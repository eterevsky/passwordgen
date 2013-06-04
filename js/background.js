function log(s) {
  console.log(s);
}

var profiles = [1, 2, 3];
var profileData = {
  1: {'name': 'Default'},
  2: {'name': 'Old'},
  3: {'name': 'Test Profile'}
};

function getProfiles() {
  var profilesWithNames = [];
  for (var i = 0; i < profiles.length; i++) {
    var id = profiles[i];
    var name = profileData[id]['name'];
    profilesWithNames.push({'id': id, 'name': name});
  }
  return profilesWithNames;
}

function getProfileName(id) {
  return profileData[id]['name'];
}

function getLastUsedProfile() {
  return 1;
}

function deleteProfile(id) {
  profiles.splice(profiles.indexOf(id), 1);
  delete profileData[id];
}

function newProfile(id, name) {
  return {'id': id, 'name': name};
}

function addProfile() {
  var id = profiles[profiles.length - 1] + 1;
  var name;

  var i;
  for (i = 1;; i++) {
    var found = false;
    name = 'Profile ' + i;
    for (var j = 0; j < profiles.length; j++) {
      if (profileData[profiles[j]]['name'] === name) {
        found = true;
        break;
      }
    }
    if (!found)
      break;
  }

  var profile = newProfile(id, name);
  profiles.push(id);
  profileData[id] = profile;
  return id;
}

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
