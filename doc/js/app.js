// Just an epsilon of a Javascript library. For modern browsers
(function() {
  if (typeof ε === "undefined" || ε === null) {
    var ε = {};
  }


  // Cross-browser event listener
  ε.on = function(e, t, f) {
    if (e.addEventListener)
      e.addEventListener(t, f, false);
    else if (e.attachEvent)
      e.attachEvent('on' + t, f);
  };


  // Cross-browser event bubble prevent
  ε.stop = function(e) {
    e.preventDefault ? e.preventDefault() : e.returnValue = 0;
  };


  // A modal box.
  // When clicking on a <figure> link to an image, shows the full-size image centered on screen and overlayed on the current page.
  // Inspired by https://github.com/Xeoncross/kb_javascript_framework
  ε.lightbox = {};

  ε.lightbox.MODAL_OVERLAY_ID = 'modal-overlay';
  ε.lightbox.MODAL_ID = 'modal';
  ε.lightbox.MODAL_INSIDE_ID = 'modal-inside';
  ε.lightbox.MODAL_LOADING_ID = 'modal-loading';
  ε.lightbox.MODAL_INSIDE_LOADING_ID = 'modal-inside-loading';

  ε.lightbox.modal = function modal(e) {
    // dark overlay
    var o = document.createElement('div');
    o.id = ε.lightbox.MODAL_OVERLAY_ID;

    // loading message
    var o2 = document.createElement('div');
    o2.id = ε.lightbox.MODAL_LOADING_ID;
    o2.innerHTML = '<div id="' + ε.lightbox.MODAL_INSIDE_LOADING_ID + '"><i class="icon-loading"></i></div>';

    // modal content
    var m = document.createElement('div');
    m.id = ε.lightbox.MODAL_ID;
    e.style ? m.appendChild(e) : m.innerHTML = e;

    // set position
    var y = window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop || -1;
    m.style.top = y >= 0 ? y + 'px' : '0';
    var h = document.documentElement.clientHeight - 2; // allow 2px tolerance
    m.style.height = h >= 0 ? h + 'px' : '100%';

    // Allow closing
    ε.on(o, 'click', ε.lightbox.closeModal);
    ε.on(o2, 'click', ε.lightbox.closeModal);
    ε.on(m, 'click', ε.lightbox.closeModal);
    ε.on(window, 'keydown', function(ev) {
      if (ev.keyCode == 27) //ESC
        ε.lightbox.closeModal();
    });

    document.body.appendChild(o);
    document.body.appendChild(o2);

    setTimeout(function() {
      document.body.appendChild(m);
      /*if (e = document.getElementById('lb-close')) {
       on(e, 'click', function(ev) {
       closeModal();
       return stop(ev);
       });
       }*/
    }, 10);
  };


  ε.lightbox.closeModal = function closeModal() {
    var e = document.getElementById(ε.lightbox.MODAL_ID);
    var e2 = document.getElementById(ε.lightbox.MODAL_LOADING_ID);
    var e3 = document.getElementById(ε.lightbox.MODAL_OVERLAY_ID);
    if (e) e.parentNode.removeChild(e);
    if (e2) e2.parentNode.removeChild(e2);
    if (e3) e3.parentNode.removeChild(e3);
  };


  ε.lightbox.init = function init() {
    if (document.querySelectorAll) {
      var a = document.querySelectorAll("figure a");
      [].forEach.call(a, function(e) {
        ε.on(e, 'click', function(ev) {
          ε.lightbox.modal('<div id="' + ε.lightbox.MODAL_INSIDE_ID + '"><img src="' + this.href + '" /></div>'); //onload="modalLoaded();"
          return ε.stop(ev);
        });
      });
    }
  };


  // Set global
  if (typeof window != 'undefined') {
    window.ε = ε;
  }
})();



// Invocations
(function() {

  // Enable lightbox
  ε.on(document, "DOMContentLoaded", function() {
    ε.lightbox.init();
  });


  // Keyboard controls
  ε.on(window, 'keydown', function(e) {
    switch (e.keyCode) {
    case 32: //space
      // space scrolls down by default, but if we reach end of page loads next page
      var scrolled = window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop || -1;
      var height = document.body.clientHeight - window.innerHeight;
      if (height - scrolled < 100) {
        console.log("WOULD LOAD NEXT (" + height + " - " + scrolled + ")");
      }
      break;
    }
  });

})();






