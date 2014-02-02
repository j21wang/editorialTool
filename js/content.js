$(document).mouseup(function(){
    highlight();
});

/*$.event.special.tripleclick = {
    setup: function(data, namespaces){
        var elem = this, $elem = jQuery(elem);
        $elem.bind('click', jQuery.event.special.tripleclick.handler);
    },

    teardown: function(namespaces){
        var elem = this, $elem = jQuery(elem);
        $elem.unbind('click', jQuery.event.special.tripleclick.handler)
    },

    handler: function(event){
        var elem = this, $elem = jQuery(elem), clicks = $elem.data('clicks') || 0;
        clicks += 1;
        if(clicks === 3){
            clicks = 0;
            event.type = "tripleclick";
            jQuery.event.handle.apply(this,arguments);
        }
        $elem.data('clicks',clicks);
    }
}*/

function getSelectedText(){
    var text = "";
    if(typeof window.getSelection != "undefined"){
        text = window.getSelection().toString();
    } else if(typeof document.selection != "undefined" && document.selection.type == "Text"){
        text = document.selection.createRange().text;
    }
    return text;
}

function highlight(){
    var selectedText = getSelectedText();
    if(selectedText){
        Tipped.create(this,'text');
        alert(selectedText);            
    }
}

chrome.runtime.onMessage.addListener(
    function(message, sender, sendResponse) {
        alert("helllo");
        if (message.toggle) {
            /*if (up) {
                lowerGrid();
            }
            else {
                raiseGrid();
            }
            up = !up;
            */
            alert("1");
        }
        else if (message.row) {
            alert("2");
            //setRowSyncStatus(message.row.id, message.row.syncState);
        }
    }
);

/*var doc = $('body');
var lightboxBack = $("<div class='lightboxBack'>");
doc.prepend(lightboxBack);
var lightboxTop = $("<div class='lightboxTop'>");
doc.append(lightboxTop);
var lightboxTable = $("<div class='lightboxTable'>");
lightboxTop.append(lightboxTable);
var lightboxRow = $("<div class='lightboxRow'>");
lightboxTable.append(lightboxRow);
var lightboxCell = $("<div class='lightboxCell'>");
lightboxRow.append(lightboxCell);
var lightboxPanel = $("<div class='lightboxPanel'>");
lightboxCell.append(lightboxPanel);

function updateGrid(raiseWhenDone) {
    var raise = raiseWhenDone;
    chrome.extension.sendMessage({getAllData: []},
        function(res) {
            lightboxPanel.empty();
            var grid = $("<div class='dropTable'>");
            lightboxPanel.append(grid);
                                 
            // Header labels
            var labelGroup = $("<div class='headerGroup'>");
            grid.append(labelGroup);
            var labelRow = $("<div class='headerRow'>");
            labelGroup.append(labelRow);
            for (lab in res.schema) {
                var cell = $("<div class='headerCell'>");
                labelRow.append(cell);
                cell.append(res.schema[lab].name);
            }
                                 
            // Old data rows
            var recordGroup = $("<div class='recordGroup'>");
            grid.append(recordGroup);
            for (rIdx in res.data) {
                var row = res.data[rIdx];
                var dataRow = $("<div class='recordRow'>");
                dataRow.attr('id', row.id)
                recordGroup.append(dataRow);
                for (sIdx in res.schema) {
                    var cId = res.schema[sIdx].id;
                    var cell = $("<div class='recordCell'>");
                    cell.attr('id', cId);
                    dataRow.append(cell);
                    var div = $("<div class='content1'>");
                    cell.append(div);
                    if (row.syncState == "dirty") div.addClass('dirty');
                    else div.addClass('clean');
                    if (!(row.data[cId] === null)) {
                        div.text(row.data[cId]);
                    }
                    div.on("dragenter", function(evt) { this.classList.add('over'); });
                    div.on("mouseenter", function(evt) { this.classList.add('over'); });
                    div.on("dragover", function(evt) { evt.preventDefault(); });
                    div.on("dragleave", function(evt) { this.classList.remove('over'); });
                    div.on("mouseleave", function(evt) { this.classList.remove('over'); });
                    div.on("click", function(evt) { this.contentEditable = 'true'; });
                    div.on("blur", blur);
                    div.on("drop", drop);
                }
            }
                                 
            // New data row
            var addGroup = $("<div class='addGroup'>");
            grid.append(addGroup);
            var dataRow = $("<div class='recordRow'>");
            addGroup.append(dataRow);
            for (lab in res.schema) {
                var cell = $("<div class='recordCell'>");
                cell.attr('id', res.schema[lab].id);
                dataRow.append(cell);
                var div = $("<div class='content1'>");
                cell.append(div);
                div.addClass('neutral');
                div.on("dragenter", function(evt) { this.classList.add('over'); });
                div.on("mouseenter", function(evt) { this.classList.add('over'); });
                div.on("dragover", function(evt) { evt.preventDefault(); });
                div.on("dragleave", function(evt) { this.classList.remove('over'); });
                div.on("mouseleave", function(evt) { this.classList.remove('over'); });
                div.on("click", function(evt) { this.contentEditable = 'true'; });
                div.on("blur", blur);
                div.on("drop", drop);
            }
            if (raise) {
                lightboxBack.fadeIn(300);
                lightboxTop.fadeIn(300);
            }
        }
    );
}

var up = false;

function raiseGrid() {
    updateGrid(true);
}

function lowerGrid() {
    var focused = $(':focus');
    if (focused.length) {
        focused.blur();
    }
    lightboxBack.fadeOut(300);
    lightboxTop.fadeOut(300);
}

function updateField(rowId, pageUrl, fieldId, value) {
    chrome.extension.sendMessage({setColumnValueById: [rowId, pageUrl, fieldId, value]});
}

function blur(evt) {
    this.contentEditable = 'false';
    var val = this.innerText;
    if (val.trim() == "") return;
    var rowId = $(this).parent().parent().attr('id');
    var url = $(location).attr('href');
    var fieldId = $(this).parent().attr('id');
    updateField(rowId, url, fieldId, val);
    if (rowId === undefined) {
        updateGrid();
    }
    else {
        setRowSyncStatus(rowId, "dirty");
    }
}

function drop(evt) {
    var val = window.getSelection().toString();
    this.innerText = val;
    var rowId = $(this).parent().parent().attr('id');
    var url = $(location).attr('href');
    var fieldId = $(this).parent().attr('id');
    updateField(rowId, url, fieldId, val);
}

function setRowSyncStatus(rowId, syncStatus) {
    var cells = $("#" + rowId + " div.content1");
    var other;
    if (syncStatus == "dirty") {
        other = "clean";
    }
    else {
        other = "dirty";
    }
    cells.removeClass(other).addClass(syncStatus);
}

var up = false;

$(document).on("dragstart", function(evt) {
    raiseGrid();
});

$(document).on("dragend", function() {
    lowerGrid();
});

chrome.runtime.onMessage.addListener(
    function(message, sender, sendResponse) {
        if (message.toggle) {
            if (up) {
                lowerGrid();
            }
            else {
                raiseGrid();
            }
            up = !up;
        }
        else if (message.row) {
            setRowSyncStatus(message.row.id, message.row.syncState);
        }
    }
);*/
