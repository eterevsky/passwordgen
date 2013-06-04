/**
 * @type {Profiles}
 */
var profiles = null;
/**
 * @type {number}
 */
var selectedProfileId = null;

function init() {
  chrome.runtime.getBackgroundPage(onBackgroundPage);
  document.getElementById('add-profile').addEventListener('click', addProfile);
}

function onBackgroundPage(bg) {
  profiles = bg.profiles;
  populateProfiles();
  selectProfile(profiles.getLastUsed());
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
    span.appendChild(title);

    var del = document.createElement('a');
    del.appendChild(document.createTextNode('\u00d7'));
    del.classList.add('delete-profile');
    del.addEventListener('click', deleteProfile.bind(null, profileId));
    span.appendChild(del);

    profilesRow.insertBefore(span, addProfileButton);
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
