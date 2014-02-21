function init(launchData) {
  var options = {
    frame: 'chrome',
    width: 600,
    height: 600
  };

  chrome.app.window.create('generate.html', options);
}
chrome.app.runtime.onLaunched.addListener(init);
