// Copyright (c) 2014 Oleg Eterevsky. Licensed under the MIT license.

var profiles = null;
var popup = null;


function init() {
  profiles = new Profiles();
  domainSettings = new DomainSettings(profiles);
  if (typeof Popup !== 'undefined')
    popup = new Popup();

  document.getElementById('domain').addEventListener('input',
                                                     onDomainChange);
  document.getElementById('password').addEventListener('input',
                                                       generatePassword);
  document.getElementById('button-copy').addEventListener('click', clipboard);
  profiles.callWhenReady(setupProfiles);
}

function setupProfiles() {
  var profilesList = profiles.getAll();
  var profilesBlock = document.getElementById('profiles-line') ||
                      document.getElementById('profile-block');

  for (var i = 0; i < profilesList.length; i++) {
    var profile = profilesList[i];
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

  if (profilesList.length === 1)
    document.getElementById('profile-block').classList.add('hidden');

  onProfileChange();
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
  profiles.getPassword(profileId, function(password) {
    document.getElementById('password').value = password;
    generatePassword();
    profiles.updateLastUsed(profileId);
  });
}

function onDomainChange() {
  var domain = document.getElementById('domain').value;;
  domainSettings.get(domain, function(profileId1) {
    document.getElementById('profile-' + profileId1).checked = true;
    onProfileChange();
  });
}

function generatePassword() {
  var password = document.getElementById('password').value;
  var profileId = getProfile();
  var passwordStatus = profiles.verifyPassword(profileId, password);

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

  document.getElementById('generated-password').value = generate(
      profileId, domain, password);
}

function clipboard() {
  document.getElementById('generated-password').select();
  document.execCommand('copy');

  var domain = document.getElementById('domain').value;
  var profileId = getProfile();
  domainSettings.updateProfile(domain, profileId);
}

var SYMBOL_SETS = {
  'upper': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  'lower': 'abcdefghijklmnopqrstuvwxyz',
  'digits': '0123456789',
  'symbols': '`~!@#$%^&*()_-+={}|[]\\:";\'<>?,./'
};

/**
 * Check whether the string s contains at least one character from each of the
 * sets.
 * @param {string} s
 * @param {Array.<string>} sets
 * @return {boolean}
 */
function checkAllCharacterTypes(s, sets) {
  var found = [];
  var i, j;
  for (i = 0; i < sets.length; i++) {
    found.push(false);
  }

  for (i = 0; i < s.length; i++) {
    for (j = 0; j < sets.length; j++) {
      if (sets[j].indexOf(s[i]) !== -1) {
        found[j] = true;
      }
    }
  }

  for (i = 0; i < found.length; i++) {
    if (!found[i])
      return false;
  }

  return true;
}

function generate(profileId, domain, password) {
  profiles.setPassword(profileId, password);
  var profile = profiles.get(profileId);
  var characters = profile['char-custom']
  var length = profile['length'];

  if (characters.length < 2)
    return '';

  /** @type {function(string, string)} */
  var hashFunction;
  switch (profile['hash']) {
    case 'md5':
      hashFunction = any_md5;
      hashFunctionRStr = rstr_md5;
      break;

    case 'sha1':
      hashFunction = any_sha1;
      hashFunctionRStr = rstr_sha1;
      break;

    case 'sha256':
      hashFunction = any_sha256;
      hashFunctionRStr = rstr_sha256;
      break;

    default:
      console.error('Hash algorithm not supported:', profile['hash']);
      return '';
  }

  var generatedPassword = ''
  for (var count = 0; generatedPassword.length < length; count++) {
    var data = count ? password + '\n' + count + domain : password + domain;
    generatedPassword += hashFunction(data, characters);
  }

  generatedPassword = generatedPassword.substring(0, length);

  if (profile['char-mix']) {
    var sets = [];
    if (profile['char-upper'])
      sets.push(SYMBOL_SETS['upper']);
    if (profile['char-lower'])
      sets.push(SYMBOL_SETS['lower']);
    if (profile['char-digits'])
      sets.push(SYMBOL_SETS['digits']);
    if (profile['char-symbols'])
      sets.push(SYMBOL_SETS['symbols']);

    if (!checkAllCharacterTypes(generatedPassword, sets)) {
      var hash = hashFunctionRStr(password + domain);
      generatedPassword = rstrToMStr(hash, length, sets);
    }
  }

  return generatedPassword;
}

window.addEventListener('load', init);
