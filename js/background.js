function log(s) {
  console.log(s);
}

function getProfiles() {
  return [{'id': 1, 'name': 'Default'},
          {'id': 2, 'name': 'Old'},
          {'id': 3, 'name': 'Test'}];
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
