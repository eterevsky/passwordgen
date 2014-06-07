// © 2014 Oleg Eterevsky. Licensed under the MIT license.

var popupModule = require('./popup');
var domainFromURL = popupModule.domainFromURL;

exports.testdomainFromURL = function(test) {
  var tld = ['github.io']
  var ctld = ['kawasaki.jp', 'nz', 'uk'];
  var ntld = ['city.kawasaki.jp', 'parliament.uk'];

  test.strictEqual(domainFromURL('http://google.com/path', tld, ctld, ntld),
                   'google.com');
  test.strictEqual(domainFromURL('www.google.com', tld, ctld, ntld),
                   'google.com');
  test.strictEqual(domainFromURL('github.io', tld, ctld, ntld),
                   'github.io');
  test.strictEqual(domainFromURL('project.github.io', tld, ctld, ntld),
                   'project.github.io');
  test.strictEqual(domainFromURL('www.project.github.io', tld, ctld, ntld),
                   'project.github.io');
  test.strictEqual(domainFromURL('site.co.kawasaki.jp', tld, ctld, ntld),
                   'site.co.kawasaki.jp');
  test.strictEqual(domainFromURL('www.site.co.kawasaki.jp', tld, ctld, ntld),
                   'site.co.kawasaki.jp');
  test.strictEqual(domainFromURL('city.kawasaki.jp', tld, ctld, ntld),
                   'city.kawasaki.jp');
  test.strictEqual(domainFromURL('www.city.kawasaki.jp', tld, ctld, ntld),
                   'city.kawasaki.jp');
  test.strictEqual(domainFromURL('parliament.uk', tld, ctld, ntld),
                   'parliament.uk');
  test.strictEqual(domainFromURL('www1.parliament.uk', tld, ctld, ntld),
                   'parliament.uk');

  test.done();
};
