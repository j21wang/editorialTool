var worker;
var selectedTable;
var isGroupCheck;
var isLimitCheck;

function startWorker(){
    worker = new Worker(chrome.extension.getURL("js/updateworker.js"));
}

function postToDB(message){
    console.log(message);
    worker.postMessage(message);
}

//startWorker();
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo){
    if(changeInfo.status === 'complete'){
        console.log("complete");
        chrome.browserAction.setIcon({path: '../images/greenchrome.png'});
        startWorker();
    } else {
        console.log("not done yet");
        chrome.browserAction.setIcon({path: '../images/redchrome.png'});
    }
});

chrome.extension.onMessage.addListener(
    function(req, sender, sendResponse) {
        console.log(req);
        console.log(req.message.length);
        if(req.message.length==2){
            var pageUrl = req.message[0];
            var message = req.message[1];
            var messageStr;
            if(message instanceof Array){
                for(var i=0; i<message.length; i++){
                    if(i==0){
                        messageStr = message[i]; 
                    } else {
                        messageStr = messageStr + "#" + message[i];
                    }
                }
            } else {
                messageStr = message;
            }
            /*if(localStorage.selectedTable == null){
                selectedTable = req.message[2];
                console.log(selectedTable);
            } else {
                selectedTable = localStorage.selectedTable;
            }*/
            selectedTable = localStorage.selectedTable;
            selected = selectedTable;
            console.log(selected);
            console.log(messageStr);
            console.log(pageUrl + " " + messageStr + " " + selectedTable);
            postToDB({url: pageUrl, text1: messageStr, table: selectedTable});
            sendResponse({url: pageUrl, text1: messageStr, table: selectedTable});
        } else {
            console.log(req.message[0]);
            selectedTable = req.message[0];
            isGroupCheck = req.message[1];
            isLimitCheck = req.message[2];
            saveChanges();
            console.log(selectedTable);
            chrome.tabs.query({active:true, currentWindow:true},function(tabs){
                console.log(selectedTable);
                console.log(tabs);
                chrome.tabs.sendMessage(tabs[0].id,{selectedTable:selectedTable,isGroupCheck:isGroupCheck,isLimitCheck:isLimitCheck},function(response){
                });
            });
        }
    }
);

function saveChanges(){
    localStorage["selectedTable"] = selectedTable;
    localStorage["isGroupCheck"] = isGroupCheck;
    localStorage["isLimitCheck"] = isLimitCheck;
    console.log(localStorage["selectedTable"]);
    console.log(localStorage["isGroupCheck"]);
    console.log(localStorage["isLimitCheck"]);
}

/*chrome.tabs.query({active:true, currentWindow:true},
    function(tabs){
        console.log(selected);
        chrome.tabs.sendMessage(tabs[0].id,{selectedTable:selected},
    function(response){
        console.log(response);
    });
});*/

/*chrome.tabs.create({
    url: chrome.extension.getURL('../popup.html'),
    active: true
}, function(tab){
    chrome.windows.create({
        tabId: tab.id,
        type: 'popup',
        focused: true
    });
});*/

/*chrome.windows.create({
    type: 'panel',
    url: chrome.extension.getURL('../popup.html'),
    width: 400,
    height: 400
}, function (newWindow){
*/
    /*console.log(newWindow);
    chrome.tabs.executeScript(newWindow.tabs[0].id,{
        code: 'document.write("hello world");'
    });*/
//});

/*chrome.tabs.onUpdated.addListener(function(tabId){
    chrome.pageAction.show(tabId);
});

chrome.tabs.getSelected(null, function(tab){
    chrome.pageAction.show(tab.id);
});

chrome.pageAction.onClicked.addListener(function(tab){
    chrome.tabs.getSelected(null, function(tab){
        chrome.tabs.sendRequest(
            tab.id,
            {callFunction: "toggleSidebar"},
            function(response){
                console.log(response);
            }
        );
    });
});*/
