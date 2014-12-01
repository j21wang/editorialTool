var queue = new Array();
var groupMode = true;
var toolOn = true;
var isImg;
var isPopUp = false;
var originalBackground = null;
var Events = {
  ENTER: 13,
  LEFT_MOUSE: 1
};
var Config = {
  LINE_LENGTH: 20,
  MIN_NUM_HIGHLIGHTED: 3
};

$(document).ready(function(){
  // Sends a request to get the values stored in localStorage from the
  // user's previous session.
  chrome.runtime.sendMessage({method: 'getStatus'}, function(response) {
    toolOn = response.status.toolOn;
    groupMode = response.status.isGroupCheck;
    if (toolOn == true || toolOn == 'true') {
      turnToolOn();
    } else {
      turnToolOff();
    }
  });

  /*chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
    groupMode = message.isGroupCheck;
    toolOn = message.toolOn;
    sendResponse(message);
    if (toolOn == true || toolOn == 'true') {
      turnToolOn();
      window.location.reload();
    } else {
      turnToolOff();
    }
  });*/
});

function turnToolOn() {
  disableClick();
  enableClick();
  drag();
}

/**
 * Sometimes when trying to draw the line to highlight something,
 * the user may accidentally click on the link (if it is a link).
 * To avoid this problem, hold down the "enter" key to disable
 * all the click events on the page.
 */
function disableClick() {
  $(document).on('keydown', function(e) {
    if (e.which == Events.ENTER) {
      document.addEventListener('click', handler, true);
    }
  });
}

// Once the "enter" key is released, the click events are reenabled.
function enableClick() {
  $(document).on('keyup', function(e) {
    if (e.which == Events.ENTER) {
      document.removeEventListener('click', handler, true);
    }
  });
}

function turnToolOff() {
  $(document).unbind('dragstart drag dragend');
  $(document).off('keydown');
  $(document).off('keyup');
}

function drag() {
  $(document)
      .drag('start',function(ev, dd){
        // Adds a div (line) to the document on left mouse click.
        if (ev.which == Events.LEFT_MOUSE) {
          return $('<div class="selection" />').appendTo(document.body);
        }
      })
      .drag(function(ev, dd){
        // Specifies the position and dimensions of line on drag.
        $(dd.proxy).css({
          top: Math.min(ev.pageY, dd.startY),
          left: Math.min(ev.pageX, dd.startX),
          width: Math.abs(ev.pageX - dd.startX)
        });
      })
      .drag("end",function( ev, dd ){
        // Remove the line once drag event is over and highlight
        // the element that is directly under the halfway point of
        // line. The halfway point is used so that the user doesn't
        // need to be so precise when highlighting an element.
        var rect =  $('.selection')[0].getBoundingClientRect();
        var width = parseFloat($(dd.proxy).css('width'));
        $(dd.proxy).remove();
        var element = document.elementFromPoint(
            rect.left + rect.width / 2, rect.top);
        if (width > Config.LINE_LENGTH) highlight(element);
      });
}

function getSelectionHTML(sel){
  var container = document.createElement('div');
  for (var i = 0, len = sel.rangeCount; i < len; ++i) {
    container.appendChild(sel.getRangeAt(i).cloneContents());
  }
  var target = $(container);
  if($(sel.anchorNode).find('img').length > 0){
    isImg = true;
    return container.innerHTML;
  } else {
    isImg = false;
    return $(target)[0].innerText.trim();
  }
}

function checkImage(htmlChildren){
  var isImage = false;
  $(htmlChildren).each(function(){
    var tagName = $($(this)[0]).prop('tagName').toLowerCase();
    if(tagName == 'img') isImage = true;
  });
  return isImage;
}

function markAsAdded(html,isImage){
  $(html).addClass('recentAdded');
  if(!isImage){
    $('.recentAdded').css('border','2px solid red');
  } else {
    $('.recentAdded').find('img').css('border','2px solid red');
  } 
}

function handler(e) {
  e.stopPropagation();
  e.preventDefault();
}

function getPathTo(elm) { 
  var allNodes = document.getElementsByTagName('*'); 
  for (var segs = []; elm && elm.nodeType == 1; elm = elm.parentNode) { 
    for (i = 1, sib = elm.previousSibling; sib; sib = sib.previousSibling) { 
      if (sib.localName == elm.localName) i++; 
    }; 
    segs.unshift(elm.localName.toLowerCase() + '[' + i + ']'); 
  }; 
  return segs.length ? '/' + segs.join('/') : null; 
};

