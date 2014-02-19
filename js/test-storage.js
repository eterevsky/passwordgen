// Copyright (c) 2014 Oleg Eterevsky. Licensed under the MIT license.

/**
 * @file Unit tests for storage compatibility layer.
 * WebStorageWrapper is tested on top of a stub for localStorage.
 * ChromeStorageWrapper is not tested. :(
 */

var getStorage = require('./storage').getStorage;
var ObjectStorage = require('./storage').ObjectStorage;
var WebStorageWrapper = require('./storage').WebStorageWrapper;

function nullOrUndef(x) {
  return x === null || x === undefined;
}

function storageTestSync(test, storage) {
  test.ok(storage.isSynchronous);
  storage.set({'a': 'b'});
  test.strictEqual(storage.get('a'), 'b');

  test.ok(nullOrUndef(storage.get('c')));

  storage.set({'123': [1, 2, {'a': [3, 4]}]});
  test.deepEqual(storage.get('123'), [1, 2, {'a': [3, 4]}]);

  storage.set({'a': 239});
  test.strictEqual(storage.get('a'), 239);

  storage.set({'b': 123, 'c': 'abc', 'd': [1, 2, 3]})
  test.strictEqual(storage.get('c'), 'abc');
  test.deepEqual(storage.get('d'), [1, 2, 3]);

  storage.remove('b');
  test.ok(nullOrUndef(storage.get('b')));
  test.strictEqual(storage.get('c'), 'abc');

  storage.remove(['a', 'd']);
  test.ok(nullOrUndef(storage.get('a')));
  test.ok(nullOrUndef(storage.get('d')));
  test.strictEqual(storage.get('c'), 'abc');

  test.done();
};

function storageTestAsync(test, storage) {
  test.expect(11);

  var setCallback1 = function() {
    test.ok(true);
    storage.get('a', getCallback1);
  };

  var getCallback1 = function(items) {
    test.deepEqual(items, {'a': 'b'});
    storage.set({'b': 123, 'c': 'abc', 'd': [1, 2, 3]}, setCallback2);
    storage.set({'abc': 239}, setCallback2);
  };

  var setCallback2called = 0;

  var setCallback2 = function() {
    if (++setCallback2called === 2) {
      test.ok(true);
      storage.get(['a', 'b', 'd', 'abc'], getCallback2a);
      storage.get({'a': 'd', 'b': 321, 'abc': null, 'e': 'f'}, getCallback2b);
    }
  };

  var getCallback2called = 0;

  var getCallback2a = function(items) {
    test.deepEqual(items, {'a': 'b', 'b': 123, 'd': [1, 2, 3], 'abc': 239});
    if (++getCallback2called === 2)
      next1();
  };

  var getCallback2b = function(items) {
    test.deepEqual(items, {'a': 'b', 'b': 123, 'abc': 239, 'e': 'f'});
    if (++getCallback2called === 2)
      next1();
  };

  var next1 = function() {
    test.ok(true);
    storage.remove(['a', 'c', 'd'], removeCallback);
  };

  var removeCallback = function() {
    test.ok(true);
    storage.get(['a', 'c', 'b'], getCallback3a);
    storage.get({'a': 'g', 'c': 321, 'b': null}, getCallback3b);
  }

  var getCallback3called = 0;

  var getCallback3a = function(items) {
    test.ok(nullOrUndef(items['a']));
    test.ok(nullOrUndef(items['c']));
    test.strictEqual(items['b'], 123);

    if (++getCallback3called === 2)
      next2();
  };

  var getCallback3b = function(items) {
    test.deepEqual(items, {'a': 'g', 'c': 321, 'b': 123});
    if (++getCallback3called === 2)
      next2();
  };

  var next2 = function() {
    test.done();
  };

  storage.set({'a': 'b'}, setCallback1);
};

/**
 * We compare a and b with relaxed comparison for null, undefined and non-found
 * members.
 */
function deepeq(a, b) {
  if ((a === null || a === undefined) && (b === null || b === undefined))
    return true;

  if (typeof a !== typeof b)
    return false;

  if (typeof a !== 'object')
    return a === b;

  for (k in a) {
    if (!deepeq(a[k], b[k]))
      return false;
  }

  for (k in b) {
    if (!deepeq(a[k], b[k]))
      return false;
  }

  return true;
}

