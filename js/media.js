/*
 * BRAINROT STUDIO — images importées (stockées sur l'appareil, dans IndexedDB).
 * Une image par scène et par histoire. Rien n'est envoyé sur internet.
 */
(function () {
  'use strict';

  var DB_NAME = 'brainrot-studio-media';
  var STORE = 'images';
  var MAX_SIDE = 1920; // les images sont ramenées à 1920 px max (format 1080 × 1920)
  var dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error('Stockage d’images indisponible sur ce navigateur.')); return; }
      var req = window.indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore(STORE); };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error('Stockage d’images indisponible.')); };
    });
    dbPromise.catch(function () { dbPromise = null; });
    return dbPromise;
  }

  function tx(mode, fn) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var t = db.transaction(STORE, mode);
        var result;
        t.oncomplete = function () { resolve(result); };
        t.onerror = t.onabort = function () { reject(t.error || new Error('Opération impossible.')); };
        result = fn(t.objectStore(STORE));
      });
    });
  }

  function key(storyId, scene) { return storyId + '/' + scene; }

  /** Redimensionne et convertit en JPEG. */
  function prepare(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type || 'image/')) { reject(new Error('Ce fichier n’est pas une image.')); return; }
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight;
        var k = Math.min(1, MAX_SIDE / Math.max(w, h));
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(w * k); canvas.height = Math.round(h * k);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        canvas.toBlob(function (blob) {
          if (!blob) { reject(new Error('Conversion de l’image impossible.')); return; }
          resolve({ blob: blob, ext: 'jpg', width: canvas.width, height: canvas.height });
        }, 'image/jpeg', 0.9);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Format d’image non pris en charge.')); };
      img.src = url;
    });
  }

  window.Media = {
    prepare: prepare,

    put: function (storyId, scene, rec) {
      rec.updatedAt = Date.now();
      return tx('readwrite', function (s) { s.put(rec, key(storyId, scene)); });
    },

    /** { scène: { blob, ext, width, height } } pour une histoire. */
    list: function (storyId) {
      var out = {};
      return tx('readonly', function (s) {
        var range = IDBKeyRange.bound(storyId + '/', storyId + '/￿');
        var req = s.openCursor(range);
        req.onsuccess = function () {
          var c = req.result;
          if (!c) return;
          out[Number(String(c.key).split('/')[1])] = c.value;
          c.continue();
        };
      }).then(function () { return out; });
    },

    remove: function (storyId, scene) {
      return tx('readwrite', function (s) { s.delete(key(storyId, scene)); });
    },

    removeStory: function (storyId) {
      return tx('readwrite', function (s) { s.delete(IDBKeyRange.bound(storyId + '/', storyId + '/￿')); });
    }
  };
})();
