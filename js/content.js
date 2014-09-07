var queue = new Array();
var tagIndexArr = new Array();
var groupMode = true;
var temp;
var isImg;

$(document).ready(function(){
    chrome.runtime.onMessage.addListener(
        function(message, sender, sendResponse){
            groupMode = message.isGroupCheck;
            console.log(groupMode);
            sendResponse(message);
        });


    $(document).keypress(function(e){
        if(e.which == 13){
            highlight(e);
        }
    });
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
    console.log($(sel.anchorNode).find("img").length);
    var container = document.createElement("div");
    for (var i = 0, len = sel.rangeCount; i < len; ++i) {
        container.appendChild(sel.getRangeAt(i).cloneContents());
    }
    var target = $(container);

    if($(sel.anchorNode).find("img").length > 0){
        console.log($(target)[0]);
        isImg = true;
        return container.innerHTML;
    } else {
        console.log($(target)[0].innerText.trim());
        isImg = false;
        return $(target)[0].innerText.trim();
    }
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

function checkImage(htmlChildren){
    var isImage = false;

    $(htmlChildren).each(function(){
        var tagName = $($(this)[0]).prop("tagName").toLowerCase();
        if(tagName == "img") {
            isImage = true;
        }
    });
    return isImage;
}

function markAsAdded(html,isImage){
    var range = window.getSelection().getRangeAt(0);
    var span = document.createElement("span");
    range.insertNode(span);

    if(!isImage){
        console.log($(span).parent());
        $($(span).parent()).addClass("added")
                           .css("border","2px solid red")
                           .css("border-radius","3px");
        temp = $(span).parent()[0];
        $(span).remove();
    } else {
        console.log($($(span).parent()).find("img"));
        $($(span).parent()).find("img").addClass("added")
                                       .css("border","2px solid red")
                                       .css("border-radius","3px");
        //temp = $(span).parent()[0];
        temp = $($(span).parent()).find("img")[0];
        console.log(temp);
        $(span).remove();
    }
}

function getPathTo(element) {
    if (element.id!=='')
        return 'id("'+element.id+'")';
    if (element===document.body)
        return element.tagName;

    var ix= 0;
    var siblings= element.parentNode.childNodes;
    for (var i= 0; i<siblings.length; i++) {
        var sibling= siblings[i];
        if (sibling===element)
            return getPathTo(element.parentNode)+'/'+element.tagName+'['+(ix+1)+']';
        if (sibling.nodeType===1 && sibling.tagName===element.tagName)
            ix++;
    }
}

function highlight(e){

    var html = "";
    var isImage = checkImage(window.getSelection().extentNode.children);    
    console.log(isImage);
    if (window.getSelection().toString() != "" || isImage) {
        $(".highlighted").css("background-color","transparent")
                             .css("border","none")
                             .removeClass("highlighted");
        $("#box").remove();

        var selection = window.getSelection();
        console.log(selection);
        //if (selection.rangeCount && selection.anchorNode == selection.extentNode) {
        if (selection.rangeCount > 0){
            var html = getSelectionHTML(selection);
            var anchorNode = selection.anchorNode;
            var pathToSelected;
            var added;

            //if($(selection.anchorNode).find("img").length > 0){
            if(html.indexOf('<img') != -1){
                isImg = true;
                //console.log(pathToSelected);
                //var src = $(selection.anchorNode).find("img")[0].src;
                var src = $(html).attr("src");
                addToList(src);
                markAsAdded(html,isImage);
                pathToSelected = "/html/body//img[@src='"+src+"']";
                //pathToSelected = getPathTo($(selection.anchorNode).find("img")[0]);
                //pathToSelected = getPathTo(temp);
            } else {
                isImg = false;
                addToList(html);
                markAsAdded(html,isImage);
                console.log($(temp).index());
                console.log(anchorNode.parentElement.localName);
                //pathToSelected = '/html/body//' + temp2.localName + '/' + temp.localName + '[contains(.,"'+html+'")]';
                pathToSelected = getPathTo(temp);
            }

            console.log(pathToSelected);
            var result = findSelectedTag(pathToSelected);
            console.log(result);
            //console.log(temp);
            //result = temp;
            var tagArr = makeTagArr(pathToSelected,result);
            console.log(tagArr);
            if(queue.length >= 3 && groupMode){
                queue = [];
            }
            queue.push(tagArr);
            if(queue.length >= 3 && groupMode){
                var prefixObject = findSimilarPrefix(queue);
                var isDifferent = checkSimilarTags(prefixObject.prefixArr);
                if(!isDifferent){
                    var prePrefixElement = prefixObject.prePrefixElement;
                    var prefixArr = prefixObject.prefixArr;
                    var prePrefix = $(prePrefixElement[0] + ":eq(" + prePrefixElement[1] + ")");
                    var sameElement = prefixObject.sameElement;
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

                    if(prePrefixElement[0] == "tbody" || prePrefixElement[0] == "table"){
                        var path = findSimilar(targetElement,elementsPathArr,prefixObject,true);
                        console.log(path);
                        highlightSimilar(targetElement,path);
                    } else {
                        var path = findSimilar(targetElement,elementsPathArr,prefixObject,false);
                        console.log(path);
                        highlightSimilar(targetElement,path);
                    }
                } else {
                    //do nothing
                }
            }
        }
    }
}

function popUp(){

    var add = document.createElement("div");
    $("body").append(add);
    $($(add)[0]).css("background-color","gray")
             .css("opacity","0.8")
             .css("width","300px")
             .css("height","70px")
             .css("position","fixed")
             .css("top","1em")
            .css("right","1em")
            .css("border-radius","3px")
            .attr("id","box");
    $("<center><p id='selectText'>Add all to selected table?</p><button id='okButton'>Add All</button><button id='addOneButton'>Add Some</button><button id='cancelButton'>Deselect All</button></center>").appendTo("#box");
    $("#selectText").css("color","white")
                    .css("font-size","15px");
    $('button').css("width","90px")
                      .css("height","20px");

}

function addAllToDB(originalBackground){

    if($('.highlighted').length > 0){
        popUp();

        var add = false;
        $("#okButton").click(function(){
            add = true;
            var addArr = [];
            $(".highlighted").each(function(){
                if(!isImg){
                    var html = $(this).html();
                    if(html.indexOf('"') > -1){
                        html = html.replace(/"/g,"'");
                    }
                    if(html != ""){
                        addArr.push(html);
                    }
                } else {
                    var html = $(this).attr("src");
                    console.log(html);
                    if(html.indexOf('"') > -1){
                        html = html.replace(/"/g,"'");
                    }
                    console.log(html);
                    if(html != ""){
                        addArr.push(html);
                    }
                }
            });
            console.log(addArr);
            addToList(addArr);
            console.log("Adding all to DB");
            $(".highlighted").css("background-color",originalBackground)
                             .css("border-color","red")
                             .css("border","2px solid red")
                             .addClass("added")
                             .removeClass("highlighted");
            queue = [];
            $("#box").remove();
        });

        $("#addOneButton").click(function(){
            $(".highlighted").hover(function(evt){
                var _this = this;
                setTimeoutConst = setTimeout(function(){
                    addToList($(_this).html());
                    $(_this).css("background-color",originalBackground)
                            .css("border","2px solid red")
                            .addClass("added")
                            .removeClass("highlighted");
                }, 1500);
            }, function(){
                clearTimeout(setTimeoutConst);
            });
            $("#box").remove();
        });

        $("#cancelButton").click(function(){
            $(".highlighted").css("background-color",originalBackground)
                             .css("border","none")
                             .removeClass("highlighted");
            $("#box").remove();
        });
    }
}

function findSimilar(targetElement,elementsPathArr,prefixObject,isTable){
    var path = "";
    var siblingNumber;
    var prefixArr = prefixObject.prefixArr;
    console.log(prefixArr);
    var sameElement = prefixObject.sameElement;
    console.log(elementsPathArr);
    for(var i=0; i<elementsPathArr.length; i++){
        console.log(elementsPathArr);
        var pre = $(prefixArr[0][0] + ":eq(" + prefixArr[0][1] + ")");
        var ele = $(elementsPathArr[i][0] + ":eq(" + elementsPathArr[i][1] + ")");
        console.log(elementsPathArr[i]);
        path = path + " > " + elementsPathArr[i][0];
        if(pre[0] == ele[0] || (isTable && elementsPathArr[i][0] == "td")){
            if(!sameElement){ // not the same element
                siblingNumber = elementsPathArr[i-1][2]+1;
            } else { // same element
                siblingNumber = elementsPathArr[i][2]+1;
            }
            path = path + ":nth-child("+siblingNumber+")";
            if(pre[0] == ele[0]) break;
        }
    }
    return path;
}

function highlightSimilar(targetElement,str){
    var similarElementsArr = [];
    var originalBackground;
    $($(targetElement).find(str)).each(function(){
        var tag = $($(this)[0]).prop("tagName").toLowerCase();
        var siblingNum = $(this).index();
        var found = $(this);
        originalBackground = $(this).css("background-color"); 
        if(!$(found).hasClass("added")){
            $(found).addClass("highlighted")
                    .css("background-color","yellow")
                    .css("border-radius","3px")
                    .css("opacity",0.8)
                    .css("border","2px solid yellow");
        }
    });
    addAllToDB(originalBackground); 
}

function checkSimilarTags(prefixArr){
    var isDifferent = false;
    var threshold = 0.4;
    for(var i=0; i<queue[0].length; i++){
        if(arraysEqual(queue[0][i],prefixArr[0]) && !isDifferent){
            if(i/queue[0].length >= threshold){
                var selectedFirst = $(queue[0][i][0] + ":eq(" + queue[0][i][1] + ")");
            } else {
                isDifferent = true;
            }
        }
    }

    for(var i=0; i<queue[1].length; i++){
        if(arraysEqual(queue[1][i],prefixArr[1]) && !isDifferent){
            if(i/queue[1].length >= threshold){
                var selectedSecond = $(queue[1][i][0] + ":eq(" + queue[1][i][1] + ")");
            } else {
                isDifferent = true;
            }
        }
    }

    for(var i=0; i<queue[2].length; i++){
        if(arraysEqual(queue[2][i],prefixArr[2]) && !isDifferent){
            if(i/queue[2].length >= threshold){
                var selectedThird = $(queue[2][i][0] + ":eq(" + queue[2][i][1] + ")");
            } else {
                isDifferent = true;
            } 
        }
    }
    return isDifferent;
}

function findSelectedTag(pathToSelected){
    var nodes = document.evaluate(pathToSelected, document, null, XPathResult.ANY_TYPE, null);
    var result = nodes.iterateNext();
    return result;
}

function makeTagArr(pathToSelected,result){
    var backwardsPath = pathToSelected;
    console.log(backwardsPath);
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
        currentTagName = $(nodesResult).prop("tagName").toLowerCase();
        siblingIndex = $(nodesResult).index(); //sibling number
        documentIndex = $(currentTagName).index(nodesResult); //whole document
        indexTagArr.unshift([currentTagName,documentIndex,siblingIndex]);
    }
    console.log(indexTagArr);
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
    var sameElement = false;
    var firstLength;
    var secondLength;
    var thirdLength;

    console.log(queue);

    if(queue[0][queue[0].length-1][0] == queue[1][queue[1].length-1][0] && queue[1][queue[1].length-1][0] == queue[2][queue[2].length-1][0]
            && queue[0][queue[0].length-1][2] == queue[1][queue[1].length-1][2] && queue[1][queue[1].length-1][2] == queue[2][queue[2].length-1][2]){
        firstLength = queue[0].length-1;
        secondLength = queue[1].length-1;
        thirdLength = queue[2].length-1;
        sameElement = true;
    } else {
        firstLength = queue[0].length-1;
        secondLength = queue[1].length-1;
        thirdLength = queue[2].length-1;
        sameElement = false;
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
                     console.log(queue[0][j]);
                     var prefixObject = {prePrefixElement: prePrefixElement, prefixArr: prefixArr, sameElement: sameElement};
                     console.log(prefixObject);
                     return prefixObject;
                 }
             }
         }
    }
}

function loadXMLDoc(){
    var xhr = new XMLHttpRequest();
    xhr.open("GET",$(location).attr('href'), false);
    xhr.send("");
    return xhr;
}

function update(pageUrl, value){
    chrome.extension.sendMessage({message: [pageUrl, value]}, function(response){
        console.log(response);
    });
}

function addToList(item){
    
    var val = item;
    var url = $(location).attr('href');
    update(url,val);
    console.log("added to table");
}



