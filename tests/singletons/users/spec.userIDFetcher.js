const { assert } = require('chai');
const sinon = require('sinon');

const auth = require('../../../js/singletons/auth');
const api = require('../../../js/singletons/api');
const userIDFetcher = require('../../../js/singletons/users/userIDFetcher');
const { eventSignals } = require('../../../js/helpers/signals');
const testUtils = require('../../testUtils');

describe('userIDFetcher.js', () => {
    beforeEach(() => {
        testUtils.reset();
    });

    beforeEach(() => {
        userIDFetcher.reset();
        auth._auth = undefined;
    });

    it('add()', () => {
        userIDFetcher.fetch = () => ({});

        userIDFetcher.add('a');
        assert.deepEqual(userIDFetcher._names, new Set(['a']));


        userIDFetcher.add('a');
        userIDFetcher.add('b');
        assert.deepEqual(userIDFetcher._names, new Set(['a', 'b']));
    });

    describe('_fetch', () => {
        it('already running', async () => {
            userIDFetcher._isRunning = true;
            const getAuthStub = sinon.stub(auth, 'getAuthObj')

            userIDFetcher._fetch();

            sinon.assert.notCalled(getAuthStub);
            assert.isTrue(userIDFetcher._isRunning);
        });

        it('success', async () => {
            sinon.stub(auth, 'getAuthObj').returns({});
            userIDFetcher.fetch = () => ({});

            userIDFetcher.add('a');
            userIDFetcher.add('b');
            userIDFetcher.add('c');

            const fetchUserIDsForNames = sinon.stub(userIDFetcher, '_fetchUserIDsForNames');

            await userIDFetcher._fetch();

            sinon.assert.calledOnce(fetchUserIDsForNames.withArgs({}, ['a', 'b', 'c']));
            assert.isFalse(userIDFetcher._isRunning);
        });


        it('error', async () => {
            sinon.stub(auth, 'getAuthObj').returns({});
            userIDFetcher.fetch = () => ({});

            userIDFetcher.add('a');
            userIDFetcher.add('b');
            userIDFetcher.add('c');

            const fetchUserIDsForNames = sinon.stub(userIDFetcher, '_fetchUserIDsForNames').
                throws("something");

            await userIDFetcher._fetch();

            sinon.assert.calledOnce(fetchUserIDsForNames.withArgs({}, ['a', 'b', 'c']));
            assert.isFalse(userIDFetcher._isRunning);
        });
    });

    it('_fetchUserIDsForNames', async () => {
        const apiRes = {
            data: [
                { login: 'a' },
                { login: 'c' }]
        };
        userIDFetcher._names = new Set(['a', 'b', 'c'])
        sinon.stub(auth, 'getAuthObj').returns({});
        sinon.stub(api, 'queryTwitchApi').withArgs('helix/users?login=a&login=b&login=c', {}).
            returns(apiRes);

        await userIDFetcher._fetchUserIDsForNames({}, ['a', 'b', 'c']);

        sinon.assert.calledOnce(eventSignals.dispatch.withArgs({ event: 'fetch.user.ids.resp', data: apiRes }));
        assert.deepEqual(Array.from(userIDFetcher._names), ['b']);
    });
});