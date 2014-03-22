self.onmessage = function(evt) {
    debugger;
    var url = evt.data.url;
    var text = evt.data.text1;
    var selectedTable = evt.data.table;
    console.log(url);
    console.log(text);
    console.log(selectedTable);
    var xhr = new XMLHttpRequest();
    var params = "text=" + encodeURIComponent(text);
    params = params + "&url=" + encodeURIComponent(url);
    params = params + "&selectedTable=" + encodeURIComponent(selectedTable);
    params = params + "&insert=Insert";
    console.log(params);
    xhr.open("POST", "http://researchvm-5.cs.rutgers.edu/index.php", true);
    xhr.onload = function(evt) {
        if (this.status == 200) {
            console.log(this.response);
            // Should the server be responding with something other than 200 if the insert fails?
            if (this.response.indexOf("Unable to Insert") > -1) {
                self.postMessage({message: this.response});
            }
            else {
                self.postMessage({message: this.response});
            }
        }
    }
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.send(params);
}
