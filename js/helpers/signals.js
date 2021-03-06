const microSignals = require('micro-signals').Signal;

module.exports = {
    eventSignals: new microSignals(),
    domSignals: new microSignals(),
}