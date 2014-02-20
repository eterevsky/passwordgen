// Copyright (c) 2014 Oleg Eterevsky. Licensed under the MIT license.

/**
 * @constructor
 * @param {Storage} opt_storage
 */
function Profiles(opt_storage) {
  /** @type {Array.<number>} */
  this.ids_ = null;
  /** @type {Object.<number, Object> */
  this.data_ = null;
  /** @type {number} */
  this.lastUsed_ = null;
  /** @type {Storage} */
  this.passwords_ = null;
  /** @type {string} */
  this.passwordStorage_ = null;
  /** @type {Storage} */
  this.storage_ = opt_storage || getStorage('permanent');
  /** @type {function()} */
  this.onReadyCallbacks_ = [];

  this.storage_.get(
      {'profile-ids': [], 'profile-last-used': null},
      this.onProfileIdsReceived_.bind(this));
  this.storage_.get(
      {'password-storage': 'memory'},
      this.onPasswordStorageReceived_.bind(this));
  this.storage_.addListener(this.onChanged_.bind(this));
}

Profiles.prototype.isReady = function() {
  return this.ids_ !== null && this.data_ !== null &&
         this.passwordStorage_ !== null;
};

/**
 * @param {function()} callback
 */
Profiles.prototype.callWhenReady = function(callback) {
  if (this.isReady()) {
    setTimeout(callback, 0);
  } else {
    this.onReadyCallbacks_.push(callback);
  }
};

/**
 * Checks whether everything is ready and if it is, call the onready callbacks.
 */
Profiles.prototype.maybeReady_ = function() {
  if (this.isReady()) {
    for (var i = 0; i < this.onReadyCallbacks_.length; i++) {
      setTimeout(this.onReadyCallbacks_[i], 0);
    }
    // To raise an exception in case it is called twice.
    this.onReadyCallbacks_ = null;
  }
};

/**
 * @param {Object} items
 */
Profiles.prototype.onProfileIdsReceived_ = function(items) {
  this.ids_ = items['profile-ids'];
  this.lastUsed_ = items['profile-last-used'];

  if (this.ids_.length === 0) {
    this.ids_ = [];
    this.data_ = {};
    this.add();
    this.maybeReady_();
  } else {
    var ids = [];
    for (var i = 0; i < this.ids_.length; i++) {
      ids.push('profile-' + this.ids_[i]);
    }
    this.storage_.get(ids, this.onDataReceived_.bind(this));
  }

  if (this.lastUsed_ === null)
    this.lastUsed_ = this.ids_[0];
};

/**
 * @param {Object} items
 */
Profiles.prototype.onPasswordStorageReceived_ = function(items) {
  this.initPasswords_(items['password-storage']);
  this.maybeReady_();
};

/**
 * @param {string} type
 */
Profiles.prototype.initPasswords_ = function(type) {
  if (this.password_ !== null &&
      this.passwordStorage_ !== null &&
      this.passwordStorage_ !== type) {
    // Password storage type changed. Need to delete passwords in the old
    // storage.
    var items = [];
    for (var i = 0; i < this.ids_.length; i++) {
      items.push('password-' + i);
    }
    this.passwords_.remove(items);
  }

  this.passwordStorage_ = type;

  var storageType;
  switch (this.passwordStorage_) {
    case 'none':      storageType = 'memory'; break;
    case 'memory':    storageType = 'session'; break;
    case 'permanent': storageType = 'local'; break;
  }
  this.passwords_ = getStorage(storageType, true /* sync */);
};

/**
 * @param {Object} items
 */
Profiles.prototype.onDataReceived_ = function(items) {
  var id;
  this.data_ = {};
  for (var key in items) {
    if (key.indexOf('profile-') !== 0)
      throw 'Internal error';
    var profile = items[key];
    id = profile['id'];
    this.data_[id] = profile;
  }
  this.maybeReady_();
};

/**
 * @param {Object} items
 */
Profiles.prototype.onChanged_ = function(items) {
  var id;
  for (var key in items) {
    var value = items[key].newValue;
    switch (key) {
      case 'profile-ids':
        this.ids_ = value;
        break;

      case 'profile-last-used':
        this.lastUsed_ = value;
        break;

      case 'password-storage':
        if (value !== this.passwordStorage_)
          this.initPasswords_(value);
        break;

      default:
        if (key.indexOf('profile-') === 0) {
          id = parseInt(key.substring(8), 10);
          if (value) {
            this.data_[id] = value;
          } else {
            delete this.data_[id];
          }
        }
    }
  }
};

