
const { assert } = require('chai');
const ReSub = require('../../../js/models/events/ReSub');

describe('ReSub.js', () => {
    it('with prime methods', () => {
        const event = new ReSub({
            'user-id': 111,
            'display-name': 'abc',
            'tmi-sent-ts': 11111111,
        }, {
            plan: 'prime',
            prime: true
        }, 333);

        assert.deepEqual(event, {
            userID: 111,
            displayName: 'abc',
            timestamp: 11111111,
            subType: 'prime',
            methods: {
                plan: 'prime',
                prime: true,
            },
            months: 333,
        });

        assert.isTrue(event instanceof ReSub);


    });
});