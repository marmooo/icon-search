git clone https://github.com/taoqf/node-html-parser
cp node-html-parser.webpack.config.js node-html-parser/webpack.config.js
cd node-html-parser
npm install
npm install -D webpack webpack-cli ts-loader
node_modules/webpack/bin/webpack.js
cp umd/* ../src
cd ..
