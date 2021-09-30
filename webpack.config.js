const path = require("path");
const ClosurePlugin = require("closure-webpack-plugin");

module.exports = {
  optimization: {
    minimizer: [
      new ClosurePlugin(
        { mode: "STANDARD" },
      ),
    ],
  },
  entry: {
    addon: "./index.js",
  },
  output: {
    path: path.resolve(__dirname, "./"),
    filename: "[name]/index.js",
  },
  optimization: { usedExports: true },
};
