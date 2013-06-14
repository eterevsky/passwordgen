// Copyright (c) 2013 Oleg Eterevsky. Licensed under the MIT license.

/**
 * @constructor
 * @param {Array.<number>} digits Prepared digits array.
 * Long unsigned integers represented for simplicity as byte arrays. 0 byte is
 * the least significant.
 * 
 * This constructor should be called mainly from other static functions. Outside
 * code should use fromInt(), fromRawStr and other functions to create BigUInt
 * instance.
 */
function BigUInt(digits) {
  this.digits_ = digits;
}

BigUInt.ZERO = new BigUInt([]);

/**
 * @return {boolean}
 */
BigUInt.prototype.iszero = function() {
  for (var i = 0; i < this.digits_.length; i++) {
    if (this.digits_[i] !== 0)
      return false;
  }

  return true;
};

/**
 * @param {number} n
 * @return {BigUInt}
 * The result is unpredictable in case n is not a non-negative integer.
 */
BigUInt.fromInt = function(n) {
  var digits = [];
  while (n > 0) {
    digits.push(n & 255);
    n = n >>> 8;
  }
  return new BigUInt(digits);
};

/**
 * @param {string} rstr Raw string (every symbol a base 256 digit, with most
 *     significant first.
 * @return {BigUInt}
 */
BigUInt.fromRawStr = function(rstr) {
  var digits = [];
  for (var i = rstr.length - 1; i >= 0; i--) {
    digits.push(rstr.charCodeAt(i));
  }
  return new BigUInt(digits);
}

/**
 * @param {BigUInt} a
 * @param {number} n Number of bits.
 * @return {BigUInt}
 */
BigUInt.shr = function(a, n) {
  if (n % 8)
    throw "Doesn't work for n not divisible by 8."
  
  var digits = a.digits_.slice(n / 8, a.digits_.length);
  return new BigUInt(digits);
};

/**
 * @param {BigUInt} a
 * @param {BigUInt} b
 * @return {BigUInt}
 */
BigUInt.add = function(a, b) {
  var digits = [];
  var c = 0;
  for (var i = 0; i < Math.max(a.digits_.length, b.digits_.length); i++) {
    var d = c + (a.digits_[i] || 0) + (b.digits_[i] || 0);
    if (d >= 256) {
      digits.push(d - 256);
      c = 1;
    } else {
      digits.push(d);
      c = 0;
    }
  }

  if (c > 0)
   digits.push(c);

  return new BigUInt(digits);
}

/**
 * @param {BigUInt} a
 * @param {BigUInt} b
 * @return {BigUInt}
 */
BigUInt.sub = function(a, b) {
  var i;
  for (i = a.digits_.length; i < b.digits_.length; i++) {
    if (b.digits_[i] > 0) {
      throw "Result of subtraction is negative.";
    }
  }

  var res = [];
  var c = 0;
  for (i = 0; i < a.digits_.length; i++) {
    var digit = a.digits_[i] - c - (b.digits_[i] || 0);
    if (digit < 0) {
      c = 1;
      res.push(digit + 256);
    } else {
      c = 0;
      res.push(digit);
    }
  }

  if (c > 0)
    throw "Result of subtraction is negative.";

  return new BigUInt(res);
};

/**
 * @param {BigUInt} a
 * @param {BigUInt} b
 * @return {BigUInt}
 */
BigUInt.mul = function(a, b) {
  var res = [];
  var c = 0;
  for (var i = 0;
       i < a.digits_.length + b.digits_.length - 1 || c > 0;
       i++) {
    for (var j = Math.max(0, i - b.digits_.length + 1);
         j < Math.min(a.digits_.length, i + 1);
         j++) {
      c += a.digits_[j] * b.digits_[i - j];
    }

    res.push(c & 255);
    c = c >>> 8;
  }

  return new BigUInt(res);
};

/**
 * @param {BigUInt} a
 * @param {BigUInt} b
 * @return {boolean}
 */
BigUInt.eq = function(a, b) {
  for (var i = 0; i < Math.max(a.digits_.length, b.digits_.length); i++) {
    if ((a.digits_[i] || 0) !== (b.digits_[i] || 0))
      return false;
  }
  return true;
};

/**
 * @param {BigUInt} a
 * @param {BigUInt} b
 * @return {boolean}
 */
BigUInt.gt = function(a, b) {
  for (var i = Math.max(a.digits_.length, b.digits_.length) - 1; i >= 0; i--) {
    var adigit = (a.digits_[i] || 0);
    var bdigit = (b.digits_[i] || 0);
    if (adigit > bdigit)
      return true;
    if (adigit < bdigit)
      return false;
  }
};

exports.BigUInt = BigUInt;