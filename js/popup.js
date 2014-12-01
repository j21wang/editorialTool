var isGroupMode = true;
var isLimitCheck = true;
var toolOn = true;
var email;
var oTable;
var selectedTable;

$(document).ready(function(e){
  // If user was already logged in in a previous session, then
  // automatically log the user in. Otherwise, display login mask.
  if (localStorage.email != 'null' && localStorage.email != null &&
      localStorage.email != undefined && localStorage.email != 'undefined') {
    $('.login-window').remove();
    login(localStorage.email);
  } else {
    displayLoginMask();
  }
  $(document).foundation();

  // Allow automatic highlighting once 3 similar elements are highlighted
  $('#groupCheck').on('click', function() {
    isGroupMode = $(this).is(':checked'); 
    table.switchTables(selectedTable);
  });

  // Show all results (or can limit to 100 max)
  $('#allResultsCheck').on('click', function(){
    isLimitCheck = $(this).is(':checked'); 
    table.switchTables(selectedTable);
    window.location.reload();
  });

  // Turn tool on/off
  $('#toolOnCheck').on('click', function(){
    toolOn = $(this).is(':checked');
    table.switchTables(selectedTable);
    window.location.reload();
  });

  // Select a different table to be displayed
  $('ins.iCheck-helper').on('click', function(){
    selectedTable = table.getSelectedTable();
    table.switchTables(selectedTable);
    table.getTableData(selectedTable);
  });

  // Delete current selected table
  $('#deleteTable').on('click', function(){
    selectedTable = table.getSelectedTable(); 
    table.deleteTable(selectedTable);
    window.location.reload();
  });

  // Create a new table
  $('#createTable').on('click', function(){
    $('#submitName').on('click', function(){
      table.createTable($('#tableName').val());
      localStorage.selectedTable = $('#tableName').val();
      window.location.reload();
    });
  });

  // Adds class to selected row in the table
  $('#list').delegate('tbody tr', 'click', function(){
    if ($(this).hasClass('row_selected')) {
      $(this).removeClass('row_selected');
    } else {
      oTable.$('tr.row_selected').removeClass('row_selected');
      $(this).addClass('row_selected');
    }
    oTable = table.initializeTable();
  });

  // Delete table entry
  $('#deleteEntry').on('click', function(){
    console.log(selectedTable);
    var anSelected = table.selectRow(oTable);
    if(anSelected.length !== 0) oTable.fnDeleteRow(anSelected[0]);
    var row = $(anSelected[0])[0];
    var rowText = $(row).children()[0].innerText;
    var rowURL = $(row).children()[1].innerText;
    var params = 'deleteEntry=' + rowText + '#' + rowURL;    
    params = params + '&selectedTable=' + selectedTable;
    console.log(params);
    var response = postRequest(params);
    console.log(response);
    if(response) $('#radioButtons #' + selectedTable).remove();
  });

  // Add table entry
  $('#addEntry').on('click', function() {
    $('#submitEntry').on('click', function() {
      var entry = $('#entry').val();
      var params = 'addEntry=' + entry;    
      if (selectedTable == '') selectedTable = 'NULL';
      params = params + '&selectedTable=' + selectedTable;
      var response = postRequest(params);
      if (response) window.location.reload();
    });
  });

  // Creates and downloads a CSV file of the currently selected table
  $('#csv').on('click', function(){
    var params = 'selectedTable=' + selectedTable;
    params = params + '&search=Search';
    var response = postRequest(params);
    if(response){
      // Create a div to put response in so that we can parse the
      // entries in the table to put in the CSV file
      var responseDiv = document.createElement('div');
      var csvData = [];
      csvData.push(selectedTable);

      $(responseDiv).html(response);
      $(responseDiv).find('editorialTool').each(function() {
        var listItem = $(this).text();
        var line = listItem.indexOf('|');
        var selectedListItem = listItem.substring(0, line);
        var urlListItem = listItem.substring(line + 1);
        csvData.push(selectedListItem);
      });

      var buffer = csvData.join('\n');
      var uri = 'data:text/csv;charset=utf8,' + encodeURIComponent(buffer);
      var fileName = 'edTool_' + selectedTable + '.csv';
      var link = document.createElement('a');
      if(link.download !== undefined){
        link.setAttribute('href', uri);
        link.setAttribute('download', fileName);
        link.click();
      } 
    }
  });

  // Share list with other users. The only options now are to add users
  // (emails separated by commas), make the list public so that all
  // registered users can see the list, or share the list on a status
  // update on facebook.
  $('#share').on('click', function() {
    $('#shareSubmit').on('click', function() {
      var usersToAdd = $('#shareList').val();
      var params = 'permissions=' + usersToAdd;    
      params = params + '&selectedTable=' + selectedTable;
      var response = postRequest(params);
      if(response) window.location.reload();
    });
    $('#makePublic').on('click', function() { 
      var params = 'permissions=public&selectedTable=' + selectedTable;
      var response = postRequest(params);
      if (response) window.location.reload();
    });
    $('#facebook').on('click', function() {
      var url = 'http://ec2-54-68-34-160.us-west-2.compute.amazonaws.com/' +
          'facebook.html?user=' + localStorage.email +
          '&table=' + selectedTable;
      window.open(url);
    });
  });

  $('#logout').on('click', function() {
    localStorage.email = 'null';
    window.location.reload();
  });

  // Existing user sign in
  $('.signin.submit.button').on('click', function() {
    var username = $('#username').val();
    var params = 'username=' + username;
    var password = $('#password').val();
    var passwordHash = CryptoJS.MD5(password).toString();
    params = params + '&password=' + passwordHash;
    var response = postRequest(params);
    if (response.indexOf('user exists') > -1) {
      login(username);
      window.location.reload();
    } else {
      $('.message').text('Incorrect login.');
    }
  });

  // New user sign up
  $('.signup.submit.button').on('click', function() {
    var username = $('#username').val();
    if (validateEmail(username)) {
      var params = 'newUsername=' + username;
      var password = $('#password').val();
      var passwordHash = CryptoJS.MD5(password).toString();
      params = params + '&password=' + passwordHash;
      var response = postRequest(params);
      if (response.indexOf('user exists') > -1) {
        $('.message').text('User already exists.');
      } else {
        login(username);
        window.location.reload();
      }
    } else {
      $('.message').text('Invalid email.');
    }
  });

  // Display login box
  $('a.login-window').on('click', function() {
      // Getting the variable's value from a link 
      var loginBox = $(this).attr('href');

      // Fade in the Popup
      $(loginBox).fadeIn(300);
      
      // Set the center alignment padding + border see css style
      var popMargTop = ($(loginBox).height() + 24) / 2; 
      var popMargLeft = ($(loginBox).width() + 24) / 2; 
      $(loginBox).css({ 
        'margin-top' : -popMargTop,
        'margin-left' : -popMargLeft
      });
      // Add the mask to body
      $('#container').append('<div id="mask"></div>');
      $('#mask').fadeIn(300);
      return false;
  });

  // Close popup when user clicks on the button close or the mask layer
  $('a.close, #mask').on('click', function() { 
    $('#mask, .login-popup').fadeOut(300, function() {
      $('#mask').remove();  
    }); 
    return false;
  });

  // Search will return table names and tables that have entries that match
  // the search query
  $('#searchTables').on('click', function() {
    var searchValue = $('#searchItem').val();
    $('#searchItem').val('');
    select.filterTables(searchValue);
  });

  // Show all tables
  $('#showAllTables').on('click', function() {
    $('#searchItem').val('');
    $('#radioButtons li label').each(function() {
      $(this).parent().show(); 
    });
  });

  // Email list to anyone
  $('#emailList').click(function() {  
    var proceed = true;
    if(!$.trim($('#recipient').val())) {
      proceed = false;
    }
    var email_reg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/; 
    if(!email_reg.test($.trim($('#recipient').val()))){
      proceed = false;
    }
    if(proceed) {
        var params = 'emailFrom=' + localStorage.email;    
        params = params + '&emailTo=' + $('#recipient').val();
        params = params + '&selectedTable=' + selectedTable;    
        var response = postRequest(params);
        window.location.reload();
    }
  });
});
  

