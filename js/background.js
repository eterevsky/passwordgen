// Copyright (c) 2014 Oleg Eterevsky. Licensed under the MIT license.

var profiles = new Profiles();

var SYMBOL_SETS = {
  'upper': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  'lower': 'abcdefghijklmnopqrstuvwxyz',
  'digits': '0123456789',
  'symbols': '`~!@#$%^&*()_-+={}|[]\\:";\'<>?,./'
};

/**
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
