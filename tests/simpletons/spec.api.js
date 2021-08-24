const { assert } = require('chai');
const fetchMock = require('fetch-mock');
const sinon = require('sinon');
const statusCodes = require('http-status-codes').StatusCodes;
const pako = require('pako');

const testUtils = require('../testUtils');
const api = require('../../js/simpletons/api');
const env = require('../../js/env');

describe('api.js', () => {
    const testPath = "/test"
    const testBody = { "test": "test" };
    const testAuth = 'an-auth';
    const defaultAuth = {
        'Client-ID': env.CLIENT_ID,
        Accept: 'application/vnd.twitchtv.v5+json',
    }
    let clock;

    beforeEach(() => {
        fetchMock.reset();
        testUtils.setFakeNow();
        testUtils.unsetFakeNow();
        env.CLIENT_ID = '';
        testUtils.reset();
        clock = sinon.useFakeTimers();
    });

    afterEach(() => {
        clock.restore(0);
    });

    describe('_getEffectiveTimeout', function () {
        this.timeout(500);
        it('with default attempt', async () => {
            const timeout = api._getEffectiveTimeout();
            clock.tick(55);
            await timeout;
        });

        it('with an argument', async () => {
            const timeout = api._getEffectiveTimeout(4);
            clock.tick(3175);
            await timeout;
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

    describe('_queryTwitchApi', async () => {
        it('zero allowance, not at max attempt should do retry 5 times', async () => {
            api._allowance = 0;

            const _getEffectiveTimeout = sinon.stub(api, '_getEffectiveTimeout').
                returns(Promise.resolve());

            try {
                await api._queryTwitchApi('a/b/c', 'an-auth');
                assert.fail('should have thrown');
            } catch (e) {
                assert.equal(e, 'api limit reached');
            }

            sinon.assert.calledOnce(_getEffectiveTimeout.withArgs(undefined));
            sinon.assert.calledOnce(_getEffectiveTimeout.withArgs(1));
            sinon.assert.calledOnce(_getEffectiveTimeout.withArgs(2));
            sinon.assert.calledOnce(_getEffectiveTimeout.withArgs(3));
            sinon.assert.calledOnce(_getEffectiveTimeout.withArgs(4));
        });

        it('normal happy fetch', async () => {
            fetchMock.getOnce((url, option) => {
                return url === testPath && option === testAuth;
            }, {
                status: statusCodes.OK,
                headers: {
                    'Ratelimit-Remaining': 10,
                },
                body: testBody,
            }, {
                overwriteRoutes: true,
            });

            const res = await api._queryTwitchApi(testPath, testAuth);

            assert.equal(api._allowance, 10);
            assert.deepEqual(res, testBody);
        });

        it('normal happy fetch with default auth', async () => {
            fetchMock.getOnce((url, option) => {
                assert.deepEqual(option, { headers: defaultAuth })
                return url === testPath;
            }, {
                status: statusCodes.OK,
                headers: {
                    'Ratelimit-Remaining': 15,
                },
                body: testBody,
            }, {
                overwriteRoutes: true,
            });

            const res = await api._queryTwitchApi(testPath);

            assert.equal(api._allowance, 15);
            assert.deepEqual(res, testBody);
        });

        it('fetch, no more allowance should set resetAt', async () => {
            fetchMock.getOnce((url, option) => {
                assert.deepEqual(option, { headers: defaultAuth })
                return url === testPath;
            }, {
                status: statusCodes.OK,
                headers: {
                    'Ratelimit-Remaining': 0,
                },
                body: testBody,
            }, {
                overwriteRoutes: true,
            });

            const res1 = await api._queryTwitchApi(testPath);
            fetchMock.getOnce((url, option) => {
                assert.deepEqual(option, { headers: defaultAuth })
                return url === testPath;
            }, {
                status: statusCodes.OK,
                headers: {
                    'Ratelimit-Remaining': 11,
                },
                body: testBody,
            }, {
                overwriteRoutes: true,
            });
            assert.isNotNull(api._resetTimeout);

            clock.tick(3001);
            const res2 = await api._queryTwitchApi(testPath);
            assert.isUndefined(api._resetTimeout);

            assert.equal(api._allowance, 11);
            assert.deepEqual(res1, testBody);
            assert.deepEqual(res2, testBody);
        });

        it('fetch no more allowance but resetAt already set', async () => {
            api._resetTimeout = Promise.resolve();
            fetchMock.getOnce((url, option) => {
                assert.deepEqual(option, { headers: defaultAuth })
                return url === testPath;
            }, {
                status: statusCodes.OK,
                headers: {
                    'Ratelimit-Remaining': 0,
                    'Ratelimit-Reset': 10000,
                },
                body: testBody,
            }, {
                overwriteRoutes: true,
            });

            const res1 = await api._queryTwitchApi(testPath);
            fetchMock.getOnce((url, option) => {
                assert.deepEqual(option, { headers: defaultAuth })
                return url === testPath;
            }, {
                status: statusCodes.OK,
                headers: {
                    'Ratelimit-Remaining': 11,
                },
                body: testBody,
            }, {
                overwriteRoutes: true,
            });
            assert.isNotNull(api._resetTimeout);

            // simulate _resetTimeout already is fired
            api._allowance = 10;
            api._resetTimeout = undefined;

            const res2 = await api._queryTwitchApi(testPath);
            assert.isUndefined(api._resetTimeout);

            assert.equal(api._allowance, 11);
            assert.deepEqual(res1, testBody);
            assert.deepEqual(res2, testBody);
        });

        it('failed fetch', async () => {
            fetchMock.getOnce((url, option) => {
                assert.deepEqual(option, { headers: defaultAuth });
                return url === testPath;
            }, {
                status: statusCodes.INTERNAL_SERVER_ERROR,
                headers: {
                    'Ratelimit-Remaining': 18,
                },
                body: testBody,
            }, {
                overwriteRoutes: true,
            });

            try {
                await api._queryTwitchApi(testPath);
                assert.fail('should not have succeeded');
            } catch (e) {
                assert.deepEqual(e, { status: statusCodes.INTERNAL_SERVER_ERROR, msg: 'query failed' });
            }

            assert.equal(api._allowance, 18);
        });

        it('gziped response', async () => {
            fetchMock.getOnce((url, option) => {
                assert.deepEqual(option, { headers: defaultAuth });
                return url === testPath;
            }, {
                status: statusCodes.OK,
                headers: {
                    'Content-Type': 'gzip',
                    'Ratelimit-Remaining': 13,
                },
                body: testBody,
            }, {
                overwriteRoutes: true,
            });

            sinon.stub(pako, 'ungzip').withArgs(sinon.match.any, { to: 'string' }).returns(JSON.stringify(testBody));

            const result = await api._queryTwitchApi(testPath);

            assert.deepEqual(result, testBody)

            assert.equal(api._allowance, 13);

        });
    });

    it('queryTwitchApi', async () => {
        api._pLimit = require('p-limit')(2);

        let startedCounter = 0;
        let finishedCounter = 0;
        sinon.stub(api, '_queryTwitchApi').
            callsFake(async (...args) => {
                assert.equal('http://127.0.0.1:5556/abc/edf', args[0])
                assert.equal('an-auth', args[1])

                startedCounter++;
                await new Promise(resolve => setTimeout(resolve, 5000));
                finishedCounter++;
            });

        const call1 = api.queryTwitchApi('abc/edf', 'an-auth');
        const call2 = api.queryTwitchApi('abc/edf', 'an-auth');
        const call3 = api.queryTwitchApi('abc/edf', 'an-auth');

        assert.equal(startedCounter, 2);
        assert.equal(finishedCounter, 0);

        clock.tick(6000);
        await call1;
        await call2;

        assert.equal(startedCounter, 3);
        assert.equal(finishedCounter, 2);

        clock.tick(6000);
        await call3;

        assert.equal(startedCounter, 3);
        assert.equal(finishedCounter, 3);
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