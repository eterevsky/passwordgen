// Copyright (c) 2013 Oleg Eterevsky. Licensed under the MIT license.

/** @type {Profiles} */
var profiles = null;
/** @type {number} */
var selectedProfileId = null;
/** @type {boolean} */
var custom = false;

function init() {
  hideWebsiteMenu();

  chrome.runtime.getBackgroundPage(onBackgroundPage);
  document.getElementById('add-profile').addEventListener('click', addProfile);
  document.getElementById('profile-name').addEventListener('input', nameChange);
//  document.getElementById('hash-function-sha3').addEventListener(
//      'click', hashChange);
  document.getElementById('hash-function-sha256').addEventListener(
      'click', hashChange);
  document.getElementById('hash-function-sha1').addEventListener(
      'click', hashChange);
  document.getElementById('hash-function-md5').addEventListener(
      'click', hashChange);
  document.getElementById('characters-upper').addEventListener(
      'click', characterTypeChange);
  document.getElementById('characters-lower').addEventListener(
      'click', characterTypeChange);
  document.getElementById('characters-digits').addEventListener(
      'click', characterTypeChange);
  document.getElementById('characters-symbols').addEventListener(
      'click', characterTypeChange);
  document.getElementById('characters-mix').addEventListener(
      'click', characterTypeChange);
  document.getElementById('characters').addEventListener(
      'input', charactersChange);
  document.getElementById('length-range').addEventListener(
      'change', rangeChange);
  document.getElementById('length-number').addEventListener(
      'change', lengthChange);

  var passwordStorage = document.getElementsByName('password-storage');
  for (var i = 0; i < passwordStorage.length; i++) {
    passwordStorage[i].addEventListener('click', passwordStorageChange);
  }
}

function hideWebsiteMenu() {
  if (chrome && chrome.extension) {
    var menu = document.getElementsByClassName('menu');
    for (var i = 0; i < menu.length; i++) {
      menu[i].classList.add('hidden');
    }
  }
}

function onBackgroundPage(bg) {
  profiles = bg.profiles;
  setPasswordStorage();
  populateProfiles();
  selectProfile(profiles.getLastUsed());
}

function setPasswordStorage() {
  var storage = profiles.getPasswordStorage();
  document.getElementById('password-storage-' + storage).checked = true;
}

function populateProfiles() {
  var profs = profiles.getAll();
  var profilesRow = document.getElementById('profile-titles');
  var addProfileButton = document.getElementById('add-profile');

  var toDelete = [];
  for (var i = 0; i < profilesRow.children.length; i++) {
    var child = profilesRow.children[i];
    if (child.tagName.toLowerCase() === 'span')
      toDelete.push(child);
  }

  for (var i = 0; i < toDelete.length; i++) {
    profilesRow.removeChild(toDelete[i]);
  }

  for (var i = 0; i < profs.length; i++) {
    var profileId = profs[i]['id'];
    var profileName = profs[i]['name'];

    var span = document.createElement('span');
    span.id = 'profile-' + profileId;

    var title = document.createElement('a');
    title.appendChild(document.createTextNode(profileName));
    title.addEventListener('click', selectProfile.bind(null, profileId));
    title.id = 'profile-name-' + profileId;
    span.appendChild(title);

    var del = document.createElement('a');
    del.appendChild(document.createTextNode('\u00d7'));
    del.classList.add('delete-profile');
    del.addEventListener('click', deleteProfile.bind(null, profileId));
    span.appendChild(del);

    profilesRow.insertBefore(span, addProfileButton);
  }
}

function gatherOptions() {
  var profile = {'id': selectedProfileId};
  profile['name'] = document.getElementById('profile-name').value;

//  if (document.getElementById('hash-function-sha3').checked)
//    profile['hash'] ='sha3';
  if (document.getElementById('hash-function-sha256').checked)
    profile['hash'] ='sha256';
  if (document.getElementById('hash-function-sha1').checked)
    profile['hash'] ='sha1';
  if (document.getElementById('hash-function-md5').checked)
    profile['hash'] ='md5';

  profile['custom'] = custom;

  profile['char-upper'] = document.getElementById('characters-upper').checked;
  profile['char-lower'] = document.getElementById('characters-lower').checked;
  profile['char-digits'] = document.getElementById('characters-digits').checked;
  profile['char-symbols'] = document.getElementById('characters-symbols')
                                    .checked;
  profile['char-mix'] = document.getElementById('characters-mix').checked;
  profile['char-custom'] = document.getElementById('characters').value;
  profile['length'] = document.getElementById('length-number').value;

  return profile;
}

