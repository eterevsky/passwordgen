// Copyright (c) 2014 Oleg Eterevsky. Licensed under the MIT license.

var background = null;
var tab = null;
var tabDomain = null;

function init() {
  chrome.runtime.getBackgroundPage(onBackgroundPage);
  document.getElementById('domain').addEventListener('input',
                                                     generatePassword);
  document.getElementById('password').addEventListener('input',
                                                       generatePassword);
  document.getElementById('button-insert').addEventListener('click', insert);
  document.getElementById('button-copy').addEventListener('click', clipboard);
  document.getElementById('button-options').addEventListener('click', options);
}

function onBackgroundPage(bg) {
  background = bg;
  setupProfiles();
  chrome.tabs.query({'active': true, 'currentWindow': true}, onActiveTabs);
}

function setupProfiles() {
  var profiles = background.profiles.getAll();
  var profilesBlock = document.getElementById('profile-block');

  for (var i = 0; i < profiles.length; i++) {
    var profile = profiles[i];
    var div = document.createElement('div');
    div.classList.add('profile-option');
    var input = document.createElement('input');
    input.setAttribute('type', 'radio');
    input.setAttribute('name', 'profile');
    input.setAttribute('value', profile['id']);
    input.id = 'profile-' + profile['id'];
    input.addEventListener('change', onProfileChange);
    if (i === 0) {
      input.checked = true;
    }
    div.appendChild(input);
    div.appendChild(document.createTextNode(profile['name']));
    profilesBlock.appendChild(div);
  }

  if (profiles.length === 1) {
    profilesBlock.classList.add('hidden');
  }
}

function getProfile() {
  var profileInputs = document.getElementsByName('profile');
  var profileId = null;

  for (var i = 0; i < profileInputs.length; i++) {
    if (profileInputs[i].checked) {
      profileId = profileInputs[i].value;
      break;
    }
  }

  return profileId;
}

function onProfileChange() {
  var profileId = getProfile();
  var password = background.profiles.getPassword(profileId) || '';
  document.getElementById('password').value = password;
  generatePassword();
  background.profiles.updateLastUsed(profileId);
}

// May use a complete list, but it's to long and it doesn't pay off.
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

function onActiveTabs(tabs) {
  if (tabs.length < 1) {
    background.console.error('No active tabs!');
    return;
  }
  var url = tabs[0].url;
  if (!url) return;
  tab = tabs[0];
  tabDomain = domainFromURL(url);
  background.getDomainSettings(tabDomain, function(profileId, domain) {
    document.getElementById('domain').value = domain;
    document.getElementById('profile-' + profileId).checked = true;
    onProfileChange();
    if (domain != tabDomain) {
      background.getDomainSettings(domain, function(profileId1) {
        document.getElementById('profile-' + profileId1).checked = true;
        onProfileChange();
      });
    }
  });
}

function generatePassword() {
  var password = document.getElementById('password').value;
  var profileId = getProfile();
  var passwordStatus = background.profiles.verifyPassword(profileId, password);

  var yes = document.getElementById('password-yes');
  var no = document.getElementById('password-no');
  switch (passwordStatus) {
    case 0:
      yes.classList.add('hidden');
      no.classList.remove('hidden');
      return;

    case 1:
      yes.classList.remove('hidden');
      no.classList.add('hidden');
      break;

    case 2:
      yes.classList.add('hidden');
      no.classList.add('hidden');
      break;
  }

  var domain = document.getElementById('domain').value;

  document.getElementById('generated-password').value = background.generate(
      profileId, domain, password);
}

function insert() {
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
  background.updateDomainProfile(domain, profileId);
  background.updateDomainSubstitute(tabDomain, domain);
}

function clipboard() {
  document.getElementById('generated-password').select();
  document.execCommand('copy');

  var domain = document.getElementById('domain').value;
  var profileId = getProfile();
  background.updateDomainProfile(domain, profileId);
}

function options() {
  chrome.tabs.create({'url': 'options.html'});
}

window.addEventListener('load', init);
