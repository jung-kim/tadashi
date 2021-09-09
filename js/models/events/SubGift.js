const Sub = require('./Sub');

class SubGift extends Sub {
    constructor(userstate, methods, count) {
        super(userstate, methods);

        this.recipientDisplayName = userstate["msg-param-recipient-display-name"] || userstate.recipientDisplayName;
        this.recipientID = userstate["msg-param-recipient-id"] || userstate.recipientID;
        this.count = count;
    }
}

module.exports = SubGift;
