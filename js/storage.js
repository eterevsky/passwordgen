// Copyright (c) 2014 Oleg Eterevsky. Licensed under the MIT license.

/**
 * @file A compability layer over different types of storage.
 * Depending on the environment in which this code is run and the required
 * lifetime of stored data, different APIs are used. Four types of storage are
 * available. Here's the list of APIs used for each kind in the order of
 * priority:
 *   'permanent' - chrome.storage.sync, localStorage
 *   'local'     - chrome.storage.local, localStorage
 *   'session'   - array in background page, sessionStorage
 *   'memory'    - in-memory array
 *
 * Storage for each type is a singleton. The exposed interface of the storage
 * is similar to the API of chrome.storage.
 *
 * There are slight differences in how various implentations handle null and
 * undefined as stored values.
 */

var storageByImplType = {};

/**
 * @param {string} type
 * @return {StorageInterface}
 */
function getStorage(type) {
  var implType;

  switch (type) {
    case 'permanent':
      if (typeof chrome !== 'undefined' && chrome.storage) {
        implType = 'chrome.storage.sync';
      } else {
        implType = 'localStorage';
      }
      break;

    case 'local':
      if (typeof chrome !== 'undefined' && chrome.storage) {
        implType = 'chrome.storage.local';
      } else {
        implType = 'localStorage';
      }
      break;

    case 'session':
      if (BackgroundStorage.isAvailable()) {
        implType = 'background';
      } else {
        implType = 'sessionStorage';
      }
      break;

    case 'memory':
      implType = 'memory';
      break;

    default:
      throw 'Unknown storage type: ' + type;
  }

  if (implType in storageByImplType)
    return storageByImplType[implType];

  var storage;

  switch (implType) {
    case 'chrome.storage.sync':
      storage = new ChromeStorageWrapper(chrome.storage.sync, 'sync');
      break;

    case 'chrome.storage.local':
      storage = new ChromeStorageWrapper(chrome.storage.local, 'local');
      break;

    case 'localStorage':
      storage = new WebStorageWrapper(localStorage);
      break;

    case 'sessionStorage':
      storage = new WebStorageWrapper(sessionStorage);
      break;

    case 'background':
      storage = new BackgroundStorage();
      break;

    case 'memory':
      storage = new ObjectStorage();
      break;

    default:
      throw 'Internal error';
  }

  storageByImplType[implType] = storage;
  return storage;
}


/**
 * @constructor
 * @interface
 */
function StorageInterface() {}

/**
 * @type {boolean|undefined}
 */
StorageInterface.prototype.isSynchronous = false;

/**
 * @param {string|Object|Array.<string>} keys String: key of the element to be
 * retrieved, array: keys to be retrieved, object: elements to be retrieved with
 * defaults.
 * @param {function(Object)|null} opt_callback A callback, called with
 * a dictionary {key: value} for the requested elements. In case of null,
 * the value will be returned from this function directly, or the exception will
 * be raised.
 * @return {number|string|Object|undefined} In case callback is provided,
 * nothing is returned. In case it is not, and keys is a string, and the
 * undelying storage allows synchronous retrieval, the value is returned.
 */
StorageInterface.prototype.get = function(keys, opt_callback) {};

/**
 * @param {Object} items
 * @param {function} opt_callback
 */
StorageInterface.prototype.set = function(items, opt_callback) {};

/**
 * @param {string|Array.<string>} keys}
 * @param {function} opt_callback
 */
StorageInterface.prototype.remove = function(keys, opt_callback) {};

/**
 * @param {function(Object)} callback
 */
StorageInterface.prototype.addListener = function(callback) {};


/**
 * @constructor
 * @implements {StorageInterface}
 */
function ObjectStorage() {
  this.values_ = {};
  this.listeners_ = [];
}

ObjectStorage.prototype.isSynchronous = true;

