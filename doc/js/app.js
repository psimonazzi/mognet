// Just an epsilon of a Javascript library. For modern browsers
(function() {
  if (typeof ε === 'undefined' || ε === null) {
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
  // When clicking on a link to an image in a <figure> element, shows the full-size image centered on screen and overlayed on the current page.
  // Inspired by https://github.com/Xeoncross/kb_javascript_framework
  ε.lightbox = (function() {
    var me = {};
    var MODAL_OVERLAY_ID = 'modal-overlay';
    var MODAL_ID = 'modal';
    var MODAL_INSIDE_ID = 'modal-inside';
    var MODAL_LOADING_ID = 'modal-loading';
    var MODAL_INSIDE_LOADING_ID = 'modal-inside-loading';

    function modal(e) {
      // background overlay
      var o = document.createElement('div');
      o.id = MODAL_OVERLAY_ID;

      // loading message
      var o2 = document.createElement('div');
      o2.id = MODAL_LOADING_ID;
      o2.innerHTML = '<div id="' + MODAL_INSIDE_LOADING_ID + '"><i class="icon-loading"></i></div>';

      // modal content
      var m = document.createElement('div');
      m.id = MODAL_ID;
      // argument could be an HTML string or a DOM element
      e.style ? m.appendChild(e) : m.innerHTML = e;

      // set position
      var y = window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop || -1;
      m.style.top = y >= 0 ? y + 'px' : '0';
      var h = document.documentElement.clientHeight - 2; // allow 2px tolerance
      m.style.height = h >= 0 ? h + 'px' : '100%';

      // Allow closing
      ε.on(o, 'click', closeModal);
      ε.on(o2, 'click', closeModal);
      ε.on(m, 'click', closeModal);
      ε.on(window, 'keydown', function(ev) {
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
    };


    function closeModal() {
      var e = document.getElementById(MODAL_ID);
      var e2 = document.getElementById(MODAL_LOADING_ID);
      var e3 = document.getElementById(MODAL_OVERLAY_ID);
      if (e) e.parentNode.removeChild(e);
      if (e2) e2.parentNode.removeChild(e2);
      if (e3) e3.parentNode.removeChild(e3);
    };


    me.init = function init() {
      if (document.querySelectorAll) {
        var a = document.querySelectorAll('figure a');
        [].forEach.call(a, function(e) {
          ε.on(e, 'click', function(ev) {
            modal('<div id="' + MODAL_INSIDE_ID + '"><img src="' + this.href + '" /></div>'); //onload="modalLoaded();"
            return ε.stop(ev);
          });
        });
      }
    };


    return me;
  })();


  // Set global
  if (typeof window != 'undefined') {
    window.ε = ε;
  }
})();



// Invocations
(function() {

  ε.on(document, 'DOMContentLoaded', function() {
    // Enable lightbox
    ε.lightbox.init();

    // Keyboard controls
    // Enable only if there are prev/next links
    if (document.querySelectorAll('a[rel=prev]').length > 0 || document.querySelectorAll('a[rel=next]').length > 0) {
      ε.on(window, 'keydown', function(e) {
        function changeLocation(dir) {
          var href = document.querySelectorAll('a[rel=' + (dir === 'prev' ? 'prev' : 'next') + ']')[0].href;
          window.location = href;
        }

        function ifEndOfPage(fn, arg) {
          var scrolled = window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop || -1;
          var height = document.body.clientHeight - window.innerHeight;
          if (height - scrolled < 100) {
            // can't scroll down anymore, we are at the end of the page
            fn(arg);
          }
        };

        switch (e.keyCode) {
        case 32: //space
          // space scrolls down by default, but if we reach end of page loads next page
          ifEndOfPage(changeLocation, 'next');
          break;
        case 74: // J
          changeLocation('next');
          break;
        case 75: // K
          changeLocation('prev');
          break;
        }
      });
    }
  });

})();
