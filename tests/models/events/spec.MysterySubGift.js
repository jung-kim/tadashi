const { assert } = require("chai");
const MysterySubGift = require("../../../js/models/events/MysterySubGift");

describe('MysterySubGift.js', () => {
    it('default', () => {
        let event = new MysterySubGift({
            'user-id': 111,
            'display-name': 'abc',
            'tmi-sent-ts': 11111111,
        }, null, 44);

        assert.deepEqual(event, {
            userID: 111,
            displayName: 'abc',
            timestamp: 11111111,
            count: 44,
            subType: undefined,
            methods: null
        });

        assert.isTrue(event instanceof MysterySubGift);
    });
});