function highlight(htmlSelection){
  var isImage = false;
  var html = $(htmlSelection);
  var text = htmlSelection.innerText.trim();
  var pathToSelected;
  var added;

  if(text.indexOf('<img') != -1){
    isImg = true;
    var src = $(html).attr("src");
    addToList(src);
    markAsAdded(html,isImage);
    pathToSelected = "/html/body//img[@src='"+src+"']";
  } else {
    isImg = false;
    addToList(text);
    markAsAdded(html,isImage);
    pathToSelected = getPathTo(htmlSelection);
  }

  var result = findSelectedTag(pathToSelected);
  var tagArr = makeTagArr(pathToSelected,result);
  if(queue.length >= Config.MIN_NUM_HIGHLIGHTED &&
      (groupMode == "true" || groupMode == true)) queue = [];
  queue.push(tagArr);
  if(queue.length >= Config.MIN_NUM_HIGHLIGHTED &&
      (groupMode == "true" || groupMode == true)){
    var prefixObject = findSimilarPrefix(queue);
    var isDifferent = checkSimilarTags(prefixObject.prefixArr);
    if(!isDifferent){
      var prePrefixElement = prefixObject.prePrefixElement;
      var prefixArr = prefixObject.prefixArr;
      var prePrefix = $(prePrefixElement[0] + ":eq(" + prePrefixElement[1] + ")");
      var sameElement = prefixObject.sameElement;
      var foundSame = false;
      var elementsPathArr = [];
      var one = [];
      var two = [];
      var three = [];
      // push all elements into array after the first element they share
      for(var i = 0; i < queue[0].length; i++){
        var prePrefixTag = $($(prePrefix)[0]).prop("tagName").toLowerCase();
        var queueTag = $(queue[0][i][0] + ":eq(" + queue[0][i][1] + ")");
        if(foundSame) one.push(queue[0][i]);
        if($(queueTag)[0] == $(prePrefix)[0]) foundSame = true;
      }
      foundSame = false;
      for(var i = 0; i < queue[1].length; i++){
        var prePrefixTag = $($(prePrefix)[0]).prop("tagName").toLowerCase();
        var queueTag = $(queue[1][i][0] + ":eq(" + queue[1][i][1] + ")");
        if(foundSame) two.push(queue[1][i]);
        if($(queueTag)[0] == $(prePrefix)[0]) foundSame = true;
      }
      foundSame = false;
      for(var i = 0; i < queue[2].length; i++){
        var prePrefixTag = $($(prePrefix)[0]).prop("tagName").toLowerCase();
        var queueTag = $(queue[2][i][0] + ":eq(" + queue[2][i][1] + ")");
        if(foundSame) three.push(queue[2][i]);
        if($(queueTag)[0] == $(prePrefix)[0]) foundSame = true;
      }
      elementsPathArr = [one, two, three];
      var targetElement = $(prePrefix)[0];
      if(prePrefixElement[0] == "tbody" || prePrefixElement[0] == "table"){
        var path = findSimilar(targetElement,elementsPathArr,prefixObject,true);
        highlightSimilar(targetElement,path);
      } else {
        var path = findSimilar(targetElement,elementsPathArr,prefixObject,false);
        highlightSimilar(targetElement,path);
      }
    } else {
        //do nothing
    }
  }
}

function popUp(){
  var add = $("body").append("<div id='popup'></div>");
  $("#popup")
      .css("background-color","gray")
      .css("opacity","1")
      .css("width","300px")
      .css("height","100px")
      .css("position","fixed")
      .css("z-index", "9999999")
      .css("top","1em")
      .css("right","1em")
      .css("border-radius","3px")
      .attr("id","box");

  $("<center>" + 
      "<p id='selectText'>Add all to selected table?</p>" +
      "<button class='popupButton' id='okButton'>Add All</button>" +
      "<button class='popupButton' id='addOneButton'>Add Some</button>" + 
      "<button class='popupButton' id='cancelButton'>Deselect All</button>" +
      "</center>").appendTo("#box");
}

