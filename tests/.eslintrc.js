var path = require('path');

const json = JSON.parse(require('fs').readFileSync(path.join(__dirname, '..', '/.eslintrc.json')).toString());

json.env.mocha = true;
json.rules['max-lines'] = 'off';
json.rules['no-sync'] = 'off';

module.exports = json;