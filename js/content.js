var queue = new Array();
var tagIndexArr = new Array();

$(document).mouseup(function(e){
    highlight();
});

function resetSelection(){
    if(window.getSelection){
        if(window.getSelection().empty){
            window.getSelection().empty();
        }
    }
}

function getSelectionParent(sel){
    var parentElement = sel.getRangeAt(0).commonAncestorContainer;
    if(parentElement.nodeType != 1){
        parentElement = parentElement.parentNode;
    }
    return parentElement;
}

function getSelectionHTML(sel){
    var container = document.createElement("div");
    for (var i = 0, len = sel.rangeCount; i < len; ++i) {
        container.appendChild(sel.getRangeAt(i).cloneContents());
    }
    return container.innerHTML;
}

//This function checks if the last elements in the queues are the same element
function checkQueue(queue){
    //needs to be more refined
    console.log(queue[0].length);
    if(queue.length != 3) return false;

    if(queue[0][queue[0].length-1][0] == queue[1][queue[1].length-1][0] && queue[0][queue[0].length-1][0] == queue[2][queue[2].length-1][0]){
        return true;
    }
    return false;
}

function highlight(){
    $(document).one("keydown",function(e){

        var html = "";
        if (window.getSelection) {

            var selection = window.getSelection();
            if (selection.rangeCount) {
                var html = getSelectionHTML(selection);
                var anchorNode = selection.anchorNode;

                if(html.indexOf('<img') != -1){
                    var src = $(html).attr("src");
                    if(e.which == 13){
                        addToList(src);
                    }
                } else {
                    if(e.which == 13){
                        //console.log(html);
                        addToList(html);
                        var pathToSelected = "/html/body//" + anchorNode.parentElement.localName + "[contains(.,'"+html+"')]";
                        var result = findSelectedTag(pathToSelected);
                        console.log(result);
                        var tagArr = makeTagArr(pathToSelected,result);
                        console.log(queue);
                        if(queue.length >= 3){
                            queue.shift();
                        }
                        queue.push(tagArr);
                        if(queue.length >= 3){
                            var prefixArr = findSimilarPrefix(queue);
                            console.log(prefixArr);
                            for(var i=0; i<queue[0].length; i++){
                                if(arraysEqual(queue[0][i],prefixArr[0])){
                                    if(i/queue[0].length > 0.5){
                                        console.log(queue[0][i]);
                                        console.log(queue[0][queue[0].length-1]);
                                        var selectedFirst = $(queue[0][i][0] + ":eq(" + queue[0][i][1] + ")");
                                        console.log($(selectedFirst)[0]);
                                        //maybe use xpath to see
                                    }
                                }
                            }
                        }

                        /*var isSimilar = checkQueue(queue);
                        if(isSimilar){
                            findSimilarTags(queue);
                        } else {
                        }*/
                        //only have to findSimilarTags if 3 consec times
                        //findSimilarTags(pathToSelected,result);
                    }
                }
            }
        }      
    });
}

function findSelectedTag(pathToSelected){
    var nodes = document.evaluate(pathToSelected, document, null, XPathResult.ANY_TYPE, null);
    var result = nodes.iterateNext();
    return result;
}

function makeTagArr(pathToSelected,result){
    var backwardsPath = pathToSelected;
    var originalTagName = $(result).prop("tagName");
    var currentTagName = $(result).prop("tagName").toLowerCase();
    var siblingIndex = $(result).index();
    var documentIndex = $(currentTagName).index(result);
    var indexArr = new Array();
    var noIndexTagArr = new Array();
    var indexTagArr = new Array();
    indexTagArr.unshift([currentTagName,documentIndex,siblingIndex]);


    /* going backwards to html tag from selected tag */
    while(currentTagName != "html"){
        backwardsPath = backwardsPath + "/parent::*";
        var nodes = document.evaluate(backwardsPath, document, null, XPathResult.ANY_TYPE, null);
        var nodesResult = nodes.iterateNext();
        console.log($(nodesResult));
        currentTagName = $(nodesResult).prop("tagName").toLowerCase();
        console.log(currentTagName);
        siblingIndex = $(nodesResult).index(); //sibling number
        console.log(siblingIndex);
        documentIndex = $(currentTagName).index(nodesResult); //whole document
        indexTagArr.unshift([currentTagName,documentIndex,siblingIndex]);
    }
    return indexTagArr;
}

