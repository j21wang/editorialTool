var worker;
var selectedTable;
var isGroupCheck;
var isLimitCheck;

function startWorker(){
  worker = new Worker(chrome.extension.getURL("js/updateworker.js"));
}

function postToDB(message){
  worker.postMessage(message);
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo){
  if(changeInfo.status === 'complete'){
    chrome.browserAction.setIcon({path: '../images/greenchrome.png'});
    startWorker();
  } else {
    chrome.browserAction.setIcon({path: '../images/redchrome.png'});
  }
});

chrome.extension.onMessage.addListener(
  function(req, sender, sendResponse) {
    if(req.message.length==2){
      var pageUrl = req.message[0];
      var message = req.message[1];
      var messageStr;
      if(message instanceof Array){
        for(var i=0; i<message.length; i++){
          if(i==0) messageStr = message[i]; 
          else messageStr = messageStr + "#" + message[i];
        }
      } else {
        messageStr = message;
      }
      selectedTable = localStorage.selectedTable;
      selected = selectedTable;
      postToDB({url: pageUrl, text1: messageStr, table: selectedTable});
      sendResponse({url: pageUrl, text1: messageStr, table: selectedTable});
    } else {
      selectedTable = req.message[0];
      isGroupCheck = req.message[1];
      isLimitCheck = req.message[2];
      saveChanges();
      chrome.tabs.query({active:true, currentWindow:true},function(tabs){
          chrome.tabs.sendMessage(tabs[0].id, {
              selectedTable:selectedTable,
              isGroupCheck:isGroupCheck,isLimitCheck:isLimitCheck
          },function(response){});
      });
    }
  }
);

function saveChanges(){
  localStorage["selectedTable"] = selectedTable;
  localStorage["isGroupCheck"] = isGroupCheck;
  localStorage["isLimitCheck"] = isLimitCheck;
}
