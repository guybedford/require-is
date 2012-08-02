define(["module","require","./is.api"],function(e,t,n){n.pluginBuilder="./is.pluginBuilder",n.features=e.config()||{},n.curModule=null,n.modules=null,n.lookupCallbacks={},n.onCallbackComplete={},n.on=function(e,t){if(t.length!=1)throw"Is feature callbacks must fire the 'complete' function provided as an argument.";if(e.substr(0,1)!="~"&&n.features[e]===!0||e.substr(0,1)=="~"&&n.features[e.substr(1)]==1){t(function(){});return}if(e.substr(0,1)!="~"&&n.features[e]===!1||e.substr(0,1)=="~"&&n.features[e.substr(1)]==0)return;if(n.onCallbackComplete[e]){n.onCallbackComplete[e].push(function(){t(function(){})});return}n.lookupCallbacks[e]=n.lookupCallbacks[e]||[],n.lookupCallbacks[e].push(t)},n.curCallbacks={};var r=function(e,t,r){var i=(t?"":"~")+e;if(n.onCallbackComplete[i]){n.onCallbackComplete[i].push(function(){r(t)});return}var s=n.lookupCallbacks[i];delete n.lookupCallbacks["~"+e],delete n.lookupCallbacks[e],n.onCallbackComplete[i]=[function(){r(t)}];var o=0,u=function(){o++;if(o<s.length)return;for(var e=0;e<n.onCallbackComplete[i].length;e++)n.onCallbackComplete[i][e]();delete n.onCallbackComplete[i]};for(var a=0;a<s.length;a++)s[a](u)};return n.lookup=function(e,i){if(n.features[e]!==undefined){var s=n.features[e];s===!0&&n.lookupCallbacks[e]||s===!1&&n.lookupCallbacks["~"+e]?r(e,s,i):i(s);return}t([e],function(t){if(t!==!0&&t!==!1)throw"Feature module "+e+" must return true or false.";n.features[e]=t,t===!0&&n.lookupCallbacks[e]||t===!1&&n.lookupCallbacks["~"+e]?r(e,t,i):i(t)})},n.load=function(e,t,r,i){var s=n.deconstruct(e);s.type=="lookup"&&n.lookup(s.feature,r),(s.type=="load_if"||s.type=="load_if_not")&&n.lookup(s.feature,function(e){e&&s.type=="load_if"||!e&&s.type=="load_if_not"?t([s.yesModuleId],r):!e&&s.type=="load_if"&&s.noModuleId||e&&s.type=="load_if_not"&&s.noModuleId?t([s.noModuleId],r):r()})},n})