self.onmessage = function(evt) {
  debugger;
  var url = evt.data.url;
  var text = evt.data.text;
  var selectedTable = evt.data.table;
  var xhr = new XMLHttpRequest();
  var params = 'text=' + encodeURIComponent(text);
  params = params + '&url=' + encodeURIComponent(url);
  params = params + '&selectedTable=' + encodeURIComponent(selectedTable);
  params = params + '&insert=Insert';
  xhr.open('POST', 
      'http://ec2-54-68-34-160.us-west-2.compute.amazonaws.com/index.php',
      true);
  xhr.onload = function(evt) {
    if (this.status == 200) { // Status 200 = OK
      self.postMessage({message: this.response});
    }
  }
  xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  xhr.send(params);
}