function addAllToDB(originalBackground){
  if($('.highlighted').length > 0){
    if (!isPopUp) {
      popUp();
      isPopUp = true;
    }
    var add = false;
    $("#okButton").click(function(){
      add = true;
      var addArr = [];
      isPopUp = false;
      $(".highlighted").each(function(){
        if(!isImg){
          var html = $(this).html();
          if(html.indexOf('"') > -1) html = html.replace(/"/g,"'");
          if(html != "") addArr.push(html);
        } else {
          var html = $(this).attr("src");
          if(html.indexOf('"') > -1) html = html.replace(/"/g,"'");
          if(html != "") addArr.push(html);
        }
      });
      addToList(addArr);
      $(".highlighted")
          .css("background-color",originalBackground)
          .css("border","2px solid red")
          .addClass("added")
          .removeClass("highlighted");
       queue = [];
       $("#box").remove();
    });

    $("#addOneButton").click(function(){
      isPopUp = false;
      $(".highlighted").hover(function(evt){
        var _this = this;
        setTimeoutConst = setTimeout(function(){
          addToList($(_this).html());
          $(_this)
              .css("background-color",originalBackground)
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
      isPopUp = false;
      $(".highlighted")
        .css("background-color",originalBackground)
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
  var sameElement = prefixObject.sameElement;
  for(var i=0; i<elementsPathArr[0].length; i++){
    var pre = $(prefixArr[0][0] + ":eq(" + prefixArr[0][1] + ")");
    var ele = $(elementsPathArr[0][i][0] + ":eq(" + elementsPathArr[0][i][1] + ")");
    path = path + " > " + elementsPathArr[0][i][0];
    if(pre[0] == ele[0] || (isTable && elementsPathArr[0][i][0] == "td" &&
          elementsPathArr[0][i][2] == elementsPathArr[1][i][2] &&
          elementsPathArr[0][i][2] == elementsPathArr[2][i][2])){
      if(!sameElement){ // not the same element
        siblingNumber = elementsPathArr[0][i-1][2] + 1;
      } else { // same element
        siblingNumber = elementsPathArr[0][i][2] + 1;
      }
      if(pre[0] == ele[0]) {
        path = path + ":nth-child("+siblingNumber+")";
        break;
      } else {
        path = path + ":nth-child("+siblingNumber+")";
      }
    }
  }
  return path;
}

function highlightSimilar(targetElement,str){
  var similarElementsArr = [];
  $($(targetElement).find(str)).each(function(){
    var tag = $($(this)[0]).prop("tagName").toLowerCase();
    var siblingNum = $(this).index();
    var found = $(this);
    originalBackground = $(this).css("background-color"); 
    if(!$(found).hasClass("recentAdded") && !$(found).hasClass("added")){
        $(found)
            .addClass("highlighted")
            .css("background-color","yellow")
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

  if(queue[0][queue[0].length-1][0] == queue[1][queue[1].length-1][0] &&
      queue[1][queue[1].length-1][0] == queue[2][queue[2].length-1][0] &&
      queue[0][queue[0].length-1][2] == queue[1][queue[1].length-1][2] &&
      queue[1][queue[1].length-1][2] == queue[2][queue[2].length-1][2]) {
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

  for(var j = firstLength; j >= 0; j--){
    for(var k = secondLength; k >= 0; k--){
      for(var l = thirdLength; l>=0; l--){
        if(queue[0][j][0] == queue[1][k][0] &&
            queue[0][j][0] == queue[2][l][0] &&
            queue[0][j][2] == queue[1][k][2] &&
            queue[0][j][2] == queue[2][l][2] && !entered){
           prefixArr.push(queue[0][j]);
           prefixArr.push(queue[1][k]);
           prefixArr.push(queue[2][l]);
           entered = true;
         }
         if(queue[0][j][0] == queue[1][k][0] &&
             queue[0][j][0] == queue[2][l][0] &&
             queue[0][j][1] == queue[1][k][1] &&
             queue[0][j][1] == queue[2][l][1]){
           prePrefixElement = queue[0][j];
           var prefixObject = {
             prePrefixElement: prePrefixElement,
             prefixArr: prefixArr,
             sameElement: sameElement
           };
           return prefixObject;
         }
       }
    }
  }
}

function updateDB(url, text){
  chrome.extension.sendMessage({method: 'updateDB', message: [url, text]},
      function(response){console.log(response)});
}

function addToList(text){
  var url = $(location).attr('href');
  updateDB(url, text);
}
