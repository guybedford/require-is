/*
 * RequireJS 'is' plugin
 *
 * Usage:
 *
 * is!myFeature?module:another
 * is!~myFeature?module (negation)
 *
 *
 * Features can be set as startup config with
 * config: {
 *   is: {
 *     var: true
 *   }
 * }
 * 
 * Otherwise the feature is assumed to be a moduleId resolving to a boolean.
 * 
 * Thus to write a dynamic feature, say iphone.js, just do:
 * 
 * iphone.js:
 * define(function() {
 *   if (typeof navigator === 'undefined' || typeof navigator.userAgent === 'undefined')
 *     return false;
 *   return navigator.userAgent.match(/iPhone/i);
 * });
 * 
 * Which can then be used with a require of the form: is!iphone?iphone-scripts.
 * 
 * 
 * Builds
 * The build environment features are computed in the same way as in development. The only difference is
 * that features are not at all evaluated.
 * 
 * It is important to retain the config for features that don't resolve to moduleIds as this is the only
 * distinction between feature detection modules and configuration items.
 * Simply set them all to 'true' to indicate that we don't need to build in their feature detection code.
 * 
 * By default, all conditional modules are written in to the build layer.
 * 
 * Then to exclude a feature's modules in a layer, simply add the 'isExclude' array of features to the module config,
 * or the global build config - both are respected and complementary.
 * 
 * This will entirely exxlude those feature modules from the layer build. The condition itself still remains
 * undetermined until the environment execution.
 * 
 * Feature layers can be created with config as in the following - 
 * 
 * Example:
 * 
 * {
 *   modules: [
 *   {
 *     name: 'core',
 *     create: true,
 *     include: ['some', 'core', 'modules'],
 *     isExclude: ['mobile'], //exclude all is!mobile? conditional dependencies
 *     isLayers: {
 *       'mobile': 'core-mobile'
 *     }
 *   },
 *   {
 *     name: 'core-mobile',
 *     create: true,
 *     include: ['some', 'core', 'modules'],
 *     exclude: ['core']
 *   }
 *   ]
 * }
 *
 * isExclude and isLayers can also be global configs for single file builds, or sharing config between the builds.
 *
 *
 * The isLayers object allows for layers to be loaded when a feature is true. In this way, instead of a
 * mobile environment triggering lots of sub-module loads, we can first require the mobile layer, reducing
 * the need for many different requests.
 *
 */

define(['module', 'require', './is-api'], function(module, require, api) {
  is = {};
  is.pluginBuilder = './is-builder';
  
  is.normalize = api.normalize;
  is.features = module.config() || {};
  
  //build tracking
  is.curModule = null;
  is.modules = null;
  
  is.empty = function() {
    return null;
  }
  
  //allow for lookup hooks
  is.lookupCallbacks = {};
  is.onCallbackComplete = {};
  
  //attach a lookup hook (doesn't trigger a lookup)
  is.on = function(feature, callback) {
    if (callback.length != 1)
      throw "Is feature callbacks must fire the 'complete' function provided as an argument.";
    //if feature is already true, just fire straight off
    if ((feature.substr(0, 1) != '~' && is.features[feature] === true) || (feature.substr(0, 1) == '~' && is.features[feature.substr(1)] == true)) {
      callback(function(){});
      return;
    }
    //already in the other branch -> ignore the callback
    else if ((feature.substr(0, 1) != '~' && is.features[feature] === false) || (feature.substr(0, 1) == '~' && is.features[feature.substr(1)] == false))
      return;
    
    //if the callbacks are already running, wait till complete then run it
    if (is.onCallbackComplete[feature]) {
      is.onCallbackComplete[feature].push(function() {
        callback(function(){});
      });
      return;
    }

    //otherwise, add to callback list for when the feature check is done
    is.lookupCallbacks[feature] = is.lookupCallbacks[feature] || [];
    is.lookupCallbacks[feature].push(callback);
  }
  
  is.curCallbacks = {};
  var runCallbacks = function(feature, result, complete) {
    
    var resultName = (result ? '' : '~') + feature;
    
    //if the callbacks are currently running, then add this to the complete list
    if (is.onCallbackComplete[resultName]) {
      is.onCallbackComplete[resultName].push(function() {
        complete(result);
      });
      return;
    }
    
    //otherwise start running the callbacks
    var callbacks = is.lookupCallbacks[resultName];
    
    delete is.lookupCallbacks['~' + feature];
    delete is.lookupCallbacks[feature];
    
    is.onCallbackComplete[resultName] = [function() {
      complete(result);
    }];
    
    var completedCallbacks = 0;
    var callbackComplete = function() {
      completedCallbacks++;
      if (completedCallbacks < callbacks.length)
        return;
      
      //once all callbacks have returned, run final complete callbacks
      for (var i = 0; i < is.onCallbackComplete[resultName].length; i++)
        is.onCallbackComplete[resultName][i]();
      
      delete is.onCallbackComplete[resultName];
    }
    
    //run callbacks
    for (var i = 0; i < callbacks.length; i++)
      callbacks[i](callbackComplete);
  }
  
  is.lookup = function(feature, complete) {
    if (is.features[feature] !== undefined) {
      
      var _feature = is.features[feature];
      //trigger any lookup callbacks
      if ((_feature === true && is.lookupCallbacks[feature]) || (_feature === false && is.lookupCallbacks['~' + feature]))
        runCallbacks(feature, _feature, complete);
      
      else
        complete(_feature);
      return;
    }
    
    require([feature], function(_feature) {
      if (_feature !== true && _feature !== false)
        throw 'Feature module ' + feature + ' must return true or false.';
      
      is.features[feature] = _feature;
      
      //trigger any lookup callbacks
      if ((_feature === true && is.lookupCallbacks[feature]) || (_feature === false && is.lookupCallbacks['~' + feature]))
        runCallbacks(feature, _feature, complete);
      
      else
        complete(_feature);
    });
  }
  
  is.load = function(name, req, load, config) {
    var f = api.parse(name);
    
    //console.log(f);
    
    //console.log(is.features);
    
    if (f.type == 'lookup')
      is.lookup(f.feature, load);
    
    if (f.type == 'load_if' || f.type == 'load_if_not') {
      //check feature
      is.lookup(f.feature, function(_feature) {
        if ((_feature && f.type == 'load_if') || (!_feature && f.type == 'load_if_not'))
          //if doing a build, check if we are including the module or not
          req([f.yesModuleId], load);

        else if ((!_feature && f.type == 'load_if' && f.noModuleId) || (_feature && f.type == 'load_if_not' && f.noModuleId))
          req([f.noModuleId], load);
          
        else
          load(is.empty());
      });
    }
  }

  return is;
  
});
