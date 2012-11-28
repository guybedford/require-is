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

Polyfills
---

Require-IS provides a nice natural polyfill system.

A feature detection module can be run, and the required polyfill only downloaded if the feature detection fails.

This allows modules to be created that are minimal in builds, excluding the polyfill module but only including the feature detection module.

Implementations for some simple polyfills are provided below:

### Polyfill Implementations

* [selector](https://github.com/guybedford/selector)
  Performs native querySelector testing, downloading sizzle dynamically only if necessary. Otherwise it returns the native selector. Also compatible with jQuery. Allows modules to only be dependent on a small selector feature detection.
* [json](https://github.com/guybedford/json)
  Checks for JSON.parse support, and if not provided downloads json2 by Douglas Crockford.


Optimizer Configuration
---

When running a build, Require-IS will by default inline the condition detection module, as well as all possible module variations loaded with Require-IS.

To get fine-grained control over this build process use the `isExclude` array option.

### Condition exclusions: isExclude

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

### Layered Loading

This is all good and well, but if the mobile detection activiates, and we have many different mobile scripts, then we will end up with many separate dynamic requests to mobile modules, which goes against the point of having a build.

To ensure that the mobile scripts are loaded from the correct layer, create a `paths` configuration in the production configuration to
point all the mobile moduleIds to the mobile layer moduleId.

Typically this is a standard post-processing operation done for all builds to allow optimal layer loading.

#### Example:
```javascript
{
  modules: [
  {
    name: 'app',
    isExclude: ['mobile'],
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

With production config:
```javascript
{
  paths: {
    'mobile-dependency-1': 'app-mobile',
    'mobile-dependency-2': 'app-mobile'
  }
}
```

This example is included in the example folder of the project.

In this way, flexible code branches can be managed.

3. Default build exclusion

  For polyfill modules, typically one wants the modules excluded from the build by default, without having to add the isExclude property.

  For this purpose, a require can be made of the form:

  ```
    define(['is!~feature-test?[polyfill]'], function(feature) {
      feature  = feature || nativeSupport();

      // use feature
    });
  ```
  
  The `[moduleId]` form of loading implies that the polyfill is by default excluded from the build.

