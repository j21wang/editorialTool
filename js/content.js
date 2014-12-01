// queue contains the 3 highlighted elements
var queue = [];

// when groupMode is turned on, similar elements will highlight
// after 3 elements are highlighted
var groupMode = true;

// checks whether the tool is turned on (if the user can drag)
var toolOn = true;

// checks if popup from adding all to DB is already displayed
var isPopUp = false;

// need original background if user cancels highlight
var originalBackground = null;

// checks if what's highlighted is an image
var isImg;

var Events = {
  ENTER: 13,
  LEFT_MOUSE: 1
};

var Config = {
  LINE_LENGTH: 20,
  MIN_NUM_HIGHLIGHTED: 3,
  THRESHOLD_PERCENTAGE: 0.4
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

/**
 * Adds a red border around the element that has been added already.
 */
function markElementAsAdded(html) {
  $(html).addClass('recentAdded');
  $('.recentAdded').css('border', '2px solid red');
}

/**
 * Handler to disable click events when the user is dragging
 * across something clickable.
 */
function handler(e) {
  e.stopPropagation();
  e.preventDefault();
}

/**
 * Gets the path to a specified element.
 */
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
  var html = $(htmlSelection);
  var text = htmlSelection.innerText.trim();
  var pathToSelected;

  if(html[0].tagName == "IMG"){
    isImg = true;
    var src = $(html).attr('src');
    addToList(src);
    markElementAsAdded(html);
    pathToSelected = '/html/body//img[@src="' + src + '"]';
  } else {
    isImg = false;
    addToList(text);
    markElementAsAdded(html);
    pathToSelected = getPathTo(htmlSelection);
  }

  var result = findSelectedTag(pathToSelected);
  var tagArr = makeTagArr(pathToSelected,result);
  // queue is cleared after 3 elements are highlighted
  if(queue.length >= Config.MIN_NUM_HIGHLIGHTED &&
      (groupMode == "true" || groupMode == true)) {
    queue = [];
  }
  queue.push(tagArr);
  if(queue.length >= Config.MIN_NUM_HIGHLIGHTED &&
      (groupMode == "true" || groupMode == true)){
    var prefixObject = findSimilarPrefix(queue);
    var isDifferent = checkSimilarTags(prefixObject.prefixArr);
    if(!isDifferent){
      var prePrefixElement = prefixObject.prePrefixElement;
      var prePrefixSelection = $(prePrefixElement[0] + ":eq(" + prePrefixElement[1] + ")");
      var sameElement = prefixObject.sameElement;
      var elementsPathArr = [];
      var firstHighlighted = [];
      var secondHighlighted = [];
      var thirdHighlighted = [];

      // push all elements into array after their first common parent element
      var foundSame = false;
      for(var i = 0; i < queue[0].length; i++){
        var prePrefixTag = $($(prePrefixSelection)[0])
            .prop("tagName").toLowerCase();
        var queueTag = $(queue[0][i][0] + ":eq(" + queue[0][i][1] + ")");
        if(foundSame) firstHighlighted.push(queue[0][i]);
        if($(queueTag)[0] == $(prePrefixSelection)[0]) foundSame = true;
      }

      foundSame = false;
      for(var i = 0; i < queue[1].length; i++){
        var prePrefixTag = $($(prePrefixSelection)[0])
            .prop("tagName").toLowerCase();
        var queueTag = $(queue[1][i][0] + ":eq(" + queue[1][i][1] + ")");
        if(foundSame) secondHighlighted.push(queue[1][i]);
        if($(queueTag)[0] == $(prePrefixSelection)[0]) foundSame = true;
      }

      foundSame = false;
      for(var i = 0; i < queue[2].length; i++){
        var prePrefixTag = $($(prePrefixSelection)[0])
            .prop("tagName").toLowerCase();
        var queueTag = $(queue[2][i][0] + ":eq(" + queue[2][i][1] + ")");
        if(foundSame) thirdHighlighted.push(queue[2][i]);
        if($(queueTag)[0] == $(prePrefixSelection)[0]) foundSame = true;
      }

      elementsPathArr = [firstHighlighted, secondHighlighted, thirdHighlighted];
      var targetElement = $(prePrefixSelection)[0];
      // Need special case for tables because users will often want to
      // only highlight all the entries of one column in the table. Otherwise
      // the entire table or multiple columns could potentially highlight
      // if the elements in the table have the same tag name.
      if(prePrefixElement[0] == "tbody" || prePrefixElement[0] == "table"){
        var path = constructPath(elementsPathArr, prefixObject, true);
        highlightSimilar(targetElement, path);
      } else {
        var path = constructPath(elementsPathArr, prefixObject, false);
        highlightSimilar(targetElement, path);
      }
    }
  }
}

/**
 * Displays the pop up dialog that asks the user what he wants to
 * do with the multiple highlighted elements.
 */