var table = {
  // initialize datatable plugin
  initializeTable: function(){
    return $('#list').dataTable();
  },

  // update the localStorage variable after user chooses to display
  // a new table
  switchTables: function(selectedTable){
    chrome.extension.sendMessage({method: 'saveState',
        message: [selectedTable, isGroupMode, isLimitCheck, toolOn]});
  },

  // get currently selected table
  getSelectedTable: function(){
    var selectedTable = ($('.checked')[0].nextElementSibling.textContent);
    return selectedTable;
  },

  // delete currently selected table
  deleteTable: function(selectedTable){
    var params = 'deleteTable=' + selectedTable;    
    var response = postRequest(params);
    if(response) $('#radioButtons #' + selectedTable).remove();
  },

  // select a row of the table
  selectRow: function(oTableLocal){
    return oTableLocal.$('tr.row_selected');
  },

  // create a new table
  createTable: function(tableName){
    var params = 'createTable=' + tableName;
    params = params + '&user=' + localStorage.email;
    var response = postRequest(params);
    if(response){
      localStorage.selectedTable = tableName;
       $('#radioButtons').append('<li>' +
           '<input type="radio" id=' + tableName + ' name="iCheck" checked>' +
           '<label class="tableName">' + tableName + '</label></li>');
    }
    select.initializePlugin(tableName);
  },

  // get currently selected table's entries
  getTableData: function(selectedTable){
    var params = 'selectedTable=' + selectedTable;
    params = params + '&search=Search';
    params = params + '&isLimit=' + isLimitCheck;
    $('#list').dataTable().fnClearTable();
    var response = postRequest(params);
    if(response){
      // parse response and add to table
      var responseDiv = document.createElement('div');
      $(responseDiv).html(response);
      $(responseDiv).find('editorialTool').each(function(){
        var listItem = $(this).text();
        var line = listItem.indexOf('|');
        var selectedListItem = listItem.substring(0, line);
        var urlListItem = listItem.substring(line + 1);
        $('#list').dataTable().fnAddData([selectedListItem, urlListItem]);
      });
    }
  }, 

  // renders the data table for the selected table
  renderTables: function(selectedTable) {
    table.switchTables(selectedTable);
    oTable = table.initializeTable();
    table.getTableData(selectedTable);
  }
}