function arraysEqual(a,b){
    if(a === b) return true;
    if(a == null || b == null) return false;
    if(a.length != b.length) return false;
    for(var i=0; i<a.length; ++i){
        if(a[i] !== b[i]) return false;
    }
    return true;
}

function getSiblingNumber(queue){
   var firstNumber = queue[0][queue[0].length-1][2];
   var secondNumber = queue[1][queue[1].length-1][2];
   var thirdNumber = queue[2][queue[2].length-1][2];

   if(firstNumber == secondNumber && firstNumber == thirdNumber){
       return firstNumber;
   }
   return -1;
}

function findSimilarPrefix(queue){
    var i = 0;
    var prefix;
    var suffix;
    var tagAfterPrefix;

    console.log(queue);
    var prefixArr = [];

    for(var j=queue[0].length-1; j>=0; j--){
         for(var k=queue[1].length-1; k>=0; k--){
             for(var l=queue[2].length-1; l>=0; l--){
                 if(queue[0][j][0] == queue[1][k][0] && queue[0][j][0] == queue[2][l][0] 
                         && queue[0][j][2] == queue[1][k][2] && queue[0][j][2] == queue[2][l][2]){
                     prefixArr.push(queue[0][j]);
                     prefixArr.push(queue[1][k]);
                     prefixArr.push(queue[2][l]);
                     return prefixArr;
                 }
             }
         }
    }
}

function findSimilarTags(queue){
    var i = 0;
    var fowardLastEqual;

    //find the last equal tag all these elements have
    while(arraysEqual(queue[0][i],queue[1][i]) && arraysEqual(queue[0][i],queue[2][i])){
        forwardLastEqual = queue[0][i];
        i++;
    }
    //console.log(forwardLastEqual);
    forwardLastEqual = $(forwardLastEqual[0] + ":eq(" + forwardLastEqual[1] + ")");
    //console.log(forwardLastEqual);
    var lastEqualChildren = $(forwardLastEqual[0]).children();
    var found;

    // go through the rest of the tags that are different
    var ele = forwardLastEqual[0];
    while(i < queue[0].length){
        found = $(ele).find(queue[0][i][0]);
        ele = queue[0][i][0];
        i++;
    }

    var siblingNumber = getSiblingNumber(queue);

    //if sib number is the same
    var similarElement;
    var originalBackground;
    $(found).each(function(){
        //console.log(this);
        var foundSibIndex = $(this).index(); //sibling number
        //console.log(foundSibIndex);
        if(foundSibIndex == siblingNumber){
            originalBackground = $(this).css("background-color"); 
            $(this).addClass("highlighted")
                             .css("background-color","yellow")
                             .css("opacity",0.8);
        } else if(siblingNumber == -1){
            //if sibling number for all 3 selected are different
            //then add all of them?
            similarElement = this;
            originalBackground = $(similarElement).css("background-color"); 
            $(similarElement).addClass("highlighted")
                             .css("background-color","yellow")
                             .css("opacity",0.8);

        }
    });

    var add = confirm("Add to DB?");
    if(add){
        $(".highlighted").each(function(){
            var html = $(this).html();
            addToList(html);
        });
        console.log("Adding all to DB");
        $(".highlighted").css("background-color",originalBackground)
                         .removeClass("highlighted");
        queue = [];
    } else {
        $(".highlighted").hover(function(evt){
            //console.log(evt);
            individualAdd = confirm("Add this?");
            if(individualAdd){
                //add to db
            } else {
            }
            $(this).css("background-color",originalBackground)
                   .removeClass("highlighted");

        });
    }
}

function loadXMLDoc(){
    var xhr = new XMLHttpRequest();
    xhr.open("GET",$(location).attr('href'), false);
    xhr.send("");
    return xhr;
}

function update(pageUrl, value, selectedTable){
    chrome.extension.sendMessage({message: [pageUrl, value, selectedTable]}, function(response){
        //console.log(response);
    });
}

function addToList(item){
    var val = item;
    var url = $(location).attr('href');
    var table = "selected";
    update(url,val,table);
}