ObjectStorage.prototype.get = function(keys, opt_callback) {
  if (!opt_callback) {
    if (typeof keys === 'string')
      return this.values_[keys];
    throw 'No callback and key is not string.';
  }

  var result = {};

  switch (typeof keys) {
    case 'string':
      result[keys] = this.values_[keys];
      break;

    case 'object':
      if (Array.isArray(keys)) {
        for (var i = 0; i < keys.length; i++) {
          result[keys[i]] = this.values_[keys[i]];
        }
      } else {
        for (var key in keys) {
          result[key] = (key in this.values_) ? this.values_[key]
                                              : keys[key];
        }
      }
      break;

    default:
      throw 'Wrong type of keys.';
  }

  setTimeout(opt_callback.bind(null, result), 0);
};

ObjectStorage.prototype.set = function(items, opt_callback) {
  var changes = {};
  for (var key in items) {
    changes[key] = {'oldValue': this.values_[key], 'newValue': items[key]};
    this.values_[key] = items[key];
  }

  this.fire_(changes);

  if (opt_callback) {
    setTimeout(opt_callback, 0);
  }
};

ObjectStorage.prototype.remove = function(keys, opt_callback) {
  if (typeof keys === 'string')
    keys = [keys];

  var changes = {};
  for (var i = 0; i < keys.length; i++) {
    changes[keys[i]] = {'oldValue': this.values_[keys[i]]};
    delete this.values_[keys[i]];
  }

  this.fire_(changes);
  if (opt_callback) {
    setTimeout(opt_callback, 0);
  }
};

ObjectStorage.prototype.addListener = function(listener) {
  this.listeners_.push(listener);
};

ObjectStorage.prototype.fire_ = function(changes) {
  for (var i = 0; i < this.listeners_.length; i++) {
    setTimeout(this.listeners_[i].bind(null, changes), 0);
  }
};


/**
 * @constructor
 * @implements {StorageInterface}
 * @param {Object} storage Either chrome.storage.local or chrome.storage.sync.
 * @param {string} areaName 'local' or 'sync'.
 */
function ChromeStorageWrapper(storage, areaName) {
  this.area_ = areaName;
  this.listeners_ = [];
  this.get = storage.get.bind(storage);
  this.set = storage.set.bind(storage);
  this.remove = storage.remove.bind(storage);
  chrome.storage.onChanged.addListener(this.handleChanges_.bind(this));
}

ChromeStorageWrapper.prototype.isSynchronous = false;

ChromeStorageWrapper.prototype.addListener = function(listener) {
  this.listeners_.push(listener);
};

ChromeStorageWrapper.prototype.handleChanges_ = function(changes, areaName) {
  if (areaName === this.area_) {
    for (var i = 0; i < this.listeners_.length; i++) {
      this.listeners_[i](changes);
    }
  }
};


/**
 * @constructor
 * @implements {StorageInterface}
 * @param {Storage} storage localStorage or sessionStorage.
 */
function WebStorageWrapper(storage, opt_window) {
  this.storage_ = storage;
  this.listeners_ = [];
  if (!opt_window)
    opt_window = window;
  opt_window.addEventListener('storage', this.handleEvent_.bind(this));
}

WebStorageWrapper.prototype.isSynchronous = true;

WebStorageWrapper.prototype.get = function(keys, opt_callback) {
  if (!opt_callback) {
    if (typeof keys === 'string')
      return JSON.parse(this.storage_.getItem(keys));
    throw 'No callback and key is not string.';
  }

  var result = {};

  switch (typeof keys) {
    case 'string':
      result[keys] = JSON.parse(this.storage_.getItem(keys));
      break;

    case 'object':
      if (Array.isArray(keys)) {
        for (var i = 0; i < keys.length; i++) {
          result[keys[i]] = JSON.parse(this.storage_.getItem(keys[i]));
        }
      } else {
        for (var key in keys) {
          var value = this.storage_.getItem(key);
          result[key] = (value === null) ? keys[key] : JSON.parse(value);
        }
      }
      break;

    default:
      throw 'Wrong type of keys.';
  }

  setTimeout(opt_callback.bind(null, result), 0);
};

