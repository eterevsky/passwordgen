// Copyright (c) 2013 Oleg Eterevsky. Licensed under the MIT license.


/**
 * @constructor
 */
function MultiSrings() {
}

/**
 * @param {Array.<number>} data
 * @param {number} length
 * @param {Array.<number>} sets Set length.
 */
MultiStrings.prototype.encode = function(data, length, sets) {
  var i;

  var dataMod = [1];
  for (i = 0; i < data.length; i++)
    dataMod.push(0);

  var appearInPrefix = {};
  var appearCount = 0;

  var res = [];

  while (length > 0) {
    var sizesLeft = []
    for (i = 0; i < setsLeft.length; i++)
      sizesLeft.push(sets[setsLeft[i]]);

    var total = this.count(length, sets, appearCount, appearInPrefix);
    var sum = [0];

    var reached = false;

    for (i = 0; i < sets.length && !reached; i++) {
      var newType = !(i in appearInPrefix);
      appearInPrefix[i] = true;
      if (newType)
        appearCount += 1;
      var nsuffixes = this.count(length - 1
      for (var j = 0; j < sets[i] && !reached; j++) {

      }
    }
  }
};

var multiStrings = new MultiStrings();


/**
 * @param {string} data Raw string. Symbols 0-255.
 * @param {number} length
 * @param {Array.<string>} alphabets Disjoint sets of letters. Every symbol must
 *     appear at most once and at most in one alphabet.
 *
 * This function will convert a raw string to a string of given length, which
 * uses at least one symbol from each of the alphabets. All output strings have
 * the same probability provided the input strings are also distributed
 * uniformly and are long enough.
 */
function rstrToMultiStr(data, length, alphabets) {
  if (alphabets.length > length)
    return '';  // Impossible

  var dataArr = [];
  var i;
  for (i = 0; i < data.length; i++)
    dataArr.push(data.charCodeAt(i));
  var sets = [];
  for (i = 0; i < alphabets.length; i++)
    sets.push(alphabets[i].length);

  var res = multiStrings.encode(dataArr, length, sets);
  var resStr = '';
  for (i = 0; i < res.length; i++) {
    resStr += alphabets[res[i][0]][res[i][1]];
  }

  return resStr;
}
