var util = require('util');
var url = require('url');

var logger = require('./logger');
var utils = require('./utils');
var renderer = require('./renderer');
var handlers = require('./handlers');
var Σ = require('./state');


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
 * @return {Object} A route object containing the normalized url of the resource, output type (i.e. html or json), medium type (i.e. hi or lo spec), HTTP Content-type header and the unique key used to lookup the resource from cache.
 *
 * @api public
 */
exports.parse = function parse(req) {
  var route = {
    url: null,
    output: null,
    hiSpec: null,
    medium: null,
    contentType: null,
    key: null,
    parsedUrl: null,
    pathname: null,
    page: null,
    filter: null,
    filterType: null,
    baseUrl: null,
    noCache: null
  };
  var acceptTypes = {
    'text/html': 'html',
    'application/json': 'json'
  };
  var contentTypes = {
    html: 'text/html',
    json: 'application/json',
    xml: 'text/xml'
  };

  exports.canonicalize(req, route);

  if (!route.output) {
    var hasExt = /\.(.+?)$/i.exec(route.parsedUrl.pathname);
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
    route.hiSpec = false;
  else
    route.hiSpec = true;

  return route;
};


/**
 * Adds to the passed route object the canonical form of the given url, discarding unneeded url elements. Setting a fake path and/or query could result in a lot of duplicated cache entries or DOS attacks. Ex. /{id}/non/existent/path would add a duplicated cache entry for {id}. This function is aware of the semantic value of the given url. The canonical url can be used as a unique key to identify the resource the url points to, and for resource cache lookups.
 * The canonical url will still be encoded as a url.
 * This function also adds to the passed route object any context-specific params that can be parsed from the url.
 *
 * @param {Object} req HTTP request
 * @param {Object} route Route object which will be modified
 *
 * @api public
 */
exports.canonicalize = function canonicalize(req, route) {
  if (req && req.url)
    route.parsedUrl = url.parse(req.url);
  else
    route.parsedUrl = '';
  route.pathname = route.parsedUrl.pathname.replace(/^\//, '').replace(/\/$/, '');
  var idxDot = route.pathname.lastIndexOf('.');
  if (idxDot < 0)
    idxDot = Infinity;
  var idxSlash = route.pathname.indexOf('/');
  if (idxSlash < 0)
    idxSlash = Infinity;
  var idx = Math.min(idxDot, idxSlash);
  route.url = idx > 0 && idx <= route.pathname.length ? route.pathname.substring(0, idx) : route.pathname;

  // Check if it is root path
  if (route.url == '')
    route.url = 'index';

  // Check if it is the special value 'menu', which is a handler for a page fragment and not a complete page, and redirect to 'search'
  // this handler may only be called programmatically and not by a client
  // Disable this check to let the client get an empty article page
  if (route.url == 'menu')
    route.url = 'search';

  switch (route.url) {
  case 'index':
    //canonical url for index pages
    var pageMatch = /\/(\d+)$/.exec(route.pathname);
    if (pageMatch && pageMatch[1])
      route.page = Number(pageMatch[1]);
    else
      route.page = 1;

    route.key = route.url + (route.page > 1 ? '/' + route.page : '');
    break;

  case 'search':
    // canonical url for search/archive pages
    // Get search filter if set
    if (idxSlash >= 0 && route.pathname.length > idxSlash)
      var params = route.pathname.substring(idxSlash + 1);
    if (params) {
      var slashed = params.split('/');
      if (slashed) {
        if (slashed.length == 1) {
          route.filter = slashed[0];
          route.filterType = 'tag';
        }
        else if (slashed.length == 2) {
          // Tags cannot be pure numbers, as they are interpreted as dates
          if (!slashed[0].match(/^\d+$/)) {
            route.filter = slashed[0];
            if (slashed[1].match(/^\d+$/))
              route.page = Number(slashed[1]);
            route.filterType = 'tag';
          }
          else {
            route.filter = slashed[0] + '/' + slashed[1];
            route.filterType = 'time';
          }
        }
        else if (slashed.length == 3) {
          route.filter = slashed[0] + '/' + slashed[1];
            if (slashed[2].match(/^\d+$/))
              route.page = Number(slashed[2]);
          route.filterType = 'time';
        }
      }
      if (!route.page)
        route.page = 1;
    }

    route.key = route.url + (route.filter ? '/' + route.filter : '') + (route.page > 1 ? '/' + route.page : '');
    break;

  case 'rss':
  case 'atom':
    // RSS/Atom feed
    route.output = 'xml';
    route.medium = 'rss';
    route.url = 'rss';
    route.key = 'rss';
    break;
  default:
    // canonical url for an indexed document (or maybe a non-existent resource)
    route.key = route.url;
    break;
  }
};


/**
 * Return the response body as text and any appropriate HTTP header, based on the route object created from a request.
 * Do whatever it takes.
 *
 * @param {Object} req HTTP request object
 * @param {Object} route Route
 * @param {Function} done Callback with signature: error, resource string
 *
 * @api public
 */
exports.getResource = function getResource(req, route, done) {
  var resource = renderer.render(route);
  if (resource) {
    // Cache HIT! All requests for the same route after the first should follow this code path
    logger.i('(Router) Render cache hit for %s :)', route.url);
    done(null, resource);
  }
  else {
    // Oh snap! We need to load context and render this resource for the first time
    var ctx = exports.context(route, req);
    if (!ctx || ctx instanceof Error) {
      // Aaargh! This will bubble up to the client and result in an HTTP error code
      // But first try to render an error page
      getErrorResource(ctx, req, route, done);
      //done(ctx);
      return;
    }

    // Read template from disk and compile if this is the first request for this template, otherwise load cached compiled template
    renderer.renderNew(route, ctx, done);
  }
};


/**
 * Like renderResource() but used to render request errors.
 * The callback will be called with both the error and the resource string set.
 * If the error cannot be rendered, the resource will be null.
 * The resource key is the error code.
 *
 * @param {Object} err Error to render
 * @param {Object} req HTTP request object
 * @param {Object} route Route
 * @param {Function} done Callback with signature: error, resource string
 *
 * @api public
 */
function getErrorResource(err, req, route, done) {
 route.key = route.url = err.status;
  var resource = renderer.render(route);
  if (resource) {
    done(err, resource);
  }
  else {
    var ctx = exports.context(route, req);
    if (!ctx || ctx instanceof Error) {
      // return the original error, not this one
      logger.e('(Router) Error while trying to render an error status for %s. %s', route.url, ctx ? ctx.toString() : ctx);
      done(err);
      return;
    }
    renderer.renderNew(route, ctx, done, err);
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
 * @return {Object} Context for the request. Could be empty. An error is thrown if there was an error in getting context. The error.status will be 403 if access is forbidden, 404 if the document was not found in the index, or 500 otherwise.
 *
 * @api public
 *
 */
exports.context = function context(route, req) {
  logger.i('(Router) Loading context for %s...', route.url);

  var ctx, doc, handled;
  // Try to get document from index
  if (Σ.index) {
    doc = Σ.index.id[route.url];
  }

  // If the document was found but is flagged 'secret', return Forbidden?
  /*if (doc && doc.secret) {
    var errSecret = new Error();
    errSecret.status = 403;
    logger.w('403 Denied request %s for secret document %s', route.url, doc.id);
    return errSecret;//throw errSecret;
  }*/

  // Any special data required by the template associated to this route must be provided by a handler.
  // This includes any context not provided by the doc itself (if any), such as dynamic content.
  // In case there is no indexed doc for this route, any necessary context will be provided by the handler.
  if (handlers[route.url])
    handled = handlers[route.url](route);

  if (!doc && !handled) {
    // No indexed doc and no handlers for this route... sadly we have to give up
    logger.w('404 Not Found (%s)', route.url);
    var err = new Error();
    err.status = 404;
    return err;//throw err;
  }

  // Merge context from index and/or handlers
  if (!ctx)
    ctx = {};
  // global flags
  if (doc && doc.doc)
    ctx.doc = true;
  // single article
  if (!ctx.items && doc)
    ctx.items = [ doc ];
  utils.extend(ctx, handled);
  // Add route
  utils.extend(ctx, route);
  // Add config in its own namespace
  ctx.cfg = Σ.cfg;

  // Finally, transform or update the context as necessary for rendering.
  // This involves adding all extra params from request data.
  // Also pull in context for any global templates (menus, archive...) if needed.
  if (route.output == 'html') {
    ctx.menu = handlers['menu'](req);

    // Additional data for articles
    if (!ctx.items)
      ctx.items = [];
    ctx.items = ctx.items.map(function(item) {
      if (item && (item.title || item.description)) {
        // safe title representation for metadata (without HTML tags)
        item.titleSafe = (item.title || item.description).replace(/<.+?>/g, '').trim();
      }

      if (item && !item.doc) {
        // Dates display
        var date = item.timestamp;
        item.timeTag = util.format("%s-%s-%s",
                                   date.getFullYear(),
                                   utils.pad(date.getMonth() + 1, 2),
                                   utils.pad(date.getDate(), 2));
        item.displayDate = util.format("%s/%s/%s",
                                       utils.pad(date.getDate(), 2),
                                       utils.pad(date.getMonth() + 1, 2),
                                       date.getFullYear());
        item.displayTime = util.format("%s:%s:%s",
                                       utils.pad(date.getHours(), 2),
                                       utils.pad(date.getMinutes(), 2),
                                       utils.pad(date.getSeconds(), 2));

        // Tags to display
        if (item.tag.length > 0) {
          item.displayTags = item.tag.map(function(t) {
            return { 'name': t, 'href': encodeURIComponent(t) };
          });
        }

        // Pagination for single article pages
        if (Σ.index.n) {
          if (!ctx.index && !ctx.search) {
            var prevN = item.n + 1 < 0 || item.n + 1 > Σ.index.n.length ? null : item.n + 1;
            ctx.prevPage = prevN != null ? Σ.index.n[prevN] : '';
            if (ctx.prevPage && Σ.index.id[ctx.prevPage])
              ctx.prevTitle = Σ.index.id[ctx.prevPage].title;
            else
              ctx.prevTitle = '/';
            var nextN = item.n - 1 < 0 || item.n - 1 > Σ.index.n.length ? null : item.n - 1;
            ctx.nextPage = nextN != null ? Σ.index.n[nextN] : '';
            if (ctx.nextPage && Σ.index.id[ctx.nextPage])
              ctx.nextTitle = Σ.index.id[ctx.nextPage].title;
            else
              ctx.nextTitle = '/';
          }
        }
      }

      // Related articles data, only in single article pages
      if (item.rel.length > 0 && !ctx.index) {
        item.hasRlinks = true;
        item.rlinks = item.rel.map(function(id) {
          if (Σ.index.id[id]) {
            return { 'href': id, 'title': Σ.index.id[id].title };
          }
          else {
            logger.e('(Router) No title found for related id %s in %s', id, item.id);
            return { 'href': id, 'title': '' };
          }
        });
      }
      return item;
    });
  }
  return ctx;
};
