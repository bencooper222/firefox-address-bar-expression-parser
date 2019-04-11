const path = require('path');

module.exports = {
  entry: {
    addon: './index.js',
  },
  output: {
    path: path.resolve(__dirname, './'),
    filename: '[name]/index.js',
  },
  optimization: { usedExports: true },
};
