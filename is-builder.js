define(['module', 'require', './is-api'], function(module, require, api) {
  is = {};
  is.features = module.config() || {};
  
  //module layer list reference
  is.modules = null;
  
  is.lookup = function(feature, complete) {
    
    if (is.features[feature] !== undefined) {
      complete(is.features[feature]);
      return;
    }
    
    is.features[feature] = true;
    require([feature]);
    complete();
    return;
  }
  
  is.normalize = api.normalize;  
  is.load = function(name, req, load, config) {
    
    //if the first load - save the modules reference
    if (!is.config) {
      is.config = config;
      
      if (config.modules) {
        //run through the module list - the first one without a layer set is the current layer we are in
        for (var i = 0; i < config.modules.length; i++)
          if (config.modules[i].layer === undefined) {
            is.curModule = config.modules[i];
            break;
          }
      }
    }
    
    var f = api.parse(name);
    
    //console.log(f);
    
    //console.log(is.features);
    
    if (f.type == 'lookup')
      is.lookup(f.feature, load);
    
    if (f.type == 'load_if' || f.type == 'load_if_not') {
      //check feature
      is.lookup(f.feature, function(_feature) {
        
        //check if it is in the config 'isExclude' list, and exclude accordingly
        var exclude = [];

        if (is.config.isExclude)
          exclude = exclude.concat(is.config.isExclude);
        
        if (is.curModule && is.curModule.isExclude)
          exclude = exclude.concat(is.curModule.isExclude);

        //do any exclusion
        if (exclude.indexOf(f.feature) != -1)
          if (f.type == 'load_if')
            f.yesModuleId = null;
          else
            f.noModuleId = null;
        if (exclude.indexOf('~' + f.feature) != -1)
          if (f.type == 'load_if')
            f.noModuleId = null;
          else
            f.yesModuleId = null;
        
        //require (if not nulled out)
        req([f.yesModuleId, f.noModuleId], load);
      });
    }
  }
  
  is.write = function(pluginName, moduleName, write) {
    if (!is.writtenFeatureLayers) {
   
      //build up layers from global and module config
      var isLayers = {};
      
      if (is.config.isLayers) {
        for (var layer in is.config.isLayers)
          if (is.features[layer]) //filter layers to features used by this module
            isLayers[layer] = is.config.isLayers[layer];
      }
      
      if (is.curModule && is.curModule.isLayers) {
        for (var layer in is.curModule.isLayers) {
          if (is.features[layer]) //filter layers to features used by this module
            isLayers[layer] = is.curModule.isLayers[layer];
        }
      }
      
      //finally write in the auto-loading of feature layers adding the loaders as feature hook callbacks
      var output = "";
      for (var layer in isLayers) {
        if (!output)
          output = "require(['" + pluginName + "'], function(is){ \n";
        output += "is.on('" + layer + "', function(complete) { require(['" + isLayers[layer] + "'], complete); }); \n";
      }
      if (output) {
        output += "});";
        write(output);
      }
      
    }
    else
      is.writtenFeatureLayers = true;
  }
  
  return is;
  
});
