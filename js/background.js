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

  chrome.storage.sync.get(
      {'profile-ids': []}, this.onProfileIdsReceived_.bind(this));
  chrome.storage.onChanged.addListener(this.onChanged_.bind(this));
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
    }
    chrome.storage.sync.get(ids, this.onDataReceived_.bind(this));
  }
};

/**
 * @param {Object} items
 */
Profiles.prototype.onDataReceived_ = function(items) {
  this.data_ = {};
  for (var key in items) {
    var profile = items[key];
    var id = profile['id'];
    this.data_[id] = profile;
  }
};

/**
 * @param {Object} items
 */
Profiles.prototype.onChanged_ = function(items) {
  for (var key in items) {
    if (key === 'profile-ids') {
      this.ids_ = items['profile-ids'].newValue;
    } else if (key === 'profile-last-used') {
      this.lastUsed_ = items['profile-last-used'].newValue;
    } else if (key.indexOf('profile-') === 0) {
      var id = parseInt(key.substring(8), 10);
      if (items[key].newValue) {
        this.data_[id] = items[key].newValue;
      } else {
        delete this.data_[id];
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
  chrome.storage.sync.set(items);
  if (!(id in this.data_))
    chrome.storage.sync.remove('profile-' + id);
};

Profiles.prototype.storeLastUsed_ = function() {
  chrome.storage.sync.set({'profile-last-used': this.lastUsed_})
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
      'char-custom': '',
      'length': 8
  };
  this.ids_.push(id);
  this.data_[id] = profile;
  this.store_(id);
  this.updateLastUsed(id);
  return id;
}

Profiles.prototype.update = function(profile) {
  this.data_[profile['id']] = profile;
  this.store_(profile['id']);
};

var profiles = new Profiles();


var MOCK_PASSWORDS = {1: 'abc', 2: '12345678'};

function getProfilePassword(profileId) {
  return MOCK_PASSWORDS[profileId] || '';
}

function verifyPassword(profileId, password) {
  if (profileId in MOCK_PASSWORDS) {
    return password === MOCK_PASSWORDS[profileId] ? 1 : 0;
  } else {
    return 2;
  }
}

function generate(profileId, domain, password, callback) {
  callback(profileId + domain + password);
}

function saveDomainProfile(domain, profileId) {
}

function saveDomainSubstitute(domain, otherDomain) {
}
