$(document).ready(function(){

    select.loadTables();
    var selectedTable = $("#tables").val()[0];
    console.log(selectedTable);
    table.initializeTable();
    table.getTableData(selectedTable);

    $("#tables").change(function(){
        selectedTable = table.switchTables();
        table.getTableData(selectedTable);
    });

    $("#deleteTable").click(function(){
        selectedTable = $("#tables").val()[0];
        table.deleteTable(selectedTable);
    });

    $("#createTable").click(function(){
        //var tableName = prompt("What table would you like to add?");
        table.createTable("movies");
    });
});

var table = {

    initializeTable: function(){
        $("#list").dataTable();
    },

    switchTables: function(){
        $("#tableText").empty();
        selectedTable = $("#tables").val()[0];
        console.log(selectedTable);
        return selectedTable;
    },

    deleteTable: function(selectedTable){
        var params = "deleteTable="+selectedTable;    
        var response = postRequest(params);
        if(response){
            $("#tables option:selected").remove();
            //$("#tables:first-child").attr("selected","selected");
        }

    },

    createTable: function(tableName){
        var params = "createTable="+tableName;
        var response = postRequest(params);
        if(response){
            $("#tables").append("<option value="+tableName+">"+tableName+"</option>");
        }
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
        this.addToSelect(tablesArr);
   },

   addToSelect: function(tablesArr){
        for(var i=0; i<tablesArr.length; i++){
            var entry = tablesArr[i];
            if(i==0){
                $("#tables").append("<option selected='selected' value="+entry+">"+entry+"</option>");
            } else {
                $("#tables").append("<option value="+entry+">"+entry+"</option>");
            }
        }
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
