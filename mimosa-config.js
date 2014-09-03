exports.config = {
    "modules": [
    "copy",
    "server",
    "jshint",
    "csslint",
    "require",
    "minify-js",
    "minify-css",
    "live-reload",
    "bower",
    "mimosa-coco"
  ],
  "server": {
    "path": "server.co",
    "defaultServer": {
      "enabled": true
    },
   "views": {
      "compileWith": "html",
      "extension": "html"
    }
  }
}
