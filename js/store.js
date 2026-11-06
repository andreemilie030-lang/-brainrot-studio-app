/*
 * BRAINROT STUDIO — stockage local.
 * Les données restent sur l'appareil (localStorage). Aucun serveur, aucun envoi.
 */
(function () {
  'use strict';

  var KEY = 'brainrot-studio:v1';
  var memory = null; // repli si localStorage est indisponible (navigation privée, etc.)

  function emptyState() {
    return { projects: [], videos: [], stories: [], characters: [] };
  }

  function isValid(s) {
    return s && Array.isArray(s.projects) && Array.isArray(s.videos);
  }

  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return emptyState();
      var parsed = JSON.parse(raw);
      if (!isValid(parsed)) return emptyState();
      if (!Array.isArray(parsed.stories)) parsed.stories = []; // données d'une version précédente
      if (!Array.isArray(parsed.characters)) parsed.characters = [];
      return parsed;
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
    },

    /* ----- Histoires ----- */

    stories: function () {
      return load().stories.slice().sort(function (a, b) { return b.updatedAt - a.updatedAt; });
    },

    getStory: function (id) {
      var list = load().stories;
      for (var i = 0; i < list.length; i++) if (list[i].id === id) return JSON.parse(JSON.stringify(list[i]));
      return null;
    },

    /** Crée (sans id) ou met à jour (avec id) une histoire. Renvoie { story, saved }. */
    saveStory: function (story) {
      var state = load();
      var now = Date.now();
      var copy = JSON.parse(JSON.stringify(story));
      copy.title = String(copy.title || '').trim().slice(0, 100) || 'Histoire sans titre';
      copy.updatedAt = now;
      var idx = -1;
      if (copy.id) for (var i = 0; i < state.stories.length; i++) if (state.stories[i].id === copy.id) idx = i;
      if (idx === -1) {
        copy.id = copy.id || uid();
        copy.createdAt = now;
        state.stories.push(copy);
      } else {
        copy.createdAt = state.stories[idx].createdAt;
        state.stories[idx] = copy;
      }
      return { story: copy, saved: save(state) };
    },

    deleteStory: function (id) {
      var state = load();
      state.stories = state.stories.filter(function (s) { return s.id !== id; });
      save(state);
    },

    /* ----- Personnages ----- */

    characters: function () {
      return load().characters.slice().sort(function (a, b) { return b.updatedAt - a.updatedAt; });
    },

    getCharacter: function (id) {
      var list = load().characters;
      for (var i = 0; i < list.length; i++) if (list[i].id === id) return JSON.parse(JSON.stringify(list[i]));
      return null;
    },

    /** Crée (sans id) ou met à jour (avec id) un personnage. Renvoie { character, saved }. */
    saveCharacter: function (ch) {
      var name = String(ch.name || '').trim().replace(/\s+/g, ' ').slice(0, 40);
      if (!name) throw new Error('Le nom est obligatoire.');
      var state = load();
      var now = Date.now();
      var copy = {
        id: ch.id, name: name, gender: ch.gender === 'f' ? 'f' : 'm',
        species: String(ch.species || '').trim().slice(0, 40)
      };
      ['appearance', 'outfit', 'personality', 'voice', 'backstory'].forEach(function (k) {
        copy[k] = String(ch[k] || '').trim().slice(0, 1500);
      });
      copy.updatedAt = now;
      var idx = -1;
      if (copy.id) for (var i = 0; i < state.characters.length; i++) if (state.characters[i].id === copy.id) idx = i;
      if (idx === -1) {
        copy.id = copy.id || uid();
        copy.createdAt = now;
        state.characters.push(copy);
      } else {
        copy.createdAt = state.characters[idx].createdAt;
        state.characters[idx] = copy;
      }
      return { character: copy, saved: save(state) };
    },

    deleteCharacter: function (id) {
      var state = load();
      state.characters = state.characters.filter(function (c) { return c.id !== id; });
      save(state);
    },

    /** Histoires (épisodes) dans lesquelles joue un personnage de la bibliothèque. */
    storiesWithCharacter: function (id) {
      return this.stories().filter(function (s) {
        return (s.characters || []).some(function (c) { return c.libraryId === id; });
      });
    }
  };
})();
