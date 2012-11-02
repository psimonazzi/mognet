var fs = require('fs');
var path = require('path');
var hogan = require('hogan.js');

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
 * @return {string}
 *
 * @api public
 */
exports.templateName = function templateName(route, version) {
  return route.medium + '.' + (version ? version + '.' : '') + 'mu.' + route.output;
};


/**
 * Return the resource body as text, compiling and applying the template if necessary.
 * Caches the resource body and the compiled template.
 *
 * @api public
 */
exports.renderNew = function renderNew(route, context, done) {
  var template = exports.render(route);
  if (template) {
    done(null, template, route);
  }
  else {
    var templateName = exports.templateName(route);
    // Allow empty context
    exports.compileAndRenderFile(templateName, context, function(err, renderedContent) {
      if (err) {
        done(err);
      }
      else {
        if (!Σ.renders[route.url])
          Σ.renders[route.url] = {};
        Σ.renders[route.url][templateName] = renderedContent;
        // Also put the route object in the callback, so the response can get HTTP headers from it.
        // If we want to send customized headers for each resource (for example in the document metadata or its handler), we would need to save the headers too in the in-memory renders.
        done(null, renderedContent, route);
      }
    });
  }
};


/**
 * Return the pre-rendered resource body as text.
 *
 * @param {string} route Route of the resource
 *
 * @return {string} Rendered text or null if none found for the given route
 *
 * @api public
 */
exports.render = function render(route) {
  var templateName = exports.templateName(route);
  var resource;

  if (Σ.renders[route.url])
    resource = Σ.renders[route.url][templateName];

  return resource;
};


/**
 * Compile mustache template if needed.
 * Run compiled template on context and return the generated content as text.
 *
 * @api public
 */
exports.compileAndRender = function compileAndRender(template, s, context) {
  var f = Σ.compiled_templates[template];
  if (!f) {
    f = Σ.compiled_templates[template] = hogan.compile(s);
  }
  var content = f.render(context);
  return content;
};


/**
 * Load template from file and compile, if needed.
 * Run compiled template on context and return the generated content as text.
 *
 * @api public
 */
exports.compileAndRenderFile = function compileAndRenderFile(templateName, context, done) {
  var f = Σ.compiled_templates[templateName];
  if (!f) {
    // read template file content as string
    if (Σ.cfg && Σ.cfg['denyDiskRead']) {
      if (Σ.cfg.verbose) console.error('(Renderer) Needed to read %s but was denied by config. Pre-render all resources once before serving them.', templateName);
      done(new Error('Needed to read from disk but was denied by config'));
    }
    fs.readFile(exports.path + templateName, 'utf8', function(err, s) {
      if (err) {
        done(err);
      }
      else {
        var content;
        try {
          f = hogan.compile(s);
          Σ.compiled_templates[templateName] = f;
          // Empty context is allowed
          content = f.render(context);
        } catch (ex) {
          err = ex;
        } finally {
          done(err, content);
        }
      }
    });
  }
  else {
    var content = f.render(context);
    done(null, content);
  }
};


/**
 * Render all documents in the index. If done before server startup, no rendering will be necessary at runtime.
 *
 * @param {Function} done Callback function called on completion.
 * @api public
 */
exports.preRender = function preRender(done) {
  // Generate all possible permutations of ids/output formats/media
  var routes = Object.keys(Σ.index['id']).map(function(docId) {
    return {
      'url': docId,
      'output': 'html',
      'medium': 'hi-spec'
    };
  }).concat(Object.keys(Σ.index['id']).map(function(docId) {
    return {
      'url': docId,
      'output': 'html',
      'medium': 'lo-spec'
    };
  }));

  function renderResource() {
    var r = routes.shift();
    if (!r)
      done();
    else {
      require('../lib/router').getRoutedResource({ 'url': r.url }, r, function(err, resource) {
        if (err) {
          console.error('(Renderer) Error pre-rendering %s: %s', r.url, err);
          // continue
        }
        renderResource();
      });
    }
  }
  renderResource();
};
