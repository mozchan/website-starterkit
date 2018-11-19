const glob = require('glob');

const srcRoot = './src/_scripts/';
const srcRootRegExp = new RegExp(srcRoot);
const entries = {}

glob.sync(`${srcRoot}**/*.js`, {
  ignore: `${srcRoot}**/_*.js`
}).map(function (file) {
  const key = file.replace(srcRootRegExp, '');
  entries[key] = file;
});

module.exports = {
  entry: entries,
  output: {
    filename: '[name]'
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  }
};