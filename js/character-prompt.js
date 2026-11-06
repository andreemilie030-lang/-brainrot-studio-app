/*
 * BRAINROT STUDIO — fiche personnage et prompt d'image.
 * Fonctions pures : aucun appel réseau, aucune génération d'image.
 */
(function () {
  'use strict';

  var SPECIES = [
    'Chat', 'Chien', 'Renard', 'Loup', 'Lapin', 'Ours', 'Raton laveur', 'Hibou', 'Corbeau', 'Grenouille',
    'Requin', 'Crocodile', 'Serpent', 'Lézard', 'Singe', 'Gorille', 'Tigre', 'Lion', 'Panda', 'Cochon',
    'Rat', 'Souris', 'Pingouin', 'Cheval', 'Chèvre', 'Mouton', 'Vache', 'Hippopotame', 'Éléphant', 'Poulpe'
  ];

  // Matière du corps selon l'espèce, pour un rendu réaliste plus précis.
  var MATTER = [
    { re: /hibou|chouette|corbeau|oiseau|aigle|perroquet|poule|coq|canard|pingouin|manchot|pigeon|mouette|flamant|paon|cygne/i, text: 'plumage aux plumes finement détaillées' },
    { re: /crocodile|alligator|serpent|lézard|iguane|caméléon|dragon|tortue|dinosaure|poisson/i, text: 'écailles aux reflets réalistes' },
    { re: /grenouille|crapaud|salamandre|poulpe|pieuvre|calmar|requin|dauphin|baleine|hippopotame|éléphant|rhinocéros|cochon|porc|axolotl|limace/i, text: 'peau texturée, légèrement brillante et ultra réaliste' }
  ];

  function matter(species) {
    for (var i = 0; i < MATTER.length; i++) if (MATTER[i].re.test(species || '')) return MATTER[i].text;
    return 'pelage dense aux poils finement détaillés';
  }

  function clean(t) {
    return String(t || '').trim().replace(/\s+/g, ' ').replace(/[.;,\s]+$/, '');
  }

  function lower1(t) { return t ? t.charAt(0).toLowerCase() + t.slice(1) : t; }

  /** Prompt d'image 3D cinématographique réaliste, en français. */
  function imagePrompt(c) {
    var species = clean(c.species) || 'animal';
    var parts = [];
    parts.push('Rendu 3D cinématographique photoréaliste d’un personnage anthropomorphe : ' + clean(c.name) +
      ', ' + lower1(species) + ' anthropomorphe ' + (c.gender === 'f' ? 'femelle' : c.gender === 'm' ? 'mâle' : '') +
      ', debout sur deux jambes, morphologie et posture humaines, ' + matter(species));
    if (clean(c.appearance)) parts.push('Apparence : ' + lower1(clean(c.appearance)));
    if (clean(c.outfit)) parts.push('Tenue : ' + lower1(clean(c.outfit)));
    if (clean(c.personality)) parts.push('Expression du visage et langage corporel qui traduisent sa personnalité : ' + lower1(clean(c.personality)));
    parts.push('Plan américain, regard intense vers la caméra, éclairage cinématographique dramatique avec lumière de contour, ' +
      'faible profondeur de champ, arrière-plan sombre et flou, étalonnage cinéma aux teintes froides et touches de rouge, ' +
      'grain de film léger, matières et tissus ultra détaillés, qualité long-métrage d’animation photoréaliste, très haute définition, format vertical 9:16');
    return parts.map(function (p) { return p.replace(/\s+,/g, ',').replace(/ {2,}/g, ' '); }).join('. ') + '.';
  }

  var NEGATIVE = 'Éviter : dessin 2D, style cartoon plat, anime, croquis, membres déformés, doigts en trop, ' +
    'visage flou, texte, logo, filigrane, cadre, basse résolution.';

  /** Fiche complète en texte (pour copier ailleurs). */
  function sheetText(c, appearances) {
    var out = [];
    out.push('FICHE PERSONNAGE — ' + clean(c.name).toUpperCase());
    out.push('Espèce : ' + (clean(c.species) || '—') + (c.gender ? ' · ' + (c.gender === 'f' ? 'Elle' : 'Il') : ''));
    [['APPARENCE PHYSIQUE', c.appearance], ['VÊTEMENTS', c.outfit], ['PERSONNALITÉ', c.personality],
     ['VOIX', c.voice], ['HISTOIRE', c.backstory]].forEach(function (s) {
      if (clean(s[1])) { out.push(''); out.push(s[0]); out.push(String(s[1]).trim()); }
    });
    if (appearances && appearances.length) {
      out.push(''); out.push('ÉPISODES');
      appearances.forEach(function (t) { out.push('- ' + t); });
    }
    out.push(''); out.push('PROMPT IMAGE 3D'); out.push(imagePrompt(c));
    out.push(''); out.push(NEGATIVE);
    return out.join('\n');
  }

  window.CharacterPrompt = { SPECIES: SPECIES, imagePrompt: imagePrompt, negative: NEGATIVE, sheetText: sheetText };
})();
