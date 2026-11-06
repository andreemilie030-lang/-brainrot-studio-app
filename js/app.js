/*
 * BRAINROT STUDIO — interface.
 * Tout le texte saisi par l'utilisateur passe par textContent (jamais innerHTML),
 * pour éviter toute injection de code.
 */
(function () {
  'use strict';

  var app = document.getElementById('app');
  var sheet = document.getElementById('create-sheet');
  var form = document.getElementById('create-form');
  var input = document.getElementById('create-input');
  var errorEl = document.getElementById('create-error');
  var toastEl = document.getElementById('toast');

  /* ---------- Outils ---------- */

  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k.indexOf('on') === 0) el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : v);
      });
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return el;
  }

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var ICONS = {
    plus: ['M12 5v14M5 12h14'],
    film: ['M4 4h16v16H4z', 'M8 4v16M16 4v16M4 8h4M4 12h4M4 16h4M16 8h4M16 12h4M16 16h4'],
    folder: ['M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
    user: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 21c0-4 3.6-7 8-7s8 3 8 7'],
    book: ['M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z', 'M5 17a3 3 0 0 1 3-3h11'],
    chevron: ['M9 6l6 6-6 6'],
    trash: ['M4 7h16', 'M10 11v6M14 11v6', 'M6 7l1 13h10l1-13', 'M9 7V4h6v3'],
    back: ['M15 6l-6 6 6 6'],
    sparkle: ['M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z', 'M19 16l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z'],
    pencil: ['M4 20h4L19 9l-4-4L4 16z', 'M13.5 6.5l4 4'],
    save: ['M5 4h11l3 3v13H5z', 'M8 4v5h7V4', 'M8 20v-6h8v6'],
    copy: ['M9 9h11v11H9z', 'M5 15H4V4h11v1'],
    image: ['M4 5h16v14H4z', 'M4 16l4.5-4.5 4 4 3-3L20 17', 'M15.5 9h.01'],
    mic: ['M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z', 'M5 11a7 7 0 0 0 14 0', 'M12 18v3'],
    play: ['M7 4.5l12 7.5-12 7.5z'],
    stop: ['M6.5 6.5h11v11h-11z'],
    download: ['M12 4v11', 'M7 10l5 5 5-5', 'M5 20h14']
  };

  function icon(name) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'icon');
    ICONS[name].forEach(function (d) {
      var p = document.createElementNS(SVG_NS, 'path');
      p.setAttribute('d', d);
      svg.appendChild(p);
    });
    return svg;
  }

  var dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  function formatDate(ts) { return dateFmt.format(new Date(ts)); }

  function greeting() {
    var hr = new Date().getHours();
    if (hr < 5) return 'Bonne nuit';
    if (hr < 18) return 'Bonjour';
    return 'Bonsoir';
  }

  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 2600);
  }

  /* ---------- Composants ---------- */

  function sectionHeader(title, linkLabel, href) {
    return h('div', { class: 'section-head' }, [
      h('h2', { class: 'section-title', text: title }),
      linkLabel ? h('a', { class: 'section-link', href: href, text: linkLabel }) : null
    ]);
  }

  function emptyState(iconName, title, text) {
    return h('div', { class: 'empty' }, [
      h('div', { class: 'empty-icon' }, [icon(iconName)]),
      h('p', { class: 'empty-title', text: title }),
      h('p', { class: 'empty-text', text: text })
    ]);
  }

  function projectCard(p, withDelete) {
    return h('article', { class: 'card project-card' }, [
      h('div', { class: 'project-thumb' }, [icon('film')]),
      h('div', { class: 'project-info' }, [
        h('h3', { class: 'project-title', text: p.title }),
        h('p', { class: 'project-meta' }, [
          h('span', { class: 'badge badge-draft', text: 'Brouillon' }),
          h('span', { text: 'Modifié le ' + formatDate(p.updatedAt) })
        ])
      ]),
      withDelete ? h('button', {
        type: 'button',
        class: 'icon-btn',
        'aria-label': 'Supprimer le projet « ' + p.title + ' »',
        onclick: function () {
          if (window.confirm('Supprimer le projet « ' + p.title + ' » ? Cette action est définitive.')) {
            Store.deleteProject(p.id);
            toast('Projet supprimé');
            render();
          }
        }
      }, [icon('trash')]) : null
    ]);
  }

  function videoCard(v) {
    return h('article', { class: 'card video-card' }, [
      h('div', { class: 'video-thumb' }, [icon('film')]),
      h('h3', { class: 'video-title', text: v.title }),
      h('p', { class: 'video-meta', text: formatDate(v.createdAt) })
    ]);
  }

  function moduleCard(href, iconName, title, text, badge) {
    return h('a', { class: 'card module-card', href: href }, [
      h('div', { class: 'module-icon' }, [icon(iconName)]),
      h('div', { class: 'module-body' }, [
        h('h3', { class: 'module-title', text: title }),
        h('p', { class: 'module-text', text: text })
      ]),
      badge ? h('span', { class: 'badge badge-ready', text: badge }) : h('span', { class: 'badge badge-soon', text: 'À venir' })
    ]);
  }

  function storageWarning() {
    if (Store.persistent()) return null;
    return h('p', { class: 'warning', role: 'note',
      text: 'Le stockage de Safari est bloqué (navigation privée ?). Tes projets ne seront pas conservés après fermeture.' });
  }

  /* ---------- Écrans ---------- */

  function viewHome() {
    var projects = Store.projects();
    var videos = Store.videos();

    var hero = h('header', { class: 'hero' }, [
      h('p', { class: 'hero-kicker', text: greeting() }),
      h('h1', { class: 'hero-title' }, [
        h('span', { class: 'hero-word', text: 'BRAINROT' }),
        h('span', { class: 'hero-word hero-accent', text: 'STUDIO' })
      ]),
      h('p', { class: 'hero-sub', text: 'Ton studio de création de vidéos, dans ta poche.' }),
      h('button', { type: 'button', class: 'btn btn-primary btn-xl', 'data-action': 'create' }, [
        icon('plus'), h('span', { text: 'Créer une vidéo' })
      ])
    ]);

    var stats = h('section', { class: 'stats', 'aria-label': 'Statistiques' }, [
      h('div', { class: 'card stat' }, [
        h('p', { class: 'stat-value', text: String(videos.length) }),
        h('p', { class: 'stat-label', text: videos.length > 1 ? 'Vidéos créées' : 'Vidéo créée' })
      ]),
      h('div', { class: 'card stat' }, [
        h('p', { class: 'stat-value', text: String(projects.length) }),
        h('p', { class: 'stat-label', text: projects.length > 1 ? 'Projets en cours' : 'Projet en cours' })
      ])
    ]);

    var projSection = h('section', { class: 'section' }, [
      sectionHeader('Projets en cours', projects.length ? 'Tout voir' : null, '#/projets'),
      projects.length
        ? h('div', { class: 'list' }, projects.slice(0, 3).map(function (p) { return projectCard(p, false); }))
        : emptyState('folder', 'Aucun projet en cours', 'Appuie sur « Créer une vidéo » pour démarrer ton premier projet.')
    ]);

    var vidSection = h('section', { class: 'section' }, [
      sectionHeader('Dernières vidéos produites'),
      videos.length
        ? h('div', { class: 'rail' }, videos.slice(0, 10).map(videoCard))
        : emptyState('film', 'Aucune vidéo produite', 'Tes vidéos terminées apparaîtront ici dès que la production sera disponible.')
    ]);

    var modules = h('section', { class: 'section' }, [
      sectionHeader('Outils du studio'),
      h('div', { class: 'list' }, [
        moduleCard('#/personnages', 'user', 'Studio de personnages',
          Store.characters().length ? Store.characters().length + ' personnage' + (Store.characters().length > 1 ? 's' : '') + ' dans ta bibliothèque' : 'Crée tes personnages et leur prompt d’image 3D.',
          'Disponible'),
        moduleCard('#/histoires', 'book', 'Générateur d’histoires',
          Store.stories().length ? Store.stories().length + ' histoire' + (Store.stories().length > 1 ? 's sauvegardées' : ' sauvegardée') : 'Histoires de 60 à 90 s, prêtes à tourner.',
          'Disponible'),
        moduleCard('#/audio', 'mic', 'Studio audio',
          Store.audioStoryIds().length ? Store.audioStoryIds().length + ' piste' + (Store.audioStoryIds().length > 1 ? 's audio prêtes' : ' audio prête') : 'Voix, bruitages et sous-titres synchronisés.',
          'Disponible'),
        moduleCard('#/montage', 'film', 'Studio de montage',
          Store.montageStoryIds().length ? Store.montageStoryIds().length + ' montage' + (Store.montageStoryIds().length > 1 ? 's prêts' : ' prêt') : 'Timeline, mouvements, transitions et pack CapCut.',
          'Disponible')
      ])
    ]);

    return [storageWarning(), hero, stats, projSection, vidSection, modules];
  }

  function pageHeader(title, backHref) {
    return h('header', { class: 'page-head' }, [
      h('a', { href: backHref || '#/accueil', class: 'back', 'aria-label': backHref ? 'Retour' : 'Retour à l’accueil' }, [icon('back')]),
      h('h1', { class: 'page-title', text: title })
    ]);
  }

  function viewProjects() {
    var projects = Store.projects();
    return [
      pageHeader('Projets'),
      storageWarning(),
      projects.length
        ? h('div', { class: 'list' }, projects.map(function (p) { return projectCard(p, true); }))
        : emptyState('folder', 'Aucun projet', 'Tes projets vidéo apparaîtront ici.'),
      h('button', { type: 'button', class: 'btn btn-primary btn-block', 'data-action': 'create' }, [
        icon('plus'), h('span', { text: 'Nouveau projet' })
      ])
    ];
  }

  /* ---------- Générateur d'histoires ---------- */

  var gen = { genre: null, draft: null, recent: [], cast: [] };
  var editor = { story: null, dirty: false, hash: '' };

  function autoGrow(t) {
    t.style.height = 'auto';
    t.style.height = (t.scrollHeight + 2) + 'px';
  }

  function textarea(value, label, onInput, extraClass) {
    var t = h('textarea', { class: 'textarea' + (extraClass ? ' ' + extraClass : ''), rows: '2', 'aria-label': label });
    t.value = value || '';
    t.addEventListener('input', function () { autoGrow(t); onInput(t.value); });
    requestAnimationFrame(function () { autoGrow(t); });
    return t;
  }

  function durationInfo(story) {
    var sec = StoryGen.duration(story);
    var state = sec < StoryGen.MIN_SECONDS ? 'short' : sec > StoryGen.MAX_SECONDS ? 'long' : 'ok';
    var msg = state === 'ok' ? 'Dans la cible (60 à 90 s)'
      : state === 'short' ? 'Trop court : vise au moins 60 s'
      : 'Trop long : vise 90 s maximum';
    return { sec: sec, state: state, msg: msg };
  }

  function durationBadge(story) {
    var d = durationInfo(story);
    return h('span', { class: 'badge badge-time is-' + d.state, text: '≈ ' + d.sec + ' s' });
  }

  function copyText(text) {
    function fallback() {
      var t = h('textarea', { class: 'sr-only', 'aria-hidden': 'true' });
      t.value = text;
      document.body.appendChild(t);
      t.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      t.remove();
      toast(ok ? 'Texte copié' : 'Copie impossible sur cet appareil');
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { toast('Texte copié'); }, fallback);
    } else fallback();
  }

  function storyReader(story) {
    return h('article', { class: 'card story' }, [
      h('div', { class: 'story-meta' }, [
        h('span', { class: 'badge badge-genre', text: StoryGen.genreLabel(story.genre) }),
        durationBadge(story),
        h('span', { class: 'story-count', text: story.scenes.length + ' scènes' })
      ]),
      h('h2', { class: 'story-title', text: story.title }),
      h('ul', { class: 'cast' }, story.characters.map(function (c) {
        return h('li', { class: 'cast-item' }, [
          h('span', { class: 'cast-name' }, [c.name, c.libraryId ? h('span', { class: 'cast-lib', text: 'Studio' }) : null]),
          c.role ? h('span', { class: 'cast-role', text: c.role }) : null
        ]);
      })),
      h('div', { class: 'story-block story-hook' }, [
        h('p', { class: 'story-label', text: 'Hook · premières secondes' }),
        h('p', { class: 'story-text', text: story.hook })
      ]),
      h('ol', { class: 'scenes' }, story.scenes.map(function (sc, i) {
        return h('li', { class: 'scene' }, [
          h('p', { class: 'story-label', text: 'Scène ' + (i + 1) }),
          sc.narration ? h('p', { class: 'story-text', text: sc.narration }) : null,
          sc.dialogues.length ? h('div', { class: 'lines' }, sc.dialogues.map(function (d) {
            return h('p', { class: 'line' }, [
              h('span', { class: 'line-who', text: StoryGen.nameOf(story, d.speaker) }),
              h('span', { class: 'line-text', text: '« ' + d.text + ' »' })
            ]);
          })) : null
        ]);
      })),
      h('div', { class: 'story-block story-ending' }, [
        h('p', { class: 'story-label', text: 'Fin' }),
        h('p', { class: 'story-text', text: story.ending })
      ])
    ]);
  }

  function generateDraft() {
    var picked = gen.cast.map(Store.getCharacter).filter(Boolean);
    gen.draft = StoryGen.generate(gen.genre, gen.recent, picked);
    var placed = StoryGen.placedCount(gen.draft);
    if (placed < picked.length) {
      var missing = picked.length - placed;
      toast(missing + ' personnage' + (missing > 1 ? 's n’ont' : ' n’a') + ' pas trouvé de rôle dans ce genre');
    }
    gen.recent.push(gen.draft.templateId);
    if (gen.recent.length > 6) gen.recent.shift();
  }

  function viewStories() {

    var library = Store.characters();
    gen.cast = gen.cast.filter(function (id) { return library.some(function (c) { return c.id === id; }); });
    var castPicker = library.length
      ? h('div', { class: 'field' }, [
          h('span', { class: 'field-label', text: 'Faire jouer mes personnages (3 maximum)' }),
          h('div', { class: 'chips', role: 'group', 'aria-label': 'Mes personnages' }, library.map(function (c) {
            var on = gen.cast.indexOf(c.id) !== -1;
            return h('button', {
              type: 'button', class: 'chip chip-cast' + (on ? ' is-active' : ''), 'aria-pressed': on ? 'true' : 'false',
              onclick: function () {
                if (on) gen.cast = gen.cast.filter(function (x) { return x !== c.id; });
                else if (gen.cast.length >= 3) { toast('3 personnages maximum par histoire'); return; }
                else gen.cast.push(c.id);
                render();
              }
            }, [c.name]);
          }))
        ])
      : h('div', { class: 'cast-empty' }, [
          h('p', { class: 'generator-note', text: 'Astuce : crée tes propres personnages pour les faire jouer dans tes histoires.' }),
          h('a', { class: 'btn btn-ghost btn-sm', href: '#/personnage/nouveau' }, [icon('user'), h('span', { text: 'Créer un personnage' })])
        ]);
    var chips = [{ id: null, label: 'Au hasard' }].concat(StoryGen.GENRES).map(function (g) {
      var active = gen.genre === g.id;
      return h('button', {
        type: 'button', class: 'chip' + (active ? ' is-active' : ''), 'aria-pressed': active ? 'true' : 'false',
        onclick: function () { gen.genre = g.id; render(); }
      }, [g.label]);
    });

    var genCard = h('section', { class: 'card generator' }, [
      h('h2', { class: 'generator-title', text: 'Générer une histoire' }),
      h('p', { class: 'generator-text', text: 'Une histoire courte de 60 à 90 secondes : un hook, 2 à 3 personnages, des dialogues, 6 à 8 scènes et une fin surprenante.' }),
      h('div', { class: 'chips', role: 'group', 'aria-label': 'Genre' }, chips),
      castPicker,
      h('button', {
        type: 'button', class: 'btn btn-primary btn-block', id: 'btn-generate',
        onclick: function () { generateDraft(); render(); scrollToId('draft'); }
      }, [icon('sparkle'), h('span', { text: gen.draft ? 'Générer une autre histoire' : 'Générer une histoire' })]),
      h('p', { class: 'generator-note', text: 'Fonctionne sans connexion et gratuitement : l’histoire est assemblée sur ton iPhone à partir de ' +
        StoryGen.templateCount(gen.genre) + ' trames originales' + (gen.genre ? ' de ce genre' : '') + ', avec ' + (gen.cast.length ? 'tes personnages et ' : '') + 'des personnages tirés au hasard.' })
    ]);

    var draftSection = null;
    if (gen.draft) {
      draftSection = h('section', { class: 'section', id: 'draft' }, [
        sectionHeader('Nouvelle histoire'),
        storyReader(gen.draft),
        h('div', { class: 'actions-row' }, [
          h('button', { type: 'button', class: 'btn btn-ghost', onclick: function () {
            editor.story = JSON.parse(JSON.stringify(gen.draft));
            editor.dirty = true;
            editor.hash = '#/histoire/brouillon';
            location.hash = editor.hash;
          } }, [icon('pencil'), h('span', { text: 'Modifier' })]),
          h('button', { type: 'button', class: 'btn btn-primary', id: 'btn-save-draft', onclick: function () {
            var res = Store.saveStory(gen.draft);
            gen.draft = null;
            toast(res.saved ? 'Histoire sauvegardée' : 'Sauvegarde impossible : stockage bloqué');
            render();
          } }, [icon('save'), h('span', { text: 'Sauvegarder' })])
        ])
      ]);
    }

    var stories = Store.stories();
    var list = h('section', { class: 'section' }, [
      sectionHeader('Mes histoires' + (stories.length ? ' (' + stories.length + ')' : '')),
      stories.length
        ? h('div', { class: 'list' }, stories.map(function (st) {
            return h('a', { class: 'card story-card', href: '#/histoire/' + encodeURIComponent(st.id) }, [
              h('div', { class: 'module-icon' }, [icon('book')]),
              h('div', { class: 'project-info' }, [
                h('h3', { class: 'project-title', text: st.title }),
                h('p', { class: 'project-meta' }, [
                  h('span', { class: 'badge badge-genre', text: StoryGen.genreLabel(st.genre) }),
                  durationBadge(st),
                  h('span', { text: formatDate(st.updatedAt) })
                ])
              ]),
              h('span', { class: 'chev' }, [icon('chevron')])
            ]);
          }))
        : emptyState('book', 'Aucune histoire sauvegardée', 'Génère une histoire, puis appuie sur « Sauvegarder » pour la retrouver ici.')
    ]);

    return [pageHeader('Histoires'), storageWarning(), genCard, draftSection, list];
  }

  function scrollToId(id) {
    requestAnimationFrame(function () {
      var el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ---------- Éditeur ---------- */

  function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function renameEverywhere(story, oldName, newName) {
    if (!oldName || oldName === newName) return;
    var re = new RegExp('(^|[^A-Za-zÀ-ÖØ-öø-ÿ])' + escapeRegExp(oldName) + '(?![A-Za-zÀ-ÖØ-öø-ÿ])', 'g');
    function rep(t) { return t.replace(re, function (m, pre) { return pre + newName; }); }
    story.hook = rep(story.hook);
    story.ending = rep(story.ending);
    story.scenes.forEach(function (sc) {
      sc.narration = rep(sc.narration);
      sc.dialogues.forEach(function (d) { d.text = rep(d.text); });
    });
  }

  function viewStoryEditor(param) {
    if (param === 'brouillon') {
      if (!editor.story || editor.story.id) { location.replace('#/histoires'); return []; }
    } else if (!editor.story || editor.story.id !== param) {
      var loaded = Store.getStory(param);
      if (!loaded) {
        return [pageHeader('Histoire', '#/histoires'), emptyState('book', 'Histoire introuvable', 'Elle a peut-être été supprimée.')];
      }
      editor.story = loaded;
      editor.dirty = false;
    }
    editor.hash = location.hash;
    var st = editor.story;

    var durEl = h('div', { class: 'duration', role: 'status' });
    function refresh() {
      var d = durationInfo(st);
      durEl.className = 'duration is-' + d.state;
      durEl.replaceChildren(
        h('span', { class: 'duration-sec', text: '≈ ' + d.sec + ' s' }),
        h('span', { class: 'duration-msg', text: d.msg + ' · ' + StoryGen.words(st) + ' mots · ' + st.scenes.length + ' scènes' })
      );
    }
    function changed() { editor.dirty = true; refresh(); }
    refresh();

    var titleInput = h('input', { class: 'input input-title', type: 'text', maxlength: '100', 'aria-label': 'Titre de l’histoire' });
    titleInput.value = st.title;
    titleInput.addEventListener('input', function () { st.title = titleInput.value; changed(); });

    var genreSelect = h('select', { class: 'input', 'aria-label': 'Genre' }, StoryGen.GENRES.map(function (g) {
      var o = h('option', { value: g.id, text: g.label });
      if (g.id === st.genre) o.selected = true;
      return o;
    }));
    genreSelect.addEventListener('change', function () { st.genre = genreSelect.value; changed(); });

    var cast = h('div', { class: 'cast-edit' }, st.characters.map(function (c) {
      var name = h('input', { class: 'input', type: 'text', maxlength: '40', 'aria-label': 'Nom du personnage' });
      name.value = c.name;
      var previous = c.name;
      name.addEventListener('change', function () {
        var v = name.value.trim().replace(/\s+/g, ' ');
        if (!v) { name.value = previous; return; }
        renameEverywhere(st, previous, v);
        c.name = v; previous = v;
        editor.dirty = true;
        rerenderKeepScroll();
        toast('Nom remplacé dans toute l’histoire');
      });
      var role = h('input', { class: 'input input-sm', type: 'text', maxlength: '40', placeholder: 'Rôle', 'aria-label': 'Rôle de ' + c.name });
      role.value = c.role || '';
      role.addEventListener('input', function () { c.role = role.value; changed(); });
      return h('div', { class: 'cast-row' }, [name, role]);
    }));

    function speakerSelect(d) {
      var sel = h('select', { class: 'input input-sm speaker', 'aria-label': 'Personnage qui parle' }, st.characters.map(function (c) {
        var o = h('option', { value: c.key, text: c.name });
        if (c.key === d.speaker) o.selected = true;
        return o;
      }));
      sel.addEventListener('change', function () { d.speaker = sel.value; changed(); });
      return sel;
    }

    var scenes = h('ol', { class: 'scenes-edit' }, st.scenes.map(function (sc, i) {
      return h('li', { class: 'card scene-edit' }, [
        h('div', { class: 'scene-head' }, [
          h('p', { class: 'story-label', text: 'Scène ' + (i + 1) }),
          h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Supprimer la scène ' + (i + 1), onclick: function () {
            if (st.scenes.length <= 1) { toast('Une histoire doit garder au moins une scène'); return; }
            if (!window.confirm('Supprimer la scène ' + (i + 1) + ' ?')) return;
            st.scenes.splice(i, 1); editor.dirty = true; rerenderKeepScroll();
          } }, [icon('trash')])
        ]),
        h('label', { class: 'field' }, [
          h('span', { class: 'field-label', text: 'Narration' }),
          textarea(sc.narration, 'Narration de la scène ' + (i + 1), function (v) { sc.narration = v; changed(); })
        ]),
        h('div', { class: 'lines-edit' }, sc.dialogues.map(function (d, j) {
          return h('div', { class: 'line-edit' }, [
            h('div', { class: 'line-edit-head' }, [
              speakerSelect(d),
              h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Supprimer la réplique', onclick: function () {
                sc.dialogues.splice(j, 1); editor.dirty = true; rerenderKeepScroll();
              } }, [icon('trash')])
            ]),
            textarea(d.text, 'Réplique', function (v) { d.text = v; changed(); })
          ]);
        })),
        h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: function () {
          sc.dialogues.push({ speaker: st.characters[0].key, text: '' }); editor.dirty = true; rerenderKeepScroll();
        } }, [icon('plus'), h('span', { text: 'Ajouter une réplique' })])
      ]);
    }));

    var addScene = h('button', { type: 'button', class: 'btn btn-ghost btn-block', onclick: function () {
      st.scenes.push({ narration: '', dialogues: [] }); editor.dirty = true; rerenderKeepScroll();
    } }, [icon('plus'), h('span', { text: 'Ajouter une scène' })]);

    var actions = h('div', { class: 'editor-bar' }, [
      h('button', { type: 'button', class: 'btn btn-ghost', 'aria-label': 'Copier le texte', onclick: function () { copyText(StoryGen.toText(st)); } },
        [icon('copy'), h('span', { text: 'Copier' })]),
      h('button', { type: 'button', class: 'btn btn-primary', id: 'btn-save-story', onclick: function () {
        if (!String(st.title).trim()) { toast('Donne un titre à ton histoire'); titleInput.focus(); return; }
        var wasDraft = !st.id;
        var res = Store.saveStory(st);
        editor.story = res.story;
        editor.dirty = false;
        if (wasDraft) gen.draft = null;
        toast(res.saved ? 'Histoire enregistrée' : 'Enregistrement impossible : stockage bloqué');
        if (wasDraft) location.replace('#/histoire/' + encodeURIComponent(res.story.id));
      } }, [icon('save'), h('span', { text: 'Enregistrer' })])
    ]);

    var del = st.id ? h('button', { type: 'button', class: 'btn btn-danger btn-block', onclick: function () {
      if (!window.confirm('Supprimer l’histoire « ' + st.title + ' » ? Cette action est définitive.')) return;
      Store.deleteStory(st.id);
      if (window.Media) Media.removeStory(st.id).catch(function () {});
      editor.story = null; editor.dirty = false;
      toast('Histoire supprimée');
      location.hash = '#/histoires';
    } }, [icon('trash'), h('span', { text: 'Supprimer l’histoire' })]) : null;

    return [
      pageHeader(st.id ? 'Modifier' : 'Nouvelle histoire', '#/histoires'),
      durEl,
      h('section', { class: 'section' }, [
        h('label', { class: 'field' }, [h('span', { class: 'field-label', text: 'Titre' }), titleInput]),
        h('label', { class: 'field' }, [h('span', { class: 'field-label', text: 'Genre' }), genreSelect])
      ]),
      h('section', { class: 'section' }, [
        sectionHeader('Personnages'),
        h('p', { class: 'hint', text: 'Change un nom : il sera remplacé partout dans l’histoire.' }),
        cast
      ]),
      h('section', { class: 'section' }, [
        sectionHeader('Hook'),
        h('p', { class: 'hint', text: 'La phrase des premières secondes, celle qui accroche.' }),
        textarea(st.hook, 'Hook', function (v) { st.hook = v; changed(); }, 'textarea-hook')
      ]),
      h('section', { class: 'section' }, [sectionHeader('Scènes'), scenes, addScene]),
      h('section', { class: 'section' }, [
        sectionHeader('Fin surprenante'),
        textarea(st.ending, 'Fin', function (v) { st.ending = v; changed(); }, 'textarea-ending')
      ]),
      st.id ? h('a', { class: 'btn btn-ghost btn-block', href: '#/montage/' + encodeURIComponent(st.id), id: 'btn-open-montage' },
        [icon('film'), h('span', { text: 'Studio de montage de cette histoire' })]) : null,
      st.id ? h('a', { class: 'btn btn-ghost btn-block', href: '#/audio/' + encodeURIComponent(st.id), id: 'btn-open-audio' },
        [icon('mic'), h('span', { text: 'Studio audio de cette histoire' })]) : null,
      del,
      actions
    ];
  }

  function rerenderKeepScroll() {
    var y = window.scrollY;
    render();
    window.scrollTo(0, y);
  }


  /* ---------- Studio de personnages ---------- */

  var charForm = { data: null, dirty: false, hash: '' };

  var CHAR_FIELDS = [
    { key: 'appearance', label: 'Apparence physique', hint: 'Taille, silhouette, couleur du pelage ou de la peau, yeux, signes distinctifs.',
      placeholder: 'Ex. : grand et maigre, pelage roux usé, une oreille déchirée, yeux jaunes perçants, cicatrice sur le museau.' },
    { key: 'outfit', label: 'Vêtements', hint: 'Tenue, accessoires, couleurs, état des vêtements.',
      placeholder: 'Ex. : long manteau noir trempé de pluie, chemise blanche froissée, montre à gousset en argent.' },
    { key: 'personality', label: 'Personnalité', hint: 'Caractère, manies, ce qui le rend unique.',
      placeholder: 'Ex. : calme en apparence, sarcastique, ment très bien, ne supporte pas le silence.' },
    { key: 'voice', label: 'Voix', hint: 'Timbre, débit, accent, tics de langage. Utile pour choisir la voix off.',
      placeholder: 'Ex. : voix grave et rauque, parle lentement, chuchote quand il est en colère.' },
    { key: 'backstory', label: 'Histoire', hint: 'D’où il vient, ce qu’il cache, ce qu’il veut.',
      placeholder: 'Ex. : ancien magicien de cirque, il a disparu pendant dix ans. Personne ne sait ce qu’il a fait.' }
  ];

  function blankCharacter() {
    return { name: '', gender: 'm', species: '', appearance: '', outfit: '', personality: '', voice: '', backstory: '' };
  }

  function avatar(c, big) {
    return h('div', { class: 'avatar' + (big ? ' avatar-xl' : ''), 'aria-hidden': 'true', text: (c.name || '?').charAt(0).toUpperCase() });
  }

  function episodesLabel(n) { return n + ' épisode' + (n > 1 ? 's' : ''); }

  function viewCharacters() {
    var list = Store.characters();
    return [
      pageHeader('Personnages'),
      storageWarning(),
      h('section', { class: 'card generator' }, [
        h('h2', { class: 'generator-title', text: 'Studio de personnages' }),
        h('p', { class: 'generator-text', text: 'Crée des personnages anthropomorphes avec leur fiche complète et un prompt d’image 3D, puis fais-les jouer dans tes histoires.' }),
        h('a', { class: 'btn btn-primary btn-block', href: '#/personnage/nouveau', id: 'btn-new-character' }, [icon('plus'), h('span', { text: 'Créer un personnage' })])
      ]),
      h('section', { class: 'section' }, [
        sectionHeader('Ma bibliothèque' + (list.length ? ' (' + list.length + ')' : '')),
        list.length
          ? h('div', { class: 'list' }, list.map(function (c) {
              var n = Store.storiesWithCharacter(c.id).length;
              return h('a', { class: 'card story-card char-card', href: '#/personnage/' + encodeURIComponent(c.id) }, [
                avatar(c),
                h('div', { class: 'project-info' }, [
                  h('h3', { class: 'project-title', text: c.name }),
                  h('p', { class: 'project-meta' }, [
                    c.species ? h('span', { class: 'badge badge-genre', text: c.species }) : null,
                    h('span', { text: episodesLabel(n) })
                  ])
                ]),
                h('span', { class: 'chev' }, [icon('chevron')])
              ]);
            }))
          : emptyState('user', 'Aucun personnage', 'Crée ton premier personnage : il pourra ensuite jouer dans plusieurs histoires.')
      ])
    ];
  }

  function promptBox(title, text, id) {
    return h('div', { class: 'prompt' }, [
      h('div', { class: 'prompt-head' }, [
        h('p', { class: 'story-label', text: title }),
        h('button', { type: 'button', class: 'btn btn-ghost btn-sm', id: id, onclick: function () { copyText(text); } },
          [icon('copy'), h('span', { text: 'Copier' })])
      ]),
      h('p', { class: 'prompt-text', text: text })
    ]);
  }

  function viewCharacterSheet(id) {
    var c = Store.getCharacter(id);
    if (!c) return [pageHeader('Personnage', '#/personnages'), emptyState('user', 'Personnage introuvable', 'Il a peut-être été supprimé.')];
    var episodes = Store.storiesWithCharacter(id);

    var sections = [h('div', { class: 'card char-hero' }, [
      avatar(c, true),
      h('div', { class: 'char-hero-body' }, [
        h('h2', { class: 'char-name', text: c.name }),
        h('p', { class: 'char-sub', text: [c.species || 'Espèce non précisée', c.gender === 'f' ? 'Elle' : 'Il'].join(' · ') }),
        h('span', { class: 'badge badge-ready', text: episodesLabel(episodes.length) })
      ])
    ])];

    CHAR_FIELDS.forEach(function (f) {
      sections.push(h('section', { class: 'card sheet-block' }, [
        h('p', { class: 'story-label', text: f.label }),
        c[f.key] ? h('p', { class: 'story-text pre', text: c[f.key] }) : h('p', { class: 'muted', text: 'Non renseigné.' })
      ]));
    });

    sections.push(h('section', { class: 'section' }, [
      sectionHeader('Épisodes'),
      episodes.length
        ? h('div', { class: 'list' }, episodes.map(function (st) {
            return h('a', { class: 'card story-card', href: '#/histoire/' + encodeURIComponent(st.id) }, [
              h('div', { class: 'module-icon' }, [icon('book')]),
              h('div', { class: 'project-info' }, [
                h('h3', { class: 'project-title', text: st.title }),
                h('p', { class: 'project-meta' }, [h('span', { class: 'badge badge-genre', text: StoryGen.genreLabel(st.genre) })])
              ]),
              h('span', { class: 'chev' }, [icon('chevron')])
            ]);
          }))
        : h('p', { class: 'hint', text: 'Ce personnage n’a encore joué dans aucun épisode sauvegardé.' }),
      h('button', { type: 'button', class: 'btn btn-ghost btn-block', id: 'btn-cast-character', onclick: function () {
        gen.cast = [c.id];
        gen.draft = null;
        location.hash = '#/histoires';
      } }, [icon('sparkle'), h('span', { text: 'Faire jouer dans une nouvelle histoire' })])
    ]));

    sections.push(h('section', { class: 'section' }, [
      sectionHeader('Prompt image 3D'),
      h('p', { class: 'hint', text: 'BRAINROT STUDIO ne génère pas d’image. Copie ce prompt et colle-le dans l’outil de génération d’image de ton choix.' }),
      h('div', { class: 'card prompt-card' }, [
        promptBox('Prompt', CharacterPrompt.imagePrompt(c), 'btn-copy-prompt'),
        promptBox('Prompt négatif (si l’outil le propose)', CharacterPrompt.negative, 'btn-copy-negative')
      ])
    ]));

    sections.push(h('div', { class: 'actions-row' }, [
      h('button', { type: 'button', class: 'btn btn-ghost', onclick: function () {
        copyText(CharacterPrompt.sheetText(c, episodes.map(function (e) { return e.title; })));
      } }, [icon('copy'), h('span', { text: 'Copier la fiche' })]),
      h('a', { class: 'btn btn-primary', href: '#/personnage/' + encodeURIComponent(c.id) + '/modifier', id: 'btn-edit-character' },
        [icon('pencil'), h('span', { text: 'Modifier' })])
    ]));

    sections.push(h('button', { type: 'button', class: 'btn btn-danger btn-block', onclick: function () {
      var msg = 'Supprimer « ' + c.name + ' » de la bibliothèque ?' +
        (episodes.length ? ' Les ' + episodesLabel(episodes.length) + ' où il joue resteront intacts.' : '');
      if (!window.confirm(msg)) return;
      Store.deleteCharacter(c.id);
      gen.cast = gen.cast.filter(function (x) { return x !== c.id; });
      toast('Personnage supprimé');
      location.hash = '#/personnages';
    } }, [icon('trash'), h('span', { text: 'Supprimer le personnage' })]));

    return [pageHeader(c.name, '#/personnages')].concat(sections);
  }

  function viewCharacterForm(id) {
    if (id === null) {
      if (!charForm.data || charForm.data.id) { charForm.data = blankCharacter(); charForm.dirty = false; }
    } else if (!charForm.data || charForm.data.id !== id) {
      var loaded = Store.getCharacter(id);
      if (!loaded) return [pageHeader('Personnage', '#/personnages'), emptyState('user', 'Personnage introuvable', 'Il a peut-être été supprimé.')];
      charForm.data = loaded;
      charForm.dirty = false;
    }
    charForm.hash = location.hash;
    var c = charForm.data;

    var promptEl = h('p', { class: 'prompt-text', id: 'prompt-preview' });
    function refresh() {
      promptEl.textContent = c.name.trim() && c.species.trim()
        ? CharacterPrompt.imagePrompt(c)
        : 'Indique au moins le nom et l’espèce pour voir le prompt.';
    }
    function changed() { charForm.dirty = true; refresh(); }
    refresh();

    var name = h('input', { class: 'input input-title', type: 'text', maxlength: '40', id: 'char-name', autocomplete: 'off', placeholder: 'Ex. : Maître Ferdinand', 'aria-label': 'Nom' });
    name.value = c.name;
    name.addEventListener('input', function () { c.name = name.value; changed(); });

    var species = h('input', { class: 'input', type: 'text', maxlength: '40', id: 'char-species', list: 'species-list', autocomplete: 'off', placeholder: 'Ex. : Renard, Hibou, Requin…', 'aria-label': 'Espèce' });
    species.value = c.species;
    species.addEventListener('input', function () { c.species = species.value; changed(); });
    var datalist = h('datalist', { id: 'species-list' }, CharacterPrompt.SPECIES.map(function (sp) { return h('option', { value: sp }); }));

    var segs = [['m', 'Il'], ['f', 'Elle']].map(function (g) {
      var b = h('button', { type: 'button', class: 'chip' + (c.gender === g[0] ? ' is-active' : ''), 'aria-pressed': c.gender === g[0] ? 'true' : 'false', 'data-gender': g[0] }, [g[1]]);
      b.addEventListener('click', function () {
        c.gender = g[0];
        segs.forEach(function (x) {
          var on = x.getAttribute('data-gender') === g[0];
          x.classList.toggle('is-active', on); x.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        changed();
      });
      return b;
    });

    var fields = CHAR_FIELDS.map(function (f) {
      var t = textarea(c[f.key], f.label, function (v) { c[f.key] = v; changed(); });
      t.setAttribute('placeholder', f.placeholder);
      t.setAttribute('maxlength', '1500');
      t.id = 'char-' + f.key;
      return h('label', { class: 'field' }, [
        h('span', { class: 'field-label', text: f.label }),
        h('span', { class: 'hint', text: f.hint }),
        t
      ]);
    });

    var isNew = !c.id;
    var bar = h('div', { class: 'editor-bar' }, [
      h('a', { class: 'btn btn-ghost', href: isNew ? '#/personnages' : '#/personnage/' + encodeURIComponent(c.id) }, ['Annuler']),
      h('button', { type: 'button', class: 'btn btn-primary', id: 'btn-save-character', onclick: function () {
        if (!c.name.trim()) { toast('Donne un nom à ton personnage'); name.focus(); return; }
        if (!c.species.trim()) { toast('Indique son espèce'); species.focus(); return; }
        var res = Store.saveCharacter(c);
        charForm.dirty = false;
        charForm.data = null;
        toast(res.saved ? 'Personnage enregistré' : 'Enregistrement impossible : stockage bloqué');
        location.replace('#/personnage/' + encodeURIComponent(res.character.id));
      } }, [icon('save'), h('span', { text: 'Enregistrer' })])
    ]);

    return [
      pageHeader(isNew ? 'Nouveau personnage' : 'Modifier', isNew ? '#/personnages' : '#/personnage/' + encodeURIComponent(c.id)),
      storageWarning(),
      h('section', { class: 'section' }, [
        h('label', { class: 'field' }, [h('span', { class: 'field-label', text: 'Nom *' }), name]),
        h('div', { class: 'field' }, [h('span', { class: 'field-label', text: 'Pronom (accorde les histoires)' }),
          h('div', { class: 'chips', role: 'group', 'aria-label': 'Pronom' }, segs)]),
        h('label', { class: 'field' }, [h('span', { class: 'field-label', text: 'Espèce *' }), species, datalist])
      ]),
      h('section', { class: 'section' }, fields),
      h('section', { class: 'section' }, [
        sectionHeader('Aperçu du prompt image'),
        h('div', { class: 'card prompt-card' }, [promptEl])
      ]),
      bar
    ];
  }

  function viewCharacterRoute(param) {
    if (param === 'nouveau') return viewCharacterForm(null);
    var m = /^(.+)\/modifier$/.exec(param);
    if (m) return viewCharacterForm(m[1]);
    return viewCharacterSheet(param);
  }


  /* ---------- Synthèse vocale de l'appareil (Web Speech API) ---------- */
  // Gratuite, sans compte ni carte : c'est la voix intégrée au système (iPhone : Safari).

  var tts = {
    supported: typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined',
    voices: [],
    playing: false,
    token: 0,
    current: null
  };

  function loadVoices() {
    if (!tts.supported) return;
    var all = window.speechSynthesis.getVoices() || [];
    tts.voices = all.filter(function (v) { return /^fr/i.test(v.lang); });
  }
  if (tts.supported) {
    loadVoices();
    window.speechSynthesis.addEventListener && window.speechSynthesis.addEventListener('voiceschanged', function () {
      var before = tts.voices.length;
      loadVoices();
      if (tts.voices.length !== before && currentRoute() === 'audio' && !tts.playing) rerenderKeepScroll();
    });
  }

  function voiceFor(uri) {
    for (var i = 0; i < tts.voices.length; i++) if (tts.voices[i].voiceURI === uri) return tts.voices[i];
    return tts.voices[0] || null;
  }

  function voiceLabel(uri) {
    var v = voiceFor(uri);
    return v ? v.name + ' (' + v.lang + ')' : 'Voix française par défaut de l’appareil';
  }

  /** Dit un texte. Appelle done({ ok, start, end }) une seule fois. */
  function speak(text, settings, onStart, done) {
    var my = tts.token;
    var finished = false, started = null;
    var u = new window.SpeechSynthesisUtterance(text);
    var v = voiceFor(settings && settings.voiceURI);
    if (v) u.voice = v;
    u.lang = v ? v.lang : 'fr-FR';
    u.rate = settings && settings.rate || 1;
    u.pitch = settings && settings.pitch || 1;
    // Filet de sécurité : sur certains iPhone, la fin de lecture n'est pas toujours signalée.
    var limit = setTimeout(function () { finish(false); }, (text.split(/\s+/).length / (2.5 * u.rate) + 6) * 1000);
    function finish(ok) {
      if (finished) return;
      finished = true;
      clearTimeout(limit);
      if (my === tts.token) done({ ok: ok, start: started, end: performance.now() });
    }
    u.onstart = function () { started = performance.now(); if (onStart && my === tts.token) onStart(); };
    u.onend = function () { finish(started !== null); };
    u.onerror = function () { finish(false); };
    tts.current = u; // garde une référence (sinon Safari peut l'oublier en cours de lecture)
    window.speechSynthesis.speak(u);
  }

  function stopSpeech() {
    tts.token += 1;
    tts.playing = false;
    if (tts.supported) window.speechSynthesis.cancel();
    var btn = document.getElementById('btn-play-all');
    if (btn) setPlayButton(btn, false);
    var cap = document.getElementById('caption');
    if (cap) cap.classList.remove('is-live');
    document.querySelectorAll('.seg.is-current').forEach(function (e) { e.classList.remove('is-current'); });
  }

  window.addEventListener('pagehide', stopSpeech);

  /* ---------- Studio audio ---------- */

  var audioUI = { storyId: null, data: null };

  function slug(t) {
    return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'histoire';
  }

  function downloadFile(name, mime, content) {
    var blob = new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = h('a', { href: url, download: name, class: 'sr-only' });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    toast('Fichier « ' + name + ' » prêt');
  }

  function speakerKeys(story) {
    return [AudioScript.NARRATOR].concat(story.characters.map(function (c) { return c.key; }));
  }

  function characterGender(c) {
    if (c.gender) return c.gender;
    if (c.libraryId) { var lib = Store.getCharacter(c.libraryId); if (lib) return lib.gender; }
    return null;
  }

  function voiceNotes(story) {
    var notes = {};
    story.characters.forEach(function (c) {
      var lib = c.libraryId && Store.getCharacter(c.libraryId);
      if (lib && lib.voice) notes[c.key] = lib.voice;
    });
    return notes;
  }

  function buildAudio(story) {
    var built = AudioScript.build(story, voiceNotes(story));
    var voices = {};
    voices[AudioScript.NARRATOR] = { voiceURI: '', rate: 1, pitch: 1 };
    var spare = [0.92, 1.15, 1.05];
    story.characters.forEach(function (c, i) {
      var g = characterGender(c);
      voices[c.key] = { voiceURI: '', rate: 1, pitch: g === 'f' ? 1.2 : g === 'm' ? 0.85 : spare[i % spare.length] };
    });
    // Si l'appareil propose plusieurs voix françaises, chaque rôle en reçoit une différente.
    if (tts.voices.length > 1) {
      speakerKeys(story).forEach(function (k, i) { voices[k].voiceURI = tts.voices[i % tts.voices.length].voiceURI; });
    }
    var audio = { storyId: story.id, storyUpdatedAt: story.updatedAt, createdAt: Date.now(),
      segments: built.segments, ambiance: built.ambiance, voices: voices };
    AudioScript.timeline(audio.segments, audio.voices);
    return audio;
  }

  function saveAudio() {
    AudioScript.timeline(audioUI.data.segments, audioUI.data.voices);
    var res = Store.saveAudio(audioUI.data);
    if (!res.saved) toast('Enregistrement impossible : stockage bloqué');
  }

  function clearMeasures() {
    var had = audioUI.data.segments.some(function (s) { return s.measured; });
    audioUI.data.segments.forEach(function (s) { delete s.measured; });
    return had;
  }

  function setPlayButton(btn, playing) {
    btn.replaceChildren(icon(playing ? 'stop' : 'play'), h('span', { text: playing ? 'Arrêter' : 'Écouter toute la piste' }));
    btn.classList.toggle('is-playing', playing);
  }

  function showCaption(story, seg, sfxList) {
    var cap = document.getElementById('caption');
    if (!cap) return;
    var names = AudioScript.namesOf(story);
    cap.classList.add('is-live');
    var parts = [
      h('p', { class: 'caption-who', text: names[seg.speaker] || seg.speaker }),
      h('p', { class: 'caption-text', text: seg.text })
    ];
    if (sfxList.length) parts.push(h('p', { class: 'caption-sfx', text: 'Bruitage : ' + sfxList.map(function (x) { return x.text; }).join(' + ') }));
    cap.replaceChildren.apply(cap, parts);
    document.querySelectorAll('.seg.is-current').forEach(function (e) { e.classList.remove('is-current'); });
    var el = document.getElementById('seg-' + seg.id);
    if (el) el.classList.add('is-current');
  }

  function playAll(story) {
    var audio = audioUI.data;
    var list = audio.segments.filter(AudioScript.isSpoken);
    if (!list.length) return;
    stopSpeech();
    tts.playing = true;
    var btn = document.getElementById('btn-play-all');
    if (btn) setPlayButton(btn, true);
    var t0 = null, results = [], i = 0;
    function next() {
      if (i >= list.length) return complete();
      var seg = list[i];
      var fx = audio.segments.filter(function (s) { return s.kind === 'sfx' && s.anchor === seg.id; });
      speak(seg.text, audio.voices[seg.speaker], function () {
        if (t0 === null) t0 = performance.now();
        showCaption(story, seg, fx);
      }, function (r) {
        results.push(r);
        i += 1;
        next();
      });
    }
    function complete() {
      var valid = results.length === list.length && t0 !== null && results.every(function (r) { return r.ok && r.end - r.start > 100; });
      stopSpeech();
      if (valid) {
        list.forEach(function (seg, k) {
          seg.measured = { start: (results[k].start - t0) / 1000, end: (results[k].end - t0) / 1000 };
        });
        saveAudio();
        toast('Sous-titres calés sur la voix de ton appareil');
        rerenderKeepScroll();
      } else {
        toast('Lecture terminée');
      }
    }
    next();
  }

  function viewAudioList() {
    var stories = Store.stories();
    var withAudio = Store.audioStoryIds();
    return [
      pageHeader('Studio audio'),
      h('section', { class: 'card generator' }, [
        h('h2', { class: 'generator-title', text: 'Studio audio' }),
        h('p', { class: 'generator-text', text: 'Transforme une histoire en piste audio : narration, dialogues par personnage, indications de jeu, bruitages et sous-titres synchronisés, exportables en SRT, WebVTT et JSON.' })
      ]),
      h('section', { class: 'section' }, [
        sectionHeader('Choisis une histoire'),
        stories.length
          ? h('div', { class: 'list' }, stories.map(function (st) {
              var has = withAudio.indexOf(st.id) !== -1;
              return h('a', { class: 'card story-card', href: '#/audio/' + encodeURIComponent(st.id) }, [
                h('div', { class: 'module-icon' }, [icon('mic')]),
                h('div', { class: 'project-info' }, [
                  h('h3', { class: 'project-title', text: st.title }),
                  h('p', { class: 'project-meta' }, [
                    h('span', { class: 'badge badge-genre', text: StoryGen.genreLabel(st.genre) }),
                    h('span', { class: has ? 'badge badge-ready' : 'badge badge-soon', text: has ? 'Piste prête' : 'Pas de piste' })
                  ])
                ]),
                h('span', { class: 'chev' }, [icon('chevron')])
              ]);
            }))
          : h('div', { class: 'cast-empty' }, [
              emptyState('mic', 'Aucune histoire sauvegardée', 'Le studio audio part d’une histoire : génère-en une et sauvegarde-la d’abord.'),
              h('a', { class: 'btn btn-ghost btn-sm', href: '#/histoires' }, [icon('book'), h('span', { text: 'Aller au générateur' })])
            ])
      ])
    ];
  }

  function viewAudio(storyId) {
    if (!storyId) return viewAudioList();
    var story = Store.getStory(storyId);
    if (!story) return [pageHeader('Studio audio', '#/audio'), emptyState('mic', 'Histoire introuvable', 'Elle a peut-être été supprimée.')];
    if (audioUI.storyId !== storyId) { audioUI.storyId = storyId; audioUI.data = Store.getAudio(storyId); }
    var audio = audioUI.data;
    var head = pageHeader('Studio audio', '#/histoire/' + encodeURIComponent(storyId));
    var intro = h('div', { class: 'card char-hero' }, [
      h('div', { class: 'module-icon' }, [icon('mic')]),
      h('div', { class: 'char-hero-body' }, [
        h('h2', { class: 'story-title', text: story.title }),
        h('span', { class: 'badge badge-genre', text: StoryGen.genreLabel(story.genre) })
      ])
    ]);

    if (!audio) {
      return [head, storageWarning(), intro, h('section', { class: 'card generator' }, [
        h('p', { class: 'generator-text', text: 'Prépare la piste : chaque narration et chaque réplique devient un segment avec son indication de jeu, les bruitages sont repérés dans le texte, et les sous-titres sont calés dans le temps.' }),
        h('button', { type: 'button', class: 'btn btn-primary btn-block', id: 'btn-build-audio', onclick: function () {
          audioUI.data = buildAudio(story);
          saveAudio();
          toast('Piste audio prête');
          rerenderKeepScroll();
        } }, [icon('sparkle'), h('span', { text: 'Préparer la piste audio' })])
      ])];
    }

    var tl = AudioScript.timeline(audio.segments, audio.voices);
    var names = AudioScript.namesOf(story);
    var cues = AudioScript.subtitles(audio.segments, names);
    var spokenCount = audio.segments.filter(AudioScript.isSpoken).length;
    var sfxCount = audio.segments.length - spokenCount;
    var roles = {};
    story.characters.forEach(function (c) { roles[c.key] = c.role; });
    var stale = story.updatedAt > (audio.storyUpdatedAt || 0);

    function rebuild(keepVoices) {
      stopSpeech();
      var oldVoices = audio.voices;
      audioUI.data = buildAudio(story);
      if (keepVoices) Object.keys(oldVoices).forEach(function (k) { if (audioUI.data.voices[k]) audioUI.data.voices[k] = oldVoices[k]; });
      saveAudio();
      toast('Piste recréée depuis l’histoire');
      rerenderKeepScroll();
    }

    var nodes = [head, storageWarning(), intro];

    if (stale) {
      nodes.push(h('div', { class: 'warning warning-action' }, [
        h('p', { text: 'L’histoire a été modifiée après la création de cette piste. Mets la piste à jour pour reprendre les nouveaux textes : tes réglages de voix sont gardés, les indications et bruitages sont recalculés.' }),
        h('button', { type: 'button', class: 'btn btn-ghost btn-sm', id: 'btn-refresh-audio', onclick: function () { rebuild(true); } }, ['Mettre à jour la piste'])
      ]));
    }

    nodes.push(h('section', { class: 'stats stats-4', 'aria-label': 'Résumé de la piste' }, [
      statTile(AudioScript.short(tl.total).replace(/^0(\d):/, '$1:'), 'Durée'),
      statTile(String(spokenCount), 'Segments de voix'),
      statTile(String(sfxCount), 'Bruitages'),
      statTile(String(cues.length), 'Sous-titres')
    ]));

    // Lecteur
    var playBtn = h('button', { type: 'button', class: 'btn btn-primary btn-block', id: 'btn-play-all', disabled: !tts.supported, onclick: function () {
      if (tts.playing) stopSpeech(); else playAll(story);
    } });
    setPlayButton(playBtn, tts.playing);
    nodes.push(h('section', { class: 'card player' }, [
      h('div', { class: 'player-head' }, [
        h('p', { class: 'story-label', text: 'Écoute' }),
        h('span', { class: 'badge ' + (tl.source === 'mesuré' ? 'badge-time is-ok' : 'badge-soon'), id: 'timing-badge',
          text: tl.source === 'mesuré' ? 'Minutage mesuré sur la voix' : 'Minutage estimé' })
      ]),
      h('div', { class: 'caption', id: 'caption' }, [h('p', { class: 'caption-text muted', text: tts.supported ? 'Le sous-titre s’affichera ici pendant la lecture.' : 'La synthèse vocale n’est pas disponible sur ce navigateur.' })]),
      playBtn,
      h('p', { class: 'generator-note', text: tts.supported
        ? 'Voix de synthèse intégrée à ton appareil : gratuite, sans compte, sans connexion. ' +
          (tts.voices.length ? tts.voices.length + ' voix française' + (tts.voices.length > 1 ? 's disponibles' : ' disponible') + '. ' : 'Aucune voix française listée pour l’instant : la voix par défaut sera utilisée. ') +
          'Une écoute complète cale automatiquement les sous-titres sur la vraie voix. Les bruitages s’affichent mais ne sont pas joués (ce sont des repères). Si tu n’entends rien, vérifie le volume et le mode silencieux.'
        : 'Les données (script, bruitages, sous-titres) restent utilisables et exportables.' })
    ]));

    // Voix par personnage
    nodes.push(h('section', { class: 'section' }, [
      sectionHeader('Voix'),
      h('p', { class: 'hint', text: 'Choisis une voix, sa vitesse et sa hauteur pour chaque rôle. Changer un réglage refait l’estimation du minutage.' }),
      h('div', { class: 'list' }, speakerKeys(story).map(function (k) {
        var v = audio.voices[k] || (audio.voices[k] = { voiceURI: '', rate: 1, pitch: 1 });
        var note = voiceNotes(story)[k];
        function changed() {
          stopSpeech();
          var had = clearMeasures();
          saveAudio();
          if (had) toast('Réglage changé : minutage repassé en estimation');
          rerenderKeepScroll();
        }
        var sel = h('select', { class: 'input', 'aria-label': 'Voix de ' + names[k] }, [h('option', { value: '', text: 'Voix par défaut de l’appareil' })].concat(
          tts.voices.map(function (vo) { var o = h('option', { value: vo.voiceURI, text: vo.name + ' (' + vo.lang + ')' }); if (vo.voiceURI === v.voiceURI) o.selected = true; return o; })));
        sel.addEventListener('change', function () { v.voiceURI = sel.value; changed(); });
        function slider(label, key, min, max) {
          var out = h('span', { class: 'range-val', text: v[key].toFixed(2) });
          var r = h('input', { type: 'range', class: 'range', min: String(min), max: String(max), step: '0.05', 'aria-label': label + ' de ' + names[k] });
          r.value = String(v[key]);
          r.addEventListener('input', function () { out.textContent = Number(r.value).toFixed(2); });
          r.addEventListener('change', function () { v[key] = Number(r.value); changed(); });
          return h('label', { class: 'range-row' }, [h('span', { class: 'field-label', text: label }), r, out]);
        }
        return h('div', { class: 'card voice-card' }, [
          h('div', { class: 'voice-head' }, [
            h('div', {}, [h('p', { class: 'cast-name', text: names[k] }), h('p', { class: 'cast-role', text: k === AudioScript.NARRATOR ? 'Narration' : roles[k] || '' })]),
            h('button', { type: 'button', class: 'btn btn-ghost btn-sm', disabled: !tts.supported, 'aria-label': 'Tester la voix de ' + names[k], onclick: function () {
              stopSpeech();
              speak(k === AudioScript.NARRATOR ? 'Voici la voix du narrateur.' : 'Bonjour, je suis ' + names[k] + '.', v, null, function () {});
            } }, [icon('play'), h('span', { text: 'Tester' })])
          ]),
          note ? h('p', { class: 'hint', text: 'Voix décrite dans le studio : ' + note }) : null,
          sel,
          slider('Vitesse', 'rate', 0.6, 1.4),
          slider('Hauteur', 'pitch', 0.5, 1.6)
        ]);
      }))
    ]));

    // Ambiance
    var amb = h('input', { class: 'input', type: 'text', maxlength: '200', 'aria-label': 'Ambiance sonore', placeholder: 'Ex. : pluie et nappe grave' });
    amb.value = audio.ambiance || '';
    amb.addEventListener('change', function () { audio.ambiance = amb.value.trim(); saveAudio(); });
    nodes.push(h('section', { class: 'section' }, [
      sectionHeader('Ambiance (tout du long)'),
      amb
    ]));

    // Conducteur
    var sceneCount = story.scenes.length;
    var groups = {};
    audio.segments.forEach(function (s) { (groups[s.scene] = groups[s.scene] || []).push(s); });
    var timelineNodes = Object.keys(groups).map(Number).sort(function (a, b) { return a - b; }).map(function (sc) {
      var segs = groups[sc].slice().sort(function (a, b) { return a.start - b.start || (a.kind === 'sfx' ? -1 : 1); });
      var anchorSeg = segs.filter(AudioScript.isSpoken)[0];
      return h('li', { class: 'card scene-edit' }, [
        h('p', { class: 'story-label', text: sc === 0 ? 'Hook' : sc > sceneCount ? 'Fin' : 'Scène ' + sc }),
        h('div', { class: 'segs' }, segs.map(function (s) { return segmentRow(s); })),
        anchorSeg ? h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: function () {
          audio.segments.push({ id: 'fx' + Date.now().toString(36), scene: sc, kind: 'sfx', anchor: anchorSeg.id, text: 'Nouveau bruitage', dur: 1.5 });
          saveAudio(); rerenderKeepScroll();
        } }, [icon('plus'), h('span', { text: 'Ajouter un bruitage' })]) : null
      ]);
    });

    function segmentRow(s) {
      var time = h('span', { class: 'seg-time', text: AudioScript.short(s.start) + ' → ' + AudioScript.short(s.end) });
      if (s.kind === 'sfx') {
        var fx = h('input', { class: 'input input-sm', type: 'text', maxlength: '120', 'aria-label': 'Description du bruitage' });
        fx.value = s.text;
        fx.addEventListener('change', function () { s.text = fx.value.trim() || 'Bruitage'; saveAudio(); });
        return h('div', { class: 'seg seg-sfx', id: 'seg-' + s.id }, [
          h('div', { class: 'seg-head' }, [h('span', { class: 'badge badge-sfx', text: 'Bruitage' }), time,
            h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Supprimer le bruitage', onclick: function () {
              audio.segments = audio.segments.filter(function (x) { return x.id !== s.id; });
              saveAudio(); rerenderKeepScroll();
            } }, [icon('trash')])]),
          fx
        ]);
      }
      var dir = textarea(s.direction, 'Indication de jeu', function (v) { s.direction = v; });
      dir.addEventListener('change', saveAudio);
      return h('div', { class: 'seg', id: 'seg-' + s.id }, [
        h('div', { class: 'seg-head' }, [
          h('span', { class: 'badge ' + (s.kind === 'dialogue' ? 'badge-ready' : 'badge-genre'), text: names[s.speaker] || s.speaker }),
          time,
          h('button', { type: 'button', class: 'icon-btn', disabled: !tts.supported, 'aria-label': 'Écouter ce segment', onclick: function () {
            stopSpeech();
            speak(s.text, audio.voices[s.speaker], null, function () {});
          } }, [icon('play')])
        ]),
        h('p', { class: 'seg-text', text: s.text }),
        h('label', { class: 'field' }, [h('span', { class: 'field-label', text: 'Indication de jeu' }), dir])
      ]);
    }

    nodes.push(h('section', { class: 'section' }, [
      sectionHeader('Conducteur'),
      h('p', { class: 'hint', text: 'Les textes viennent de l’histoire (modifie-les dans l’éditeur d’histoire). Ici, tu règles les indications de jeu et les bruitages.' }),
      h('ol', { class: 'scenes-edit' }, timelineNodes)
    ]));

    // Exports
    var base = slug(story.title);
    function labels() { var l = {}; speakerKeys(story).forEach(function (k) { l[k] = voiceLabel(audio.voices[k] && audio.voices[k].voiceURI); }); return l; }
    nodes.push(h('section', { class: 'section' }, [
      sectionHeader('Exporter'),
      h('p', { class: 'hint', text: 'Fichiers texte standards, à enregistrer dans Fichiers puis importer dans ton logiciel de montage.' }),
      h('div', { class: 'export-grid' }, [
        h('button', { type: 'button', class: 'btn btn-ghost', id: 'btn-srt', onclick: function () {
          downloadFile(base + '.srt', 'application/x-subrip;charset=utf-8', AudioScript.toSRT(AudioScript.subtitles(audio.segments, names)));
        } }, [icon('download'), h('span', { text: 'Sous-titres .srt' })]),
        h('button', { type: 'button', class: 'btn btn-ghost', id: 'btn-vtt', onclick: function () {
          downloadFile(base + '.vtt', 'text/vtt;charset=utf-8', AudioScript.toVTT(AudioScript.subtitles(audio.segments, names)));
        } }, [icon('download'), h('span', { text: 'Sous-titres .vtt' })]),
        h('button', { type: 'button', class: 'btn btn-ghost', id: 'btn-json', onclick: function () {
          downloadFile(base + '-audio.json', 'application/json;charset=utf-8', JSON.stringify(AudioScript.exportJSON(story, audio, labels()), null, 2));
        } }, [icon('download'), h('span', { text: 'Données .json' })]),
        h('button', { type: 'button', class: 'btn btn-ghost', id: 'btn-copy-audio', onclick: function () { copyText(AudioScript.toText(story, audio)); } },
          [icon('copy'), h('span', { text: 'Copier le script' })])
      ]),
      h('p', { class: 'generator-note', text: 'Le navigateur ne permet pas d’enregistrer la voix de synthèse dans un fichier audio. Pour garder le son, tu peux essayer l’enregistrement d’écran de l’iPhone (avec le micro coupé) pendant une écoute complète.' })
    ]));

    nodes.push(h('button', { type: 'button', class: 'btn btn-danger btn-block', onclick: function () {
      if (!window.confirm('Recréer la piste depuis l’histoire ? Tes indications de jeu, bruitages et réglages de voix seront remplacés.')) return;
      rebuild(false);
    } }, [icon('sparkle'), h('span', { text: 'Recréer la piste depuis l’histoire' })]));

    nodes.splice(nodes.length - 1, 0, h('a', { class: 'btn btn-primary btn-block', href: '#/montage/' + encodeURIComponent(storyId), id: 'btn-go-montage' },
      [icon('film'), h('span', { text: 'Passer au montage' })]));

    return nodes;
  }

  function statTile(value, label) {
    return h('div', { class: 'card stat' }, [h('p', { class: 'stat-value', text: value }), h('p', { class: 'stat-label', text: label })]);
  }


  /* ---------- Studio de montage ---------- */
  // Aperçu animé dans l'appli + plan de montage exportable. Aucun rendu de fichier vidéo.

  var PPS = 16; // pixels par seconde sur la timeline
  var mUI = { storyId: null, images: {}, urls: [], loadedFor: null, selected: 0, t: 0, playing: false, raf: 0, t0: 0, from: 0, shown: -1 };

  function libraryMap() {
    var map = {};
    Store.characters().forEach(function (c) { map[c.id] = c; });
    return map;
  }

  function revokeImages() {
    mUI.urls.forEach(function (u) { URL.revokeObjectURL(u); });
    mUI.urls = [];
    mUI.images = {};
  }

  function loadImages(storyId) {
    mUI.loadedFor = storyId;
    if (!window.Media) return;
    Media.list(storyId).then(function (map) {
      if (mUI.storyId !== storyId) return;
      revokeImages();
      Object.keys(map).forEach(function (k) {
        var u = URL.createObjectURL(map[k].blob);
        mUI.urls.push(u);
        mUI.images[k] = { url: u, ext: map[k].ext, blob: map[k].blob, width: map[k].width, height: map[k].height };
      });
      if (currentRoute() === 'montage' && Object.keys(map).length) rerenderKeepScroll();
    }, function () { /* stockage d'images indisponible : l'aperçu utilise des cartes de scène */ });
  }

  function stopPreview() {
    mUI.playing = false;
    if (mUI.raf) cancelAnimationFrame(mUI.raf);
    mUI.raf = 0;
    var b = document.getElementById('btn-preview');
    if (b) b.replaceChildren(icon('play'), h('span', { text: 'Lire l’aperçu' }));
  }

  function timedAudio(story, audio) {
    AudioScript.timeline(audio.segments, audio.voices);
    return audio;
  }

  /** Empreinte des horaires de la voix : le montage n'est à recaler que si elle change. */
  function audioSig(audio) {
    return audio.segments.filter(AudioScript.isSpoken).map(function (x) { return x.id + ':' + x.start + '-' + x.end; }).join('|');
  }

  function prepareMontage(story, previous) {
    var audio = Store.getAudio(story.id);
    var createdAudio = false;
    if (!audio) { audio = buildAudio(story); Store.saveAudio(audio); audio = Store.getAudio(story.id); createdAudio = true; }
    else if (story.updatedAt > (audio.storyUpdatedAt || 0)) {
      // L'histoire a changé : la piste audio est recalée d'abord (réglages de voix gardés).
      var voices = audio.voices;
      audio = buildAudio(story);
      Object.keys(voices).forEach(function (k) { if (audio.voices[k]) audio.voices[k] = voices[k]; });
      Store.saveAudio(audio); audio = Store.getAudio(story.id); createdAudio = true;
    }
    timedAudio(story, audio);
    var m = Montage.build(story, audio, libraryMap(), previous);
    m.audioSig = audioSig(audio);
    var res = Store.saveMontage(m);
    if (!res.saved) toast('Enregistrement impossible : stockage bloqué');
    return createdAudio;
  }

  function viewMontageList() {
    var stories = Store.stories();
    var ready = Store.montageStoryIds();
    return [
      pageHeader('Studio de montage'),
      h('section', { class: 'card generator' }, [
        h('h2', { class: 'generator-title', text: 'Studio de montage' }),
        h('p', { class: 'generator-text', text: 'Organise plans, images, voix, sous-titres et bruitages sur une timeline de 60 à 90 secondes, avec zooms, panoramiques et transitions, puis exporte un pack prêt à assembler dans CapCut.' }),
        h('p', { class: 'generator-note', text: 'BRAINROT STUDIO ne fabrique pas de fichier vidéo (MP4) : il prépare le montage, la vidéo s’assemble dans CapCut.' })
      ]),
      h('section', { class: 'section' }, [
        sectionHeader('Choisis une histoire'),
        stories.length
          ? h('div', { class: 'list' }, stories.map(function (st) {
              var has = ready.indexOf(st.id) !== -1;
              return h('a', { class: 'card story-card', href: '#/montage/' + encodeURIComponent(st.id) }, [
                h('div', { class: 'module-icon' }, [icon('film')]),
                h('div', { class: 'project-info' }, [
                  h('h3', { class: 'project-title', text: st.title }),
                  h('p', { class: 'project-meta' }, [
                    h('span', { class: 'badge badge-genre', text: StoryGen.genreLabel(st.genre) }),
                    h('span', { class: has ? 'badge badge-ready' : 'badge badge-soon', text: has ? 'Montage prêt' : 'À préparer' })
                  ])
                ]),
                h('span', { class: 'chev' }, [icon('chevron')])
              ]);
            }))
          : h('div', { class: 'cast-empty' }, [
              emptyState('film', 'Aucune histoire sauvegardée', 'Le montage part d’une histoire : génère-en une et sauvegarde-la d’abord.'),
              h('a', { class: 'btn btn-ghost btn-sm', href: '#/histoires' }, [icon('book'), h('span', { text: 'Aller au générateur' })])
            ])
      ])
    ];
  }

  function viewMontage(storyId) {
    if (!storyId) return viewMontageList();
    var story = Store.getStory(storyId);
    if (!story) return [pageHeader('Montage', '#/montage'), emptyState('film', 'Histoire introuvable', 'Elle a peut-être été supprimée.')];
    if (mUI.storyId !== storyId) {
      stopPreview(); revokeImages();
      mUI.storyId = storyId; mUI.selected = 0; mUI.t = 0; mUI.shown = -1;
    }
    if (mUI.loadedFor !== storyId) loadImages(storyId);
    if (mUI.raf) { cancelAnimationFrame(mUI.raf); mUI.raf = 0; } // la lecture reprend sur le nouvel affichage

    var head = pageHeader('Studio de montage', '#/histoire/' + encodeURIComponent(storyId));
    var intro = h('div', { class: 'card char-hero' }, [
      h('div', { class: 'module-icon' }, [icon('film')]),
      h('div', { class: 'char-hero-body' }, [
        h('h2', { class: 'story-title', text: story.title }),
        h('span', { class: 'badge badge-genre', text: StoryGen.genreLabel(story.genre) })
      ])
    ]);

    var montage = Store.getMontage(storyId);
    var audio = Store.getAudio(storyId);
    if (!montage || !audio) {
      return [head, storageWarning(), intro, h('section', { class: 'card generator' }, [
        h('p', { class: 'generator-text', text: 'Le montage se cale sur la piste audio : chaque scène devient un ou plusieurs plans, avec cadrage, mouvement de caméra et transition. Une image par scène, que tu importes depuis tes photos.' }),
        audio ? null : h('p', { class: 'generator-note', text: 'Cette histoire n’a pas encore de piste audio : elle sera créée automatiquement.' }),
        h('button', { type: 'button', class: 'btn btn-primary btn-block', id: 'btn-build-montage', onclick: function () {
          var created = prepareMontage(story, null);
          toast(created ? 'Piste audio et montage prêts' : 'Montage prêt');
          rerenderKeepScroll();
        } }, [icon('sparkle'), h('span', { text: 'Préparer le montage' })])
      ])];
    }

    timedAudio(story, audio);
    var names = AudioScript.namesOf(story);
    var cues = AudioScript.subtitles(audio.segments, names);
    var voice = audio.segments.filter(AudioScript.isSpoken);
    var sfx = audio.segments.filter(function (x) { return x.kind === 'sfx'; });
    var shots = montage.shots;
    var sceneOf = {};
    montage.scenes.forEach(function (sc, i) { sceneOf[sc.scene] = { sc: sc, index: i }; });
    if (mUI.selected >= shots.length) mUI.selected = 0;
    if (mUI.t > montage.total) mUI.t = 0;
    var imgCount = montage.scenes.filter(function (sc) { return mUI.images[sc.scene]; }).length;
    var inRange = montage.total >= 60 && montage.total <= 90;
    var stale = story.updatedAt > (montage.storyUpdatedAt || 0) || (montage.audioSig && montage.audioSig !== audioSig(audio));

    function persist() {
      Store.saveMontage(montage);
    }

    var nodes = [head, storageWarning(), intro];

    if (stale) {
      nodes.push(h('div', { class: 'warning warning-action' }, [
        h('p', { text: 'L’histoire ou la piste audio a changé depuis la préparation du montage. Recale le montage pour suivre les nouveaux horaires (tes réglages de plans et tes images sont gardés).' }),
        h('button', { type: 'button', class: 'btn btn-ghost btn-sm', id: 'btn-resync-montage', onclick: function () {
          stopPreview();
          prepareMontage(story, montage);
          toast('Montage recalé');
          rerenderKeepScroll();
        } }, ['Recaler le montage'])
      ]));
    }

    nodes.push(h('section', { class: 'stats stats-4', 'aria-label': 'Résumé du montage' }, [
      statTile(Montage.clock(montage.total).replace(/^0(\d):/, '$1:'), inRange ? 'Durée (cible 60–90 s)' : 'Durée hors cible'),
      statTile(String(shots.length), 'Plans'),
      statTile(imgCount + '/' + montage.scenes.length, 'Images importées'),
      statTile(String(shots.filter(function (x) { return x.transition !== 'cut'; }).length), 'Transitions')
    ]));

    /* ----- Aperçu ----- */
    function layer(cls) {
      return h('div', { class: 'pv-layer ' + cls }, []);
    }
    var layerA = layer('pv-a'), layerB = layer('pv-b');
    var flash = h('div', { class: 'pv-flash' });
    var sub = h('div', { class: 'pv-sub' });
    var fxTag = h('div', { class: 'pv-fx' });
    var badge = h('div', { class: 'pv-label' });
    var clockEl = h('span', { class: 'pv-clock', id: 'pv-clock' });
    var frame = h('div', { class: 'pv', id: 'preview', 'aria-label': 'Aperçu du montage' }, [layerB, layerA, flash, badge, fxTag, sub]);

    function fill(el, shot) {
      var sc = sceneOf[shot.scene].sc;
      var img = mUI.images[shot.scene];
      // Sans image : fond quadrillé animé (le mouvement reste visible) + texte fixe et lisible.
      if (img) el.replaceChildren(h('img', { class: 'pv-media', src: img.url, alt: '' }));
      else el.replaceChildren(h('div', { class: 'pv-media pv-ph-bg' }), h('div', { class: 'pv-ph' }, [
        h('p', { class: 'pv-ph-label', text: sc.label + ' · image à importer' }),
        h('p', { class: 'pv-ph-text', text: sc.text })
      ]));
      el.setAttribute('data-shot', shot.id);
    }

    function setTransform(el, shot, t, extra) {
      var media = el.firstChild;
      if (!media) return;
      var tr = Montage.transformAt(shot, t);
      var s = tr.s * (extra && extra.scale || 1);
      var x = tr.x + (extra && extra.dx || 0);
      media.style.transform = 'translate(' + x.toFixed(2) + '%, ' + tr.y.toFixed(2) + '%) scale(' + s.toFixed(4) + ')';
    }

    function drawFrame(t) {
      var i = Montage.shotAt(montage, t);
      var shot = shots[i], prev = shots[i - 1];
      if (mUI.shown !== i || !layerA.firstChild) {
        if (prev) fill(layerB, prev); else layerB.replaceChildren();
        fill(layerA, shot);
        mUI.shown = i;
        document.querySelectorAll('.tl-shot.is-playing').forEach(function (e) { e.classList.remove('is-playing'); });
        var blk = document.getElementById('tl-' + shot.id);
        if (blk) blk.classList.add('is-playing');
      }
      var tr = Montage.TRANSITIONS[shot.transition] || Montage.TRANSITIONS.cut;
      var inT = t - shot.start;
      var p = tr.duration ? Math.min(1, inT / tr.duration) : 1;
      var active = prev && tr.duration && inT < tr.duration;
      var extra = null;
      layerA.style.opacity = '1'; layerA.style.filter = 'none';
      layerB.style.opacity = '0';
      flash.style.opacity = '0'; flash.className = 'pv-flash';
      if (active) {
        if (shot.transition === 'fade') { layerB.style.opacity = '1'; layerA.style.opacity = String(p); }
        else if (shot.transition === 'black') {
          flash.className = 'pv-flash is-black';
          if (p < 0.5) { layerB.style.opacity = '1'; layerA.style.opacity = '0'; flash.style.opacity = String(p * 2); }
          else flash.style.opacity = String((1 - p) * 2);
        } else if (shot.transition === 'white') { flash.className = 'pv-flash is-white'; flash.style.opacity = String(1 - p); }
        else if (shot.transition === 'blur') { layerB.style.opacity = '1'; layerA.style.opacity = String(p); layerA.style.filter = 'blur(' + ((1 - p) * 14).toFixed(1) + 'px)'; }
        else if (shot.transition === 'glitch') { extra = { dx: (Math.random() - 0.5) * 8 * (1 - p) }; layerA.style.filter = 'hue-rotate(' + Math.round((1 - p) * 90) + 'deg) contrast(1.4)'; }
        else if (shot.transition === 'zoom') { extra = { scale: 1 + (1 - p) * 0.35 }; layerB.style.opacity = '1'; layerA.style.opacity = String(p); }
      }
      setTransform(layerA, shot, t, extra);
      if (prev) setTransform(layerB, prev, t);
      var sc = sceneOf[shot.scene].sc;
      badge.textContent = 'Plan ' + (i + 1) + ' · ' + sc.label;
      var cue = null;
      for (var c = 0; c < cues.length; c++) if (t >= cues[c].start && t < cues[c].end) { cue = cues[c]; break; }
      sub.textContent = cue ? cue.text.replace(/\n/g, ' ') : ''; // l'aperçu est plus étroit que l'écran final
      sub.style.visibility = cue ? 'visible' : 'hidden';
      var fx = sfx.filter(function (x) { return t >= x.start && t < x.end; });
      fxTag.textContent = fx.length ? 'Bruitage : ' + fx.map(function (x) { return x.text; }).join(' + ') : '';
      fxTag.style.visibility = fx.length ? 'visible' : 'hidden';
      clockEl.textContent = Montage.clock(t) + ' / ' + Montage.clock(montage.total);
      var ph = document.getElementById('tl-playhead');
      if (ph) ph.style.transform = 'translateX(' + (t * PPS).toFixed(1) + 'px)';
    }

    function loop() {
      if (!mUI.playing) return;
      var t = mUI.from + (performance.now() - mUI.t0) / 1000;
      if (t >= montage.total) { mUI.t = montage.total; drawFrame(montage.total - 0.001); stopPreview(); mUI.t = 0; return; }
      mUI.t = t;
      drawFrame(t);
      var tl = document.getElementById('timeline');
      if (tl) {
        var x = t * PPS + 64;
        if (x > tl.scrollLeft + tl.clientWidth - 40 || x < tl.scrollLeft) tl.scrollLeft = x - 80;
      }
      mUI.raf = requestAnimationFrame(loop);
    }

    function play() {
      if (mUI.t >= montage.total - 0.05) mUI.t = 0;
      mUI.playing = true; mUI.from = mUI.t; mUI.t0 = performance.now();
      var b = document.getElementById('btn-preview');
      if (b) b.replaceChildren(icon('stop'), h('span', { text: 'Pause' }));
      mUI.raf = requestAnimationFrame(loop);
    }

    function seek(t) {
      mUI.t = Math.max(0, Math.min(montage.total - 0.001, t));
      if (mUI.playing) { mUI.from = mUI.t; mUI.t0 = performance.now(); }
      drawFrame(mUI.t);
    }

    nodes.push(h('section', { class: 'card player' }, [
      h('div', { class: 'player-head' }, [
        h('p', { class: 'story-label', text: 'Aperçu (muet)' }),
        clockEl
      ]),
      frame,
      h('div', { class: 'actions-row' }, [
        h('button', { type: 'button', class: 'btn btn-ghost', onclick: function () { seek(0); } }, [icon('back'), h('span', { text: 'Début' })]),
        h('button', { type: 'button', class: 'btn btn-primary', id: 'btn-preview', onclick: function () { if (mUI.playing) stopPreview(); else play(); } },
          [icon('play'), h('span', { text: 'Lire l’aperçu' })])
      ]),
      h('p', { class: 'generator-note', text: 'Simulation dans l’appli : mouvements, transitions, sous-titres et repères de bruitages. Ce n’est pas un fichier vidéo, et la voix n’y est pas jouée (écoute-la dans le studio audio).' })
    ]));

    /* ----- Timeline ----- */
    var width = Math.ceil(montage.total * PPS);
    function pos(a, b) { return { left: (a * PPS).toFixed(1) + 'px', width: Math.max(3, (b - a) * PPS - 2).toFixed(1) + 'px' }; }
    function block(cls, a, b, text, attrs) {
      var el = h(attrs && attrs.button ? 'button' : 'div', Object.assign({ class: 'tl-block ' + cls, title: text }, attrs && attrs.extra || {}), [text]);
      var p2 = pos(a, b);
      el.style.left = p2.left; el.style.width = p2.width;
      return el;
    }
    function track(label, children, cls) {
      var lane = h('div', { class: 'tl-lane ' + (cls || '') }, children);
      lane.style.width = width + 'px';
      return h('div', { class: 'tl-row' + (cls === 'tl-tall' ? ' tl-row-tall' : '') }, [h('span', { class: 'tl-label', text: label }), lane]);
    }
    var ticks = [];
    for (var tk = 0; tk <= montage.total; tk += 5) {
      var tick = h('span', { class: 'tl-tick', text: Montage.clock(tk).replace(/\.0$/, '').replace(/^00:/, '0:') });
      tick.style.left = (tk * PPS) + 'px';
      ticks.push(tick);
    }
    var ruler = track('', ticks, 'tl-ruler');
    ruler.firstChild.nextSibling.addEventListener('click', function (e) {
      var r = e.currentTarget.getBoundingClientRect();
      seek((e.clientX - r.left) / PPS);
    });
    var shotBlocks = shots.map(function (s, i) {
      var b = block('tl-shot' + (sceneOf[s.scene].index % 2 ? ' alt' : '') + (i === mUI.selected ? ' is-selected' : '') + (s.transition !== 'cut' ? ' has-tr' : ''),
        s.start, s.end, 'P' + (i + 1), { button: true, extra: { type: 'button', id: 'tl-' + s.id, 'aria-label': 'Plan ' + (i + 1) } });
      b.addEventListener('click', function () {
        mUI.selected = i; seek(s.start + 0.01);
        stopPreview();
        rerenderKeepScroll();
      });
      return b;
    });
    var playhead = h('div', { class: 'tl-playhead', id: 'tl-playhead', 'aria-hidden': 'true' });
    var tlInner = h('div', { class: 'tl-inner' }, [
      ruler,
      track('Plans', shotBlocks, 'tl-tall'),
      track('Images', montage.scenes.map(function (sc) {
        var has = !!mUI.images[sc.scene];
        var el = block('tl-img' + (has ? ' has-img' : ''), sc.start, sc.end, has ? sc.label : sc.label + ' · manquante');
        return el;
      })),
      track('Voix', voice.map(function (v) {
        return block(v.kind === 'dialogue' ? 'tl-dlg' : 'tl-nar', v.start, v.end, names[v.speaker] || v.speaker);
      })),
      track('Sous-titres', cues.map(function (c) { return block('tl-sub', c.start, c.end, c.text.replace(/\n/g, ' ')); })),
      track('Bruitages', sfx.map(function (x) { return block('tl-sfx', x.start, x.end, x.text); })),
      track('Ambiance', audio.ambiance ? [block('tl-amb', 0, montage.total, audio.ambiance)] : []),
      playhead
    ]);
    nodes.push(h('section', { class: 'section' }, [
      sectionHeader('Timeline'),
      h('p', { class: 'hint', text: 'Fais défiler horizontalement. Touche un plan pour le régler, ou la règle des secondes pour te placer.' }),
      (function () {
        var tl = h('div', { class: 'card tl', id: 'timeline' }, [tlInner]);
        tl.addEventListener('scroll', function () { mUI.tlScroll = tl.scrollLeft; });
        return tl;
      })()
    ]));

    /* ----- Inspecteur du plan sélectionné ----- */
    var shot = shots[mUI.selected];
    var scInfo = sceneOf[shot.scene];
    var sc = scInfo.sc;
    var sameScene = shots.filter(function (x) { return x.scene === shot.scene; }).length;
    var img = mUI.images[shot.scene];

    function select(label, options, value, onChange, disabled) {
      var el = h('select', { class: 'input', 'aria-label': label, disabled: !!disabled }, Object.keys(options).map(function (k) {
        var o = h('option', { value: k, text: typeof options[k] === 'string' ? options[k] : options[k].label + (options[k].duration ? ' (' + String(options[k].duration).replace('.', ',') + ' s)' : '') });
        if (k === value) o.selected = true;
        return o;
      }));
      el.addEventListener('change', function () { onChange(el.value); });
      return h('label', { class: 'field' }, [h('span', { class: 'field-label', text: label }), el]);
    }

    var fileInput = h('input', { type: 'file', accept: 'image/*', class: 'sr-only', id: 'image-input', tabindex: '-1' });
    fileInput.addEventListener('change', function () {
      var f = fileInput.files && fileInput.files[0];
      if (!f) return;
      toast('Import de l’image…');
      Media.prepare(f).then(function (rec) {
        return Media.put(storyId, shot.scene, rec);
      }).then(function () {
        toast('Image importée pour « ' + sc.label + ' »');
        mUI.loadedFor = null; mUI.shown = -1;
        rerenderKeepScroll();
      }, function (err) { toast(err && err.message ? err.message : 'Import impossible'); });
    });

    nodes.push(h('section', { class: 'section', id: 'inspector' }, [
      sectionHeader('Plan ' + (mUI.selected + 1) + ' · ' + sc.label + (shot.parts > 1 ? ' (' + shot.part + '/' + shot.parts + ')' : '')),
      h('div', { class: 'card inspector' }, [
        h('p', { class: 'seg-time', text: Montage.clock(shot.start) + ' → ' + Montage.clock(shot.end) + ' · ' + (shot.end - shot.start).toFixed(1).replace('.', ',') + ' s' }),
        h('p', { class: 'seg-text', text: sc.text }),
        h('div', { class: 'insp-image' }, [
          img ? h('img', { class: 'insp-thumb', src: img.url, alt: 'Image de ' + sc.label }) : h('div', { class: 'insp-thumb insp-empty' }, [icon('image')]),
          h('div', { class: 'insp-image-body' }, [
            h('p', { class: 'field-label', text: 'Image de la scène' }),
            h('p', { class: 'hint', text: (img ? 'Importée' : 'Pas encore d’image') + (sameScene > 1 ? ' · utilisée par les ' + sameScene + ' plans de la scène' : '') }),
            h('label', { class: 'btn btn-ghost btn-sm', for: 'image-input', id: 'btn-import-image', role: 'button', tabindex: '0' }, [icon('image'), h('span', { text: img ? 'Remplacer' : 'Importer' })]),
            fileInput,
            img ? h('button', { type: 'button', class: 'btn btn-ghost btn-sm', id: 'btn-remove-image', onclick: function () {
              Media.remove(storyId, shot.scene).then(function () { mUI.loadedFor = null; mUI.shown = -1; revokeImages(); toast('Image retirée'); rerenderKeepScroll(); });
            } }, [icon('trash'), h('span', { text: 'Retirer' })]) : null
          ])
        ]),
        select('Cadrage', Montage.SHOT_TYPES, shot.shotType, function (v) {
          shot.shotType = v;
          if (shot.part === 1) { sc.shotType = v; sc.imagePrompt = Montage.scenePrompt(story, sc.scene, v, libraryMap()); }
          persist(); rerenderKeepScroll();
        }),
        select('Mouvement de caméra', Montage.MOVES, shot.movement, function (v) { shot.movement = v; persist(); mUI.shown = -1; seek(shot.start + 0.01); rerenderKeepScroll(); }),
        select(mUI.selected === 0 ? 'Transition d’entrée (début de la vidéo)' : 'Transition d’entrée', Montage.TRANSITIONS, shot.transition,
          function (v) { shot.transition = v; persist(); rerenderKeepScroll(); }, mUI.selected === 0),
        h('p', { class: 'hint', text: 'Dans CapCut : ' + Montage.keyframes(shot.movement) + '.' }),
        promptBox('Prompt d’image de la scène', sc.imagePrompt, 'btn-copy-scene-prompt')
      ])
    ]));

    /* ----- Exports ----- */
    function imagesForExport() {
      var out = {};
      Object.keys(mUI.images).forEach(function (k) { out[k] = { ext: mUI.images[k].ext }; });
      return out;
    }
    var base = slug(story.title);
    nodes.push(h('section', { class: 'section' }, [
      sectionHeader('Exporter pour CapCut'),
      h('p', { class: 'hint', text: 'Le pack .zip contient les images numérotées, le plan de montage (texte et tableau), les sous-titres .srt, le script audio, les prompts d’images et les données .json, avec un mode d’emploi CapCut.' }),
      h('button', { type: 'button', class: 'btn btn-primary btn-block', id: 'btn-export-pack', onclick: function () {
        var imgs = imagesForExport();
        var files = [
          { name: 'LISEZ-MOI.txt', data: Montage.readme(story, montage, Object.keys(imgs).length) },
          { name: 'plan-de-montage.txt', data: Montage.planText(story, audio, montage, imgs) },
          { name: 'plan-de-montage.csv', data: Montage.planCSV(story, audio, montage, imgs) },
          { name: 'sous-titres.srt', data: AudioScript.toSRT(cues) },
          { name: 'script-audio.txt', data: AudioScript.toText(story, audio) },
          { name: 'prompts-images.txt', data: Montage.promptsText(story, montage) },
          { name: 'montage.json', data: JSON.stringify(Montage.toJSON(story, audio, montage, imgs), null, 2) }
        ];
        var jobs = montage.scenes.map(function (scn, i) {
          var im = mUI.images[scn.scene];
          if (!im) return null;
          return im.blob.arrayBuffer().then(function (buf) { files.push({ name: Montage.imageName(scn, i, im.ext), data: new Uint8Array(buf) }); });
        }).filter(Boolean);
        Promise.all(jobs).then(function () {
          var zip = Zip.create(files);
          var url = URL.createObjectURL(zip);
          var a = h('a', { href: url, download: base + '-montage.zip', class: 'sr-only' });
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
          toast('Pack « ' + base + '-montage.zip » prêt (' + files.length + ' fichiers)');
        }, function () { toast('Export impossible'); });
      } }, [icon('download'), h('span', { text: 'Pack CapCut (.zip)' })]),
      h('div', { class: 'export-grid' }, [
        h('button', { type: 'button', class: 'btn btn-ghost', id: 'btn-plan-txt', onclick: function () {
          downloadFile(base + '-plan-de-montage.txt', 'text/plain;charset=utf-8', Montage.planText(story, audio, montage, imagesForExport()));
        } }, [icon('download'), h('span', { text: 'Plan .txt' })]),
        h('button', { type: 'button', class: 'btn btn-ghost', id: 'btn-montage-srt', onclick: function () {
          downloadFile(base + '.srt', 'application/x-subrip;charset=utf-8', AudioScript.toSRT(cues));
        } }, [icon('download'), h('span', { text: 'Sous-titres .srt' })])
      ]),
      h('button', { type: 'button', class: 'btn btn-ghost btn-block', id: 'btn-copy-plan', onclick: function () {
        copyText(Montage.planText(story, audio, montage, imagesForExport()));
      } }, [icon('copy'), h('span', { text: 'Copier le plan de montage' })]),
      h('p', { class: 'generator-note', text: 'Aucun fichier vidéo (MP4) n’est produit : CapCut sur iPhone n’importe pas de projet de montage externe, l’assemblage se fait à la main en suivant le plan. Les sous-titres .srt peuvent être importés si ta version de CapCut le permet ; sinon, utilise ses légendes automatiques.' })
    ]));

    nodes.push(h('button', { type: 'button', class: 'btn btn-danger btn-block', onclick: function () {
      if (!window.confirm('Recréer le montage ? Les réglages de plans (cadrages, mouvements, transitions) seront remplacés. Les images importées sont gardées.')) return;
      stopPreview();
      prepareMontage(story, null);
      mUI.selected = 0; mUI.shown = -1;
      toast('Montage recréé');
      rerenderKeepScroll();
    } }, [icon('sparkle'), h('span', { text: 'Recréer le montage' })]));

    requestAnimationFrame(function () {
      var tlEl = document.getElementById('timeline');
      if (tlEl && mUI.tlScroll) tlEl.scrollLeft = mUI.tlScroll;
      drawFrame(mUI.t);
      if (mUI.playing) { mUI.from = mUI.t; mUI.t0 = performance.now(); mUI.raf = requestAnimationFrame(loop); }
    });
    return nodes;
  }

  var ROUTES = {
    accueil: viewHome,
    projets: viewProjects,
    personnages: viewCharacters,
    personnage: viewCharacterRoute,
    histoires: viewStories,
    histoire: viewStoryEditor,
    audio: viewAudio,
    montage: viewMontage
  };

  function parseRoute() {
    var parts = (location.hash || '').replace(/^#\/?/, '').split('/');
    var name = ROUTES[parts[0]] ? parts[0] : 'accueil';
    var param = '';
    try { param = decodeURIComponent(parts.slice(1).join('/')); } catch (e) { param = ''; }
    return { name: name, param: param };
  }

  function currentRoute() { return parseRoute().name; }

  function render() {
    var route = parseRoute();
    var nodes = ROUTES[route.name](route.param);
    var view = h('div', { class: 'view' }, nodes);
    app.replaceChildren(view);

    var tabName = route.name === 'histoire' || route.name === 'audio' || route.name === 'montage' ? 'histoires' : route.name === 'personnage' ? 'personnages' : route.name;
    document.querySelectorAll('.tab[data-route]').forEach(function (t) {
      var active = t.getAttribute('data-route') === tabName;
      t.classList.toggle('is-active', active);
      if (active) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
    });
  }

  /* ---------- Création de projet ---------- */

  function openSheet() {
    errorEl.textContent = '';
    input.value = '';
    if (typeof sheet.showModal === 'function') sheet.showModal();
    else sheet.setAttribute('open', '');
    // Léger délai : laisse l'animation démarrer avant d'ouvrir le clavier.
    setTimeout(function () { input.focus(); }, 60);
  }

  function closeSheet() {
    if (typeof sheet.close === 'function') sheet.close();
    else sheet.removeAttribute('open');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!input.value.trim()) {
      errorEl.textContent = 'Indique un titre pour ta vidéo.';
      input.focus();
      return;
    }
    var res = Store.createProject(input.value);
    closeSheet();
    toast(res.saved ? 'Projet « ' + res.project.title + ' » créé' : 'Projet créé (non sauvegardé : stockage bloqué)');
    if (currentRoute() !== 'accueil' && currentRoute() !== 'projets') location.hash = '#/accueil';
    else render();
  });

  input.addEventListener('input', function () {
    if (input.value.trim()) errorEl.textContent = '';
  });

  sheet.addEventListener('click', function (e) {
    if (e.target === sheet) closeSheet(); // toucher en dehors de la feuille
  });

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-action]');
    if (!el) return;
    var action = el.getAttribute('data-action');
    if (action === 'create') openSheet();
    else if (action === 'close-sheet') closeSheet();
  });

  var restoringHash = false;
  window.addEventListener('hashchange', function () {
    if (restoringHash) { restoringHash = false; return; }
    var guard = editor.dirty && location.hash !== editor.hash ? editor
      : charForm.dirty && location.hash !== charForm.hash ? charForm : null;
    if (guard) {
      if (!window.confirm('Tu as des modifications non enregistrées. Quitter quand même ?')) {
        restoringHash = true;
        location.hash = guard.hash;
        return;
      }
      guard.dirty = false;
      if (editor.story && !editor.story.id) editor.story = null;
      charForm.data = null;
    }
    if (currentRoute() !== 'histoire') editor.story = null;
    if (currentRoute() !== 'personnage') charForm.data = null;
    stopSpeech();
    audioUI.storyId = null;
    stopPreview();
    if (currentRoute() !== 'montage') { revokeImages(); mUI.storyId = null; mUI.loadedFor = null; }
    render();
    window.scrollTo(0, 0);
  });

  window.addEventListener('beforeunload', function (e) {
    if (editor.dirty || charForm.dirty) { e.preventDefault(); e.returnValue = ''; }
  });

  window.addEventListener('storage', render); // synchronise si un autre onglet modifie les données

  render();
})();
