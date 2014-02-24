var CONF = 'web';

function initConf() {
  if (typeof chrome !== 'undefined' && chrome) {
    if (chrome.extension) {
      CONF = 'extension';
    } else if (chrome.app && chrome.app.window) {
      CONF = 'app';
    }
  }

  var body = document.getElementsByTagName('body')[0];
  body.classList.remove('web');
  body.classList.add(CONF);
  return CONF;
}

function adjustWindowSize(width) {
  if (CONF !== 'app')
    return;
  var height = document.getElementById('content').clientHeight + 70;
  var win = chrome.app.window.current();
  win.resizeTo(width, height);
}

