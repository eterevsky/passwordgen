// Copyright (c) 2013 Oleg Eterevsky. Licensed under the MIT license.

var BigUInt = require('./biguint').BigUInt;
var MStrings = require('./mstrings').MStrings;

exports.testCount1 = function(test) {
  var mstrings = new MStrings();

  test.strictEqual(mstrings.count(0, [1]).toNumber(), 0);
  test.strictEqual(mstrings.count(1, [1]).toNumber(), 1);
  test.strictEqual(mstrings.count(10, [1]).toNumber(), 1);

  test.strictEqual(mstrings.count(0, [2]).toNumber(), 0);
  test.strictEqual(mstrings.count(1, [2]).toNumber(), 2);
  test.strictEqual(mstrings.count(10, [2]).toNumber(), 1024);

  test.strictEqual(mstrings.count(0, [10]).toNumber(), 0);
  test.strictEqual(mstrings.count(1, [10]).toNumber(), 10);
  var ten10 = BigUInt.mul(BigUInt.fromInt(100000), BigUInt.fromInt(100000));
  test.ok(BigUInt.eq(mstrings.count(10, [10]), ten10));

  test.done();
};

exports.testCount2 = function(test) {
  var mstrings = new MStrings();

  test.ok(BigUInt.eq(mstrings.count(0, [1, 1]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(0, [1, 2]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(0, [2, 1]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(0, [2, 5]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(0, [256, 5]), BigUInt.ZERO));

  test.ok(BigUInt.eq(mstrings.count(1, [1, 1]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(1, [1, 2]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(1, [2, 1]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(1, [2, 5]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(1, [256, 5]), BigUInt.ZERO));

  test.ok(BigUInt.eq(mstrings.count(2, [1, 1]), BigUInt.fromInt(2)));
  test.ok(BigUInt.eq(mstrings.count(2, [1, 2]), BigUInt.fromInt(4)));
  test.ok(BigUInt.eq(mstrings.count(2, [2, 1]), BigUInt.fromInt(4)));
  test.ok(BigUInt.eq(mstrings.count(2, [2, 5]), BigUInt.fromInt(20)));
  test.ok(BigUInt.eq(mstrings.count(2, [256, 5]), BigUInt.fromInt(2560)));

  test.ok(BigUInt.eq(mstrings.count(3, [1, 1]), BigUInt.fromInt(6)));
  test.ok(BigUInt.eq(mstrings.count(3, [1, 2]), BigUInt.fromInt(18)));
  test.ok(BigUInt.eq(mstrings.count(3, [2, 1]), BigUInt.fromInt(18)));
  test.ok(BigUInt.eq(mstrings.count(3, [2, 5]), BigUInt.fromInt(210)));
  test.ok(BigUInt.eq(mstrings.count(3, [256, 5]), dummyCalc(3, [256, 5])));

  test.done();
};

function dummyCalc(length, sets) {
  var count = 0;
  var i;

  var s = [];
  for (i = 0; i < length; i++) {
    s.push(0);
  }

  while (true) {
    var notFound = false;
    for (i = 0; i < sets.length; i++)
      if (s.indexOf(i) === -1) {
        notFound = true;
        break;
      }

    if (!notFound) {
      var subcount = 1;
      for (i = 0; i < length; i++)
        subcount *= sets[s[i]];
      count += subcount;
    }

    i = 0;
    while (i < length && s[i] === sets.length - 1) {
      s[i] = 0;
      i++;
    }

    if (i >= length)
      break;

    s[i]++;
  }

  return BigUInt.fromInt(count);
};

exports.testCount3 = function(test) {
  var mstrings = new MStrings();

  test.ok(BigUInt.eq(mstrings.count(0, [1, 1, 1]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(0, [1, 2, 1]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(0, [2, 1, 1]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(0, [1, 3, 1]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(0, [1, 1, 3]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(0, [1, 2, 2]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(0, [3, 2, 2]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(0, [1, 5, 2]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(0, [3, 3, 3]), BigUInt.ZERO));

  test.ok(BigUInt.eq(mstrings.count(1, [1, 1, 1]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(1, [1, 2, 1]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(1, [2, 1, 1]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(1, [1, 3, 1]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(1, [1, 1, 3]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(1, [1, 2, 2]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(1, [3, 2, 2]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(1, [1, 5, 2]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(1, [3, 3, 3]), BigUInt.ZERO));

  test.ok(BigUInt.eq(mstrings.count(2, [1, 1, 1]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(2, [1, 2, 1]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(2, [2, 1, 1]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(2, [1, 3, 1]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(2, [1, 1, 3]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(2, [1, 2, 2]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(2, [3, 2, 2]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(2, [1, 5, 2]), BigUInt.ZERO));
  test.ok(BigUInt.eq(mstrings.count(2, [3, 3, 3]), BigUInt.ZERO));

  test.ok(BigUInt.eq(mstrings.count(3, [1, 1, 1]), BigUInt.fromInt(6)));
  test.ok(BigUInt.eq(mstrings.count(3, [1, 2, 1]), BigUInt.fromInt(12)));
  test.ok(BigUInt.eq(mstrings.count(3, [2, 1, 1]), BigUInt.fromInt(12)));
  test.ok(BigUInt.eq(mstrings.count(3, [1, 3, 1]), BigUInt.fromInt(18)));
  test.ok(BigUInt.eq(mstrings.count(3, [1, 1, 3]), BigUInt.fromInt(18)));
  test.ok(BigUInt.eq(mstrings.count(3, [1, 2, 2]), BigUInt.fromInt(24)));
  test.ok(BigUInt.eq(mstrings.count(3, [3, 2, 2]), BigUInt.fromInt(72)));
  test.ok(BigUInt.eq(mstrings.count(3, [1, 5, 2]), BigUInt.fromInt(60)));
  test.ok(BigUInt.eq(mstrings.count(3, [3, 3, 3]), BigUInt.fromInt(162)));

  test.ok(BigUInt.eq(mstrings.count(4, [1, 1, 1]), dummyCalc(4, [1, 1, 1])));
  test.ok(BigUInt.eq(mstrings.count(4, [1, 2, 1]), dummyCalc(4, [1, 1, 2])));
  test.ok(BigUInt.eq(mstrings.count(4, [2, 1, 1]), dummyCalc(4, [1, 1, 2])));
  test.ok(BigUInt.eq(mstrings.count(4, [1, 3, 1]), dummyCalc(4, [1, 1, 3])));
  test.ok(BigUInt.eq(mstrings.count(4, [1, 1, 3]), dummyCalc(4, [1, 1, 3])));
  test.ok(BigUInt.eq(mstrings.count(4, [1, 2, 2]), dummyCalc(4, [1, 2, 2])));
  test.ok(BigUInt.eq(mstrings.count(4, [3, 2, 2]), dummyCalc(4, [2, 2, 3])));
  test.ok(BigUInt.eq(mstrings.count(4, [1, 5, 2]), dummyCalc(4, [1, 2, 5])));
  test.ok(BigUInt.eq(mstrings.count(4, [3, 3, 3]), dummyCalc(4, [3, 3, 3])));

  test.done();
};

exports.testCount4 = function(test) {
  var mstrings = new MStrings();

  test.ok(BigUInt.eq(mstrings.count(6, [1, 2, 3, 4]),
                     dummyCalc(6, [1, 2, 3, 4])));

  test.done();
};

exports.testEncode = function(test) {
  var mstrings = new MStrings();

  var zero = String.fromCharCode(0);
  test.strictEqual(mstrings.encode(zero, 8, ['a']), 'aaaaaaaa');
  test.strictEqual(mstrings.encode(zero, 2, ['a', 'bc']), 'ab');
  test.strictEqual(mstrings.encode(zero, 4, ['a', 'b', 'c']), 'aabc');

  var ff = String.fromCharCode(255);
  test.strictEqual(mstrings.encode(ff, 8, ['a']), 'aaaaaaaa');
  test.strictEqual(mstrings.encode(ff, 2, ['a', 'bc']), 'ca');
  test.strictEqual(mstrings.encode(ff, 4, ['a', 'b', 'c']), 'ccba');

  test.done();
};

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

exports.testEncodeMany = function(test) {
  var mstrings = new MStrings();

  var sets = ['a', 'b', 'c', 'de'];

  for (var i = 0; i < 256; i++) {
    var s = String.fromCharCode(i);
    var res = mstrings.encode(s, 4, sets);
    test.ok(checkAllCharacterTypes(res, sets));
  }

  test.done();
};

exports.testEncodeUniform3 = function(test) {
  var mstrings = new MStrings();
  var sets = ['a', 'b', 'cd'];

  var count = {};

  for (var i = 0; i < 256; i++) {
    var s = String.fromCharCode(i);
    var res = mstrings.encode(s, 3, sets);
    if (res in count) {
      count[res]++;
    } else {
      count[res] = 1;
    }
  }

  var min = count['abc'];
  var max = count['abc'];

  for (var a in count) {
    if (count[a] < min)
      min = count[a];
    if (count[a] > max)
      max = count[a];
  }

  test.ok(max - min <= 2);

  test.done();
};

exports.testEncodeUniform4 = function(test) {
  var mstrings = new MStrings();
  var sets = ['a', 'b', 'c', 'd'];

  var count = {};

  for (var i = 0; i < 256; i++) {
    var s = String.fromCharCode(i);
    var res = mstrings.encode(s, 4, sets);
    if (res in count) {
      count[res]++;
    } else {
      count[res] = 1;
    }
  }

  var min = count['abcd'];
  var max = count['abcd'];

  for (var a in count) {
    if (count[a] < min)
      min = count[a];
    if (count[a] > max)
      max = count[a];
  }

  test.ok(max - min <= 2);

  test.done();
};


exports.testEncodeUniform5 = function(test) {
  var mstrings = new MStrings();
  var sets = ['a', 'b', 'c', 'de', 'fgh'];

  var count = {};

  for (var i = 0; i < 65536; i++) {
    var s = String.fromCharCode(i & 255) + String.fromCharCode(i >>> 8);
    var res = mstrings.encode(s, 5, sets);
    if (res in count) {
      count[res]++;
    } else {
      count[res] = 1;
    }
  }

  var min = count['abcdf'];
  var max = count['abcdf'];

  for (var a in count) {
    if (count[a] < min)
      min = count[a];
    if (count[a] > max)
      max = count[a];
  }

  test.ok(max - min <= 2);

  test.done();
};

