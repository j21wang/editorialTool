var queue = new Array();
var tagIndexArr = new Array();

$(document).keypress(function(e){
    if(e.which == 13){
        highlight(e);
    }
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
    if(queue.length != 3) return false;

    if(queue[0][queue[0].length-1][0] == queue[1][queue[1].length-1][0] && queue[0][queue[0].length-1][0] == queue[2][queue[2].length-1][0]){
        return true;
    }
    return false;
}

function checkForApostrophes(text){
    var apostropheIndex = text.indexOf("'");
    if(apostropheIndex != -1){
        text = text.substring(0,apostropheIndex) + "&apos" + text.substring(apostropheIndex+1);
    }
    console.log(text);
    return text;
}

function highlight(e){

    var html = "";
    if (window.getSelection().toString() != "") {

    var selection = window.getSelection();
    console.log(selection);
    console.log(selection.anchorNode);
    console.log(selection.extentNode);
    if (selection.rangeCount && selection.anchorNode == selection.extentNode) {
        var html = getSelectionHTML(selection);
        html = checkForApostrophes(html);
        console.log(html);
        var anchorNode = selection.anchorNode;

        if(html.indexOf('<img') != -1){
            var src = $(html).attr("src");
            if(e.which == 13){
                addToList(src);
            }
        } else {
            addToList(html);
            console.log(html);
            var pathToSelected = "/html/body//" + anchorNode.parentElement.localName + "[contains(.,'"+html+"')]";
            var result = findSelectedTag(pathToSelected);
            var tagArr = makeTagArr(pathToSelected,result);
            if(queue.length >= 3){
                queue.shift();
            }
            queue.push(tagArr);
            if(queue.length >= 3){
                var prefixObject = findSimilarPrefix(queue);
                var isDifferent = checkSimilarTags(prefixObject.prefixArr);
                if(!isDifferent){
                    var prePrefixElement = prefixObject.prePrefixElement;
                    var prefixArr = prefixObject.prefixArr;
                    var prePrefix = $(prePrefixElement[0] + ":eq(" + prePrefixElement[1] + ")");
                    var foundSame = false;
                    var elementsPathArr = [];
                    for(var i=0; i<queue[0].length; i++){
                        var prePrefixTag = $($(prePrefix)[0]).prop("tagName").toLowerCase();
                        var queueTag = $(queue[0][i][0] + ":eq(" + queue[0][i][1] + ")");
                        if(foundSame){
                            elementsPathArr.push(queue[0][i]);
                        }

                        if($(queueTag)[0] == $(prePrefix)[0]){
                            foundSame = true;
                        }
                    }
                    var targetElement = $(prePrefix)[0];
                    var str = "";
                    var siblingNumber;
                    for(var i=0; i<elementsPathArr.length; i++){
                        var pre = $(prefixArr[0][0] + ":eq(" + prefixArr[0][1] + ")");
                        var ele = $(elementsPathArr[i][0] + ":eq(" + elementsPathArr[i][1] + ")");
                        str = str + " > " + elementsPathArr[i][0];
                        //str = str + " " + elementsPathArr[i][0];
                        if(pre[0] == ele[0]){
                            //str = str + ":nth-child("+(elementsPathArr[i-1][2]+1)+")";
                            //str = str + ":nth-child(0)";
                            alert("enters");
                            console.log(elementsPathArr);
                            siblingNumber = elementsPathArr[i-1][2]+1;
                            str = str + ":nth-child("+siblingNumber+")";
                            console.log(str);
                            break;
                        }
                        //str = str + " > " + elementsPathArr[i][0];
                    }

                    var similarElementsArr = [];
                    var originalBackground;
                    $($(targetElement).find(str)).each(function(){
                        var tag = $($(this)[0]).prop("tagName").toLowerCase();
                        var siblingNum = $(this).index();
                        var found = $(this);
                        originalBackground = $(this).css("background-color"); 
                        $(found).addClass("highlighted")
                                .css("background-color","yellow")
                                .css("opacity",0.8);

                    });

                    /*var add = confirm("Add to DB?");
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
                            individualAdd = confirm("Add this?");
                            if(individualAdd){
                                //add to db
                            } else {
                            }
                            $(this).css("background-color",originalBackground)
                                   .removeClass("highlighted");
                        });
                    }*/


                    } else {
                        //do nothing
                    }
                
                }
            }
        }
    }      
}

function checkSimilarTags(prefixArr){
    var isDifferent = false;
    for(var i=0; i<queue[0].length; i++){
        if(arraysEqual(queue[0][i],prefixArr[0]) && !isDifferent){
            if(i/queue[0].length >= 0.5){
                var selectedFirst = $(queue[0][i][0] + ":eq(" + queue[0][i][1] + ")");
            } else {
                isDifferent = true;
            }
        }
    }

    for(var i=0; i<queue[1].length; i++){
        if(arraysEqual(queue[1][i],prefixArr[1]) && !isDifferent){
            if(i/queue[1].length >= 0.5){
                var selectedSecond = $(queue[1][i][0] + ":eq(" + queue[1][i][1] + ")");
            } else {
                isDifferent = true;
            }
        }
    }

    for(var i=0; i<queue[2].length; i++){
        if(arraysEqual(queue[2][i],prefixArr[2]) && !isDifferent){
            if(i/queue[2].length >= 0.5){
                var selectedThird = $(queue[2][i][0] + ":eq(" + queue[2][i][1] + ")");
            } else {
                isDifferent = true;
            } 
        }
    }
    return isDifferent;
}

function findSelectedTag(pathToSelected){
    console.log(pathToSelected);
    var nodes = document.evaluate(pathToSelected, document, null, XPathResult.ANY_TYPE, null);
    var result = nodes.iterateNext();
    return result;
}

function makeTagArr(pathToSelected,result){
    var backwardsPath = pathToSelected;
    var originalTagName = $(result).prop("tagName");
    console.log(originalTagName);
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
        currentTagName = $(nodesResult).prop("tagName").toLowerCase();
        siblingIndex = $(nodesResult).index(); //sibling number
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
    var entered = false;

    var prePrefixElement;
    var prefixArr = [];
    var firstLength;
    var secondLength;
    var thirdLength;

    if(queue[0][queue[0].length-1] == queue[1][queue[1].length-1] && queue[1][queue[1].length-1] == queue[2][queue[2].length-1]){
        firstLength = queue[0].length;
        secondLength = queue[1].length;
        thirdLength = queue[2].length;
    } else {
        firstLength = queue[0].length-1;
        secondLength = queue[1].length-1;
        thirdLength = queue[2].length-1;
    }

    for(var j=firstLength; j>=0; j--){
         for(var k=secondLength; k>=0; k--){
             for(var l=thirdLength; l>=0; l--){
                 if(queue[0][j][0] == queue[1][k][0] && queue[0][j][0] == queue[2][l][0] 
                         && queue[0][j][2] == queue[1][k][2] && queue[0][j][2] == queue[2][l][2] && !entered){
                     prefixArr.push(queue[0][j]);
                     prefixArr.push(queue[1][k]);
                     prefixArr.push(queue[2][l]);
                     entered = true;

                 }
                 if(queue[0][j][0] == queue[1][k][0] && queue[0][j][0] == queue[2][l][0] 
                         && queue[0][j][1] == queue[1][k][1] && queue[0][j][1] == queue[2][l][1]){
                     prePrefixElement = queue[0][j];
                     var prefixObject = {prePrefixElement: prePrefixElement, prefixArr: prefixArr};
                     return prefixObject;
                 }
             }
         }
    }
}

    //if sib number is the same
    /*var similarElement;
    var originalBackground;
    $(found).each(function(){
        var foundSibIndex = $(this).index(); //sibling number
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
            individualAdd = confirm("Add this?");
            if(individualAdd){
                //add to db
            } else {
            }
            $(this).css("background-color",originalBackground)
                   .removeClass("highlighted");

        });
    }*/

function loadXMLDoc(){
    var xhr = new XMLHttpRequest();
    xhr.open("GET",$(location).attr('href'), false);
    xhr.send("");
    return xhr;
}

function update(pageUrl, value, selectedTable){
    chrome.extension.sendMessage({message: [pageUrl, value, selectedTable]}, function(response){
    });
}

function addToList(item){
    var val = item;
    var url = $(location).attr('href');
    var table = "selected";
    update(url,val,table);
}
