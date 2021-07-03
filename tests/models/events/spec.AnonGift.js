const { assert } = require("chai");
const AnonGift = require("../../../js/models/events/AnonGift");

describe('AnonGift.js', () => {
    it('default', () => {
        let event = new AnonGift({
            'user-id': 111,
            'display-name': 'abc',
            'tmi-sent-ts': 11111111,
        });

        assert.deepEqual(event, {
            userID: 111,
            displayName: 'abc',
            timestamp: 11111111,
        });

        assert.isTrue(event instanceof AnonGift);
    });
});