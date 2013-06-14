// Copyright (c) 2013 Oleg Eterevsky. Licensed under the MIT license.

var BigUInt = require('./biguint').BigUInt;

exports.testFromRawStr = function(test) {
  var s = String.fromCharCode(0);
  test.ok(BigUInt.eq(BigUInt.fromRawStr(s), BigUInt.ZERO),
          '"\\0" == 0');

  s = String.fromCharCode(255);
  test.ok(BigUInt.eq(BigUInt.fromRawStr(s), BigUInt.fromInt(255)),
          '"\\0xFF" == 255');

  s = 'abc';
  var n = 0;
  for (var i = 0; i < s.length; i++) {
    n *= 256;
    n += s.charCodeAt(i);
  }

  test.ok(BigUInt.eq(BigUInt.fromRawStr(s), BigUInt.fromInt(n)),
          '"abc" == ...');

  test.done();
};

exports.testShr = function(test) {
  var a = BigUInt.fromInt(239);
  test.ok(BigUInt.eq(BigUInt.shr(a, 0), a), '239 >> 0 == 239');

  test.ok(BigUInt.shr(a, 8).iszero(), '239 >> 8 == 0');

  test.ok(BigUInt.shr(a, 200).iszero(), '239 >> 200 == 0');

  var b = BigUInt.fromRawStr('abcdef');
  test.ok(BigUInt.eq(BigUInt.shr(b, 16), BigUInt.fromRawStr('abcd')),
          '"abcdef" >> 16 == "abcd"');

  test.done();
};

exports.testAdd = function(test) {
  test.ok(BigUInt.add(BigUInt.ZERO, BigUInt.ZERO).iszero());

  var b = BigUInt.fromRawStr('abcdefghijk');

  test.ok(BigUInt.eq(BigUInt.add(BigUInt.ZERO, b), b));

  var a = BigUInt.add(BigUInt.fromInt(123456789), BigUInt.fromInt(987654321));
  test.ok(BigUInt.eq(a, BigUInt.fromInt(1111111110)),
          '123456789 + 987654321 = 1111111110');

  test.done();
};

exports.testSub = function(test) {
  test.ok(BigUInt.sub(BigUInt.ZERO, BigUInt.ZERO).iszero());

  var five = BigUInt.fromInt(5);
  test.ok(BigUInt.eq(BigUInt.sub(five, BigUInt.ZERO), five));

  test.throws(function() {BigUInt.sub(BigUInt.ZERO, five)});

  var abcdef = BigUInt.fromRawStr('abcdef');
  var abcdea = BigUInt.fromRawStr('abcdea');

  test.ok(BigUInt.eq(BigUInt.sub(abcdef, abcdea), five));
  test.ok(BigUInt.eq(BigUInt.sub(abcdef, five), abcdea));

  test.ok(BigUInt.eq(
      BigUInt.sub(BigUInt.fromInt(1857823454), BigUInt.fromInt(1734509734)),
      BigUInt.fromInt(123313720)));

  test.done();
};

exports.testMul = function(test) {
  test.ok(BigUInt.mul(BigUInt.ZERO, BigUInt.ZERO).iszero());

  var five = BigUInt.fromInt(5);

  test.ok(BigUInt.mul(BigUInt.ZERO, five).iszero());
  test.ok(BigUInt.mul(five, BigUInt.ZERO).iszero());

  test.ok(BigUInt.eq(BigUInt.mul(five, five), BigUInt.fromInt(25)));

  var n12345 = BigUInt.fromInt(12345);
  test.ok(BigUInt.mul(n12345, BigUInt.ZERO).iszero);

  var n12345_2 = BigUInt.mul(n12345, n12345)
  test.ok(BigUInt.eq(n12345_2, BigUInt.fromInt(152399025)));

  var n12345_3 = BigUInt.mul(n12345_2, n12345);
  test.ok(BigUInt.eq(n12345_3, BigUInt.mul(n12345, n12345_2)));

  var n12345_4 = BigUInt.mul(n12345_2, n12345_2);
  test.ok(BigUInt.eq(n12345_4, BigUInt.mul(n12345, n12345_3)));

  test.ok(BigUInt.eq(BigUInt.mul(n12345_3, n12345_3),
                     BigUInt.mul(n12345_4, n12345_2)));

  test.done();
};

exports.testEq = function(test) {
  test.expect(5);

  test.ok(BigUInt.eq(BigUInt.ZERO, BigUInt.ZERO),
          '0 == 0');
  test.ok(!BigUInt.eq(BigUInt.ZERO, BigUInt.fromInt(1)),
          '0 != 1');
  test.ok(!BigUInt.eq(BigUInt.fromInt(1), BigUInt.ZERO),
          '1 != 0');

  test.ok(BigUInt.eq(BigUInt.fromInt(123456789), BigUInt.fromInt(123456789)),
          '123456789 == 123456789');
  test.ok(!BigUInt.eq(BigUInt.fromInt(123456789), BigUInt.fromInt(123456788)),
          '123456789 != 123456788');

  test.done();
};

exports.testGt = function(test) {
  test.ok(!BigUInt.gt(BigUInt.ZERO, BigUInt.ZERO));

  var five = BigUInt.fromInt(5);
  test.ok(!BigUInt.gt(five, five));
  test.ok(BigUInt.gt(five, BigUInt.ZERO));
  test.ok(!BigUInt.gt(BigUInt.ZERO, five));

  var abc = BigUInt.fromRawStr('abcdefgh');

  test.ok(!BigUInt.gt(abc, abc));
  test.ok(BigUInt.gt(abc, BigUInt.ZERO));
  test.ok(!BigUInt.gt(BigUInt.ZERO, abc));
  test.ok(BigUInt.gt(abc, five));
  test.ok(!BigUInt.gt(five, abc));

  var abd = BigUInt.fromRawStr('abcdefgk');

  test.ok(BigUInt.gt(abd, abc));
  test.ok(!BigUInt.gt(abc, abd));

  test.done();
};