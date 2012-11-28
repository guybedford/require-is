({
  appDir: 'www',
  dir: 'www-built',
  baseUrl: '.',
  fileExclusionRegExp: /(^example)|(.git)$/,
  map: {
    '*': {
      is: 'require-is/is'
    }
  },
  modules: [
    {
      name: 'app',
      isExclude: ['mobile'], //excludes mobile code branch in app
    },
    {
      name: 'app-mobile',
      create: true,
      exclude: ['app'],
      include: ['app'] 
    }
  ]
})
