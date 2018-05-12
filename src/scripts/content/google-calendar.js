/*jslint indent: 2 */
/*global $: false, document: false, togglbutton: false, MutationObserver: false, HTMLIFrameElement: false*/
'use strict';

function insertButton(bubblecontent, description) {
  var link = togglbutton.createTimerLink({
    className: 'google-calendar',
    description: description
  });
  bubblecontent.insertBefore(link, bubblecontent.firstChild);
}

// Detail view
togglbutton.render('.ep:not(.toggl)', {observe: true}, function (elem) {
  var description, togglButtonElement;

  togglButtonElement = $('.ep-dpc', elem);
  description = $('.ep-title input', elem).value;

  insertButton(togglButtonElement, description);
});

// Popup view
togglbutton.render('.bubblecontent:not(.toggl)', {observe: true}, function (elem) {
  // Goal view  
  var description, goal = $('.title-text', elem), event = $('#mtb', elem);
  if (goal) {
    description = goal.textContent;
  }
  // Event view
  if (event) {
    description = event.textContent;
  }

  if (description) {
    insertButton(elem, description);
  }
});

// Popup view for Tasks
// we subscribe here for DOM changes, so we could get tasks IFrames with description info
var observer = new MutationObserver(function (mutations) {
  mutations.filter(function (mutation) {
    //tasks iframes are only one without id or class
    var iframe = Array.from(mutation.addedNodes.values()).find(function (node) {
      return node instanceof HTMLIFrameElement && node.id.length === 0 && node.className.length === 0;
    });
    if (iframe) {
      iframe.onload = function () {
        var taskname = $('.b', this.contentDocument),
          bubblecontent = this.parentElement.parentElement.parentElement; //got to .bubblecontent so button styles be the same
        if (bubblecontent.classList.contains("bubblecontent")) {
          insertButton(bubblecontent, taskname.textContent);
        }
      };
    }
  });
});

observer.observe($('body'), { childList: true, subtree: true });

//Google Calendar Modern

function insertButtonModern(bubblecontent, description, startDate, stopDate) {
  var link = togglbutton.createTimerLink({
    className: 'google-calendar-modern',
    description: description,
    startDate: startDate,
    stopDate: stopDate
  });
  bubblecontent.appendChild(link);
}


// @param titleElement: the span element that represent the title from the popup view
// @return object of the form {startDate, endDate}
function getDates(titleElement) {

  // function: if dependency exists, return the assignee, otherwise return null
  // to avoid null dereferences
  const dependOn = (dependency, assignee) => {
    if (dependency) {
      return assignee;
    } else {
      return null;
    }
  }

  let topHalf = dependOn(titleElement, titleElement.parentElement.parentElement.parentElement);
  let bottomHalf = dependOn(topHalf, topHalf.nextSibling);

  // navigate down
  let timeInfo = dependOn(bottomHalf, bottomHalf.firstChild);
  let timeContainer = dependOn(timeInfo, timeInfo.children[1]); // TODO: make this null-resistent
  let dateContainer = dependOn(timeContainer, timeContainer.firstChild)

  // extracts: 
  /*
  0: "Friday, 4 May08:00 – 10:30"   --> source string
  1: "Friday"
  2: "4"
  3: "May"
  4: "08:00"
  5: "10:30"
  */
  let dateTokens = /(\w+), (\d{1,2}) (\w+)(\d\d:\d\d) – (\d\d:\d\d)/.exec(dateContainer.textContent);

  // TODO: support crazy events like: 'Sat, 21 April, 21:30 – Sun, 22 April, 05:00' (copied from web page directly)

  let monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  let startDate = new Date(
      (new Date()).getFullYear() , // current year
      monthNames.indexOf(dateTokens[3]), // month from the tokens
      dateTokens[2], // day
      dateTokens[4].substring(0,2), // hours
      dateTokens[4].substring(3,5), // minutes
    );

  let stopDate = new Date(
    (new Date()).getFullYear() , // current year
    monthNames.indexOf(dateTokens[3]), // month from the tokens
    dateTokens[2], // day
    dateTokens[5].substring(0,2), // hours
    dateTokens[5].substring(3,5), // minutes
  );

  return {startDate, stopDate};
}

// Popup view Google Calendar Modern

/*

Data chips ==> selector for the pop-up view in general

exept for some div structure navigation, there are no easy attribute selectors for date and or start time or end time
while less clean, it should be more efficient (no api call)
and even less work

there is a data-eventid attr in a div in the popup

*/

togglbutton.render('div[data-chips-dialog="true"]', {observe: true}, function (elem) {
  if ($('.toggl-button', elem)) {
    return;
  }

  // this selector grabs the title of the event from the pop-up view
  var title = $('span[role="heading"]', elem), target = elem, description;

  // won't do anything without a title or description found
  // title is used to place it on top of that, no actual toggl parameter

  let dates = getDates(title);
  let startDate = dates.startDate, stopDate = dates.stopDate;

  if (title) {
    description = title.textContent;
    target = title.parentElement.previousSibling;
  }
  if (description) {
    if (startDate) {
      if (stopDate) {
        insertButtonModern(target, description, startDate, stopDate);
        return;
      }
      insertButtonModern(target, description, startDate);
      return;
    }
    insertButtonModern(target, description);
  }
});
