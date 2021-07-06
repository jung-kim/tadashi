const { assert } = require('chai');
const fetchMock = require('fetch-mock');
const sinon = require('sinon');
const statusCodes = require('http-status-codes').StatusCodes;
const pako = require('pako');

const testUtils = require('../testUtils');
const api = require('../../js/simpletons/api');
const env = require('../../js/env');
const eventSignals = require('../../js/helpers/signals').eventSignals;

describe('api.js', () => {
    const testPath = "test"
    const testRoutePath = `path:/${testPath}`;
    const testBody = { "test": "test" };

    beforeEach(() => {
        fetchMock.reset();
        testUtils.setFakeNow();
        testUtils.unsetFakeNow();
        env.CLIENT_ID = '';
        testUtils.reset();
    });

    describe('_makeTwitchAPIQuery', () => {
        const defaultAuth = {
            'Client-ID': env.CLIENT_ID,
            Accept: 'application/vnd.twitchtv.v5+json',
        }

        it('block on waitForReset', async () => {
            api.waitForReset = new Promise((resolve) => {
                setTimeout(resolve, 500);
            });
            fetchMock.getOnce(testRoutePath, {
                status: statusCodes.OK,
                body: testBody,
            }, {
                overwriteRoutes: true,
            });

            const start = Date.now();
            assert.deepEqual(await api._makeTwitchAPIQuery(testPath), testBody);
            const diff = Date.now() - start;

            sinon.assert.calledOnce(eventSignals.dispatch.withArgs({ event: 'api.unthrottled' }));

            assert.deepEqual(fetchMock.lastOptions().headers, defaultAuth)
            assert.isTrue(diff >= 500);
            assert.isNull(api.waitForReset);
        });

        it('response not ok', async () => {
            fetchMock.getOnce(testRoutePath, {
                status: statusCodes.INTERNAL_SERVER_ERROR,
                body: testBody,
            }, {
                overwriteRoutes: true,
            });

            try {
                await api._makeTwitchAPIQuery(testPath);
            } catch (err) {
                assert.deepEqual(err, { status: statusCodes.INTERNAL_SERVER_ERROR, msg: 'query failed' })
            }

            assert.deepEqual(fetchMock.lastOptions().headers, defaultAuth)
            assert.isNull(api.waitForReset);
        });

        it('response gziped', async () => {
            fetchMock.getOnce(testRoutePath, {
                status: statusCodes.OK,
                headers: {
                    'Content-Type': 'gzip'
                },
                body: '',
            }, {
                overwriteRoutes: true,
            });
            sinon.stub(pako, 'ungzip').withArgs(sinon.match.any, { to: 'string' }).returns(JSON.stringify(testBody));

            assert.deepEqual(await api._makeTwitchAPIQuery(testPath), testBody);

            assert.deepEqual(fetchMock.lastOptions().headers, defaultAuth)
            assert.isNull(api.waitForReset);
        });

        it('remaining is 0', async () => {
            fetchMock.getOnce(testRoutePath, {
                status: statusCodes.OK,
                headers: {
                    'Ratelimit-Remaining': 0,
                    'Ratelimit-Reset': testUtils.fakeNow,
                },
                body: testBody,
            }, {
                overwriteRoutes: true,
            });

            try {
                assert.deepEqual(await api._makeTwitchAPIQuery(testPath), testBody);
            } catch (err) {
                assert.deepEqual(err, { status: statusCodes.OK, msg: 'too many requests' });
            }

            assert.deepEqual(fetchMock.lastOptions().headers, defaultAuth)
            assert.isNotNull(api.waitForReset);
        });

        it('response status is too many requests', async () => {
            fetchMock.getOnce(testRoutePath, {
                status: statusCodes.TOO_MANY_REQUESTS,
                headers: {
                    'Ratelimit-Remaining': 10,
                    'Ratelimit-Reset': testUtils.fakeNow,
                },
                body: testBody,
            }, {
                overwriteRoutes: true,
            });

            try {
                assert.deepEqual(await api._makeTwitchAPIQuery(testPath), testBody);
            } catch (err) {
                assert.deepEqual(err, { status: statusCodes.TOO_MANY_REQUESTS, msg: 'too many requests' });
            }

            assert.deepEqual(fetchMock.lastOptions().headers, defaultAuth)
            assert.isNotNull(api.waitForReset);
        });
    });

    it('queryTmiApi', async () => {
        const path = "/somewhere/over/ther/rainbow";

        fetchMock.getOnce(`${env.TMI_ENDPOINT}/${path}`, {
            status: statusCodes.OK,
            body: '{"h": "hello"}',
        }, {
            overwriteRoutes: true,
        });

        const resp = await api.queryTmiApi(path);

        assert.deepEqual(resp, { h: "hello" });
    });

    it('queryTwitchApi', async () => {
        const _makeTwitchAPIQuery = sinon.stub(api, '_makeTwitchAPIQuery').
            withArgs(`${env.TWITCH_ENDPOINT}/abc/edf`, 'an-auth');

        await api.queryTwitchApi('abc/edf', 'an-auth');

        sinon.assert.calledOnce(_makeTwitchAPIQuery);
    });

    describe('_getThrottledSleepDuration', () => {
        it('error case', () => {
            const sleepDuration = api._getThrottledSleepDuration({
                headers: {
                    get: (key) => {
                        assert.equal(key, 'Ratelimit-Reset');
                        return 'abc';
                    }
                }
            });
            assert.equal(sleepDuration, 15);
        });

        it('value is too large', () => {
            const sleepDuration = api._getThrottledSleepDuration({
                headers: {
                    get: (key) => {
                        assert.equal(key, 'Ratelimit-Reset');
                        return '9999';
                    }
                }
            });
            assert.equal(sleepDuration, 15);
        });

        it('value is appropriate', () => {
            const sleepDuration = api._getThrottledSleepDuration({
                headers: {
                    get: (key) => {
                        assert.equal(key, 'Ratelimit-Reset');
                        return '9';
                    }
                }
            });
            assert.equal(sleepDuration, 9);
        });
    });

    describe('getChannelSearch', () => {
        it('valid name', async () => {
            const queryTwitchApi = sinon.stub(api, 'queryTwitchApi').withArgs('helix/search/channels?query=abcsfwerw&first=10', 'auth-obj');

            await api.getChannelSearch('abcsfwerw', 'auth-obj');

            sinon.assert.calledOnce(queryTwitchApi);
        });

        it('invalid name', async () => {
            const queryTwitchApi = sinon.stub(api, 'queryTwitchApi');

            assert.deepEqual(await api.getChannelSearch('!!', 'auth-obj'), {});

            sinon.assert.notCalled(queryTwitchApi);
        });
    });

    it('getChannelInfo', async () => {
        const queryTwitchApi = sinon.stub(api, 'queryTwitchApi').withArgs('helix/streams?user-login=abc', 'auth-obj');

        await api.getChannelInfo('abc', 'auth-obj');

        sinon.assert.calledOnce(queryTwitchApi);
    });
});