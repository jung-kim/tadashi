
const { assert } = require('chai');
const Sub = require('../../../js/models/events/Sub');

describe('Sub.js', () => {
    it('just user state', () => {
        const s = new Sub({
            'user-id': 111,
            'display-name': 'abc',
            'tmi-sent-ts': 11111111,
            'months': 5,
            'msg-param-cumulative-months': 6,
            'subType': 'a-sub-type',
            'subRank': 'a-sub-rank'
        });

        assert.deepEqual(s, {
            userID: 111,
            displayName: 'abc',
            timestamp: 11111111,
            months: 5,
            totalMonths: 6,
            subType: 'a-sub-type',
            subRank: 'a-sub-rank',
        });
    });

    it('user state override', () => {
        const s = new Sub({
            'user-id': 111,
            'display-name': 'abc',
            'tmi-sent-ts': 11111111,
            'months': 5,
            'msg-param-cumulative-months': 6,
            'subType': 'a-sub-type',
            'subRank': 'a-sub-rank'
        }, {
            plan: 'a-plan',
            prime: true
        }, 222);

        assert.deepEqual(s, {
            userID: 111,
            displayName: 'abc',
            timestamp: 11111111,
            months: 222,
            totalMonths: 5,
            subType: 'prime',
            subRank: 'a-plan',
        });
    });
});