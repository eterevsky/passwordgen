// Copyright (c) 2014 Oleg Eterevsky. Licensed under the MIT license.

/**
 * Per-domain settings include which profile is used for domain, and
 * a substitution: if one domain (or generic string) is used to generate
 * password for another.
 *
 * @constructor
 * @param {Storage} [opt_storage]
 */
function DomainSettings(profiles, opt_storage) {
  this.profiles_ = profiles;
  this.storage_ = getStorage('permanent');
}

/**
 * @param {string} domain
 * @param {number} profileId
 */
DomainSettings.prototype.updateProfile = function(domain, profileId) {
  var item = {};
  item['domain-profile-' + domain] = profileId;
  this.storage_.set(item);
}

/**
 * @param {string} domain
 * @param {string} substitute
 */
DomainSettings.prototype.updateSubstitute = function(domain, substitute) {
  var item = {};
  item['domain-substitute-' + domain] = substitute;
  this.storage_.set(item);
}

/**
 * @param {string} domain
 * @param {function(number, string)} callback
 */
DomainSettings.prototype.get = function(domain, callback) {
  this.profiles_.callWhenReady(function() {
    var request = {};
    request['domain-profile-' + domain] = this.profiles_.getLastUsed();
    request['domain-substitute-' + domain] = domain;
    this.storage_.get(request, function(items) {
      callback(items['domain-profile-' + domain],
               items['domain-substitute-' + domain])
    }.bind(this));
  }.bind(this));
}

