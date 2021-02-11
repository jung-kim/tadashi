const Common = require('./Common');

class Cheer extends Common {
    constructor(userstate) {
        super(userstate);
        this.bits = parseInt(userstate['bits'] || 0);
    }
}

module.exports = Cheer;
