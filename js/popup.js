$(document).ready(function(){

    select.loadTables();
    var selectedTable = $("#tables").val();
    select.getTableData(selectedTable);

    $("#tables").change(function(){
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
   },

   showTables: function(evt){
   },

   loadTables: function(){
        var params = "getTables=GetTables";    
        var response = this.postRequest(params);
        this.parseData(response);
   },

   parseData: function(response){
        var textEntries = $(response).find('editorialTool');
        console.log(textEntries);
        for(var i=0; i<textEntries.prevObject.length; i++){
            console.log(textEntries.prevObject[i]);
        }
   },

   initialSelect: function(){
        this.getRequest(params);
   }
}
