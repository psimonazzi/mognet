var util = require('util');
var url = require('url');

var utils = require('../lib/utils');
var renderer = require('../lib/renderer');
var handlers = require('../lib/handlers');
var Σ = require('../lib/state');


/**
 * Check if the HTTP request is from a known mobile User Agent.
 * Copy/pasted from http://detectmobilebrowsers.com
 *
 * @param {Object} req HTTP request. Should have a field 'headers.user-agent' representing the User Agent string (otherwise returns false)
 *
 * @return {Boolean} True if the User Agent is mobile, false otherwise
 *
 * @api private
 */
exports.mobileCheck = function mobileCheck(req) {
  if (!req.headers || !req.headers['user-agent'])
    return false;
  var a = req.headers['user-agent'].toLowerCase();
  return (/android.+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|meego.+mobile|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(di|rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)));
};


/**
 * Parse a HTTP request.
 *
 * @param {Object} req Request
 *
 * @return {Object} A route object containing the normalized url of the resource, output type (i.e. html or json), medium type (i.e. hi or lo spec)
 *
 * @api public
 */
exports.parse = function parse(req) {
  var route = {
    'url': null,
    'output': null,
    'medium': null,
    'contentType': null
  };
  var acceptTypes = {
    'text/html': 'html',
    'application/json': 'json'
  };
  var contentTypes = {
    'html': 'text/html',
    'json': 'application/json',
    'xml': 'application/xml'
  };

  var parsedUrl = url.parse(req.url);
  var pathname = parsedUrl.pathname.replace(/^\//, '');
  var idxDot = pathname.lastIndexOf('.');
  if (idxDot < 0)
    idxDot = Infinity;
  var idxSlash = pathname.indexOf('/');
  if (idxSlash < 0)
    idxSlash = Infinity;
  var idx = Math.min(idxDot, idxSlash);
  route.url = idx > 0 && idx <= pathname.length ? pathname.substring(0, idx) : pathname;

  if (!route.output) {
    var hasExt = /\.(.+?)$/i.exec(parsedUrl.pathname);
    if (hasExt && hasExt[1] && Object.keys(contentTypes)[hasExt[1].toLowerCase()]) {
      route.output = hasExt[1].toLowerCase();
    }
  }
  if (!route.output && req.headers && req.headers['accept']) {
    for (var i in acceptTypes) {
      if (req.headers['accept'].indexOf(i) > -1) {
        route.output = acceptTypes[i];
        break;
      }
    }
  }
  if (!route.output) {
    route.output = 'html';
  }

  route.contentType = contentTypes[route.output];

  if (exports.mobileCheck(req))
    route.medium = 'lo-spec';
  else
    route.medium = 'hi-spec';

  return route;
};


/**
 * Return the response body as text and any appropriate HTTP header, based on the request.
 * Do whatever it takes.
 *
 * @param {Object} req Request
 * @param {Function} done Callback with signature: error, resource string, route object
 *
 * @api public
 */
exports.getResource = function getResource(req, done) {
  var route = exports.parse(req);
  exports.getRoutedResource(req, route, done);
};


/**
 * Return the response body as text, based on the route object created from a request.
 * Do whatever it takes.
 *
 * @param {Object} route Route
 * @param {Function} done Callback with signature: error, resource string, route object
 *
 * @api public
 */
exports.getRoutedResource = function getRoutedResource(req, route, done) {
  var resource = renderer.render(route);
  if (resource) {
    // Cache HIT!
    done(null, resource, route);
  }
  else {
    // Oh snap! We need to render this for the first time
    var ctx;
    try {
      ctx = exports.context(route, req);
    } catch (err) {
      // Aaargh! This will bubble up to the client and result in an HTTP error code
      done(err);
      return;
    }

    // Render this resource for the first time. Maybe read template from disk and/or compile
    renderer.renderNew(route, ctx, done);
  }
};


/**
 * Get context for this request. Context is extracted mainly from an indexed document, plus global/extra params.
 * Context fields:
 * - all the document fields
 * - all the required handlers fields
 * - 'menu': the menu handler object, only for HTML rendering
 * - 'route': the route object
 * - pagination and related links fields
 *
 * @param {Object} route Route
 * @param {Object} req Request
 *
 * @return {Object} Context for the request. Could be empty. An error is thrown if there was an error in getting context. The error.status will be 404 if the document was not found in the index, or 500 otherwise.
 *
 * @api public
 *
 */
exports.context = function context(route, req) {
  // Get from index
  var ctx, doc, handled;
  try {
    doc = Σ.index.id[route.url];
    ctx = doc;
  }
  catch (e) {

  }

  // If the document was found but is flagged 'secret', return Forbidden
  if (doc && doc.secret) {
    var errSecret = new Error();
    errSecret.status = 403;
    if (Σ.cfg.verbose) console.log('(Router) Denied request %s for secret document %s', route.url, doc.id);
    throw errSecret;
  }

  // Any special data required by the template associated to this route must be provided by a handler.
  // This includes any context not provided by the doc itself (if any), such as dynamic content.
  // In case there is no indexed doc for this route, any necessary context will be provided by the handler.
  if (handlers[route.url])
    handled = handlers[route.url](req);

  if (!doc && !handled) {
    // No indexed doc and no handlers for this route... sadly we have to give up
    // TODO log '404 Not Found (' + route.url + ')'
    var err = new Error();
    err.status = 404;
    throw err;
  }

  // Merge context from index and/or handlers
  if (!ctx)
    ctx = {};
  utils.extend(ctx, doc);
  utils.extend(ctx, handled);
  // Add route
  ctx.route = route;

  // Finally, transform or update the context as necessary for rendering.
  // This involves adding all extra params from request data.
  // Also pull in context for any global templates (menus, archive...) if needed.
  if (route.output == 'html') {
    ctx.menu = handlers['menu'](req);
  }

  // Additional data for articles
  if (doc && !doc.doc) {
    if (Σ.index['n']) {
      // Dates display
      ctx.timeTag = util.format("%s-%s-%s",
                                doc.modified.getFullYear(),
                                utils.pad(doc.modified.getMonth() + 1, 2),
                                utils.pad(doc.modified.getDay() + 1, 2));
      ctx.displayDate = util.format("%s / %s /%s",
                                    utils.pad(doc.modified.getDay() + 1, 2),
                                    utils.pad(doc.modified.getMonth() + 1, 2),
                                    doc.modified.getFullYear());
      ctx.displayTime = util.format("%s:%s:%s.%s",
                                    utils.pad(doc.modified.getHours(), 2),
                                    utils.pad(doc.modified.getMinutes(), 2),
                                    utils.pad(doc.modified.getSeconds(), 2),
                                    utils.pad(doc.modified.getMilliseconds(), 3));

      // Tags display
      // Related articles data
      if (doc.tag.length > 0) {
        ctx.tag = doc.tag.map(function(t) {
          return { 'name': t, 'href': encodeURIComponent(t) };
        });
      }

      // Pagination
      var nextN = utils.rangeCheck(doc.n + 1, Σ.index.n.length);
      ctx.nextId = nextN != null ? Σ.index.n[nextN] : '';
      if (ctx.nextId && Σ.index.id[ctx.nextId])
        ctx.nextTitle = Σ.index.id[ctx.nextId].title;
      var prevN = utils.rangeCheck(doc.n - 1, Σ.index.n.length);
      ctx.prevId = prevN != null ? Σ.index.n[prevN] : '';
      if (ctx.prevId && Σ.index.id[ctx.prevId])
        ctx.prevTitle = Σ.index.id[ctx.prevId].title;
    }

    // Related articles data
    if (doc.rel.length > 0) {
      ctx.hasRlinks = true;
      ctx.rlinks = doc.rel.map(function(id) {
        if (Σ.index.id[id]) {
          return {
            'href': id,
            'title': Σ.index.id[id].title
          };
        }
        else {
          if (Σ.cfg.verbose) console.error('(Router) No title found for related id %s in %s', id, doc.id);
          return {
            'href': id,
            'title': ''
          };
        }
      });
    }
  }

  return ctx;
};