function displayPopup(){
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

  // The "Add Some" button allows the user to manually add
  // the highlighted elements one by one by hovering over a
  // highlighted element.
  $("<center>" + 
      "<p id='selectText'>Add all to selected table?</p>" +
      "<button class='popupButton' id='okButton'>Add All</button>" +
      "<button class='popupButton' id='addOneButton'>Add Some</button>" + 
      "<button class='popupButton' id='cancelButton'>Deselect All</button>" +
      "</center>").appendTo("#box");
}

/**
 * Triggers after 3 similar elements are highlighted and other similar
 * elements on the page are automatically highlighted.
 */
function addAllToDB(originalBackground){
  if($('.highlighted').length > 0){
    if (!isPopUp) {
      displayPopup();
      isPopUp = true;
    }
    // Add all to database.
    $("#okButton").click(function(){
      var entriesToAdd = [];
      isPopUp = false;
      $(".highlighted").each(function(){
        if(!isImg){
          var html = $(this).html();
          if(html.indexOf('"') > -1) html = html.replace(/"/g,"'");
          if(html != "") entriesToAdd.push(html);
        } else {
          var html = $(this).attr("src");
          if(html.indexOf('"') > -1) html = html.replace(/"/g,"'");
          if(html != "") entriesToAdd.push(html);
        }
      });
      addToList(entriesToAdd);
      markAsAdded('.highlighted');
      queue = [];
      $("#box").remove();
    });

    // Add one at a time to database. User can hover over the
    // highlighted elements one at a time if he wants to add that
    // specific element to the database.
    $('#addOneButton').click(function(){
      isPopUp = false;
      $('.highlighted').hover(function(evt) {
        var _this = this;
        setTimeoutConst = setTimeout(function(){
          addToList($(_this).html());
          markAsAdded(_this);
        }, 1500); // user needs to over over for 1500 ms
      }, function() {
        clearTimeout(setTimeoutConst);
      });
      $('#box').remove();
    });

    // Unhighlight all.
    $('#cancelButton').click(function(){
      isPopUp = false;
      $('.highlighted')
        .css('background-color', originalBackground)
        .css('border','none')
        .removeClass('highlighted');
      $('#box').remove();
    });
  }
}

/**
 * Marks element on the page as added once it's in the database.
 */
function markAsAdded(selection) {
  $(selection)
      .css('background-color', originalBackground)
      .css('border', '2px solid red')
      .addClass('added')
      .removeClass('highlighted');
}

/**
 * Finds a common path from the 3 highlighted elements. The other
 * elements on the page that have this path will be highlighted.
 */
function constructPath(elementsPathArr, prefixObject, isTable){
  var path = '';
  var siblingNumber;
  var prefixArr = prefixObject.prefixArr;
  var sameElement = prefixObject.sameElement;
  for(var i = 0; i < elementsPathArr[0].length; i++){
    var pre = $(prefixArr[0][0] + ':eq(' + prefixArr[0][1] + ')');
    var ele = $(elementsPathArr[0][i][0] + ':eq(' + elementsPathArr[0][i][1] + ')');
    path = path + ' > ' + elementsPathArr[0][i][0];
    if(pre[0] == ele[0] || (isTable && elementsPathArr[0][i][0] == 'td' &&
          elementsPathArr[0][i][2] == elementsPathArr[1][i][2] &&
          elementsPathArr[0][i][2] == elementsPathArr[2][i][2])){
      if(!sameElement){ // not the same element
        siblingNumber = elementsPathArr[0][i-1][2] + 1;
      } else { // same element
        siblingNumber = elementsPathArr[0][i][2] + 1;
      }
      if(pre[0] == ele[0]) {
        path = path + ':nth-child(' + siblingNumber + ')';
        break;
      } else {
        path = path + ':nth-child(' + siblingNumber + ')';
      }
    }
  }
  return path;
}

/**
 * Highlights other elements that are similar to the 3 that were
 * manually highlighted by the user.
 */
function highlightSimilar(targetElement, path){
  $($(targetElement).find(path)).each(function(){
    var found = $(this);
    originalBackground = $(this).css('background-color'); 
    if(!$(found).hasClass('recentAdded') && !$(found).hasClass('added')){
        $(found).addClass('highlighted');
    }
  });
  addAllToDB(originalBackground); 
}

/**
 * Checks for the similarity of the highlighted elements' paths.
 * An element's depth in the dom must exceed a configured threshold
 * for this to work. This is to avoid picking up elements that are
 * too general.
 */
function checkSimilarTags(prefixArr){
  var isDifferent = false;
  for(var i = 0; i < queue[0].length; i++){
    if(arraysEqual(queue[0][i], prefixArr[0]) && !isDifferent){
      if(i / queue[0].length < Config.THRESHOLD_PERCENTAGE){
        isDifferent = true;
      }
    }
  }
  for(var i=0; i<queue[1].length; i++){
    if(arraysEqual(queue[1][i], prefixArr[1]) && !isDifferent){
      if(i / queue[1].length < Config.THRESHOLD_PERCENTAGE){
        isDifferent = true;
      }
    }
  }
  for(var i=0; i<queue[2].length; i++){
    if(arraysEqual(queue[2][i], prefixArr[2]) && !isDifferent){
      if(i / queue[2].length < Config.THRESHOLD_PERCENTAGE){
        isDifferent = true;
      } 
    }
  }
  return isDifferent;
}

function findSelectedTag(pathToSelected) {
  var nodes = document.evaluate(pathToSelected, document, null,
      XPathResult.ANY_TYPE, null);
  return nodes.iterateNext();
}

/**
 * Makes an array of all the elements that are in the path
 * to the highlighted element.
 */
function makeTagArr(pathToSelected, result) {
  var backwardsPath = pathToSelected;
  var currentTagName = $(result).prop("tagName").toLowerCase();
  var siblingIndex = $(result).index();
  var documentIndex = $(currentTagName).index(result);
  var tagArr = [];
  tagArr.unshift([currentTagName,documentIndex,siblingIndex]);

  // going backwards to html tag from selected tag
  while(currentTagName != "html"){
    backwardsPath = backwardsPath + "/parent::*";
    var nodes = document.evaluate(backwardsPath, document, null,
        XPathResult.ANY_TYPE, null);
    var nodesResult = nodes.iterateNext();
    currentTagName = $(nodesResult).prop("tagName").toLowerCase();
    siblingIndex = $(nodesResult).index(); //sibling num
    documentIndex = $(currentTagName).index(nodesResult); //whole document num
    tagArr.unshift([currentTagName,documentIndex,siblingIndex]);
  }
  return tagArr;
}

/**
 * Compares the contents of two arrays to determine whether
 * or not they're equal.
 */
function arraysEqual(a, b){
  if(a === b) return true;
  if(a == null || b == null) return false;
  if(a.length != b.length) return false;
  for(var i = 0; i < a.length; ++i){
    if(a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * queue contains 3 arrays; each array contains the path to a
 *   highlighted element
 * queue[i] contains the array, which contains the path of the ith
 *   element highlighted
 * queue[i][queue[i].length - 1] is the highlighted element
 * queue[i][queue[i].length - 1][0] is the highlighted element's tag
 * queue[i][queue[i].length - 1][2] is the nth child number that element is
 *   respective to its parent
 * From the 3 elements highlighted consecutively, it checks if
 * they all have the same tag name and are the same sibling number.
 * If so, it means that the rest of the tags on the same webpage that
 * follow the same pattern will eventually be highlighted as well.
 */
function isSameElement(queue) {
  if(queue[0][queue[0].length - 1][0] == queue[1][queue[1].length - 1][0] &&
      queue[1][queue[1].length - 1][0] == queue[2][queue[2].length - 1][0] &&
      queue[0][queue[0].length - 1][2] == queue[1][queue[1].length - 1][2] &&
      queue[1][queue[1].length - 1][2] == queue[2][queue[2].length - 1][2]) {
    return true;
  }
  return false;
}

/**
 * Finds a similar prefix using the sibling numbers of the
 * highlighted elements.
 */
function findSimilarPrefix(queue){
  var foundSamePrefix = false;
  // the first ancestor that contains the 3 highlighted elements
  var prePrefixElement;
  var commonPrefix = [];
  var firstLength = queue[0].length - 1;
  var secondLength = queue[1].length - 1;
  var thirdLength = queue[2].length - 1;
  var sameElement = isSameElement(queue);

  for(var j = firstLength; j >= 0; j--){
    for(var k = secondLength; k >= 0; k--){
      for(var l = thirdLength; l >= 0; l--){
        // Looks for the most specific common prefix from the
        // 3 highlighted elements.
        if(queue[0][j][0] == queue[1][k][0] &&
            queue[0][j][0] == queue[2][l][0] &&
            queue[0][j][2] == queue[1][k][2] &&
            queue[0][j][2] == queue[2][l][2] && !foundSamePrefix){
           commonPrefix.push(queue[0][j]); // element tag name
           commonPrefix.push(queue[1][k]); // element number
           commonPrefix.push(queue[2][l]); // child number
           foundSamePrefix = true;
         }
         // Goes up the DOM to look for the first common element that
         // contains the 3 highlighted elements.
         if(queue[0][j][0] == queue[1][k][0] &&
             queue[0][j][0] == queue[2][l][0] &&
             queue[0][j][1] == queue[1][k][1] &&
             queue[0][j][1] == queue[2][l][1]){
           prePrefixElement = queue[0][j];
           var prefixObject = {
             prePrefixElement: prePrefixElement,
             prefixArr: commonPrefix,
             sameElement: sameElement
           };
           return prefixObject;
         }
       }
    }
  }
}

/**
 * Prepares a message with the text entry to be added to the database.
 */
function addToList(text){
  var url = $(location).attr('href');
  chrome.extension.sendMessage({method: 'updateDB', message: [url, text]});
}
