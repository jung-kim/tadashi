const fetchMock = require('fetch-mock');
const { assert } = require('chai');
const statusCodes = require('http-status-codes').StatusCodes;
const sinon = require('sinon');

const auth = require('../../../js/simpletons/auth');
const api = require('../../../js/simpletons/api');
const userIDFetcher = require('../../../js/singletons/users/userIDFetcher');

describe('userIDFetcher.js', () => {
    beforeEach(() => {
        fetchMock.reset();
        auth._setAuthToken('testAuth');
        api.reset();
        sinon.verifyAndRestore();
    });

    afterEach(() => {
        userIDFetcher.reset();
        auth._auth = undefined;
    });

    it('add()', () => {
        userIDFetcher.fetch = () => { };

        userIDFetcher.add('a');
        assert.deepEqual(userIDFetcher._names, new Set(['a']));


        userIDFetcher.add('a');
        userIDFetcher.add('b');
        assert.deepEqual(userIDFetcher._names, new Set(['a', 'b']));
    });

    it('_fetch', async () => {
        userIDFetcher.fetch = () => { };

        userIDFetcher.add('a');
        userIDFetcher.add('b');
        userIDFetcher.add('c');

        fetchMock.getOnce(`end:helix/users?login=a&login=b&login=c`, {
            status: statusCodes.ACCEPTED,
            body: { data: [{ login: 'a', id: 1 }, { login: 'c', id: 3 }] },
        });
        await userIDFetcher._fetch();

        assert.deepEqual(userIDFetcher._names, new Set(['b']));

        fetchMock.getOnce(`end:helix/users?login=b`, {
            status: statusCodes.TOO_MANY_REQUESTS,
        });
        await userIDFetcher._fetch();
        assert.deepEqual(userIDFetcher._names, new Set(['b']));
    });
});