// (function($) {

//   var Events = {
//     "MSG": "app.msg"
//   }
//   var MessageClass = {
//     "INFO": "info",
//     "WARN": "warn",
//     "ERROR": "error"
//   }

//   /*$.subscribe(Events.MSG, function(t, msg) {
//     $("#msg-content").html(msg);
//     $("#msg").attr("class", t);
//     });*/

//   /*
//     document.addEventListener('keydown', function(e) {
//     switch (e.keyCode) {
//     case 13: // ENTER. ESC should also take you out of fullscreen by default.
//     e.preventDefault();
//     document.cancelFullScreen(); // explicitly go out of fs.
//     break;
//     case 70: // f
//     enterFullscreen();
//     break;
//     }
//     }, false);
//   */
//   // JQuery Hotkeys plugin required
//   $(document).bind('keydown', 'g', function(e) {gridToggle(24);});
//   $(document).bind('keydown', 'shift+g', function(e) {gridToggle(27);});
//   $(document).bind('keydown', 'h', function(e) {helpToggle();});
//   $(document).bind('keydown', 'e', function(e) {
//     $("#msg-content").html("Hotkey");
//     if ($("#msg").hasClass("hidden"))
//       $("#msg").removeClass().addClass("floating").addClass(MessageClass.ERROR);
//     else
//       $("#msg").removeClass().addClass("floating").addClass("hidden");
//   });
//   $(document).bind('keydown', 's', function(e) { styleTester("+"); });
//   $(document).bind('keydown', 'shift+s', function(e) { styleTester("-"); });
//   /*$(document).bind('keydown', 'space', function(e) {
//     // space scrolls down by default, but if we reach end of page loads next page
//     var scrolled = $(window).scrollTop();
//     var height = $(document).height() - $(window).height();
//     console.log("scrolled: " + $(window).scrollTop() + ", document height: " + $(document).height() + ", window height: " + $(window).height());
//     if (height - scrolled < 100) {
//       console.log("WOULD LOAD NEXT");
//     }
//   });*/

//   $(document).ready(function() {
//     $("#help-toggle").click(helpToggle);
//     //$.publish(Events.MSG, [MessageClass.ERROR, "Errore!!!"]);
//     $("[data-fav]").click(favToggle);
//   });


//   // Closure to hold function state
//   var gridToggle;
//   (function() {
//     var gridIsVisible = false; // becomes like global in scope
//     gridToggle = function(size) {
//       if (gridIsVisible)
// 	$("body, header, footer").css("background-image", "none");
//       else
// 	$("body, header, footer").css("background-image", "url(img/grid1140-" + size + ".png)")
// 	.css("background-position", "top center").css("background-repeat", "repeat-y");
//       //TODO: overlay a div with the grid in background, semitransparent
//       gridIsVisible = !gridIsVisible;
//       return false;
//     };
//   })();

//   function helpToggle() {
//     $("#controls-menu").toggleClass("hidden");
//     return false;
//   }

//   // Closure to hold function state
//   var styleTester;
//   (function() {
//     var STYLE_COUNT = 8;
//     var idx = 0; // becomes like global in scope
//     styleTester = function(dir) {
//       (dir == "+") ? idx++ : idx--;
//       if (idx >= STYLE_COUNT)
// 	idx = 0;
//       if (idx < 0)
// 	idx = STYLE_COUNT-1;
//       $("h2, aside, .nav li").attr("class", "s"+idx);
//       return false;
//     };
//   })();

//   function favToggle(e) {
//     $el = $(this);
//     if ($el.attr("data-fav") == 0) {
//       $el.html("&#x2605;");
//       $el.attr("data-fav", "1");
//       // $.publish("added-to-favorites");
//       $favCount = $("#fav sup");
//       $favCount.html($favCount.html() == "" ? "1" : String(parseInt($favCount.html()) + 1)); //$favCount.html() + 1
//     }
//     else {
//       $el.html("&#x2606;");
//       $el.attr("data-fav", "0");
//       // $.publish("removed-from-favorites");
//       $favCount = $("#fav sup");
//       $favCount.html($favCount.html() == "" ? "" : String(parseInt($favCount.html()) - 1));
//       if ($favCount.html() == "0")
// 	$favCount.html("");
//     }
//     e.preventDefault();
//   }

// })(jQuery);
