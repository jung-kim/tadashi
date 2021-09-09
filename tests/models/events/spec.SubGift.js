const { assert } = require("chai");
const SubGift = require("../../../js/models/events/SubGift");

describe('SubGift', () => {
    it('default', () => {
        let event = new SubGift({
            'user-id': 111,
            'display-name': 'abc',
            'tmi-sent-ts': 11111111,
            'msg-param-recipient-display-name': 'bbb',
            'msg-param-recipient-id': 999,
        }, null, 44);

        assert.deepEqual(event, {
            userID: 111,
            displayName: 'abc',
            timestamp: 11111111,
            count: 44,
            subType: undefined,
            methods: null,
            recipientDisplayName: 'bbb',
            recipientID: 999,
        });

        assert.isTrue(event instanceof SubGift);
    });
});