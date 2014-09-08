self.onmessage = function(evt) {
  debugger;
  var url = evt.data.url;
  var text = evt.data.text1;
  var selectedTable = evt.data.table;
  var xhr = new XMLHttpRequest();
  var params = "text=" + encodeURIComponent(text);
  params = params + "&url=" + encodeURIComponent(url);
  params = params + "&selectedTable=" + encodeURIComponent(selectedTable);
  params = params + "&insert=Insert";
  xhr.open("POST", "http://researchvm-5.cs.rutgers.edu/index.php", true);
  xhr.onload = function(evt) {
    if (this.status == 200) {
      self.postMessage({message: this.response});
    }
  }
  xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xhr.send(params);
}
