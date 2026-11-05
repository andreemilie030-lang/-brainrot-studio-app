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
    back: ['M15 6l-6 6 6 6']
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

  function moduleCard(href, iconName, title, text) {
    return h('a', { class: 'card module-card', href: href }, [
      h('div', { class: 'module-icon' }, [icon(iconName)]),
      h('div', { class: 'module-body' }, [
        h('h3', { class: 'module-title', text: title }),
        h('p', { class: 'module-text', text: text })
      ]),
      h('span', { class: 'badge badge-soon', text: 'À venir' })
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
        moduleCard('#/personnages', 'user', 'Bibliothèque de personnages', 'Crée et retrouve tes personnages.'),
        moduleCard('#/histoires', 'book', 'Générateur d’histoires', 'Trouve des idées et écris tes scénarios.')
      ])
    ]);

    return [storageWarning(), hero, stats, projSection, vidSection, modules];
  }

  function pageHeader(title) {
    return h('header', { class: 'page-head' }, [
      h('a', { href: '#/accueil', class: 'back', 'aria-label': 'Retour à l’accueil' }, [icon('back')]),
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

  function viewSoon(title, iconName, text, items) {
    return [
      pageHeader(title),
      h('div', { class: 'card soon' }, [
        h('div', { class: 'soon-icon' }, [icon(iconName)]),
        h('span', { class: 'badge badge-soon', text: 'En développement' }),
        h('p', { class: 'soon-text', text: text }),
        h('p', { class: 'soon-sub', text: 'Ce module n’est pas encore disponible. Prévu :' }),
        h('ul', { class: 'soon-list' }, items.map(function (i) { return h('li', { text: i }); }))
      ])
    ];
  }

  var ROUTES = {
    accueil: viewHome,
    projets: viewProjects,
    personnages: function () {
      return viewSoon('Personnages', 'user',
        'La bibliothèque rassemblera tous les personnages de tes vidéos.',
        ['Créer une fiche personnage', 'Nom, description et style', 'Réutiliser un personnage dans plusieurs vidéos']);
    },
    histoires: function () {
      return viewSoon('Histoires', 'book',
        'Le générateur t’aidera à trouver des idées et à écrire tes scénarios.',
        ['Idées de départ', 'Structure en scènes', 'Envoi du scénario vers un projet vidéo']);
    }
  };

  function currentRoute() {
    var r = (location.hash || '').replace(/^#\/?/, '');
    return ROUTES[r] ? r : 'accueil';
  }

  function render() {
    var route = currentRoute();
    var nodes = ROUTES[route]();
    var view = h('div', { class: 'view' }, nodes);
    app.replaceChildren(view);

    document.querySelectorAll('.tab[data-route]').forEach(function (t) {
      var active = t.getAttribute('data-route') === route;
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

  window.addEventListener('hashchange', function () {
    render();
    window.scrollTo(0, 0);
  });

  window.addEventListener('storage', render); // synchronise si un autre onglet modifie les données

  render();
})();
