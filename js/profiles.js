// Copyright (c) 2014 Oleg Eterevsky. Licensed under the MIT license.

/**
 * @constructor
 */
function Profiles() {
  /** @type {Array.<number>} */
  this.ids_ = null;
  /** @type {Object.<number, Object> */
  this.data_ = null;
  /** @type {number} */
  this.lastUsed_ = 1;
  /** @type {Object.<string, string>} */
  this.passwords_ = {};
  /** @type {string} */
  this.passwordStorage_ = 'memory';
  /** @type {Storage} */
  this.storage_ = getStorage('permanent');

  this.storage_.get(
      {'profile-ids': []}, this.onProfileIdsReceived_.bind(this));
  this.storage_.get(
      {'password-storage': 'memory'},
      this.onPasswordStorageReceived_.bind(this));
  this.storage_.addListener(this.onChanged_.bind(this));
}

/**
 * @param {Object} items
 */
Profiles.prototype.onProfileIdsReceived_ = function(items) {
  this.ids_ = items['profile-ids'];

  if (this.ids_.length === 0) {
    this.ids_ = [];
    this.data_ = {};
    this.add();
  } else {
    var ids = [];
    for (var i = 0; i < this.ids_.length; i++) {
      ids.push('profile-' + this.ids_[i]);
      ids.push('password-' + this.ids_[i]);
    }
    this.storage_.get(ids, this.onDataReceived_.bind(this));
  }
};

/**
 * @param {Object} items
 */
Profiles.prototype.onPasswordStorageReceived_ = function(items) {
  this.passwordStorage_ = items['password-storage'];
};

/**
 * @param {Object} items
 */
Profiles.prototype.onDataReceived_ = function(items) {
  var id;
  this.data_ = {};
  for (var key in items) {
    if (key.indexOf('profile-') === 0) {
      var profile = items[key];
      id = profile['id'];
      this.data_[id] = profile;
    } else if (key.indexOf('password-') === 0) {
      id = parseInt(key.substring(9), 10);
      this.passwords_[id] = items[key];
    }
  }
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
        this.passwordStorage_ = value;
        if (value === 'none')
          this.passwords_ = {};
        break;

      default:
        if (key.indexOf('profile-') === 0) {
          id = parseInt(key.substring(8), 10);
          if (value) {
            this.data_[id] = value;
          } else {
            delete this.data_[id];
          }
        } else if (key.indexOf('password-') === 0) {
          id = parseInt(key.substring(9), 10);
          this.passwords_[id] = value;
        }
    }
  }
};

/**
 * @param {number} id
 */
Profiles.prototype.store_ = function(id) {
  var items = {};
  items['profile-ids'] = this.ids_;
  if (id in this.data_)
    items['profile-' + id] = this.data_[id];
  this.storage_.set(items);
  if (!(id in this.data_))
    this.storage_.remove('profile-' + id);
};

Profiles.prototype.storeLastUsed_ = function() {
  this.storage_.set({'profile-last-used': this.lastUsed_})
};

/**
 * @return {Array.<Object>}
 */
Profiles.prototype.getAll = function() {
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
  if (this.passwordStorage !== 'none') {
    return this.passwords_[id];
  } else {
    return '';
  }
};

/**
 * @param {number} id
 * @param {string} password
 */
Profiles.prototype.setPassword = function(id, password) {
  switch (this.passwordStorage_) {
    case 'none':
      break;

    case 'memory':
      this.passwords_[id] = password;
      break;

    case 'permanent':
      this.passwords_[id] = password;
      var storageItem = {};
      storageItem['password-' + id] = password;
      this.storage_.set(storageItem);
      break;
  }
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
  this.passwordStorage_ = storage;
  if (storage === 'none') {
    this.passwords_ = {};
  }
  this.storage_.set({'password-storage': storage});
  if (storage !== 'permanent') {
    var ids = [];
    for (var i = 0; i < this.ids_.length; i++) {
      ids.push('password-' + this.ids_[i]);
    }
    this.storage_.remove(ids);
  }
};
