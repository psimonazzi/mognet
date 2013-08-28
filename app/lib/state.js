// require()d modules are cached, so this one will hold the state object across the app
module.exports = {
  'cfg': {},
  'index': {},
  'renders': {},
  'compiled_templates': {}
};

module.exports.loadConfig = loadConfig;
module.exports.cfg = loadConfig();

function CONFIG_DEFAULTS() {
  return {
    "version": "v0.8.1",
    "port": 80,
    "denyDiskRead": false,
    "verbose": false,
    "pageSize": 12,
    "baseUrl": null,
    "user": null,
    "group": null,
    "googleAnalyticsAccount": null
  };
}


/**
 * Load config from hardcoded defaults, possibly overriding values with those
 * in a file named 'config.json', if the file is found.
 *
 * @return {Object} The config object. If there was an error returns a hardcoded default config (see sources)
 *
 * @api private
 */
function loadConfig() {
  var cfg = CONFIG_DEFAULTS();

  // Could just require('../config.json'), but we want to be able to reload the file at any time
  try {
    var json = require('./utils').loadJSONSync(__dirname + '/../config.json');
    cfg = require('./utils').extend(cfg, json);
  } catch (err) {
    require('./logger').w('Cannot load config. %s', err);
  }
  return cfg;
}
