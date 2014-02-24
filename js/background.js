function init(launchData) {
  var options = {
    frame: 'chrome',
    width: 260,
    height: 300
  };

  chrome.app.window.create('generate.html', options);
}
chrome.app.runtime.onLaunched.addListener(init);
