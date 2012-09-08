({
  appDir: 'www',
  dir: 'www-built',
  baseUrl: '.',
  map: {
    '*': {
      'is': 'is/is'
    }
  },
  fileExclusionRegExp: /(^example)|(.git)$/,
  modules: [
    {
      name: 'app',
      isExclude: ['mobile'], //excludes mobile code branch in app
      isLayers: {
        'mobile': 'app-mobile' //automatically run a dynamic request to app-mobile if mobile feature detection passes
      }
    },
    {
      name: 'app-mobile',
      create: true,
      exclude: ['app'],
      include: ['app'] 
    }
  ]
})
