self.onmessage = function(evt) {
    debugger;
    var row = evt.data.row;
    var schema = evt.data.schema;
    var xhr = new XMLHttpRequest();
    var params = "id=" + encodeURIComponent(row.id);
    params = params + "url=" + encodeURIComponent(row.url);
    for (sIdx in schema) {
        var name = schema[sIdx].name;
        var id = schema[sIdx].id;
        var val = row.data[id];
        if (!(val === null) && !(val === undefined)) {
            if (params != "") {
                params = params + "&";
            }
            params = params + name + "=" + encodeURIComponent(val);
        }
    }
    params = params + "&insert=Insert";
    xhr.open("POST", "http://ec2-54-214-179-160.us-west-2.compute.amazonaws.com/index.php", true);
    xhr.onload = function(evt) {
        if (this.status == 200) {
            // Should the server be responding with something other than 200 if the insert fails?
            if (this.response.indexOf("Unable to Insert") > -1) {
                self.postMessage({id: row.id, status: 'dirty', message: this.response});
            }
            else {
                self.postMessage({id: row.id, status: 'clean', message: this.response});
            }
        }
    }
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.send(params);
}
