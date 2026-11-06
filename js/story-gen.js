/*
 * BRAINROT STUDIO — générateur d'histoires (100 % local, gratuit, sans IA externe).
 * Assemble une trame écrite à l'avance avec des personnages tirés au hasard.
 */
(function () {
  'use strict';

  var D = window.StoryData;
  var WORDS_PER_SECOND = 2.5; // débit moyen d'une voix off en français (~150 mots/min)

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function genreLabel(id) {
    for (var i = 0; i < D.GENRES.length; i++) if (D.GENRES[i].id === id) return D.GENRES[i].label;
    return id;
  }

  /** Remplace les marqueurs {A}, {A:il}, {A:e}, {A:mot|mots}… */
  function fill(text, cast) {
    return text.replace(/\{([A-C])(?::([^}]+))?\}/g, function (all, key, form) {
      var c = cast[key];
      if (!c) return all;
      if (!form) return c.name;
      var f = c.gender === 'f';
      if (form.indexOf('|') !== -1) { var parts = form.split('|'); return f ? parts[1] : parts[0]; }
      switch (form) {
        case 'il': return f ? 'elle' : 'il';
        case 'Il': return f ? 'Elle' : 'Il';
        case 'e': return f ? 'e' : '';
        case 'le': return f ? 'la' : 'le';
        case 'Le': return f ? 'La' : 'Le';
        case 'lui': return f ? 'elle' : 'lui';
        default: return all;
      }
    });
  }

  /**
   * Place les personnages de la bibliothèque dans les rôles libres d'une trame
   * (rôles sans nom imposé, et de même genre si la trame impose un genre).
   * Renvoie { clé du rôle: personnage }.
   */
  function placeLibrary(tpl, picked) {
    var placed = {};
    (picked || []).forEach(function (p) {
      for (var i = 0; i < tpl.characters.length; i++) {
        var ch = tpl.characters[i];
        if (ch.name || placed[ch.key]) continue;
        if (ch.gender && ch.gender !== p.gender) continue;
        placed[ch.key] = p;
        return;
      }
    });
    return placed;
  }

  function castCharacters(tpl, picked) {
    var placed = placeLibrary(tpl, picked);
    var used = {};
    var cast = {};
    Object.keys(placed).forEach(function (k) { used[placed[k].name] = true; });
    tpl.characters.forEach(function (ch) {
      var lib = placed[ch.key];
      var gender = lib ? lib.gender : ch.gender || (Math.random() < 0.5 ? 'f' : 'm');
      var name = lib ? lib.name : ch.name;
      if (!name) {
        var pool = D.NAMES[gender].filter(function (n) { return !used[n]; });
        name = pick(pool);
      }
      used[name] = true;
      var role = Array.isArray(ch.role) ? (gender === 'f' ? ch.role[1] : ch.role[0]) : ch.role;
      cast[ch.key] = { key: ch.key, name: name, gender: gender, role: role, libraryId: lib ? lib.id : undefined };
    });
    return cast;
  }

  /**
   * Génère une histoire.
   * @param {string|null} genreId  genre voulu, ou null pour « au hasard »
   * @param {string[]} avoid       identifiants de trames à éviter (déjà vues récemment)
   * @param {object[]} picked      personnages de la bibliothèque à faire jouer ({ id, name, gender })
   */
  function generate(genreId, avoid, picked) {
    avoid = avoid || [];
    picked = picked || [];
    var pool = D.TEMPLATES.filter(function (t) { return !genreId || t.genre === genreId; });
    // Garde les trames qui accueillent le plus de personnages choisis.
    var fit = function (t) { return Object.keys(placeLibrary(t, picked)).length; };
    var best = Math.max.apply(null, pool.map(fit));
    pool = pool.filter(function (t) { return fit(t) === best; });
    var fresh = pool.filter(function (t) { return avoid.indexOf(t.id) === -1; });
    var tpl = pick(fresh.length ? fresh : pool);
    var cast = castCharacters(tpl, picked);

    return {
      templateId: tpl.id,
      genre: tpl.genre,
      title: pick(tpl.titles),
      characters: tpl.characters.map(function (ch) {
        var c = cast[ch.key];
        var out = { key: c.key, name: c.name, role: c.role };
        if (c.libraryId) out.libraryId = c.libraryId;
        return out;
      }),
      hook: fill(tpl.hook, cast),
      scenes: tpl.scenes.map(function (s) {
        return {
          narration: fill(s.n, cast),
          dialogues: s.d.map(function (line) { return { speaker: line[0], text: fill(line[1], cast) }; })
        };
      }),
      ending: fill(tpl.ending, cast)
    };
  }

  function countWords(text) {
    var m = String(text || '').match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9]+(?:[’'-][A-Za-zÀ-ÖØ-öø-ÿ0-9]+)*/g);
    return m ? m.length : 0;
  }

  function words(story) {
    var n = countWords(story.hook) + countWords(story.ending);
    story.scenes.forEach(function (s) {
      n += countWords(s.narration);
      s.dialogues.forEach(function (d) { n += countWords(d.text); });
    });
    return n;
  }

  function duration(story) { return Math.round(words(story) / WORDS_PER_SECOND); }

  function nameOf(story, key) {
    for (var i = 0; i < story.characters.length; i++) if (story.characters[i].key === key) return story.characters[i].name;
    return key;
  }

  /** Version texte, prête à copier (script de tournage / voix off). */
  function toText(story) {
    var out = [];
    out.push(story.title.toUpperCase());
    out.push(genreLabel(story.genre) + ' · environ ' + duration(story) + ' secondes');
    out.push('');
    out.push('PERSONNAGES');
    story.characters.forEach(function (c) { out.push('- ' + c.name + (c.role ? ' (' + c.role + ')' : '')); });
    out.push('');
    out.push('HOOK');
    out.push(story.hook);
    story.scenes.forEach(function (s, i) {
      out.push('');
      out.push('SCÈNE ' + (i + 1));
      if (s.narration) out.push('Narration : ' + s.narration);
      s.dialogues.forEach(function (d) { out.push(nameOf(story, d.speaker) + ' : « ' + d.text + ' »'); });
    });
    out.push('');
    out.push('FIN');
    out.push(story.ending);
    return out.join('\n');
  }

  window.StoryGen = {
    GENRES: D.GENRES,
    MIN_SECONDS: 60,
    MAX_SECONDS: 90,
    generate: generate,
    duration: duration,
    words: words,
    genreLabel: genreLabel,
    nameOf: nameOf,
    toText: toText,
    placedCount: function (story) {
      return story.characters.filter(function (c) { return c.libraryId; }).length;
    },
    templateCount: function (genreId) {
      return D.TEMPLATES.filter(function (t) { return !genreId || t.genre === genreId; }).length;
    }
  };
})();
