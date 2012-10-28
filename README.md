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

Download `require-is` into its own folder either manually or using [volo](https://github.com/volojs/volo):

```
volo add guybedford/require-is
```

Add the following map configuration for ease of use:

```javascript
  map: {
    '*': {
      'is': 'require-is/is'
    }
  }
```

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
    'require-is/is': {
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

##### 'browser' condition

By default, require-is defines the `browser` condition automatically, and will automatically exclude any scripts loaded on the `~browser` condition from the build. This allows for easy management of code branches sharing client and server code allowing for a single codebase between client and server.


### Multiple conditions:

Multiple conditions can be handled in two ways:

##### 1) Nested 'is' calls:

```javascript
  define(['is!ios?ios-code:is!android?android-code'], function(mobileCode) {
  });
```

This can become difficult to read, and there is no bracket notation supported for operation ordering. Calls are simply run from left to right.

##### 2) Multiple 'is' calls:

```javascript
  define(['is!ios?ios-code', 'is!android?android-code', 'is!blackberry?blackberry-code'], function(ios, android, blackberry) {
    var mobileCode = ios || android || blackberry;
  });
```

When no alternative load is give, is returns a `null` module, so that the above conditional checks will return the only defined module in the group.


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
  },
  {
    //define the 'app-mobile' layer to contain all the mobile scripts from 'app'
    name: 'app-mobile',
    create: true,
    include: ['app'], //fires the default inclusion of app, which includes all conditions (and mobile)
    exclude: ['app'] //exclude uses the version of app as above, with the exclusions made, hence the difference between include and exclude is purely the mobile scripts!
  }
  ]
}
```

This example is included in the example folder of the project.

In this way, flexible code branches can be managed.
