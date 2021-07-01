const Common = require('./Common');

class Sub extends Common {
    constructor(userstate, methods) {
        super(userstate);
        this.methods = methods;

        if (methods && methods['prime']) {
            this.subType = 'prime';
        } else if (methods) {
            this.subType = this.methods['planName'];
        }
        this.subRank = methods ? methods['plan'] : userstate.subRank;
    }
}

module.exports = Sub;
