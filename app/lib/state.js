// require()d modules are cached, so this one will hold the state object across the app
module.exports = {
  'cfg': {},
  'index': {},
  'renders': {},
  'compiled_templates': {}
};

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
 * Filename is '/config.json'.
 * If the file is not found, it is created with the default values.
 *
 * @return {Object} The parsed config object. If there was an error returns a hardcoded default config (see sources)
 *
 * @api private
 */
function loadConfig() {
  var filename = require('path').normalize(__dirname + '/../config.json');
  try {
    var raw = require('fs').readFileSync(filename);
  } catch (err) {
    //console.error(err);
    try {
      require('fs').writeFileSync(filename, JSON.stringify(CONFIG_DEFAULTS(), null, '  '), 'utf8');
    } catch (err) {
      console.error(err);
    }
    return CONFIG_DEFAULTS();
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error(err);
    // default config
    return CONFIG_DEFAULTS();
  }
}
