
const Sub = require('./Sub');

class MysterySubGift extends Sub {
    constructor(userstate, methods, count) {
        super(userstate, methods);

        this.count = count;
    }
}

module.exports = MysterySubGift;
