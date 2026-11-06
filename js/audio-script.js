/*
 * BRAINROT STUDIO — piste audio d'une histoire.
 * Fonctions pures (aucun réseau) : segments de voix, indications de jeu,
 * bruitages, minutage, sous-titres SRT / WebVTT et export JSON.
 */
(function () {
  'use strict';

  var WPS = 2.5;            // mots par seconde à vitesse 1 (même base que le générateur)
  var GAP = 0.25;           // silence entre deux répliques (s)
  var SCENE_GAP = 0.5;      // silence entre deux scènes (s)
  var NARRATOR = 'NARRATEUR';

  /* ---------- Indications de jeu ---------- */

  var GENRE_TONE = {
    'horreur': 'voix basse, tendue',
    'mystere': 'posée, intrigante',
    'surnaturel': 'feutrée, comme un secret',
    'trahison': 'froide, contenue',
    'humour-noir': 'pince-sans-rire, faussement sérieux'
  };

  var AMBIANCE = {
    'horreur': 'Nappe grave et inquiétante, très basse en fond',
    'mystere': 'Tic-tac d’horloge et nappe feutrée',
    'surnaturel': 'Nappe éthérée avec un souffle lointain',
    'trahison': 'Pulsation tendue, cordes graves',
    'humour-noir': 'Petite musique faussement joyeuse (piano ou ukulélé)'
  };

  function words(t) {
    var m = String(t || '').match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9]+(?:[’'-][A-Za-zÀ-ÖØ-öø-ÿ0-9]+)*/g);
    return m ? m.length : 0;
  }

  function uniq(list) {
    var seen = {};
    return list.filter(function (x) { if (!x || seen[x]) return false; seen[x] = true; return true; });
  }

  function dialogueDirection(text, ctx) {
    var d = [];
    var t = String(text || '').trim();
    if (ctx.whisper) d.push('chuchoté');
    if (/\b(présence|double|voix)\b/i.test(ctx.role || '')) d.push('voix étrange, lente, comme venue d’ailleurs');
    if (/!/.test(t)) d.push('fort, exclamé');
    if (/\?\s*$/.test(t)) d.push('interrogatif, monter en fin de phrase');
    if (/…|\.\.\./.test(t)) d.push('hésitant, laisser traîner');
    if (words(t) <= 3) d.push('sec, bref');
    if (!d.length) d.push(GENRE_TONE[ctx.genre] || 'naturel');
    if (ctx.voiceNote) d.push('voix du personnage : ' + ctx.voiceNote);
    return uniq(d).join(' ; ');
  }

  /* ---------- Bruitages (repérés dans la narration) ---------- */

  var SFX = [
    { re: /trois coups|frapp/i, text: 'Coups sourds frappés sur du bois', dur: 1.5 },
    { re: /berceuse/i, text: 'Berceuse fredonnée, lointaine et déformée', dur: 4 },
    { re: /grésill/i, text: 'Grésillement électrique', dur: 2 },
    { re: /vacill/i, text: 'Ampoule qui grésille et clignote', dur: 1.5 },
    { re: /verrouill|verrou/i, text: 'Verrou qui claque', dur: 1 },
    { re: /\bporte/i, text: 'Porte qui grince', dur: 1.5 },
    { re: /\bon sonne|sonnette/i, text: 'Sonnette d’entrée', dur: 1.5 },
    { re: /vibre/i, text: 'Vibration de téléphone', dur: 1.2 },
    { re: /\btrain\b|\bquai\b/i, text: 'Train qui entre en gare, crissement des freins', dur: 3 },
    { re: /ravin|les freins/i, text: 'Crissement de pneus puis choc lointain', dur: 2.5 },
    { re: /se gare|voiture/i, text: 'Moteur de voiture qui ralentit', dur: 2.5 },
    { re: /sirène/i, text: 'Sirènes au loin', dur: 3 },
    { re: /champagne/i, text: 'Bouchon de champagne qui saute', dur: 1 },
    { re: /forêt|arbres/i, text: 'Vent léger dans les arbres', dur: 3 },
    { re: /escalier|descend|marches/i, text: 'Pas lents sur des marches en bois', dur: 2 },
    { re: /\bcour[ st]|panique/i, text: 'Pas précipités', dur: 1.5 },
    { re: /miroir|\bverre\b|vitre/i, text: 'Tintement de verre', dur: 1 },
    { re: /pièce dans l’eau|fontaine/i, text: 'Pièce qui tombe dans l’eau', dur: 1.2 },
    { re: /photo|selfie|zoome/i, text: 'Déclic d’appareil photo', dur: 0.6 },
    { re: /café|(^|[^a-zà-ÿ])thé([^a-zà-ÿ]|$)|tasse/i, text: 'Tasse posée sur une soucoupe', dur: 0.8 },
    { re: /\bsigne\b|signature/i, text: 'Stylo qui griffe le papier', dur: 1 },
    { re: /pigeon/i, text: 'Battements d’ailes', dur: 1.2 },
    { re: /cimetière|cercueil/i, text: 'Vent sur un cimetière, cloche lointaine', dur: 3 },
    { re: /flacon|pilules|médicaments/i, text: 'Pilules qui s’entrechoquent dans un flacon', dur: 1 },
    { re: /lampe/i, text: 'Déclic d’interrupteur', dur: 0.5 },
    { re: /fauteuil/i, text: 'Grincement de vieux fauteuil en cuir', dur: 1.2 },
    { re: /robot|instruction reçue/i, text: 'Bip électronique', dur: 0.6 },
    { re: /radio/i, text: 'Souffle d’une vieille radio', dur: 2 },
    { re: /babyphone/i, text: 'Petit bip de babyphone', dur: 0.6 }
  ];

  function detectSfx(text) {
    var out = [];
    SFX.forEach(function (s) { if (s.re.test(text || '')) out.push({ text: s.text, dur: s.dur }); });
    return out.slice(0, 2); // 2 bruitages maximum par passage, pour ne pas surcharger
  }

  /* ---------- Construction de la piste ---------- */

  var n = 0;
  function sid() { n += 1; return 's' + Date.now().toString(36) + n.toString(36); }

  function speakerMap(story) {
    var map = {};
    story.characters.forEach(function (c) { map[c.key] = c; });
    return map;
  }

  /**
   * Construit la piste audio à partir d'une histoire.
   * @param {object} story
   * @param {object} voiceNotes  { clé du personnage: description de voix (studio) }
   */
  function build(story, voiceNotes) {
    voiceNotes = voiceNotes || {};
    var chars = speakerMap(story);
    var genre = story.genre;
    var segs = [];

    function narration(scene, text, direction) {
      if (!String(text || '').trim()) return null;
      var s = { id: sid(), scene: scene, kind: 'narration', speaker: NARRATOR, text: String(text).trim(), direction: direction };
      segs.push(s);
      detectSfx(text).forEach(function (fx) {
        segs.push({ id: sid(), scene: scene, kind: 'sfx', anchor: s.id, text: fx.text, dur: fx.dur });
      });
      return s;
    }

    narration(0, story.hook, 'accrocheur, rythme vif, appuyer le dernier mot');

    story.scenes.forEach(function (sc, i) {
      var scene = i + 1;
      narration(scene, sc.narration, GENRE_TONE[genre] || 'posée');
      var whisper = /chuchot|murmur/i.test(sc.narration || '');
      sc.dialogues.forEach(function (d) {
        if (!String(d.text || '').trim()) return;
        var c = chars[d.speaker] || {};
        segs.push({
          id: sid(), scene: scene, kind: 'dialogue', speaker: d.speaker, text: String(d.text).trim(),
          direction: dialogueDirection(d.text, { genre: genre, whisper: whisper, role: c.role, voiceNote: voiceNotes[d.speaker] })
        });
      });
    });

    narration(story.scenes.length + 1, story.ending, 'ralentir, petite pause avant la dernière phrase, chute appuyée');

    return { segments: segs, ambiance: AMBIANCE[genre] || '' };
  }

  /* ---------- Minutage ---------- */

  function spoken(seg) { return seg.kind === 'narration' || seg.kind === 'dialogue'; }

  function estimate(seg, voices) {
    var v = voices && voices[seg.speaker];
    var rate = v && v.rate ? v.rate : 1;
    return Math.max(0.8, words(seg.text) / (WPS * rate));
  }

  /**
   * Calcule start / end de chaque segment.
   * Si une lecture complète a été mesurée sur la voix de l'appareil (seg.measured),
   * ces temps réels sont utilisés ; sinon, estimation à partir du nombre de mots.
   */
  function timeline(segs, voices) {
    var voiced = segs.filter(spoken);
    var measured = voiced.length > 0 && voiced.every(function (s) { return s.measured && s.measured.end > s.measured.start; });
    var t = 0, prevScene = null, byId = {};
    voiced.forEach(function (s) {
      if (measured) {
        s.start = s.measured.start; s.end = s.measured.end;
      } else {
        if (prevScene !== null) t += s.scene !== prevScene ? SCENE_GAP : GAP;
        s.start = t; s.end = t + estimate(s, voices); t = s.end;
      }
      prevScene = s.scene;
      byId[s.id] = s;
    });
    segs.forEach(function (s) {
      if (spoken(s)) return;
      var a = byId[s.anchor];
      s.start = a ? Math.max(0, a.start - 0.2) : 0;
      s.end = s.start + (s.dur || 1);
    });
    segs.forEach(function (s) { s.start = round(s.start); s.end = round(s.end); });
    var total = voiced.length ? voiced[voiced.length - 1].end : 0;
    return { total: round(total), source: measured ? 'mesuré' : 'estimé' };
  }

  function round(x) { return Math.round(x * 1000) / 1000; }

  /* ---------- Sous-titres ---------- */

  var LINE = 42;

  function wrap(text) {
    if (text.length <= LINE) return text;
    // Coupe en 2 lignes équilibrées, sur un espace.
    var mid = Math.floor(text.length / 2), best = -1;
    for (var i = 0; i < text.length; i++) {
      if (text[i] === ' ' && (best === -1 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
    }
    return best === -1 ? text : text.slice(0, best) + '\n' + text.slice(best + 1);
  }

  function pieces(text) {
    var max = LINE * 2;
    // Découpe en phrases (sans « lookbehind », non pris en charge avant iOS 16.4).
    var sentences = (String(text).trim().match(/[^.!?…]+(?:[.!?…]+\s*»?|$)/g) || [String(text)])
      .map(function (x) { return x.trim(); }).filter(Boolean);
    var out = [];
    sentences.forEach(function (s) {
      if (s.length <= max) { out.push(s); return; }
      var cur = '';
      s.split(/\s+/).forEach(function (w) {
        if ((cur + ' ' + w).trim().length > max) { out.push(cur); cur = w; }
        else cur = (cur + ' ' + w).trim();
      });
      if (cur) out.push(cur);
    });
    // Regroupe les morceaux très courts avec le suivant si cela tient.
    var merged = [];
    out.forEach(function (p) {
      var last = merged[merged.length - 1];
      if (last && last.length < 18 && (last + ' ' + p).length <= max) merged[merged.length - 1] = last + ' ' + p;
      else merged.push(p);
    });
    return merged;
  }

  /** Sous-titres synchronisés : [{ start, end, text, speaker }] */
  function subtitles(segs, names) {
    var cues = [];
    segs.filter(spoken).forEach(function (s) {
      var parts = pieces(s.text);
      var totalChars = parts.reduce(function (a, p) { return a + p.length; }, 0) || 1;
      var t = s.start, span = s.end - s.start;
      parts.forEach(function (p) {
        var d = span * (p.length / totalChars);
        cues.push({ start: round(t), end: round(t + d), text: wrap(p), speaker: s.kind === 'dialogue' ? (names[s.speaker] || s.speaker) : 'Narrateur' });
        t += d;
      });
    });
    return cues;
  }

  function pad(x, n) { x = String(x); while (x.length < n) x = '0' + x; return x; }
  function stamp(sec, sep) {
    var ms = Math.round(sec * 1000);
    var h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
    return pad(h, 2) + ':' + pad(m, 2) + ':' + pad(s, 2) + sep + pad(ms % 1000, 3);
  }
  function short(sec) {
    var m = Math.floor(sec / 60), s = sec - m * 60;
    return pad(m, 2) + ':' + (s < 10 ? '0' : '') + s.toFixed(1);
  }

  function toSRT(cues) {
    return cues.map(function (c, i) {
      return (i + 1) + '\n' + stamp(c.start, ',') + ' --> ' + stamp(c.end, ',') + '\n' + c.text;
    }).join('\n\n') + '\n';
  }

  function vttEscape(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function toVTT(cues) {
    return 'WEBVTT\n\n' + cues.map(function (c, i) {
      return (i + 1) + '\n' + stamp(c.start, '.') + ' --> ' + stamp(c.end, '.') + '\n<v ' + vttEscape(c.speaker) + '>' + vttEscape(c.text);
    }).join('\n\n') + '\n';
  }

  /* ---------- Exports ---------- */

  function exportJSON(story, audio, voiceLabels) {
    var names = namesOf(story);
    var tl = timeline(audio.segments, audio.voices);
    var segs = audio.segments;
    return {
      format: 'brainrot-studio/audio',
      version: 1,
      story: { title: story.title, genre: story.genre },
      language: 'fr-FR',
      durationSeconds: tl.total,
      timing: tl.source,
      speakers: [NARRATOR].concat(story.characters.map(function (c) { return c.key; })).map(function (k) {
        var v = audio.voices[k] || {};
        return { key: k, name: names[k], role: k === NARRATOR ? 'Narration' : (story.characters.filter(function (c) { return c.key === k; })[0] || {}).role || '',
          voice: voiceLabels && voiceLabels[k] || null, rate: v.rate || 1, pitch: v.pitch || 1 };
      }),
      voiceTrack: segs.filter(spoken).map(function (s) {
        return { id: s.id, scene: s.scene, type: s.kind, speaker: names[s.speaker] || s.speaker, start: s.start, end: s.end, text: s.text, direction: s.direction };
      }),
      sfxTrack: segs.filter(function (s) { return s.kind === 'sfx'; }).map(function (s) {
        return { id: s.id, scene: s.scene, start: s.start, end: s.end, description: s.text };
      }),
      ambiance: audio.ambiance ? { start: 0, end: tl.total, description: audio.ambiance } : null,
      subtitles: subtitles(segs, names)
    };
  }

  function namesOf(story) {
    var names = {}; names[NARRATOR] = 'Narrateur';
    story.characters.forEach(function (c) { names[c.key] = c.name; });
    return names;
  }

  /** Script audio lisible (conducteur pour l'enregistrement). */
  function toText(story, audio) {
    var names = namesOf(story);
    var tl = timeline(audio.segments, audio.voices);
    var out = ['SCRIPT AUDIO — ' + story.title.toUpperCase(),
      'Durée : ' + short(tl.total) + ' (' + tl.source + ')'];
    if (audio.ambiance) out.push('Ambiance (tout du long) : ' + audio.ambiance);
    var scene = -1;
    audio.segments.slice().sort(function (a, b) { return a.start - b.start || (a.kind === 'sfx' ? -1 : 1); }).forEach(function (s) {
      if (s.scene !== scene) {
        scene = s.scene;
        out.push('');
        out.push(scene === 0 ? 'HOOK' : scene > story.scenes.length ? 'FIN' : 'SCÈNE ' + scene);
      }
      if (s.kind === 'sfx') out.push('[' + short(s.start) + '] BRUITAGE : ' + s.text);
      else out.push('[' + short(s.start) + '] ' + (names[s.speaker] || s.speaker).toUpperCase() + ' (' + s.direction + ') : ' + s.text);
    });
    return out.join('\n');
  }

  window.AudioScript = {
    NARRATOR: NARRATOR,
    build: build,
    timeline: timeline,
    subtitles: subtitles,
    toSRT: toSRT,
    toVTT: toVTT,
    exportJSON: exportJSON,
    toText: toText,
    namesOf: namesOf,
    isSpoken: spoken,
    short: short
  };
})();
