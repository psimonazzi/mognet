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
    "locale": "en",
    "pageSize": 12
  };
}


/**
 * Load config (sync) from a file in JSON format.
 * Filename is 'config.json'.
 * If the file is not found, it is created with the default values.
 *
 * Any property found in environment variables will override the value set in the file.
 * Environment variables are named with prefix 'MOGNET_' and the uppercased property name with '_' instead of camelCase, eg. 'pageSize' becomes 'MOGNET_PAGE_SIZE'.
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
    var writeCfgFile = true;
  }
  if (!writeCfgFile) {
    try {
      cfg = JSON.parse(raw);
    } catch (err) {
      console.error(err);
    }
  }

  // finally try to override with env vars
  cfg.port = process.env.MOGNET_PORT || process.env.PORT || cfg.port;
  cfg.denyDiskRead = process.env.MOGNET_DENY_DISK_READ || cfg.denyDiskRead;
  cfg.verbose = process.env.MOGNET_VERBOSE || cfg.verbose;
  cfg.locale = process.env.MOGNET_LOCALE || cfg.locale;
  cfg.pageSize = process.env.MOGNET_PAGE_SIZE || cfg.pageSize;

  // If there was no file write it with the current values
  if (writeCfgFile) {
    try {
      require('fs').writeFileSync(filename, JSON.stringify(cfg, null, '  '), 'utf8');
    } catch (err) {
      console.error(err);
    }
  }

  return cfg;
}