/**
 * @param {Object} items
 * @param {function} opt_callback
 */
WebStorageWrapper.prototype.set = function(items, opt_callback) {
  var changes = {};
  for (var key in items) {
    changes[key] = {'oldValue': JSON.parse(this.storage_.getItem(key)),
                    'newValue': items[key]};
    this.storage_.setItem(key, JSON.stringify(items[key]));
  }

  this.fire_(changes);

  if (opt_callback) {
    setTimeout(opt_callback, 0);
  }
};

/**
 * @param {string|Array.<string>} keys}
 * @param {function} opt_callback
 */
WebStorageWrapper.prototype.remove = function(keys, opt_callback) {
  if (typeof keys === 'string')
    keys = [keys];

  var changes = {};
  for (var i = 0; i < keys.length; i++) {
    changes[keys[i]] = {'oldValue': JSON.parse(this.storage_.getItem(keys[i]))};
    this.storage_.removeItem(keys[i]);
  }

  this.fire_(changes);
  if (opt_callback) {
    setTimeout(opt_callback, 0);
  }
};

WebStorageWrapper.prototype.addListener = function(listener) {
  this.listeners_.push(listener);
};

WebStorageWrapper.prototype.fire_ = function(changes) {
  for (var i = 0; i < this.listeners_.length; i++) {
    setTimeout(this.listeners_[i].bind(null, changes), 0);
  }
};

/**
 * @param {Event} event
 */
WebStorageWrapper.prototype.handleEvent_ = function(event) {
  if (event.storageArea != this.storage_)
    return;

  var changes = {};
  var oldValue = null;
  var newValue = null;
  if (event.oldValue !== null && event.oldValue !== undefined)
    oldValue = JSON.parse(event.oldValue);
  if (event.newValue !== null && event.newValue !== undefined)
    newValue = JSON.parse(event.newValue);
  changes[event.key] = {'oldValue': oldValue, 'newValue': newValue};
  this.fire_(changes);
};

if (typeof exports !== 'undefined') {
  exports.getStorage = getStorage;
  exports.ObjectStorage = ObjectStorage;
  exports.WebStorageWrapper = WebStorageWrapper;
}


/**
 * Store data in ObjectStorage created on the background page. For this to work
 * @constructor
 */
function BackgroundStorage() {
}

/**
 * We can't synchronously check whether the background page contains Storage.
 */
BackgroundStorage.isAvailable = function() {
  if (!(typeof chrome !== 'undefined' &&
        chrome.runtime &&
        chrome.runtime.getBackgroundPage &&
        chrome.runtime.getManifest))
    return false;
  var manifest = chrome.runtime.getManifest();
  return manifest['app'] &&
         manifest['app']['background'] &&
         manifest['app']['background']['scripts'] ||  // <-- OR
         manifest['background'] &&
         manifest['background']['scripts'];
};

BackgroundStorage.prototype.isSynchronous = false;

BackgroundStorage.prototype.get = function(keys, callback) {
  chrome.runtime.getBackgroundPage(function(bg) {
    bg.getStorage('memory').get(keys, callback);
  }.bind(this));
};

BackgroundStorage.prototype.set = function(items, opt_callback) {
  chrome.runtime.getBackgroundPage(function(bg) {
    bg.getStorage('memory').set(items, opt_callback);
  }.bind(this));
};

BackgroundStorage.prototype.remove = function(keys, opt_callback) {
  chrome.runtime.getBackgroundPage(function(bg) {
    bg.getStorage('memory').remove(keys, opt_callback);
  }.bind(this));
};

BackgroundStorage.prototype.addListener = function(listener) {
  chrome.runtime.getBackgroundPage(function(bg) {
    bg.getStorage('memory').addListener(listener);
  }.bind(this));
};
