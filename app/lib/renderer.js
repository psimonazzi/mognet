var fs = require('fs');
var path = require('path');
var util = require('util');
var mustache = require('mustache');

var logger = require('./logger');
var utils = require('./utils');
var Σ = require('./state');


/**
 * Full path of the templates directory.
 *
 * @api public
 */
exports.path = path.normalize(__dirname + '/../../tmpl/');


/**
 * Create the template filename for the resource designated by the given routing info, using a template version if specified.
 *
 * @param {Object} route Route of the resource
 * @param {string} version (Optional) Template version
 *
 * @return {string}
 *
 * @api public
 */
exports.templateName = function templateName(route, version) {
  return (route.medium ? route.medium : 'index') + '.' + (version ? version + '.' : '') + 'mu.' + route.output;
};


/**
 * Create the cache key for the given template filename.
 * The key will be equal to the template name if the route defines a specific medium type.
 *
 * @param {Object} route Route of the resource
 * @param {string} templateName Template filename
 *
 * @return {string}
 *
 * @api public
 */
exports.templateKey = function templateKey(route, templateName) {
  if (typeof route.hiSpec === 'undefined' || route.medium)
    return templateName;
  return (route.hiSpec ? 'hi-spec.' : 'lo-spec.') + templateName;
};


/**
 * Run the compiled template to render the resource and return it.
 * If the compiled template is not in cache, it will be read from disk and compiled.
 * Caches both the rendered resource body and the compiled template for future requests.
 *
 * Use render() instead if the rendered resource is already in cache.
 *
 * @param {Object} route Route of the resource
 * @param {Object} context Context data that will be used to render the template; can be null
 * @param {Function} done Callback with signature: error, rendered text
 * @param {Object} originalError If not null, the resource to render represents this error
 *
 * @api public
 */
exports.renderNew = function renderNew(route, context, done, originalError) {
  var templateName = exports.templateName(route);
  var templateKey = exports.templateKey(route, templateName);
  exports.compileAndRenderFile(templateName, context, function(err, renderedContent) {
    if (err) {
      // return the original error, not this one
      logger.e('(Renderer) Error while trying to render an error status for %s. (%s)', route.url, err ? err.toString() : err);
      done(originalError || err);
    }
    else {
      if (!Σ.renders[route.key])
        Σ.renders[route.key] = {};
      Σ.renders[route.key][templateKey] = renderedContent;
      // TODO If we want to send customized headers for each resource (for example in the document metadata or its handler), we would need to save the headers too in the in-memory renders.
      done(originalError, renderedContent);
    }
  });
};


/**
 * Return the pre-rendered resource text from cache.
 *
 * @param {Object} route Route of the resource
 *
 * @return {string} Rendered text or null if none found in cache for the given route
 *
 * @api public
 */
exports.render = function render(route) {
  var templateName = exports.templateName(route);
  var templateKey = exports.templateKey(route, templateName);
  var resource;
  var renderCache = Σ.renders[route.key];
  if (renderCache)
    resource = renderCache[templateKey];

  return resource;
};


/**
 * Load template from file and compile, or load the compiled template from cache if found.
 * Run compiled template on context and return the generated content as text.
 *
 * This is the only code path that could load a file from disk.
 *
 * @param {string} templateName Template filename
 * @param {Object} context Context data that will be used to render the template; can be null
 * @param {Function} done Callback with signature: error, rendered text

 * @api public
 */
exports.compileAndRenderFile = function compileAndRenderFile(templateName, context, done) {
  // mustache module has an internal compile cache, but we want to avoid loading the template from file and so keep our own cache
  // We could cache the template file content, and not the compiled function. Mustache will cache the function
  var f = Σ.compiled_templates[templateName];
  if (!f) {
    // Read template file content as string, then compile and run
    if (Σ.cfg && Σ.cfg.denyDiskRead) {
      var err = new Error(util.format('(Renderer) Needed to read %s but was denied by config. Pre-render all resources once before serving them.', templateName));
      done(err);
    }
    else {
      logger.i('(Renderer) Reading %s...', templateName);
      fs.readFile(exports.path + templateName, 'utf8', function(err, s) {
        if (err) {
          done(err);
        }
        else {
          try {
            Σ.compiled_templates[templateName] = f = mustache.compile(s);
            var content = f(context);
          } catch (ex) {
            err = ex;
            err.message = util.format('(Renderer) Error compiling template %s. (%s)', templateName, err);
          }
          done(err, content);
        }
      });
    }
  }
  else {
    // Cache HIT! Just run the compiled template
    logger.i('(Renderer) Rendering compiled template %s...', templateName);
    try {
      var content = f(context);
    } catch (err) {
      err.message = util.format('(Renderer) Error running compiled template %s. (%s)', templateName, err);
      done(err);
    }
    done(null, content);
  }
};
