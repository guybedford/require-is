/*
 * RequireJS 'is' plugin
 *
 * Usage:
 *
 * is!myFeature?module
 * is!~myFeature?module (negation)
 *
 * Features can be set dynamically with
 * require('is', function(is) {
 *   is.enable('var');
 * });
 *
 * Or features can be set as startup config with
 * config: {
 *   is: {
 *     var: true
 *   }
 * }
 *
 * If none of the above applies, the feature is assumed to be a moduleId
 * that resolves to a boolean.
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
 * The build environment features are computed in the same way as normally. Using path mappings
 * and the 'is' config, particular build environments can be configured.
 *
 * The build determines if the conditional modules should be written or not.
 *
 * It is still up to the environment detection to determine if the features apply or not.
 *
 * With careful config, this covers the use cases of specific device builds, as well as packaging
 * all variations into a single built file.
 *
 * Build layers corresponding to a particular feature variation can be created using a feature variation
 * build name.
 *
 * Basically, disable the feature and build the first modules that would be using it. Then create a separate
 * mobule which includes: [is!feature*]. This will then drop back all items of that feature into the build,
 * that were previously excluded.
 *
 * Example::
 *
 * name: 'main-build'
 * include: [all, my, stuff]
 *
 * name: 'feature-build'
 * include: [is!mobile*]
 * exclude: ['main-build']
 *
 * config: {
 *   is: {
 *     mobile: false
 *   }
 * }
 *
 *
 *
 * NB, runtime changes are not possible - config must be constant
 *
 */

define(['module', 'require'], function(module, require) {
  
  var is = {};
  
  is.features = module.config() || {};
  
  //check features
  for (var f in is.features)
    if (is.features[f] !== true && is.features[f] !== false)
      throw 'Feature ' + f + ' must be true or false in config.';
  
  is.used = {};
  
  //build tracking
  is.deps = {};
  is.writeFeatures = {};
  
  is.lookup = function(feature, isBuild, complete) {
    
    if (is.features[feature] !== undefined) {
      
      if (isBuild)
        //ensure we write in this feature detection
        //is.writeFeatures[feature] = is.features[feature];
      
      complete(is.features[feature]);
      return;
    }
    
    if (isBuild) {
      //add the feature detection to the build
      require([feature], function(){});
      //in build - return value isn't checked anyway
      complete();
      return;
    }    
    
    require([feature], function(_feature) {
      if (_feature !== true && _feature !== false)
        throw 'Feature module ' + feature + ' must return true or false.';
      is.features[feature] = _feature;
      complete(_feature);
    });
  }
  
  
  /*
   * Breakdown 'is' call into an object:
   * {
   *   feature: 'featureId',
   *   type: 'load_if' / 'load_if_not' / 'check' / 'load_deps'
   *   moduleId: 'moduleId'
   * }
   */
  is.deconstruct = function(f) {
    //is![feature]
    if (f.substr(0, 1) == '[')
      return {
        feature: f.substr(1, f.length - 2),
        type: 'check'
      };
    
    //is!feature*
    if (f.substr(f.length - 1, 1) == '*')
      return {
        feature: f.substr(0, f.length - 1),
        type: 'load_deps'
      };
      
    var feature = f.substr(0, f.indexOf('?'));
    var moduleId = f.substr(feature.length + 1, f.length - feature.length - 1);
    
    //is!something
    if (feature == '')
      throw 'Not a valid is call: is!' + f;
    
    //is!feature?moduleId
    if (feature.substr(0, 1) == '~')
      return {
        feature: feature.substr(1, f.length - 1),
        type: 'load_if_not',
        moduleId: moduleId
      };
    //is!~feature?moduleId
    else
      return {
        feature: feature,
        type: 'load_if',
        moduleId: moduleId
      };
  }
  
  is.normalize = function(name, normalize) {
    var f = is.deconstruct(name);
    f.feature = normalize(f.feature);

    if (f.moduleId)
      f.moduleId = normalize(f.moduleId);
    
    //reconstruct
    if (f.type == 'check')
      return '[' + f.feature + ']';
    
    if (f.type == 'load_deps')
      return f.feature + '*';
    
    if (f.type == 'load_if_not')
      return '~' + f.feature + '?' + f.moduleId;
    
    if (f.type == 'load_if')
      return f.feature + '?' + f.moduleId;
  }
  
  is.set = function(feature) {
    if (is.used[feature] && is.features[feature] != true)
      throw 'is: Feature ' + feature + ' has already been used, can\'t change!';
    is.features[feature] = true;
  }
  
  is.unset = function(feature) {
    if (is.used[feature] && is.features[feature] == true)
      throw 'is: Feature ' + feature + ' has already been used, can\'t change!';
    is.features[feature] = false;
  }
  
  is.load = function(name, req, load, config) {
    var f = is.deconstruct(name);
    
    if (f.type == 'check') {
      is.lookup(f.feature, config.isBuild, load);
      return;
    }
    
    if (f.type == 'load_if' || f.type == 'load_if_not') {
      //track conditional loads for builds
      if (config.isBuild) {
        is.deps[f.feature] = is.deps[f.feature] || [];
        is.deps[f.feature].push(f.moduleId);
      }
      
      //check feature
      is.lookup(f.feature, config.isBuild, function(_feature) {
        
        if (config.isBuild) {
          if (config.isExclude && config.isExclude.indexOf(f.feature) != -1) {
            load(null);
            return;
          }
          //by default, build the module in
          req([f.moduleId], load);
          return;
        }
        
        if ((_feature && f.type == 'load_if') || (!_feature && f.type == 'load_if_not')) {
          //if doing a build, check if we are including the module or not
          req([f.moduleId], load);
        }
        else
          load(null);
      });
      return;
    }
    
    if (f.type == 'load_deps') {
      if (!config.isBuild)
        throw 'Can\'t form an "is" dependency load when not in build.';
      
      is.deps[f.feature] = is.deps[f.feature] || [];
      //by virtue of loading all the dependencies, they will get written into the layer
      req(is.deps[f.feature], function() {
        load(null);
      });
    }
  }
  
  /* is.write = function(pluginName, moduleName, write) {
    //write in the features 
    for (var i = 0; i < is.writeFeatures.length; i++) {
      
    }
  } */
  
  return is;
  
});