function passwordStorageChange() {
  var passwordStorage = null;
  var radioButtons = document.getElementsByName('password-storage');
  for (var i = 0; i < radioButtons.length; i++) {
    if (radioButtons[i].checked) {
      passwordStorage = radioButtons[i].value;
      break;
    }
  }

  if (!passwordStorage) {
    console.error('No password storage option chosen. This should not happen.');
    return;
  }

  profiles.setPasswordStorage(passwordStorage);
}

function nameChange() {
  var name = document.getElementById('profile-name').value;
  document.getElementById('profile-name-' + selectedProfileId)
      .firstChild.textContent = name;
  profiles.update(gatherOptions());
}

function hashChange() {
  profiles.update(gatherOptions());
}

function characterTypeChange() {
  updateCustom(false);
  profiles.update(gatherOptions());
}

function charactersChange() {
  updateCustom(true);
  profiles.update(gatherOptions());
}

function rangeChange() {
  document.getElementById('length-number').value =
      document.getElementById('length-range').value
  profiles.update(gatherOptions());
}

function lengthChange() {
  document.getElementById('length-range').value =
      document.getElementById('length-number').value
  profiles.update(gatherOptions());
}

function updateCharactersFromTypes() {
  var s = '';
  if (document.getElementById('characters-upper').checked)
    s += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (document.getElementById('characters-lower').checked)
    s += 'abcdefghijklmnopqrstuvwxyz';
  if (document.getElementById('characters-digits').checked)
    s += '0123456789';
  if (document.getElementById('characters-symbols').checked)
    s += '`~!@#$%^&*()_-+={}|[]\\:";\'<>?,./';

  document.getElementById('characters').value = s;
}

function updateCustom(newCustom) {
  custom = newCustom;
  if (custom) {
    document.getElementById('characters-upper').checked = false;
    document.getElementById('characters-lower').checked = false;
    document.getElementById('characters-digits').checked = false;
    document.getElementById('characters-symbols').checked = false;
    document.getElementById('characters-mix').checked = false;
    document.getElementById('characters-mix').disabled = true;
  } else {
    document.getElementById('characters-mix').disabled = false;
    updateCharactersFromTypes();
  }
}

/**
 * @param {number} profileId
 */
function selectProfile(profileId) {
  if (selectedProfileId) {
    var oldProfile = document.getElementById('profile-' + selectedProfileId);
    if (oldProfile)
      oldProfile.classList.remove('selected-profile');
  }

  selectedProfileId = profileId;
  document.getElementById('profile-' + profileId).classList
      .add('selected-profile');

  var profile = profiles.get(profileId);
  document.getElementById('profile-name').value = profile['name'];
  document.getElementById('hash-function-' + profile['hash']).checked = true;

  updateCustom(profile['custom']);

  if (profile['custom']) {
    document.getElementById('characters').value = profile['char-custom'];
  } else {
    document.getElementById('characters-upper').checked = profile['char-upper'];
    document.getElementById('characters-lower').checked = profile['char-lower'];
    document.getElementById('characters-digits').checked =
        profile['char-digits'];
    document.getElementById('characters-symbols').checked =
        profile['char-symbols'];
    document.getElementById('characters-mix').checked = profile['char-mix'];
    updateCharactersFromTypes();
  }

  document.getElementById('length-range').value = profile['length'];
  document.getElementById('length-number').value = profile['length'];
}

/**
 * @param {number} profileId
 */
function deleteProfile(profileId) {
  var name = profiles.getName(profileId);

  if (confirm('Delete the profile "' + name + '"?')) {
    profiles.deleteProfile(profileId);
    populateProfiles();
    if (profileId === selectedProfileId) {
      selectProfile(profiles.getLastUsed());
    } else {
      selectProfile(selectedProfileId);
    }
  }
}

function addProfile() {
  var profileId = profiles.add();
  populateProfiles();
  selectProfile(profileId);
  document.getElementById('profile-name').focus();
}

window.addEventListener('load', init);
