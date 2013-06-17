// Copyright (c) 2013 Oleg Eterevsky. Licensed under the MIT license.

/**
 * @constructor
 */
function MultiStrings() {
}

/**
 * @param {number} length
 * @param {Array.<number>} sets Number of elements in each set.
 * @param {Array.<number>} setsInPrefix Indexes of sets that already appeared
 *     in the prefix.
 * @return {BigUInt}
 */
MultiStrings.prototype.count_ = function(length, sets, setsInPrefix) {
};

/**
 * @param {string} data Raw string.
 * @param {number} length The length of the 
 * @param {Array.<string>} sets Mutually exclusive sets of symbols.
 *
 * @return {string} For each position the index of set and the
 *     number of the symbol in the set.
 *
 * The total number N of strings with symbols from each set is calculated. The
 * string number (data * N) / 2^l is taken. Here l = data.length * 8 (the number
 * of bits in data). The resulting strings are ordered lexicographically with
 * respect to the set number and the order of symbols a the set.
 */
MultiStrings.prototype.encode = function(data, length, sets) {
  var i, iset, ichar;

  var setLengths = [];
  for (i = 0; i < sets.length; i++)
    setLengths.push(sets[i].length);

  var total = this.count_(length, setLengths, []);
  var dataNum = BigUInt.fromRawStr(data);
  var index = BigUInt.shr(BigUInt.mul(total, dataNum), data.length * 8));

  var res = '';
  var setsInPrefix = [];
  while (length > 0) {
    var sum = BinUInt.fromInt(0);
    var found = false;
    for (iset = 0; iset < sets.length; iset++) {
      // Taking the next character from set #iset.
      var appearInPrefix = (setsInPrefix.indexOf(iset) != -1);
      if (!appearInPrefix) {
        setsInPrefix.push(iset);
      }

      // The number of suffixes of length - 1 for each single letter from set
      // #iset
      var nsuffixes = this.count_(length - 1, setLengths, setsInPrefix);

      for (ichar = 0; ichar < sets[iset].length; ichar++) {
        var newSum = BigUInt.add(sum, nsuffixes);
        if (BigUInt.gt(newSum, index)) {
          found = true;
          break;
        }
        sum = newSum;
      }

      if (found) {
        // #iset remains in setsInPrefix.
        break;
      }

      if (!appearInPrefix)
        setsInPrefix.pop();
    }

    res += sets[iset][ichar];
    index = BigUInt.sub(index, sum);
  }

  return res;
};

var multiStrings = new MultiStrings();


/**
 * @param {string} data Raw string. Symbols 0-255.
 * @param {number} length
 * @param {Array.<string>} alphabets Disjoint sets of letters. Every symbol must
 *     appear at most once and at most in one alphabet.
 *
 * This function will convert a raw string to a string of given length, which
 * uses at least one symbol from each of the sets. All output strings have
 * roughly the same probability provided the input strings are also distributed
 * uniformly and are long enough.
 */
function rstrToMultiStr(data, length, sets) {
  return multiStrings.encode(data, length, sets);
}
