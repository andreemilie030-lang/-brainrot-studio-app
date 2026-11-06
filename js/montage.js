/*
 * BRAINROT STUDIO — plan de montage (fonctions pures, aucun rendu vidéo).
 * Découpe la piste audio en plans, attribue cadrages, mouvements et transitions,
 * et produit un plan de montage lisible pour un assemblage manuel dans CapCut.
 */
(function () {
  'use strict';

  var MAX_SHOT = 4.5;   // durée maximale d'un plan (s) : rythme des vidéos courtes
  var TAIL = 1;         // tenue de la dernière image après la dernière phrase (s)
  var CANVAS = { width: 1080, height: 1920, fps: 30, ratio: '9:16' };

  // s = échelle, x / y = décalage en % de la largeur / hauteur de l'écran
  var MOVES = {
    'zoom-in': { label: 'Zoom avant lent', from: { s: 1, x: 0, y: 0 }, to: { s: 1.15, x: 0, y: 0 } },
    'zoom-out': { label: 'Zoom arrière lent', from: { s: 1.15, x: 0, y: 0 }, to: { s: 1, x: 0, y: 0 } },
    'punch-in': { label: 'Zoom rapide (punch-in)', from: { s: 1.05, x: 0, y: 0 }, to: { s: 1.35, x: 0, y: 0 } },
    'pan-left': { label: 'Glissement vers la gauche', from: { s: 1.2, x: 6, y: 0 }, to: { s: 1.2, x: -6, y: 0 } },
    'pan-right': { label: 'Glissement vers la droite', from: { s: 1.2, x: -6, y: 0 }, to: { s: 1.2, x: 6, y: 0 } },
    'pan-up': { label: 'Glissement vers le haut', from: { s: 1.2, x: 0, y: 5 }, to: { s: 1.2, x: 0, y: -5 } },
    'pan-down': { label: 'Glissement vers le bas', from: { s: 1.2, x: 0, y: -5 }, to: { s: 1.2, x: 0, y: 5 } },
    'static': { label: 'Fixe', from: { s: 1, x: 0, y: 0 }, to: { s: 1, x: 0, y: 0 } }
  };

  var TRANSITIONS = {
    'cut': { label: 'Coupe franche', duration: 0 },
    'fade': { label: 'Fondu enchaîné', duration: 0.5 },
    'black': { label: 'Fondu au noir', duration: 0.6 },
    'white': { label: 'Flash blanc', duration: 0.3 },
    'blur': { label: 'Flou', duration: 0.5 },
    'glitch': { label: 'Glitch', duration: 0.3 },
    'zoom': { label: 'Zoom', duration: 0.4 }
  };

  var SHOT_TYPES = {
    'large': 'Plan large',
    'moyen': 'Plan moyen',
    'gros': 'Gros plan',
    'tres-gros': 'Très gros plan'
  };

  var SCENE_TRANSITION = { 'horreur': 'black', 'mystere': 'fade', 'surnaturel': 'blur', 'trahison': 'glitch', 'humour-noir': 'zoom' };
  var MOOD = {
    'horreur': 'atmosphère d’horreur oppressante, ombres profondes, lumière froide',
    'mystere': 'atmosphère de mystère feutrée, clair-obscur, brume légère',
    'surnaturel': 'atmosphère surnaturelle, lueur irréelle, reflets étranges',
    'trahison': 'atmosphère de thriller tendue, contrastes durs, teintes froides',
    'humour-noir': 'humour noir, couleurs légèrement saturées, ton absurde et cinématographique'
  };

  var MOVE_CYCLE = ['zoom-in', 'pan-left', 'zoom-out', 'pan-up', 'pan-right', 'pan-down'];

  function round(x) { return Math.round(x * 1000) / 1000; }
  function clean(t) { return String(t || '').trim().replace(/\s+/g, ' '); }

  function sceneLabel(scene, sceneCount) {
    return scene === 0 ? 'Hook' : scene > sceneCount ? 'Fin' : 'Scène ' + scene;
  }

  function sceneText(story, scene) {
    if (scene === 0) return story.hook;
    if (scene > story.scenes.length) return story.ending;
    var sc = story.scenes[scene - 1];
    return sc.narration || sc.dialogues.map(function (d) { return d.text; }).join(' ');
  }

  /** Personnages présents dans une scène (cités ou qui parlent). */
  function sceneCast(story, scene) {
    var text = sceneText(story, scene);
    var speakers = scene > 0 && scene <= story.scenes.length
      ? story.scenes[scene - 1].dialogues.map(function (d) { return d.speaker; }) : [];
    return story.characters.filter(function (c) {
      return speakers.indexOf(c.key) !== -1 || (c.name && text.indexOf(c.name) !== -1);
    });
  }

  function lower1(t) { return t ? t.charAt(0).toLowerCase() + t.slice(1) : t; }
  function phrase(t) { return lower1(clean(t).replace(/[.\s]+$/, '')); }

  function describe(c, lib) {
    if (lib) {
      var bits = [clean(lib.species) ? lib.species.toLowerCase() + ' anthropomorphe' : 'personnage anthropomorphe'];
      if (clean(lib.appearance)) bits.push(phrase(lib.appearance));
      if (clean(lib.outfit)) bits.push('vêtu de : ' + phrase(lib.outfit));
      return c.name + ' (' + bits.join(', ') + ')';
    }
    return c.name + (c.role ? ' (' + c.role.toLowerCase() + ')' : '');
  }

  /** Prompt d'image d'une scène, cohérent avec les personnages du studio. */
  function scenePrompt(story, scene, shotType, library) {
    library = library || {};
    var cast = sceneCast(story, scene).map(function (c) { return describe(c, c.libraryId && library[c.libraryId]); });
    var parts = ['Image 3D cinématographique photoréaliste, format vertical 9:16',
      (SHOT_TYPES[shotType] || 'Plan moyen') + ' : ' + clean(sceneText(story, scene)).replace(/[.\s]+$/, '')];
    if (cast.length) parts.push('Personnages : ' + cast.join(' ; '));
    parts.push(MOOD[story.genre] || 'atmosphère cinématographique');
    parts.push('éclairage dramatique, faible profondeur de champ, étalonnage cinéma, très haute définition, aucun texte à l’image');
    return parts.join('. ') + '.';
  }

  /**
   * Construit (ou recale) le montage sur la piste audio.
   * @param story
   * @param audio     piste audio (segments déjà minutés par AudioScript.timeline)
   * @param library   { id: personnage du studio }
   * @param previous  montage précédent : ses réglages par plan / scène sont conservés
   */
  function build(story, audio, library, previous) {
    var segs = audio.segments.filter(function (s) { return s.kind === 'narration' || s.kind === 'dialogue'; });
    var sceneCount = story.scenes.length;
    var lastEnd = segs.length ? segs[segs.length - 1].end : 0;
    var total = round(lastEnd + TAIL);

    // Début de chaque scène = début de sa première phrase ; la scène 0 commence à 0.
    var starts = {};
    segs.forEach(function (s) { if (starts[s.scene] === undefined) starts[s.scene] = s.start; });
    var order = Object.keys(starts).map(Number).sort(function (a, b) { return a - b; });
    if (order.length) starts[order[0]] = 0;

    var prevShots = {}, prevScenes = {};
    if (previous) {
      (previous.shots || []).forEach(function (s) { prevShots[s.id] = s; });
      (previous.scenes || []).forEach(function (s) { prevScenes[s.scene] = s; });
    }

    var shots = [], scenes = [], moveIndex = 0;
    order.forEach(function (scene, i) {
      var start = starts[scene];
      var end = i + 1 < order.length ? starts[order[i + 1]] : total;
      var dur = end - start;
      var n = Math.min(4, Math.max(1, Math.ceil(dur / MAX_SHOT)));
      var isHook = scene === 0, isEnd = scene > sceneCount;
      var mainType = isHook ? 'gros' : isEnd ? 'moyen' : 'large';
      var keep = prevScenes[scene] || {};
      scenes.push({
        scene: scene,
        label: sceneLabel(scene, sceneCount),
        start: round(start), end: round(end),
        shotType: keep.shotType || mainType,
        imagePrompt: scenePrompt(story, scene, keep.shotType || mainType, library),
        text: clean(sceneText(story, scene))
      });
      for (var k = 0; k < n; k++) {
        var id = 'sc' + scene + '-' + (k + 1);
        var old = prevShots[id] || {};
        var s0 = start + dur * k / n, s1 = start + dur * (k + 1) / n;
        var move, type;
        if (isHook) { move = k === 0 ? 'punch-in' : 'pan-up'; type = k === 0 ? 'gros' : 'moyen'; }
        else if (isEnd && k === n - 1) { move = 'zoom-in'; type = 'gros'; }
        else { move = MOVE_CYCLE[moveIndex % MOVE_CYCLE.length]; moveIndex += 1; type = k === 0 ? mainType : k % 2 ? 'gros' : 'tres-gros'; }
        var trans;
        if (shots.length === 0) trans = 'cut';
        else if (k > 0) trans = 'cut';
        else if (isEnd) trans = 'black';
        else trans = SCENE_TRANSITION[story.genre] || 'fade';
        shots.push({
          id: id, scene: scene, part: k + 1, parts: n,
          start: round(s0), end: round(s1),
          shotType: old.shotType || type,
          movement: old.movement || move,
          transition: old.transition || trans
        });
      }
    });
    if (shots.length) shots[shots.length - 1].end = total;

    return {
      storyId: story.id,
      storyUpdatedAt: story.updatedAt,
      audioUpdatedAt: audio.updatedAt || 0,
      total: total,
      shots: shots,
      scenes: scenes,
      createdAt: previous && previous.createdAt || Date.now()
    };
  }

  /* ---------- Aperçu : état de l'image à l'instant t ---------- */

  function lerp(a, b, p) { return a + (b - a) * p; }
  function ease(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }

  function shotAt(montage, t) {
    var list = montage.shots;
    for (var i = 0; i < list.length; i++) if (t >= list[i].start && t < list[i].end) return i;
    return t >= montage.total ? list.length - 1 : 0;
  }

  function transformAt(shot, t) {
    var m = MOVES[shot.movement] || MOVES.static;
    var p = Math.min(1, Math.max(0, (t - shot.start) / Math.max(0.001, shot.end - shot.start)));
    p = shot.movement === 'punch-in' ? 1 - Math.pow(1 - p, 3) : ease(p);
    return { s: lerp(m.from.s, m.to.s, p), x: lerp(m.from.x, m.to.x, p), y: lerp(m.from.y, m.to.y, p) };
  }

  /* ---------- Exports ---------- */

  function pad(n, w) { n = String(n); while (n.length < w) n = '0' + n; return n; }
  function clock(sec) {
    var m = Math.floor(sec / 60), s = sec - m * 60;
    return pad(m, 2) + ':' + (s < 10 ? '0' : '') + s.toFixed(1);
  }
  function secs(x) { return x.toFixed(1).replace('.', ',') + ' s'; }

  /** Nom de fichier sans accent ni espace : 01-hook.jpg, 02-scene1.jpg… 10-fin.jpg */
  function imageName(scene, index, ext) {
    var tag = scene.scene === 0 ? 'hook' : scene.label === 'Fin' ? 'fin' : 'scene' + scene.scene;
    return 'images/' + pad(index + 1, 2) + '-' + tag + '.' + (ext || 'jpg');
  }

  function keyframes(moveId) {
    var m = MOVES[moveId] || MOVES.static;
    if (moveId === 'static') return 'aucune image clé (image fixe, échelle 100 %)';
    function kf(v) {
      var bits = ['échelle ' + Math.round(v.s * 100) + ' %'];
      if (v.x) bits.push('position X ' + (v.x > 0 ? '+' : '') + v.x + ' % de la largeur');
      if (v.y) bits.push('position Y ' + (v.y > 0 ? '+' : '') + v.y + ' % de la hauteur');
      return bits.join(', ');
    }
    return 'image clé au début : ' + kf(m.from) + ' → image clé à la fin : ' + kf(m.to);
  }

  /** Informations communes aux exports. */
  function details(story, audio, montage, images) {
    var names = AudioScript.namesOf(story);
    var voice = audio.segments.filter(AudioScript.isSpoken);
    var sfx = audio.segments.filter(function (s) { return s.kind === 'sfx'; });
    var sceneIndex = {};
    montage.scenes.forEach(function (sc, i) { sceneIndex[sc.scene] = i; });
    function fileFor(scene) {
      var i = sceneIndex[scene];
      var img = images && images[scene];
      return img ? imageName(montage.scenes[i], i, img.ext) : null;
    }
    return { names: names, voice: voice, sfx: sfx, sceneIndex: sceneIndex, fileFor: fileFor };
  }

  function planText(story, audio, montage, images) {
    var d = details(story, audio, montage, images);
    var out = [];
    out.push('PLAN DE MONTAGE — ' + story.title.toUpperCase());
    out.push('Format : vertical 9:16, 1080 × 1920, 30 images/s · Durée : ' + clock(montage.total) + ' · ' + montage.shots.length + ' plans');
    out.push('Ce plan sert à assembler la vidéo à la main dans CapCut. BRAINROT STUDIO ne produit pas de fichier vidéo.');
    if (audio.ambiance) out.push('Ambiance sonore (toute la vidéo) : ' + audio.ambiance);
    montage.shots.forEach(function (s, i) {
      var sc = montage.scenes[d.sceneIndex[s.scene]];
      var file = d.fileFor(s.scene);
      out.push('');
      out.push('PLAN ' + pad(i + 1, 2) + ' — ' + sc.label + (s.parts > 1 ? ' (' + s.part + '/' + s.parts + ')' : '') +
        ' · ' + clock(s.start) + ' → ' + clock(s.end) + ' (' + secs(s.end - s.start) + ')');
      out.push('  Image : ' + (file || 'à créer — prompt « ' + sc.label + ' » dans prompts-images.txt') + (s.part > 1 ? ' (même image que le plan précédent)' : ''));
      out.push('  Cadrage : ' + (SHOT_TYPES[s.shotType] || s.shotType));
      out.push('  Mouvement : ' + (MOVES[s.movement] || MOVES.static).label + ' — ' + keyframes(s.movement));
      var tr = TRANSITIONS[s.transition] || TRANSITIONS.cut;
      out.push('  Transition d’entrée : ' + tr.label + (tr.duration ? ' (' + secs(tr.duration) + ')' : ''));
      d.voice.filter(function (v) { return v.start < s.end && v.end > s.start && v.start >= s.start - 0.01; }).forEach(function (v) {
        out.push('  Voix ' + clock(v.start) + ' — ' + (d.names[v.speaker] || v.speaker) + ' (' + v.direction + ') : « ' + v.text + ' »');
      });
      d.sfx.filter(function (x) { return x.start >= s.start - 0.01 && x.start < s.end; }).forEach(function (x) {
        out.push('  Bruitage ' + clock(x.start) + ' : ' + x.text);
      });
    });
    return out.join('\n');
  }

  function csvCell(v) {
    v = String(v == null ? '' : v);
    return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }

  function planCSV(story, audio, montage, images) {
    var d = details(story, audio, montage, images);
    var rows = [['Plan', 'Scène', 'Début', 'Fin', 'Durée (s)', 'Image', 'Cadrage', 'Mouvement', 'Images clés', 'Transition', 'Durée transition (s)', 'Texte de la scène']];
    montage.shots.forEach(function (s, i) {
      var sc = montage.scenes[d.sceneIndex[s.scene]];
      var tr = TRANSITIONS[s.transition] || TRANSITIONS.cut;
      rows.push([i + 1, sc.label, clock(s.start), clock(s.end), (s.end - s.start).toFixed(2).replace('.', ','),
        d.fileFor(s.scene) || 'à créer', SHOT_TYPES[s.shotType] || s.shotType, (MOVES[s.movement] || MOVES.static).label,
        keyframes(s.movement), tr.label, tr.duration.toFixed(1).replace('.', ','), sc.text]);
    });
    return '﻿' + rows.map(function (r) { return r.map(csvCell).join(';'); }).join('\r\n') + '\r\n';
  }

  function promptsText(story, montage) {
    var out = ['PROMPTS D’IMAGES — ' + story.title.toUpperCase(),
      'Une image par scène, au format vertical 9:16. Après génération, enregistre chaque image sous le nom indiqué',
      'ou importe-la dans le studio de montage de BRAINROT STUDIO.', ''];
    montage.scenes.forEach(function (sc, i) {
      out.push(pad(i + 1, 2) + ' — ' + sc.label + ' → ' + imageName(sc, i, 'jpg'));
      out.push(sc.imagePrompt);
      out.push('');
    });
    return out.join('\n');
  }

  function toJSON(story, audio, montage, images) {
    var d = details(story, audio, montage, images);
    return {
      format: 'brainrot-studio/montage',
      version: 1,
      note: 'Plan de montage. Aucun fichier vidéo n’est produit par BRAINROT STUDIO.',
      canvas: CANVAS,
      durationSeconds: montage.total,
      story: { title: story.title, genre: story.genre },
      scenes: montage.scenes.map(function (sc) {
        return { scene: sc.scene, label: sc.label, start: sc.start, end: sc.end, image: d.fileFor(sc.scene), imagePrompt: sc.imagePrompt, text: sc.text };
      }),
      shots: montage.shots.map(function (s, i) {
        var m = MOVES[s.movement] || MOVES.static, tr = TRANSITIONS[s.transition] || TRANSITIONS.cut;
        return {
          index: i + 1, id: s.id, scene: s.scene, start: s.start, end: s.end, duration: round(s.end - s.start),
          image: d.fileFor(s.scene), shotType: SHOT_TYPES[s.shotType] || s.shotType,
          movement: { id: s.movement, label: m.label, from: { scale: m.from.s, xPercent: m.from.x, yPercent: m.from.y }, to: { scale: m.to.s, xPercent: m.to.x, yPercent: m.to.y } },
          transitionIn: { id: s.transition, label: tr.label, duration: tr.duration }
        };
      }),
      voiceTrack: d.voice.map(function (v) {
        return { start: v.start, end: v.end, speaker: d.names[v.speaker] || v.speaker, text: v.text, direction: v.direction };
      }),
      sfxTrack: d.sfx.map(function (x) { return { start: x.start, end: x.end, description: x.text }; }),
      ambiance: audio.ambiance || null,
      subtitles: AudioScript.subtitles(audio.segments, d.names)
    };
  }

  function readme(story, montage, imageCount) {
    return [
      'BRAINROT STUDIO — PACK DE MONTAGE « ' + story.title + ' »',
      '',
      'Ce pack ne contient pas de vidéo : il contient tout ce qu’il faut pour assembler la vidéo dans CapCut.',
      '',
      'CONTENU',
      '- plan-de-montage.txt : chaque plan avec horaires, image, cadrage, mouvement (images clés) et transition',
      '- plan-de-montage.csv : le même plan sous forme de tableau (Numbers, Excel)',
      '- sous-titres.srt : sous-titres synchronisés',
      '- script-audio.txt : narration et dialogues avec indications de jeu et bruitages',
      '- prompts-images.txt : un prompt d’image par scène',
      '- montage.json : toutes les données (pour un autre outil)',
      '- images/ : ' + (imageCount ? imageCount + ' image(s) importée(s), numérotées dans l’ordre du montage' : 'vide pour l’instant (génère les images avec prompts-images.txt)'),
      '',
      'ASSEMBLER DANS CAPCUT (iPhone)',
      '1. Dans l’app Fichiers, touche le fichier .zip pour le décompresser.',
      '2. Ouvre le dossier images, sélectionne les images, puis Partager → « Enregistrer les images » pour les mettre dans Photos.',
      '3. Dans CapCut : Nouveau projet → choisis les images dans l’ordre 01, 02, 03… → format 9:16.',
      '4. Pour chaque plan de plan-de-montage.txt : si une scène a plusieurs plans, coupe son clip (« Diviser ») aux horaires indiqués ;',
      '   règle la durée de chaque clip pour que les débuts tombent aux horaires du plan (durée totale : ' + clock(montage.total) + ').',
      '5. Mouvements : sélectionne le clip, ajoute une image clé (losange) au début et une à la fin, avec les échelles et positions indiquées.',
      '6. Transitions : touche le petit carré entre deux clips et choisis la transition indiquée (ou la plus proche dans ta version).',
      '7. Voix : Audio → enregistre une voix off en lisant script-audio.txt (indications de jeu entre parenthèses).',
      '   Selon ta version, CapCut peut aussi proposer une fonction texte-en-parole.',
      '8. Sous-titres : utilise les légendes automatiques de CapCut, ou importe sous-titres.srt si ta version le permet.',
      '9. Bruitages : Audio → Effets sonores, aux horaires indiqués dans le plan.',
      '10. Exporte en 1080p, 30 images/s.',
      '',
      'Les noms de menus de CapCut peuvent varier selon la version et la langue de l’application.'
    ].join('\n');
  }

  window.Montage = {
    MOVES: MOVES, TRANSITIONS: TRANSITIONS, SHOT_TYPES: SHOT_TYPES, CANVAS: CANVAS,
    build: build, scenePrompt: scenePrompt, shotAt: shotAt, transformAt: transformAt,
    planText: planText, planCSV: planCSV, promptsText: promptsText, toJSON: toJSON, readme: readme,
    imageName: imageName, keyframes: keyframes, clock: clock
  };
})();
