function addColumn(name) {
    return bar.addColumn(name);
}
function renameColumn(schemaId, name) {
    return bar.renameColumn(schemaId, name);
}
function toId(name) {
    return bar.toId(name);
}
function toName(id) {
    return bar.toName(id);
}
function addRow(rowObj) {
    bar.addRow(rowObj);
}
function getSchemaLabels() {
    return bar.getSchemaLabels();
}
function getAllData() {
    return bar.getAllData();
}
function getUniqueRowId() {
    return bar.getUniqueRowId();
}
function getColumnValue(name) {
    return bar.getColumnValue(name);
}
function setColumnValueById(rowId, url, fieldId, value) {
    return bar.setColumnValueById(rowId, url, fieldId, value);
}

var bar = {
    schemaIdGen: 0,
    schemaIds: [],
    schemaLabels: [],
    dataRows: [],
    currentRow: [],
    updateWorker: null,
    startWorker: function() {
        this.updateWorker = new Worker(chrome.extension.getURL("js/updateworker.js"));
        this.updateWorker.onmessage = function(evt) {
            var rowId = evt.data['id'];
            var row = bar.findRow(rowId);
            if (!(row === null)) {
                row.syncState = evt.data['status'];
                chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {row: row});
                });
            }
        }
    },
    addColumn: function(name) {
        name = name.trim();
        if (name.length == 0) return null;
        var myId = this.schemaIdGen++ + "";
        this.schemaIds.push(myId);
        this.schemaLabels.push(name);
        return myId;
    },
    toId: function(name) {
        var idx = this.schemaLabels.indexOf(name);
        if (idx > -1) return this.schemaIds[idx];
        return null;
    },
    toName: function(id) {
        var idx = this.schemaIds.indexOf(id);
        if (idx > -1) return this.schemaLabels[idx];
        return null;
    },
    getSchemaLabels: function() {
        var ret = [];
        for (var i = 0; i < this.schemaIds.length; i++) {
            ret[i] = {
                name: this.schemaLabels[i],
                id: this.schemaIds[i]
            };
        }
        return ret;
    },
    renameColumn: function(id, name) {
        name = name.trim();
        if (name.length == 0) return false;
        var idx = this.schemaIds.indexOf(id);
        if (idx > -1) this.schemaLabels[idx] = name;
        return true;
    },
    deleteColumn: function(id) {
        var idx = this.schemaIds.indexOf(id);
        if (idx > -1) {
            this.schemaIds.splice(idx, 1);
            this.schemaLabels.splice(idx, 1);
        }
    },
    addRow: function(rowObj) {
        this.dataRows.push(rowObj);
    },
    getAllData: function() {
        return this.dataRows;
    },
    setColumnValueById: function(rowId, url, fieldId, value) {
        var row;
        if (rowId === null) {
            rowId = uuid.v4();
            row = {
               id: rowId,
               url: url,
               syncState: "dirty",
               data: []
            };
            this.dataRows.push(row);
        }
        else {
            row = this.findRow(rowId);
        }
        if (!(row === null)) {
            row.data[fieldId] = value;
            row.syncState = "dirty";
            this.sendDirtyRows();
        }
        return row;
    },
    setColumnValueByName: function(rowId, name, value) {
        var fieldId = this.toId(name);
        return this.setColumnValueById(rowId, fieldId, value);
    },
    getUniqueRowId: function() {
        return uuid.v4();
    },
    findRow: function(rowId) {
        for (idx in this.dataRows) {
            var row = this.dataRows[idx];
            if (row.id == rowId) return row;
        }
        return null;
    },
    sendDirtyRows: function() {
        for (idx in this.dataRows) {
            var row = this.dataRows[idx];
            if (row.syncState == "dirty") {
                this.updateWorker.postMessage({schema: getSchemaLabels(), row: row});
            }
        }
    }
};

chrome.extension.onMessage.addListener(
    function(req, sender, sendResponse) {
        if (req.addColumnToRow) {
            addColumn(req.addColumnToRow[1]);
        }
        else if (req.getAllData) {
            sendResponse({schema: getSchemaLabels(), data: getAllData()});
        }
        else if (req.getSchemaLabels) {
            sendResponse({labels: getSchemaLabels()});
        }
        else if (req.setColumnValueById) {
            sendResponse({value: setColumnValueById(req.setColumnValueById[0], req.setColumnValueById[1], req.setColumnValueById[2], req.setColumnValueById[3])});
        }
    }
);

bar.startWorker();

chrome.browserAction.onClicked.addListener(
    function(tab) {
        // send message to content script to toggle grid raise.
        chrome.tabs.sendMessage(tab.id, {toggle: true});
    }
);

// Temporary for initial implementation
bar.addColumn("list");
//bar.addColumn("what");
//bar.addColumn("where");
//bar.addColumn("when");
