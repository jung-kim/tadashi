
const Sub = require('./Sub');

class MysterySubGift extends Sub {
    constructor(userstate, methods, counts) {
        super(userstate, methods);

        this.counts = counts;
    }
}

module.exports = MysterySubGift;
