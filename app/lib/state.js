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
    "pageSize": 12,
    "baseUrl": null,
    "user": null,
    "group": null,
    "googleAnalyticsAccount": null,
    "staticUrl": null
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
  var envCfg = {};
  if (process.env.PORT)
    envCfg.port = process.env.PORT;
  Object.keys(process.env).forEach(function(k) {
    if (k.match(/^MOGNET_/) && process.env[k] !== undefined) {
      var tmpName = k.replace(/^MOGNET_/, "").toLowerCase();
      var name = "";
      for (var i = 0; i < tmpName.length; i++)
        name += (i > 0 && tmpName[i-1]) == '_' ? tmpName[i].toUpperCase() : tmpName[i].toLowerCase();
      name = name.replace(/_/g, "");
      if (process.env[k] === 'false')
        envCfg[name] = false;
      else if (process.env[k] === 'true')
        envCfg[name] = true;
      else if (process.env[k].match(/^\d+$/) && new Number(process.env[k]) !== Number.NaN) {
        envCfg[name] = new Number(process.env[k]).valueOf();
      }
      else
        envCfg[name] = process.env[k];
    }
  });
  require('../lib/utils').extend(cfg, envCfg);

  // If there was no file write it with the current values
  // TODO confusing, as the values in the file may be different from the actual values used.
  /*if (writeCfgFile) {
    try {
      require('fs').writeFileSync(filename, JSON.stringify(cfg, null, '  '), 'utf8');
    } catch (err) {
      console.error(err);
    }
  }*/

  return cfg;
}
