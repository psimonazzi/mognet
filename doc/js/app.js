// Some useful global stuff
(function() {

  function on(e, t, f) {
    if (e.addEventListener)
      e.addEventListener(t, f, false);
    else if (e.attachEvent)
      e.attachEvent('on' + t, f);
  }


  function stop(e) {
    e.preventDefault ? e.preventDefault() : e.returnValue = 0;
  }


  // Browser
  if (typeof window != 'undefined') {
    window.on = on;
    window.stop = stop;
  }

})();


// Lightbox v0.2.0
// Inspired by https://github.com/Xeoncross/kb_javascript_framework
(function() {
  var MODAL_OVERLAY_ID = 'modal-overlay';
  var MODAL_ID = 'modal';
  var MODAL_INSIDE_ID = 'modal-inside';
  var MODAL_LOADING_ID = 'modal-loading';
  var MODAL_INSIDE_LOADING_ID = 'modal-inside-loading';


  function modal(e) {
    // dark overlay
    var o = document.createElement('div');
    o.id = MODAL_OVERLAY_ID;

    // loading message
    var o2 = document.createElement('div');
    o2.id = MODAL_LOADING_ID;
    o2.innerHTML = '<div id="' + MODAL_INSIDE_LOADING_ID + '"><i class="icon-loading"></i></div>';

    // modal content
    var m = document.createElement('div');
    m.id = MODAL_ID;
    e.style ? m.appendChild(e) : m.innerHTML = e;

    // set position
    var y = window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop || -1;
    m.style.top = y >= 0 ? y + 'px' : '0';
    var h = document.documentElement.clientHeight - 2; // allow 2px tolerance
    m.style.height = h >= 0 ? h + 'px' : '100%';

    // Allow closing
    on(o, 'click', closeModal);
    on(o2, 'click', closeModal);
    on(m, 'click', closeModal);
    on(window, 'keydown', function(ev) {
      if (ev.keyCode == 27) //ESC
        closeModal();
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
  }


  function closeModal() {
    var e = document.getElementById(MODAL_ID);
    var e2 = document.getElementById(MODAL_LOADING_ID);
    var e3 = document.getElementById(MODAL_OVERLAY_ID);
    if (e) e.parentNode.removeChild(e);
    if (e2) e2.parentNode.removeChild(e2);
    if (e3) e3.parentNode.removeChild(e3);
  }


  function lightbox() {
    if (document.querySelectorAll) {
      var a = document.querySelectorAll("figure a");
      [].forEach.call(a, function(e) {
        on(e, 'click', function(ev) {
          modal('<div id="' + MODAL_INSIDE_ID + '"><img src="' + this.href + '" /></div>'); //onload="modalLoaded();"
          return stop(ev);
        });
      });
    }
  }


  // Enable
  on(document, "DOMContentLoaded", function() {
    lightbox();
  });

})();



// Keyboard controls
(function() {

  on(window, 'keydown', function(e) {
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
