/*
 * BRAINROT STUDIO — stockage local.
 * Les données restent sur l'appareil (localStorage). Aucun serveur, aucun envoi.
 */
(function () {
  'use strict';

  var KEY = 'brainrot-studio:v1';
  var memory = null; // repli si localStorage est indisponible (navigation privée, etc.)

  function emptyState() {
    return { projects: [], videos: [] };
  }

  function isValid(s) {
    return s && Array.isArray(s.projects) && Array.isArray(s.videos);
  }

  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return emptyState();
      var parsed = JSON.parse(raw);
      return isValid(parsed) ? parsed : emptyState();
    } catch (e) {
      return memory || emptyState();
    }
  }

  function save(state) {
    memory = state;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      return false;
    }
  }

  function uid() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  window.Store = {
    persistent: function () {
      try {
        var t = '__bs_test__';
        window.localStorage.setItem(t, t);
        window.localStorage.removeItem(t);
        return true;
      } catch (e) {
        return false;
      }
    },

    projects: function () {
      return load().projects.slice().sort(function (a, b) { return b.updatedAt - a.updatedAt; });
    },

    /** Vidéos réellement terminées. Vide tant que la production n'existe pas. */
    videos: function () {
      return load().videos.slice().sort(function (a, b) { return b.createdAt - a.createdAt; });
    },

    createProject: function (title) {
      var clean = String(title || '').trim().replace(/\s+/g, ' ').slice(0, 80);
      if (!clean) throw new Error('Le titre est obligatoire.');
      var state = load();
      var now = Date.now();
      var project = { id: uid(), title: clean, status: 'brouillon', createdAt: now, updatedAt: now };
      state.projects.push(project);
      var saved = save(state);
      return { project: project, saved: saved };
    },

    deleteProject: function (id) {
      var state = load();
      state.projects = state.projects.filter(function (p) { return p.id !== id; });
      save(state);
    }
  };
})();
