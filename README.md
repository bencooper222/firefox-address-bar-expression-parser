# firefox-address-bar-expression-parser

The source code can be found in `index.js`. The `manifest.json` can be found in the `addon` directory which is what is zipped.

`npm run build` to compile `./addon/index.js`. Should just need a simple node setup to run (currently on node 11.12.0 and npm 6.7.0).


./node_modules/.bin/google-closure-compiler -O ADVANCED addon/index.js --js_output_file addon/index.prod.js --language_out ECMASCRIPT_2015