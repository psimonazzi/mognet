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
 * Load config (sync) from a file in JSON format and/or from environment variables.
 * Filename is 'config.json'.
 * If the file is not found, it is created with the default values, or the values set in environment variables.
 *
 * Any property found in environment variables will override the value set in the file.
 * Environment variables are named with prefix 'MOGNET_' and the uppercased property name with '_' instead of camelCase, eg. 'pageSize' becomes 'MOGNET_PAGE_SIZE'. An exception is the port variable, which can be set as MOGNET_PORT or PORT.
 *
 * @return {Object} The config object. If there was an error returns a hardcoded default config (see sources)
 *
 * @api private
 */
function loadConfig() {
  // first get defaults
  var cfg = CONFIG_DEFAULTS();

  // then try to override with config file
  var filename = require('path').normalize(__dirname + '/../config.json');
  try {
    var raw = require('fs').readFileSync(filename);
  } catch (err) {
    var noCfgFile = true;
  }
  if (!noCfgFile) {
    try {
      cfg = JSON.parse(raw);
    } catch (err) {
      require('../lib/logger').e('Cannot load config. %s', err);
    }
  }

  return cfg;
}
