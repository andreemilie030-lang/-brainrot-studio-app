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
    image: ['M4 5h16v14H4z', 'M4 16l4.5-4.5 4 4 3-3L20 17', 'M15.5 9h.01']
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

  var ROUTES = {
    accueil: viewHome,
    projets: viewProjects,
    personnages: viewCharacters,
    personnage: viewCharacterRoute,
    histoires: viewStories,
    histoire: viewStoryEditor
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

    var tabName = route.name === 'histoire' ? 'histoires' : route.name === 'personnage' ? 'personnages' : route.name;
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
    render();
    window.scrollTo(0, 0);
  });

  window.addEventListener('beforeunload', function (e) {
    if (editor.dirty || charForm.dirty) { e.preventDefault(); e.returnValue = ''; }
  });

  window.addEventListener('storage', render); // synchronise si un autre onglet modifie les données

  render();
})();
