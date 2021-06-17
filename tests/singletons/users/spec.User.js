const { assert } = require('chai');
const env = require('../../../js/env');
const User = require('../../../js/singletons/users/User');

describe('User.js', () => {
    it('new()', () => {
        const u1 = getUserObject(123, 'abc');
        assert.equal(u1._id, 123);
        assert.equal(u1._userName, 'abc');
        assert.isUndefined(u1._following);
        assert.isUndefined(u1._followedBy);

        const u2 = getUserObject(undefined, 'abc', [1], [2]);
        assert.isUndefined(u2._id);
        assert.equal(u2._userName, 'abc');
        assert.deepEqual(u2._following, new Set([1]));
        assert.deepEqual(u2._followedBy, new Set([2]));
    });

    describe('addFollowing()', () => {
        it('default', () => {
            const u1 = getUserObject(123, 'abc');
            assert.isUndefined(u1._following);

            u1.addFollowing(1);
            assert.deepEqual(u1._following, new Set([1]));


            u1.addFollowing(2);
            assert.deepEqual(u1._following, new Set([1, 2]));

            u1.addFollowing(2);
            assert.deepEqual(u1._following, new Set([1, 2]));

            u1.addFollowedBy();
            assert.deepEqual(u1._following, new Set([1, 2]));
        });

        it('undefined', () => {
            const u1 = getUserObject(123, 'abc');

            u1.addFollowing();

            assert.isUndefined(u1._following);
        });
    });

    describe('addFollowedBy()', () => {
        it('default', () => {
            const u1 = getUserObject(123, 'abc');
            assert.isUndefined(u1._followedBy);

            u1.addFollowedBy(1);
            assert.deepEqual(u1._followedBy, new Set([1]));


            u1.addFollowedBy(2);
            assert.deepEqual(u1._followedBy, new Set([1, 2]));

            u1.addFollowedBy(2);
            assert.deepEqual(u1._followedBy, new Set([1, 2]));

            u1.addFollowedBy();
            assert.deepEqual(u1._followedBy, new Set([1, 2]));
        });

        it('undefined', () => {
            const u1 = getUserObject(123, 'abc');

            u1.addFollowedBy();

            assert.isUndefined(u1._followedBy);
        });
    });

    it('isFollowing()', () => {
        const u1 = getUserObject(123, 'abc');

        assert.isUndefined(u1.isFollowing(1));

        u1.addFollowing(1);
        assert.isTrue(u1.isFollowing(1));
        assert.isFalse(u1.isFollowing(4));
    });

    it('isFollowedBy()', () => {
        const u1 = getUserObject(123, 'abc');

        assert.isUndefined(u1.isFollowedBy(1));

        u1.addFollowedBy(1);
        assert.isTrue(u1.isFollowedBy(1));
        assert.isFalse(u1.isFollowedBy(4));
    });

    it('getFollowingCounts', () => {
        const u1 = getUserObject(123, 'abc');

        assert.isUndefined(u1.getFollowingCounts());

        u1.addFollowing(1);
        u1.addFollowing(2);
        u1.addFollowing(3);
        u1.addFollowing(3);

        assert.equal(u1.getFollowingCounts(), 3);
    });

    it('getFollowedByCounts', () => {
        const u1 = getUserObject(123, 'abc');

        assert.isUndefined(u1.getFollowedByCounts());

        u1.addFollowedBy(1);
        u1.addFollowedBy(2);
        u1.addFollowedBy(3);
        u1.addFollowedBy(3);

        assert.equal(u1.getFollowedByCounts(), 3);
    });

    it('getUserName', () => {
        const u1 = getUserObject(123, 'abc');
        assert.equal(u1.getUserName(), 'abc');
    });


    describe('addSubscribedTo', () => {
        it('null case', () => {
            const user = new User(123, 'abc')
            user.addSubscribedTo();
            assert.isUndefined(user._subscribedTo);
        });

        it('add valid object', () => {
            const user = new User(123, 'abc')
            user.addSubscribedTo({
                broadcaster_id: 111,
                plan_name: "Channel Subscription (twitchdev)",
            });
            assert.deepEqual(user._subscribedTo, {
                111: {
                    broadcaster_id: 111,
                    plan_name: "Channel Subscription (twitchdev)",
                }
            });

            user.addSubscribedTo({
                broadcaster_id: 222,
                plan_name: "Channel Subscription (twitchdev)",
            });
            assert.deepEqual(user._subscribedTo, {
                111: {
                    broadcaster_id: 111,
                    plan_name: "Channel Subscription (twitchdev)",
                },
                222: {
                    broadcaster_id: 222,
                    plan_name: "Channel Subscription (twitchdev)",
                }
            });
        });
    });

    it('getSubscribedToCount', () => {
        const user = new User(123, 'abc')

        assert.equal(user.getSubscribedToCount(), undefined);

        user.addSubscribedTo({
            broadcaster_id: 111,
            plan_name: "Channel Subscription (twitchdev)",
        });

        assert.equal(user.getSubscribedToCount(), 1);

        user.addSubscribedTo({
            broadcaster_id: 222,
            plan_name: "Channel Subscription (twitchdev)",
        });

        assert.equal(user.getSubscribedToCount(), 2);
    });

    describe('getSubscribedTo', () => {
        it('undefined cases', () => {
            const user = new User(123, 'abc');

            assert.isUndefined(user.getSubscribedTo(9999));
        });

        it('match case', () => {
            const user = new User(123, 'abc');

            user.addSubscribedTo({
                broadcaster_id: 111,
                plan_name: "Channel Subscription (twitchdev)",
            });

            assert.deepEqual(user.getSubscribedTo(111), {
                broadcaster_id: 111,
                plan_name: "Channel Subscription (twitchdev)",
            });
        });
    });

    describe('getInfo', () => {
        it('without sub', () => {
            const user = getUserObject(111, 'abc');
            env.channelId = 123;
            assert.equal(user.getInfo(), "following: undefined\nis_subscribed: false");
        });

        it('with none gifted sub', () => {
            const user = getUserObject(111, 'abc', [123], undefined, { 123: { tier: '1000', plan_name: 'a-plan', is_gift: false } });
            env.channelId = 123;
            assert.equal(user.getInfo(), "following: true\nis_subscribed: true\ntier: 1000\nplan_name: a-plan");
        });

        it('with gifted sub', () => {
            const user = getUserObject(111, 'abc', [123], undefined, { 123: { tier: '1000', plan_name: 'a-plan', is_gift: true, gifter_name: 'a-gifter' } });
            env.channelId = 123;
            assert.equal(user.getInfo(), "following: true\nis_subscribed: true\ntier: 1000\nplan_name: a-plan\ngifter_name: a-gifter");
        });
    });

    describe('getInfoCss', () => {
        it('not subscribed', () => {
            const user = getUserObject(111, 'abc');
            env.channelId = 123;
            assert.equal(user.getInfoCss(), 'not-subscribed');
        });

        it('subscribed', () => {
            const user = getUserObject(111, 'abc');
            user.addSubscribedTo({ broadcaster_id: 123 })
            env.channelId = 123;
            assert.equal(user.getInfoCss(), 'subscribed');
        });
    });
});