/**
 * Add/remove/update a profile in storage.
 * @param {number} id
 */
Profiles.prototype.store_ = function(id) {
  var items = {};
  items['profile-ids'] = this.ids_;
  if (id in this.data_)
    items['profile-' + id] = this.data_[id];
  this.storage_.set(items);
  if (!(id in this.data_)) {
    this.storage_.remove('profile-' + id);
    this.passwords_.remove('password-' + id);
  }
};

Profiles.prototype.storeLastUsed_ = function() {
  this.storage_.set({'profile-last-used': this.lastUsed_})
};

/**
 * @return {Array.<Object>}
 */
Profiles.prototype.getAll = function(callback) {
  var profs = [];
  for (var i = 0; i < this.ids_.length; i++) {
    profs.push(this.data_[this.ids_[i]]);
  }
  return profs;
};

/**
 * @param {number} id
 * @return {string}
 */
Profiles.prototype.getName = function(id) {
  return this.data_[id]['name'];
};

/**
 * @param {number} id
 * @return {Object}
 */
Profiles.prototype.get = function(id) {
  return this.data_[id];
};

/**
 * @return {number}
 */
Profiles.prototype.getLastUsed = function() {
  if (this.lastUsed_ in this.data_) {
    return this.lastUsed_;
  } else {
    return this.ids_[0];
  }
}

/**
 * @param {number} id
 */
Profiles.prototype.updateLastUsed = function(id) {
  if (id !== this.lastUsed_ && id in this.data_) {
    this.lastUsed_ = id;
    this.storeLastUsed_();
  }
}

/**
 * @param {number} id
 */
Profiles.prototype.deleteProfile = function(id) {
  this.ids_.splice(this.ids_.indexOf(id), 1);
  delete this.data_[id];
  this.store_(id);
  if (this.ids_.length === 0)
    this.add();
}

/**
 * @return {number}
 */
Profiles.prototype.add = function() {
  var id, name;
  var i;
  if (this.ids_.length === 0) {
    id = 1;
    name = 'Default';
    this.lastUsed_ = 1;
  } else {
    id = this.ids_[this.ids_.length - 1] + 1;
    for (i = 1;; i++) {
      var found = false;
      name = 'Profile ' + i;
      for (var key in this.data_) {
        if (this.data_[key]['name'] === name) {
          found = true;
          break;
        }
      }
      if (!found)
        break;
    }
  }

  var profile = {
      'id': id,
      'name': name,
      'hash': 'sha256',
      'custom': false,
      'char-upper': true,
      'char-lower': true,
      'char-digits': true,
      'char-symbols': true,
      'char-mix': false,
      'char-custom': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
                     'abcdefghijklmnopqrstuvwxyz' +
                     '0123456789' +
                     '`~!@#$%^&*()_-+={}|[]\\:";\'<>?,./',
      'length': 8
  };
  this.ids_.push(id);
  this.data_[id] = profile;
  this.store_(id);
  this.updateLastUsed(id);
  return id;
}

/**
 * @param {Object} profile
 */
Profiles.prototype.update = function(profile) {
  this.data_[profile['id']] = profile;
  this.store_(profile['id']);
};

/**
 * @param {number} id
 */
Profiles.prototype.getPassword = function(id) {
  return this.passwords_.get('password-' + id) || '';
};

/**
 * @param {number} id
 * @param {string} password
 */
Profiles.prototype.setPassword = function(id, password) {
  var items = {};
  items['password-' + id] = password;
  this.passwords_.set(items);
};

/**
 * @param {number} id
 * @param {string} password
 * @returns {number} 0 — wrong, 1 — right, 2­ — unknown.
 */
Profiles.prototype.verifyPassword = function(id, password) {
  return 2;
};

/**
 * @return {string} none|memory|permanent
 */
Profiles.prototype.getPasswordStorage = function() {
  return this.passwordStorage_;
};

/**
 * @param {string} storage none|memory|permanent
 */
Profiles.prototype.setPasswordStorage = function(storage) {
  if (this.passwordStorage_ !== storage) {
    this.initPasswords_(storage);
    this.storage_.set({'password-storage': storage});
  }
};
