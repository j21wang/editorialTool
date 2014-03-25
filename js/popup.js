$(document).ready(function(){

    select.loadTables();
    var selectedTable = $("#tables").val();
    select.getTableData(selectedTable);

    $("#tables").change(function(){
        $("#tableText").empty();
        selectedTable = $("#tables").val();
        select.getTableData(selectedTable);
    });

});

var select = {

   getRequest: function(params){
        var xhr = new XMLHttpRequest();
        xhr.onload = this.showTables();
        xhr.open("GET", "http://researchvm-5.cs.rutgers.edu/index.php", false);
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.send(params);
        return xhr.responseText;
   },

   postRequest: function(params){
        var xhr = new XMLHttpRequest();
        xhr.onload = this.showTables();
        xhr.open("POST", "http://researchvm-5.cs.rutgers.edu/index.php", false);
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.send(params);
        return xhr.responseText;
   },
   
   getTableData: function(selectedTable){
        var params = "selectedTable="+selectedTable;
        params = params + "&search=Search";
        var response = this.postRequest(params);
        console.log(response);
        var responseDiv = document.createElement("div");
        $(responseDiv).html(response);
        $(responseDiv).find('editorialTool').each(function(){
            console.log($(this).text());
            $("#tableText").append("<br>" + $(this).text());
        });
   },

   showTables: function(evt){
   },

   loadTables: function(){
        var params = "getTables=GetTables";    
        var response = this.postRequest(params);
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
        this.getRequest(params);
   }
}
