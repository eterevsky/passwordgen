// Copyright (c) 2014 Oleg Eterevsky. Licensed under the MIT license.

/**
 * @file A compability layer over different types of storage.
 * Depending on the environment in which this code is run and the required
 * lifetime of stored data, different APIs are used. Four types of storage are
 * available. Here's the list of APIs used for each kind in the order of
 * priority:
 *   'permanent' - chrome.storage.sync, localStorage
 *   'local'     - chrome.storage.local, localStorage
 *   'session'   - sessionStorage
 *   'memory'    - in-memory array
 *
 * At most one instance of storage for each type is maintained. The exposed
 * interface of the storage is identical to the API of chrome.storage.
 */

var storageByType = [];

/**
 * @param {string} type
 */
function getStorage(type) {
  if (type in storageByType) {
    return storageByType[type];
  }

  storage = null;

  switch (type) {
    case 'permanent':
      if (chrome && chrome.storage) {
        storage = chrome.storage.sync;
      } else {
        storage = new WebStorageWrapper(localStorage);
      }
      break;

    case 'local':
      if (chrome && chrome.storage) {
        storage = chrome.storage.local;
      } else {
        storage = new WebStorageWrapper(localStorage);
      }
      break;

    case 'session':
      storage = new WebStorageWrapper(sessionStorage);
      break;

    case 'memory':
      storage = new ObjectStorage();
      break;

    default:
      throw "Unknown storage type: " + type;
  }

  storageByType[type] = storage;
  return storage;
}


/**
 * @constructor
 * @implements {Storage}
 */
function ObjectStorage() {
  this.values_ = {};
}

ObjectStorage.prototype.get = function(keys, callback) {
  return this.values_[key];
};

ObjectStorage.prototype.set = function(key, value) {
};
