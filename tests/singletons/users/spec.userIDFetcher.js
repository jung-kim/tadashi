const fetchMock = require('fetch-mock');
const { assert } = require('chai');
const statusCodes = require('http-status-codes').StatusCodes;
const sinon = require('sinon');

const auth = require('../../../js/simpletons/auth');
const api = require('../../../js/simpletons/api');
const userIDFetcher = require('../../../js/singletons/users/userIDFetcher');
const { eventSignals } = require('../../../js/helpers/signals');

describe('userIDFetcher.js', () => {
    beforeEach(() => {
        fetchMock.reset();
        reset();
    });

    afterEach(() => {
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

    it('_fetch', async () => {
        sinon.stub(auth, 'getAuthObj').returns({});
        userIDFetcher.fetch = () => ({});

        userIDFetcher.add('a');
        userIDFetcher.add('b');
        userIDFetcher.add('c');

        const fetchUserIDsForNames = sinon.stub(userIDFetcher, '_fetchUserIDsForNames');

        await userIDFetcher._fetch();

        sinon.assert.calledOnce(fetchUserIDsForNames.withArgs({}, ['a', 'b', 'c']));
    });

    it('_fetchUserIDsForNames', async () => {
        const apiRes = {
            data: [
                { login: 'a' },
                { login: 'c' }]
        };
        userIDFetcher._names = new Set(['a', 'b', 'c'])
        sinon.stub(auth, 'getAuthObj').returns({});
        sinon.stub(api, 'queryTwitchApi').withArgs('helix/users?login=a&login=b&login=c', {})
            .returns(apiRes);

        await userIDFetcher._fetchUserIDsForNames({}, ['a', 'b', 'c']);

        sinon.assert.calledOnce(eventSignals.dispatch.withArgs({ event: 'fetch.user.ids.resp', data: apiRes }));
        assert.deepEqual(Array.from(userIDFetcher._names), ['b']);
    });
});