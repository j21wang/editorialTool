var worker;
var selectedTable;
var isGroupCheck;
var isLimitCheck;
var toolOn;

function startWorker(){
  worker = new Worker(chrome.extension.getURL('js/updateworker.js'));
}

function postToDB(message){
  worker.postMessage(message);
}

/**
 * Detects if the web page has finished loading. If the extension
 * icon is red, then the page is still loading, and sometimes a refresh
 * is needed. If the icon is green, then the user can start making lists.
 */
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo){
  if(changeInfo.status === 'complete'){
    chrome.browserAction.setIcon({path: '../images/greenchrome.png'});
    startWorker();
  } else {
    chrome.browserAction.setIcon({path: '../images/redchrome.png'});
  }
});

chrome.extension.onMessage.addListener(
  function (req, sender, sendResponse) {
    if (req.method == 'getStatus') {
      // Gets the values stored in localStorage saved by the user
      // in the previous session.
      sendResponse({status: localStorage});
    } else if (req.method == 'updateDB') {
      // Updates the database with the new entries highlighted, whether
      // it's one entry or multiple entries.
      var pageUrl = req.message[0];
      var message = req.message[1];
      var messageStr;
      if (message instanceof Array) messageStr = stringifyArray(message); 
      else messageStr = message;
      selectedTable = localStorage.selectedTable;
      postToDB({url: pageUrl, text: messageStr, table: selectedTable});
    } else if (req.method == 'saveState') {
      // Saves the state of the popup window when it's collapsed so that
      // when the user opens the popup window later, the previous state
      // is restored.
      selectedTable = req.message[0];
      isGroupCheck = req.message[1];
      isLimitCheck = req.message[2];
      toolOn = req.message[3];
      saveChanges();
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {
            selectedTable:selectedTable,
            isGroupCheck:isGroupCheck,
            isLimitCheck:isLimitCheck,
            toolOn:toolOn
          });
      });
    }
  }
);

function stringifyArray(array) {
  // TODO: Array object needs to be passed to the backend so that
  // we don't need to use '#' to split up all the array entries.
  // By doing this, we're also hoping that one of the items that we
  // highlight don't contain a hash in it.
  var arrayStr;
  for (var i = 0; i < array.length; i++){
    if (i == 0) arrayStr = array[i]; 
    else arrayStr = arrayStr + "#" + array[i];
  }
  return arrayStr;
}

function saveChanges(){
  localStorage["selectedTable"] = selectedTable;
  localStorage["isGroupCheck"] = isGroupCheck;
  localStorage["isLimitCheck"] = isLimitCheck;
  localStorage["toolOn"] = toolOn;
}
