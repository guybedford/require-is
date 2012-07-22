/*
 * requirejs 'is' plugin
 *
 * Usage:
 *
 * is!var:module
 *
 * features can be set dynamically with
 * require('is', function(is) {
 *   is.enable('var');
 * });
 *
 * features can be set as startup config with
 * config: {
 *   is: {
 *     var: true
 *   }
 * }
 *
 * by default, all features are disabled
 *
 * is normalizes based on the configuration url
 *
 * is!var:module -> is!module (if var)
 * is!var:module -> is![null] (if !var)
 *
 * NB, runtime changes are not possible - config must be constant
 *
 *
 */

define(['module'], function(module) {
  
  var is = {};
  
  is.features = module.config() || {};
  
  is.used = {};
  
  is.normalize = function(name, normalize) {
    if (name.substr(0, 1) == '[')
      return name;
    
    var parts = name.split('?');
    
    if (parts.length == 2) {
      //normal
      is.used[parts[0]] = true;
      
      if (is.features[parts[0]])
        return normalize(parts[1]);
      else
        return '[__null]';
    }
    else {
      return normalize(parts[0]);
    }
  }
  
  is.set = function(feature) {
    if (is.used[feature])
      throw 'is: Feature ' + feature + ' has already been used, can\'t change!';
    is.features[feature] = true;
  }
  
  is.unset = function(feature) {
    if (is.used[feature])
      throw 'is: Feature ' + feature + ' has already been used, can\'t change!';
    is.features[feature] = false;
  }
  
  is.load = function(name, req, load, config) {
    if (name.substr(0, 1) == '[') {
      name = name.substr(1, name.length - 2);
      if (name === '__null')
        load(null)
      else
        load(this.features[name] ? true : false);
    }
    else
      req([name], function(module) {
        load(module);
      });
  }
  
  return is;
  
});