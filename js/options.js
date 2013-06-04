var background = null;
var selectedProfileId = null;

function init() {
  chrome.runtime.getBackgroundPage(onBackgroundPage);
}

function onBackgroundPage(bg) {
  background = bg;
  document.getElementById('add-profile').addEventListener('click', addProfile);
  populateProfiles(background.getProfiles());
  selectProfile(background.getLastUsedProfile());
}

function populateProfiles(profiles) {
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

  for (var i = 0; i < profiles.length; i++) {
    var profileId = profiles[i]['id'];
    var profileName = profiles[i]['name'];

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
  var name = background.getProfileName(profileId);

  if (confirm('Delete the profile "' + name + '"?')) {
    background.deleteProfile(profileId);
    populateProfiles(background.getProfiles());
    if (profileId === selectedProfileId) {
      selectProfile(background.getLastUsedProfile());
    } else {
      selectProfile(selectedProfileId);
    }
  }
}


function addProfile() {
  var profileId = background.addProfile();
  populateProfiles(background.getProfiles());
  selectProfile(profileId);
}


window.addEventListener('load', init);
