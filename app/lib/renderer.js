var fs = require('fs');
var path = require('path');
var mustache = require('mustache');

var logger = require('../lib/logger');
var utils = require('../lib/utils');
var Σ = require('../lib/state');


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
 *
 * @api public
 */
exports.renderNew = function renderNew(route, context, done) {
  var templateName = exports.templateName(route);
  var templateKey = exports.templateKey(route, templateName);
  exports.compileAndRenderFile(templateName, context, function(err, renderedContent) {
    if (err) {
      done(err);
    }
    else {
      if (!Σ.renders[route.key])
        Σ.renders[route.key] = {};
      Σ.renders[route.key][templateKey] = renderedContent;
      // TODO If we wanted to send customized headers for each resource (for example in the document metadata or its handler), we would need to save the headers too in the in-memory renders.
      done(null, renderedContent);
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
    if (Σ.cfg && Σ.cfg['denyDiskRead']) {
      logger.e('✖ (Renderer) Needed to read %s but was denied by config. Pre-render all resources once before serving them.', templateName);
      done(new Error('Needed to read from disk but was denied by config'));
    }

    logger.i('✔ (Renderer) Reading %s...', templateName);
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
          logger.e('✖ (Renderer) Error compiling template %s. %s', templateName, err);
        }
        done(err, content);
      }
    });
  }
  else {
    // Cache HIT! Just run the compiled template
    logger.i('✔ (Renderer) Rendering compiled template %s...', templateName);
    try {
      var content = f(context);
    } catch (err) {
      logger.e('✖ (Renderer) Error running compiled template %s. %s', templateName, err);
      done(err);
    }
    done(null, content);
  }
};


/**
 * Render all documents in the index. If done before server startup, no rendering will be necessary at runtime.
 * This function will generate all possible permutations of ids/output formats/media and then render the resource for each one, in order to fill the cache.
 * If an error is raised it will be ignored until the function has completed, and passed to the callback.
 *
 * @param {Function} done Callback function called on completion, with signature: error
 *
 * @api public
 */
exports.preRender = function preRender(done) {
  var routes = Object.keys(Σ.index['id']).map(function(docId) {
    return {
      url: docId,
      key: docId,
      output: 'html',
      hiSpec: true
    };
  }).concat(Object.keys(Σ.index['id']).map(function(docId) {
    return {
      url: docId,
      key: docId,
      output: 'html',
      hiSpec: false
    };
  }));

  var lastError;
  function renderResource() {
    var r = routes.shift();
    if (!r) {
      done(lastError);
    }
    else {
      require('../lib/router').getResource({ 'url': r.url }, r, function(err, resource) {
        if (err) {
          lastError = err;
          logger.e('✖ (Renderer) Error pre-rendering %s: %s', r.url, err);
          // continue
        }
        renderResource();
      });
    }
  }
  renderResource();
};
