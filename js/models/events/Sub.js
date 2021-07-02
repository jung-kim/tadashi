const Common = require('./Common');

class Sub extends Common {
    constructor(userstate, methods) {
        super(userstate);
        this.methods = methods;

        // plan can be ['Prime'] or whatever
        if (methods) {
            this.subType = this.methods['plan'];
        } else {
            this.subType = undefined;
        }
    }
}

module.exports = Sub;
