define(['module', './is-api'], function(module, api) {
  var is = {};
  is.features = module.config() || {};
  
  is.features.browser = false;
  is.features.build = true;
  
  //module layer list reference
  is.modules = null;
  
  is.lookup = function(feature, complete) {
    
    if (is.features[feature] !== undefined) {
      complete(is.features[feature]);
      return;
    }
    
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

    if (f.type == 'lookup')
      is.lookup(f.feature, load);
    
    if (f.type == 'load_if' || f.type == 'load_if_not') {
      //check feature
      is.lookup(f.feature, function(_feature) {
        //check if it is in the config 'isExclude' list, and exclude accordingly
        var exclude = ['~browser'];

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
        
        if (!f.yesBuild)
          f.yesModuleId = null;
          
        if (!f.noBuild)
          f.noModuleId = null;
        
        //if an external url, null out as well
        //if (f.yesModuleId.match(/https?:\/\//))
        //  f.yesModuleId = null;
        //if (f.noModuleId.match(/https?:\/\//))
        //  f.noModuleId = null;
        
        //require (if not nulled out)
        req([f.yesModuleId, f.noModuleId], load);
      });
    }
  }
  
  return is;
  
});
