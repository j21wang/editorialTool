var isGroupMode = true;
var oTable;
$(document).ready(function(){

    select.loadTables();
    console.log(localStorage);
    var selectedTable;
    console.log($(".checked").length);
    if($(".checked").length == 0 || localStorage === undefined || localStorage.length == 0){
        selectedTable = $($(".iradio_flat-blue")[0]).next()[0].innerText;
        $($(".iradio_flat-blue")[0]).addClass("checked");
        console.log(selectedTable);
    } else {
        selectedTable = localStorage.selectedTable;
        console.log(selectedTable);
    }
    table.switchTables(selectedTable);
    console.log(selectedTable);
    oTable = table.initializeTable();
    table.getTableData(selectedTable);

    $("#groupCheck").click(function(){
        isGroupMode = $(this).is(":checked"); 
        table.switchTables(selectedTable);
    });

    $("ins.iCheck-helper").click(function(){
        console.log(localStorage);
        selectedTable = table.getSelectedTable();
        console.log(selectedTable);
        table.switchTables(selectedTable);
        table.getTableData(selectedTable);
    });

    $("#deleteTable").click(function(){
        selectedTable = table.getSelectedTable(); 
        console.log(selectedTable);
        table.deleteTable(selectedTable);
        window.location.reload();
    });

    /*$("#createTable").avgrund({
        width: 300,
        height: 80,
        onLoad: function(elem){
            $("#submitName").click(function(){
                console.log("lol");
                table.createTable($("#tableName").val());
                window.location.reload();
            });
        },
        onUnload: function(elem){
            $("#submitName").click(function(){
                console.log("lol");
                table.createTable($("#tableName").val());
                window.location.reload();
            });
        },
        template: '<center>' + 
                  '<div>What would you like to name your table?</div>' + 
                  '<br>' +
                  '<input type="text" id="tableName">' +
                  '<button id="submitName">Submit</button' +
                  '</center>'
    });*/
    $("#createTable").click(function(){
        $("#tableName").removeAttr("disabled");
        $("#submitName").removeAttr("disabled");
        $("#submitName").click(function(){
            table.createTable($("#tableName").val());
            window.location.reload();
        });
    });

    $("#list tbody tr").click(function(event){
        /*$(oTable.fnSettings().aoData).each(function(){
            $(this.nTr).removeClass('row_selected');
        });
        $(event.target.parentNode).addClass('row_selected');
        */
        if($(this).hasClass('row_selected')){
            $(this).removeClass('row_selected')
        } else {
            console.log($(".row_selected"));
            oTable.$('tr.row_selected').removeClass('row_selected');
            $(this).addClass('row_selected');
        }
    });

    $("#deleteEntry").click(function(){
        var anSelected = table.selectRow(oTable);
        if(anSelected.length !== 0){
            oTable.fnDeleteRow(anSelected[0]);
        }
        var row = $(anSelected[0])[0];
        var rowText = $(row).children()[0].innerText;
        var rowURL = $(row).children()[1].innerText;
        console.log(rowURL);
        /*var params = "deleteEntry="+anSelected;    
        var response = postRequest(params);
        if(response){
            //$("#tables option:selected").remove();
            console.log($("#radioButtons #"+selectedTable));
            $("#radioButtons #"+selectedTable).remove();
        }*/
    });
});

var table = {

    initializeTable: function(){
        return $("#list").dataTable();
    },

    switchTables: function(selectedTable){
        chrome.extension.sendMessage({message: [selectedTable, isGroupMode]},function(response){
        });
    },

    getSelectedTable: function(){
        var selectedTable = ($(".checked")[0].nextElementSibling.textContent);
        return selectedTable;
    },

    deleteTable: function(selectedTable){
        var params = "deleteTable="+selectedTable;    
        var response = postRequest(params);
        if(response){
            //$("#tables option:selected").remove();
            console.log($("#radioButtons #"+selectedTable));
            $("#radioButtons #"+selectedTable).remove();
        }
    },

    selectRow: function(oTableLocal){
        /*var aReturn = new Array();
        var aTrs = oTableLocal.fnGetNodes();
        for(var i=0; i<aTrs.length; i++){
            if($(aTrs[i]).hasClass('row_selected')){
                aReturn.push(aTrs[i]);
            }
        }
        return aReturn;
        */
        return oTableLocal.$('tr.row_selected');
    },

    createTable: function(tableName){
        var params = "createTable="+tableName;
        var response = postRequest(params);
        if(response){
            $("#radioButtons").append('<input type="radio" id='+tableName+' name="iCheck"><label></label><br>');
        }
        select.initializePlugin(tableName);
    },

    getTableData: function(selectedTable){
        var params = "selectedTable="+selectedTable;
        params = params + "&search=Search";
        $("#list").dataTable().fnClearTable();
        var response = postRequest(params);
        console.log(response);
        var responseDiv = document.createElement("div");
        $(responseDiv).html(response);
        $(responseDiv).find('editorialTool').each(function(){
            var listItem = $(this).text();
            var line = listItem.indexOf("|");
            var selectedListItem = listItem.substring(0,line);
            var urlListItem = listItem.substring(line+1);
            $("#list").dataTable().fnAddData([selectedListItem,urlListItem]);
        });
   },
}

var select = {

   loadTables: function(){
        var params = "getTables=GetTables";    
        var response = postRequest(params);
        var responseDiv = document.createElement("div");
        $(responseDiv).html(response);
        var tablesArr = this.parseData($(responseDiv));
        this.addRadioButton(tablesArr);
   },

   addRadioButton: function(tablesArr){
        for(var i=0; i<tablesArr.length; i++){
            var entry = tablesArr[i];
            console.log(localStorage);
            if(entry == localStorage.selectedTable){
                $("#radioButtons").append('<input type="radio" id='+entry+' name="iCheck" checked><label>'+entry+'</label><br>');
            } else {
                $("#radioButtons").append('<input type="radio" id='+entry+' name="iCheck"><label>'+entry+'</label><br>');
            }
            this.initializePlugin(entry);
        }
   },

   initializePlugin: function(elementID){
        $("#"+elementID).iCheck({
            checkboxClass: 'icheckbox_flat-blue',
            radioClass: 'iradio_flat-blue',
            //insert:'<div class="icheck_line-icon"></div>'+elementID
        });
   },

   parseData: function(response){
        var tablesArr = new Array();
        $(response).find('editorialTool').each(function(){
            tablesArr.push($(this).text());
        });
        return tablesArr;
   },

   initialSelect: function(){
        getRequest(params);
   }
}

function getRequest(params){
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://researchvm-5.cs.rutgers.edu/index.php", false);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.send(params);
    return xhr.responseText;
}
  
function postRequest(params){
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "http://researchvm-5.cs.rutgers.edu/index.php", false);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.send(params);
    return xhr.responseText;
}

