var background = null;

function init() {
  chrome.runtime.getBackgroundPage(function(bg) {background = bg;});
}

window.addEventListener('load', init);
