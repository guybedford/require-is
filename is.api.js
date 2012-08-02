define([], function() {
  
  var is = {};
  
  /*
   * Breakdown 'is' call into an object:
   * {
   *   feature: 'featureId',
   *   type: 'load_if' / 'load_if_not' / 'lookup'
   *   yesModuleId: 'moduleId'
   *   noModuleId: 'moduleId'
   * }
   */
  is.deconstruct = function(f) {      
    var feature = f.substr(0, f.indexOf('?'));
    var actions = f.substr(feature.length + 1, f.length - feature.length - 1);
    
    var yesModuleId = actions.substr(0, actions.indexOf(':'));
    var noModuleId = actions.substr(yesModuleId.length + 1, actions.length - yesModuleId.length - 1);
    
    if (yesModuleId == '') {
      yesModuleId = actions;
      noModuleId = null;
    }
    
    //is!feature
    if (feature == '')
      return {
        feature: f,
        type: 'lookup'
      }
    
    //is!feature?moduleId
    if (feature.substr(0, 1) == '~')
      return {
        feature: feature.substr(1, f.length - 1),
        type: 'load_if_not',
        yesModuleId: yesModuleId,
        noModuleId: noModuleId
      };
    //is!~feature?moduleId
    else
      return {
        feature: feature,
        type: 'load_if',
        yesModuleId: yesModuleId,
        noModuleId: noModuleId
      };
  }
  
  is.normalize = function(name, normalize) {
    var f = is.deconstruct(name);
    f.feature = normalize(f.feature);

    if (f.yesModuleId)
      f.yesModuleId = normalize(f.yesModuleId);
    if (f.noModuleId)
      f.noModuleId = normalize(f.noModuleId);
    
    //reconstruct
    if (f.type == 'lookup')
      return f.feature;
    
    if (f.type == 'load_if_not')
      return '~' + f.feature + '?' + f.yesModuleId + (f.noModuleId ? ':' + f.noModuleId : '');
    
    if (f.type == 'load_if')
      return f.feature + '?' + f.yesModuleId + (f.noModuleId ? ':' + f.noModuleId : '');
  }

  return is;
  
});