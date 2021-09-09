
const { assert } = require('chai');
const Sub = require('../../../js/models/events/Sub');

describe('Sub.js', () => {
    it('just user state', () => {
        const event = new Sub({
            'user-id': 111,
            'display-name': 'abc',
            'tmi-sent-ts': 11111111,
        });

        assert.deepEqual(event, {
            userID: 111,
            displayName: 'abc',
            timestamp: 11111111,
            subType: undefined,
            methods: undefined,
        });

        assert.isTrue(event instanceof Sub);
    });

    it('with prime methods', () => {
        const event = new Sub({
            'user-id': 111,
            'display-name': 'abc',
            'tmi-sent-ts': 11111111,
        }, {
            plan: 'prime',
            prime: true
        }, 222);

        assert.deepEqual(event, {
            userID: 111,
            displayName: 'abc',
            timestamp: 11111111,
            subType: 'prime',
            methods: {
                plan: 'prime',
                prime: true,
            },
        });
        assert.isTrue(event instanceof Sub);
    });


    it('with none prime methods', () => {
        const event = new Sub({
            'user-id': 111,
            'display-name': 'abc',
            'tmi-sent-ts': 11111111,
        }, {
            plan: 'a-plan',
        }, 222);

        assert.deepEqual(event, {
            userID: 111,
            displayName: 'abc',
            timestamp: 11111111,
            subType: 'a-plan',
            methods: {
                plan: 'a-plan',
            },
        });
        assert.isTrue(event instanceof Sub);
    });
});