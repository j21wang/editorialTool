var messageGenerator = {
    displaySchema: function() {
        debugger;
        var schemaRow = $("#schema");
        var back = chrome.extension.getBackgroundPage();
        var labels = back.getSchemaLabels();
        for (idx in labels) {
            var lab = labels[idx];
            var newColumn = $("<td>");
            newColumn.attr('schemaId', lab.id);
            schemaRow.append(newColumn);
            newColumn.append(lab.name);
            newColumn.on('click', messageGenerator.addColumnWidgetOnClick)
        }
    },
    addColumnWidget: function(target) {
        if (target.attr('id') == 'add') {
            var newColumn = $("<td>");
            target.before(newColumn);
            target = newColumn;
        }
        var newTextBox = $("<input id='schemaLabelInput'>");
        var schemaId = target.attr('schemaId');
        if (!(schemaId === undefined)) newTextBox.attr('schemaId', schemaId);
        newTextBox.val(target.text());
        newTextBox.attr('original', target.text());
        target.text('');
        target.append(newTextBox);
        newTextBox.on('change', messageGenerator.removeColumnWdiget);
        newTextBox.on('keypress', messageGenerator.removeColumnWidget);
        newTextBox.focus();
    },
    conditionallyAddColumnWidgetOnType: function(evt) {
        if ($("#schemaLabelInput").length) return;
        messageGenerator.addColumnWidget($("#add"));
    },
    addColumnWidgetOnClick: function(evt) {
        if ($("#schemaLabelInput").length) return;
        messageGenerator.addColumnWidget($(evt.target));
    },
    removeColumnWidget: function(evt) {
        evt.cancelBubble = true;
        if (evt.type == 'keypress' && evt.keyCode != 13) return;
        var target = $(evt.target);
        var parent = target.parent();
        var schemaId = target.attr('schemaId');

        if (schemaId === undefined) {
            var id = messageGenerator.addSchemaName(target.val());
            if (id === null) {
                parent.remove();
                return;
            }
            parent.attr('schemaId', id);
        }
        else if (!messageGenerator.updateSchemaName(schemaId, target.val()))
            target.val(target.attr("original"));

        parent.on('click', messageGenerator.addColumnWidgetOnClick);
        parent.append(target.val());
        target.remove();
    },
    addSchemaName: function(name) {
        return chrome.extension.getBackgroundPage().addColumn(name);
    },
    updateSchemaName: function(schemaId, name) {
        return chrome.extension.getBackgroundPage().renameColumn(schemaId, name);
    },
    displayAddColumnWidget: function() {
        var schemaRow = $("#schema");
        var newColumn = $("<td id='add'>");
        newColumn.append("+");
        schemaRow.append(newColumn);
        newColumn.on('click', messageGenerator.addColumnWidgetOnClick);
        $("body").on('keydown', messageGenerator.conditionallyAddColumnWidgetOnType);
    }
};

$(document).ready(function () {
                            messageGenerator.displaySchema();
                            messageGenerator.displayAddColumnWidget();
                          }
                  );
