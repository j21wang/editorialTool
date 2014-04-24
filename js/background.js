var worker;
var selectedTable;
function startWorker(){
    worker = new Worker(chrome.extension.getURL("js/updateworker.js"));
}

function postToDB(message){
    console.log(message);
    worker.postMessage(message);
}

startWorker();

chrome.extension.onMessage.addListener(
    function(req, sender, sendResponse) {
        console.log(req);
        console.log(req.message.length);
        if(req.message.length>2){
            var pageUrl = req.message[0];
            var message = req.message[1];
            //var selectedTable = req.message[2];
            selected = selectedTable;
            console.log(selected);
            console.log(pageUrl + " " + message + " " + selectedTable);
            postToDB({url: pageUrl, text1: message, table: selectedTable});
            sendResponse({url: pageUrl, text1: message, table: selectedTable});
        } else {
            console.log(req.message[0]);
            selectedTable = req.message[0];
            isGroupCheck = req.message[1];
            saveChanges();
            console.log(selectedTable);
            chrome.tabs.query({active:true, currentWindow:true},function(tabs){
                console.log(selectedTable);
                console.log(tabs);
                chrome.tabs.sendMessage(tabs[0].id,{selectedTable:selectedTable,isGroupCheck:isGroupCheck},function(response){
                    console.log(response);
                });
            });
        }
    }
);

function saveChanges(){
    localStorage["selectedTable"] = selectedTable;
    console.log(localStorage["selectedTable"]);
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
