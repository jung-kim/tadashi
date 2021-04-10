var path = require('path');

/*eslint-disable no-sync*/
const json = JSON.parse(require('fs').readFileSync(path.join(__dirname, '..', '/.eslintrc.json')).toString());
/*eslint-enable no-sync*/

json.env.mocha = true;
json.globals.reset = true;
json.rules['max-lines'] = 'off';

module.exports = json;