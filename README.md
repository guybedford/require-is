Require-is
===

A conditional loading plugin for [Require-JS](http://requirejs.org/) that works with optimizer builds and build layers.

Very similar to the has module in Dojo, except fully compatible with the Require-JS optimizer.

In this way, conditional code branches can be managed at a fine level by the Require-JS optimizer build process.

Basic usage:

```javascript
define(['is!mobile?mobile-component:desktop-component'], function(component) {
  //...
});
```

Installation
---

Using [volo](https://github.com/volojs/volo):
```
volo add guybedford/require-is
```

Alternaively, download is.js and place it in the baseUrl folder of a Require-JS project.

Syntax
---

Where conditional loads are needed, use the RequireJS plugin syntax:

```
is![conditionId]?[moduleId]:[moduleId]
```

The negation form is also accepted:

```
is!~[conditionId]?[moduleId]
```


Setting Conditions
---

There are two ways to set conditions.

### 1. Using the RequireJS configuration:

```javascript
requirejs.config({
  config: {
    is: {
      mobile: true
    }
  }
});
```

Any number of conditions can be set to true or false in this way.

### 2. With a detection script:

When the `conditionId` is not found in the configuration, Require-IS loads the RequireJS module with moduleId, `conditionId`.

This module should return `true` or `false` based on the feature condition.

#### Example:

To create our mobile condition, we would populate the file `mobile.js` in the base RequireJS folder:

mobile.js:
```javascript
define(function() {
  return navigator.userAgent.match(/iPhone/);
});
```


Optimizer Configuration
---

When running a build, Require-IS will by default inline the condition detection module, as well as all possible module variations loaded with Require-IS.

To get fine-grained control over this build process there are a number of options provided to allow full flexibility.

### 1. Condition exclusions: isExclude

You may wish to entirely exclude a specific condition case. For example, to exclude all the mobile scripts from the build, and then have them only loaded dynamically if needed.

This can be done with the build paramter - isExclude.

isExclude is an array of conditionIds to exclude from the build layer. It can be applied for a single build layer or for the entire build config.

#### Example:

Require-JS build config:
```javascript
{
  modules: [
  {
    name: 'app',
    isExclude: ['mobile']
  }
  ]
}
```

This will build `app` with all `is!mobile?moduleId` moduleIds excluded from the build layer.

To exclude the negation of mobile (from `is!~mobile?moduleId` OR `is!mobile?...:moduleId`), simply add `~mobile` to the `isExclude` array.

### 2. Condition layers: isLayers

This is all good and well, but if the mobile detection activiates, and we have many different mobile scripts, then we will end up with many separate dynamic requests to mobile modules, which goes against the point of having a build.

We thus create a feature layer with the use of the standard `exclude` and `include` options available for Require-JS builds.

Additionally, Require-IS allows for specifying where to find this condition layer so that it will be dynamically included instead of having many different requests if the condition is needed.

#### Example:
```javascript
{
  modules: [
  {
    name: 'app',
    isExclude: ['mobile'],
    isLayers: {
      mobile: 'app-mobile' //tell Require-IS to load 'app-mobile' if the mobile condition is positive
    }
  }
  {
    //define the 'app-mobile' layer
    name: 'app-mobile',
    create: true,
    include: ['app'],
    exclude: ['app']
  }
  ]
}
```

This example is included in the example folder of the project.

In this way, flexible code branches can be managed.