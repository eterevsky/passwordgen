// Copyright (c) 2014 Oleg Eterevsky. Licensed under the MIT license.

/**
 * @file Here goes all the code, specific to Chrome Extension.
 */

// Maybe use a complete list? It's too long though.
var EFFECTIVE_TLD = ['com.au', 'co.uk', 'co.jp'];

function domainFromURL(url) {
  var fullDomain = url.match(/^\w+:\/\/((?:\w[-\w\d]*\.)*\w[-\w\d]*)\/.*/)[1];
  if (!fullDomain)
    return null;

  var parts = fullDomain.split('.');
  if (parts.length <= 2)
    return fullDomain;
  var third = false;
  for (var i = 0; i < EFFECTIVE_TLD.length; i++) {
    var tld = EFFECTIVE_TLD[i];
    if (fullDomain.indexOf(tld, fullDomain.length - tld.length) != -1) {
      third = true;
      break;
    }
  }

  if (third) {
    return parts.slice(parts.length - 3).join('.');
  } else {
    return parts.slice(parts.length - 2).join('.');
  }
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
  this.domainSettings_.updateSubstitute(tabDomain, domain);
};

Popup.prototype.showOptions_ = function() {
  chrome.tabs.create({'url': 'options.html'});
};

