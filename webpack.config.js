const path = require("path");
const ClosurePlugin = require("closure-webpack-plugin");

module.exports = {
  optimization: {
    minimizer: [
      new ClosurePlugin(
        { mode: "AGGRESSIVE_BUNDLE" },
        { externs: ["./index.extern.js"] }
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
