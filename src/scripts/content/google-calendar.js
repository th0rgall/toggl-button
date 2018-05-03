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

function insertButtonModern(bubblecontent, description) {
  var link = togglbutton.createTimerLink({
    className: 'google-calendar-modern',
    description: description
  });
  bubblecontent.appendChild(link);
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

  if (title) {
    description = title.textContent;
    target = title.parentElement.previousSibling;
  }
  if (description) {
    insertButtonModern(target, description);
  }
});