var storageTestListeners = function(test, storage) {
  test.expect(16);
  var listener1expect = [];
  var listener2expect = [];
  var continuation = null;

  var listener = function(expect, changes) {
    test.ok(expect.length > 0);
    for (var i = 0; i < expect.length; i++) {
      if (deepeq(expect[i], changes))
        break;
    }

    test.ok(i < expect.length);
    if (i >= expect.length) {
      test.done();
    }
    expect.splice(i, 1);

    if (listener1expect.length === 0 && listener2expect.length === 0)
      continuation();
  };

  var continue1 = function() {
    storage.get(['a'], function(items) {});  // Nothing should happen.

    storage.set({'a': 239, 'b': [1, 2, 3]});
    listener1expect.push({'a': {'oldValue': 'b', 'newValue': 239},
                          'b': {'oldValue': null, 'newValue': [1, 2, 3]}});
    listener2expect.push({'a': {'oldValue': 'b', 'newValue': 239},
                          'b': {'oldValue': null, 'newValue': [1, 2, 3]}});

    storage.set({'c': 123});
    listener1expect.push({'c': {'oldValue': null, 'newValue': 123}});
    listener2expect.push({'c': {'oldValue': null, 'newValue': 123}});

    continuation = continue2;
  };

  var continue2 = function() {
    storage.remove(['c']);
    listener1expect.push({'c': {'oldValue': 123, 'newValue': null}});
    listener2expect.push({'c': {'oldValue': 123, 'newValue': null}});

    continuation = continue3;
  };

  var continue3 = function() {
    test.done();
  };

  storage.addListener(listener.bind(null, listener1expect));
  storage.addListener(listener.bind(null, listener2expect));

  storage.set({'a': 'b'});
  listener1expect.push({'a': {'oldValue': null, 'newValue': 'b'}});
  listener2expect.push({'a': {'oldValue': null, 'newValue': 'b'}});
  continuation = continue1;
};


function LocalStorageStub(window) {
  this.values_ = {};
  this.window_ = window;
}

LocalStorageStub.prototype.getItem = function(key) {
  if (key in this.values_) {
    return this.values_[key];
  } else {
    return null;
  }
};

LocalStorageStub.prototype.setItem = function(key, value, opt_dispatch) {
  if (typeof key !== 'string')
    throw 'Wrong key type';

  if (typeof value !== 'string')
    throw 'Wrong value type';

  var event;

  if (opt_dispatch) {
    event = {
      'type': 'storage',
      'key': key,
      'newValue': value,
      'oldValue': this.values_[key],
      'storageArea': this

    };
  }

  this.values_[key] = value;

  if (opt_dispatch)
    this.window_.dispatchEvent(event);
};

LocalStorageStub.prototype.removeItem = function(key, opt_dispatch) {
  if (typeof key !== 'string')
    throw 'Wrong key type';

  var event;

  if (opt_dispatch) {
    event = {
      'type': 'storage',
      'key': key,
      'newValue': null,
      'oldValue': this.values_[key],
      'storageArea': this
    };
  }

  delete this.values_[key];

  if (opt_dispatch)
    this.window_.dispatchEvent(event);
};


function WindowStub() {
  this.listeners_ = [];
}

WindowStub.prototype.addEventListener = function(type, listener) {
  this.listeners_.push(listener);
};

WindowStub.prototype.dispatchEvent = function(event) {
  for (var i = 0; i < this.listeners_.length; i++)
    setTimeout(this.listeners_[i].bind(null, event), 0);
};


exports.testGetStorage = function(test) {
  var storage = getStorage('memory');
  test.ok(storage instanceof ObjectStorage);
  test.done();
};

exports.testObjectStorageSync = function(test) {
  var storage = new ObjectStorage();
  storageTestSync(test, storage);
};

exports.testObjectStorageAsync = function(test) {
  var storage = new ObjectStorage();
  storageTestAsync(test, storage);
};

exports.testObjectStorageListeners = function(test) {
  var storage = new ObjectStorage();
  storageTestListeners(test, storage);
};

exports.testWebStorageSync = function(test) {
  var window = new WindowStub();
  var localStorage = new LocalStorageStub(window);
  var storage = new WebStorageWrapper(localStorage, window);
  storageTestSync(test, storage);
};

exports.testWebStorageAsync = function(test) {
  var window = new WindowStub();
  var localStorage = new LocalStorageStub(window);
  var storage = new WebStorageWrapper(localStorage, window);
  storageTestAsync(test, storage);
};

exports.testWebStorageListeners = function(test) {
  var window = new WindowStub();
  var localStorage = new LocalStorageStub(window);
  var storage = new WebStorageWrapper(localStorage, window);
  storageTestListeners(test, storage);
};

exports.testWebStorageOtherWindow = function(test) {
  var window = new WindowStub();
  var localStorage = new LocalStorageStub(window);
  var storage = new WebStorageWrapper(localStorage, window);

  var expect = [];
  var continuation = null;

  var listener = function(changes) {
    test.ok(expect.length > 0);
    for (var i = 0; i < expect.length; i++) {
      if (deepeq(expect[i], changes))
        break;
    }

    test.ok(i < expect.length);
    if (i >= expect.length)
      test.done();
    expect.splice(i, 1);

    if (expect.length === 0 && continuation)
      continuation();
  };

  var continue1 = function() {
    test.strictEqual(storage.get('a'), 'b');
    localStorage.removeItem('a', true);
    continuation = continue2;
    expect.push({'a': {'oldValue': 'b', 'newValue': null}});
  };

  var continue2 = function() {
    test.done();
  };

  storage.addListener(listener);

  localStorage.setItem('a', '"b"', true);
  localStorage.setItem('b', '123', true);
  expect.push({'a': {'oldValue': null, 'newValue': 'b'}});
  expect.push({'b': {'oldValue': null, 'newValue': 123}});
  continuation = continue1;
};