var select = {
  // load all tables into the select
  loadTables: function() {
    var params = 'getTables=GetTables';    
    params = params + '&user=' + localStorage.email;
    var response = postRequest(params);
    var responseDiv = document.createElement('div');
    $(responseDiv).html(response);
    var tablesArr = this.parseData($(responseDiv), 'editorialTool');
    this.addRadioButton(tablesArr);
  },

  // filters the displayed tables by the user's search query
  filterTables: function(searchValue) {
    var params = 'searchValue=' + searchValue;
    params = params + '&user=' + localStorage.email;
    var response = postRequest(params);
    var responseDiv = document.createElement('div');
    $(responseDiv).html(response);
    var tablesArr = this.parseData($(responseDiv), 'tableName');
    $('#radioButtons li label').each(function() {
      if(tablesArr.indexOf($(this).text()) <= -1) {
        $(this).parent().hide(); 
      } else {
        $(this).parent().show(); 
      }
    });
  },

  // add radio buttons (icheck plugin) to the displayed tables
  addRadioButton: function(tablesArr) {
    for(var i = 0; i < tablesArr.length; i++) {
      var entry = tablesArr[i];
      var user = localStorage.email.split('@')[0];
      if(entry == localStorage.selectedTable){
        $('#radioButtons').append('<li>' +
            '<input type="radio" id=' + entry + ' name="iCheck" checked>' +
            '<label class="tableName">' + entry + '</label></li>');
      } else {
        $('#radioButtons').append('<li>' +
            '<input type="radio" id=' + entry + ' name="iCheck">' +
            '<label class="tableName">' + entry + '</label></li>');
      }
      this.initializePlugin(entry);
    }
  },

  // initializes icheck plugin
  initializePlugin: function(elementID) {
    $("#" + elementID).iCheck({
       checkboxClass: 'icheckbox_flat-blue',
       radioClass: 'iradio_flat-blue'
    });
  },

  // parse response for tables
  parseData: function(response, parseBy){
    var tablesArr = [];
    $(response).find(parseBy).each(function() {
      tablesArr.push($(this).text());
    });
    return tablesArr;
  },

  // checks the selected table in the select
  setSelectedTable: function() {
    var selectedTable;
    if($('.checked').length == 0 || localStorage === undefined ||
        localStorage.length == 0){
      if($($(".iradio_flat-blue")[0]).next()[0] !== undefined){
        selectedTable = $($(".iradio_flat-blue")[0]).next()[0].innerText;
        $($(".iradio_flat-blue")[0]).addClass("checked");
      }
    } else {
      selectedTable = localStorage.selectedTable;
    }
    return selectedTable;
  }
}

function postRequest(params){
  var xhr = new XMLHttpRequest();
  xhr.open("POST",
      "http://ec2-54-68-34-160.us-west-2.compute.amazonaws.com/index.php",
      false);
  xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xhr.send(params);
  return xhr.responseText;
}

// Check if email is valid when user is signing up
function validateEmail(email) { 
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
} 

// Get the previous saved state of user during the last session
function retrieveSavedState() {
  isGroupMode = localStorage.isGroupCheck;
  if (isGroupMode == 'true') {
    $('#groupCheck').prop('checked', true);
  } else {
    $('#groupCheck').prop('checked', false);
  }
  isLimitCheck = localStorage.isLimitCheck;
  if (isLimitCheck == 'true') {
    $('#allResultsCheck').prop('checked', true);
  } else {
    $('#allResultsCheck').prop('checked', false);
  }
  toolOn = localStorage.toolOn;
  if (toolOn == 'true') {
    $('#toolOnCheck').prop('checked', true);
  } else {
    $('#toolOnCheck').prop('checked', false);
  }
}

// Logs the user in and renders the display for the user
function login(username) {
  localStorage.email = username;
  $('#loginName').text('Logged In: ' + localStorage.email);
  select.loadTables();
  selectedTable = select.setSelectedTable(); 
  retrieveSavedState(); 
  table.renderTables(selectedTable);
}

// Displays the login mask when the user isn't logged in
function displayLoginMask() {
  $('#container').append('<div id="loginMask"></div>');
  $('#loginMask').fadeIn(300);
  $('#loginMask').append('<div style="position: relative; top: 70px"' +
      'id="loginContainer"></div>');
  $('#loginContainer').append('<center><h1 id="editorialTool">' +
      'Editorial Tool</h1></center>');
  $('#loginContainer').append('<center><a href="#login-box"' +
      'class="login-window button">Login</a></center>');
  $('#loginContainer').append('<center><a class="about button">' +
      'About</a></center>');
}
