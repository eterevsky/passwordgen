// Copyright (c) 2014 Oleg Eterevsky. Licensed under the MIT license.

/**
 * @file Here goes all the code, specific to Chrome Extension.
 */

function domainFromURL(url, opt_tld, opt_children_tld, opt_not_tld) {
  if (!opt_tld) {
    opt_tld = EFFECTIVE_TLD;
    opt_children_tld = CHILDREN_TLD;
    opt_not_tld = NOT_TLD;
  }

  var fullDomain = url.match(/^(?:\w+:\/\/)?((?:\w[-\w\d]*\.)*\w[-\w\d]*)(?:\/.*)?/)[1];
  if (!fullDomain)
    return null;

  var parts = fullDomain.split('.');
  if (parts.length <= 2)
    return fullDomain;

  var startDomainPart = parts.length - 2;
  for (var i = 0; i < parts.length; i++) {
    var domainSuffix = parts.slice(i).join('.');
    if (opt_not_tld.indexOf(domainSuffix) >= 0) {
      startDomainPart = i;
      break;
    }

    if (opt_children_tld.indexOf(domainSuffix) >= 0) {
      startDomainPart = i - 2;
      break;
    }

    if (opt_tld.indexOf(domainSuffix) >= 0) {
      startDomainPart = i - 1;
      break;
    }
  }

  if (startDomainPart < 0)
    startDomainPart = 0;

  return parts.slice(startDomainPart).join('.');
}

/**
 * @constructor
 */
function Popup(domainSettings) {
  this.domainSettings_ = domainSettings;
  this.tabDomain_ = null;
  document.getElementById('button-options').addEventListener(
      'click', this.showOptions_.bind(this));
  document.getElementById('button-insert').addEventListener(
      'click', this.insert_.bind(this));
  chrome.tabs.query({'active': true, 'currentWindow': true},
                    this.onActiveTabs_.bind(this));
}

Popup.prototype.onActiveTabs_ = function(tabs) {
  if (tabs.length < 1) {
    background.console.error('No active tabs!');
    return;
  }
  var tab = tabs[0];
  var url = tab.url;
  if (!url)
    return;
  this.tabDomain_ = domainFromURL(url);

  domainSettings.get(this.tabDomain_, function(profileId, domain) {
    document.getElementById('domain').value = domain;
    document.getElementById('profile-' + profileId).checked = true;
    onDomainChange();
  });
};

Popup.prototype.insert_ = function() {
  var genPassword = document.getElementById('generated-password').value;
  chrome.tabs.executeScript({
    'allFrames': true,
    'code': 'var pass = "' + genPassword + '";' +
            'var inputs = document.getElementsByTagName("input");' +
            'for (var i = 0; i < inputs.length; i++) {' +
              'var input = inputs[i];' +
              'if (input.getAttribute("type") === "password") {' +
                'input.value = pass;' +
              '}' +
            '}'
  });

  var domain = document.getElementById('domain').value;
  var profileId = getProfile();
  this.domainSettings_.updateProfile(domain, profileId);
  this.domainSettings_.updateSubstitute(this.tabDomain_, domain);
};

Popup.prototype.showOptions_ = function() {
  chrome.tabs.create({'url': 'options.html'});
};

if (typeof exports !== 'undefined') {
  exports.domainFromURL = domainFromURL;
}
