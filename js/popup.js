var isGroupMode = true;
var isLimitCheck = true;
var oTable;
$(document).ready(function(){

    select.loadTables();
    console.log(localStorage);
    var selectedTable;
    console.log($(".checked").length);
    if($(".checked").length == 0 || localStorage === undefined || localStorage.length == 0){
        if($($(".iradio_flat-blue")[0]).next()[0]!==undefined){
            selectedTable = $($(".iradio_flat-blue")[0]).next()[0].innerText;
            $($(".iradio_flat-blue")[0]).addClass("checked");
            console.log(selectedTable);
        }
    } else {
        selectedTable = localStorage.selectedTable;
        console.log(selectedTable);
    }
    isGroupMode = localStorage.isGroupCheck;
    if(isGroupMode=="true"){
        $("#groupCheck").prop("checked",true);
    } else {
        $("#groupCheck").prop("checked",false);
    }
    isLimitCheck = localStorage.isLimitCheck;
    if(isLimitCheck=="true"){
        $("#allResultsCheck").prop("checked",true);
    } else {
        $("#allResultsCheck").prop("checked",false);
    }
    table.switchTables(selectedTable);
    console.log(selectedTable);
    oTable = table.initializeTable();
    table.getTableData(selectedTable);

    $("#groupCheck").click(function(){
        isGroupMode = $(this).is(":checked"); 
        table.switchTables(selectedTable);
    });

    $("#allResultsCheck").click(function(){
        isLimitCheck = $(this).is(":checked"); 
        table.switchTables(selectedTable);
        window.location.reload();
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

    /*$("#viewAll").avgrund({
        width: 300,
        height: 80,
        onLoad: function(elem){
            var params = "allData="+table.getSelectedTable();
            params = params + "&search=Search";
            var response = postRequest(params);
            console.log(response);
            var responseDiv = document.createElement("div");
            $(responseDiv).html(response);
            $(responseDiv).find('editorialTool').each(function(){
                var listItem = $(this).text();
                var line = listItem.indexOf("|");
                var selectedListItem = listItem.substring(0,line);
                var urlListItem = listItem.substring(line+1);
                $("#entireList").html(selectedListItem);
                //$("#list").dataTable().fnAddData([selectedListItem,urlListItem]);
            });

        },
        onUnload: function(elem){
            
        },
        template: '<center>' + 
                  '<div id="entireList"> </div>' +
                  '</center>'

    });*/
    $("#createTable").click(function(){
        $("#tableName").removeAttr("disabled");
        $("#submitName").removeAttr("disabled");
        $("#submitName").click(function(){
            table.createTable($("#tableName").val());
            localStorage.selectedTable = $("#tableName").val();
            window.location.reload();
        });
    });

    $("#list").delegate("tbody tr","click",function(event){
        if($(this).hasClass('row_selected')){
            $(this).removeClass('row_selected')
        } else {
            console.log($(".row_selected"));
            oTable.$('tr.row_selected').removeClass('row_selected');
            $(this).addClass('row_selected');
        }
        oTable = table.initializeTable();
    });

    $("#deleteEntry").click(function(){
        var anSelected = table.selectRow(oTable);
        if(anSelected.length !== 0){
            oTable.fnDeleteRow(anSelected[0]);
        }
        var row = $(anSelected[0])[0];
        var rowText = $(row).children()[0].innerText;
        var rowURL = $(row).children()[1].innerText;
        console.log(rowText);
        console.log(rowURL);
        var params = "deleteEntry="+rowText+"#"+rowURL;    
        params = params + "&selectedTable=" + selectedTable;
        var response = postRequest(params);
        if(response){
            //$("#tables option:selected").remove();
            console.log(response);
            console.log($("#radioButtons #"+selectedTable));
            $("#radioButtons #"+selectedTable).remove();
        }
    });

    $("#addEntry").click(function(){
        console.log("HI");
        $("#entry").removeAttr("disabled");
        $("#submitEntry").removeAttr("disabled");
        $("#submitEntry").click(function(){
            console.log("EHH");
            var entry = $("#entry").val();
            console.log(entry);
            var params = "addEntry="+entry;    
            params = params + "&selectedTable=" + selectedTable;
            var response = postRequest(params);
            if(response){
                console.log(response);
                window.location.reload();
            }
        });
    });

});

var table = {

    initializeTable: function(){
        return $("#list").dataTable();
    },

    switchTables: function(selectedTable){
        chrome.extension.sendMessage({message: [selectedTable, isGroupMode, isLimitCheck]},function(response){
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
        return oTableLocal.$('tr.row_selected');
    },

    createTable: function(tableName){
        var params = "createTable="+tableName;
        var response = postRequest(params);
        if(response){
            localStorage.selectedTable = tableName;
            $("#radioButtons").append('<input type="radio" id='+tableName+' name="iCheck" checked><label></label><br>');
        }
        select.initializePlugin(tableName);
    },

    getTableData: function(selectedTable){
        var params = "selectedTable="+selectedTable;
        params = params + "&search=Search";
        params = params + "&isLimit="+isLimitCheck;
        $("#list").dataTable().fnClearTable();
        var response = postRequest(params);
        if(response){
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
        }
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

