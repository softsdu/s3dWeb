import * as pluginImportMap from 'babel-plugin-import-map';

pluginImportMap.load('./import-map.json');
export default {
  "presets": [
    ["@babel/preset-env", { "modules": false }]
  ],
  "plugins": [
    pluginImportMap.plugin()
  ]
};