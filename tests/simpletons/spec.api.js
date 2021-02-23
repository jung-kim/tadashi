const { assert } = require('chai');
const fetchMock = require('fetch-mock');
const statusCodes = require('http-status-codes').StatusCodes;

const testUtils = require('../testUtils');
const api = require('../../js/simpletons/api');
const env = require('../../js/env');
const constants = require('../../js/helpers/constants');

describe('api.js', () => {
    const testPath = "test"
    const testRoutePath = `path:/${testPath}`;
    const testURL = `${env.TWITCH_ENDPOINT}/${testPath}`
    const testBody = { "test": "test" };

    beforeEach(() => {
        api.reset();
        fetchMock.reset();
        testUtils.setFakeNow();
    });

    afterEach(() => {
        testUtils.unsetFakeNow();
    });

    describe('_makeAPIQuery', () => {
        it('make sure 200 works', async () => {
            fetchMock.getOnce(testRoutePath, {
                status: statusCodes.OK,
                body: testBody,
            }, {
                overwriteRoutes: true,
            });
            assert.deepEqual(await api._makeAPIQuery(testURL, undefined), testBody);
            assert.isNull(api.waitForReset);
        });

        it('2xx should work', async () => {
            fetchMock.getOnce(testRoutePath, {
                status: statusCodes.ACCEPTED,
                body: testBody,
            }, {
                overwriteRoutes: true,
            });
            assert.deepEqual(await api._makeAPIQuery(testURL, undefined), testBody);
            assert.isNull(api.waitForReset);
        });

        it('5xx should throw exception', async () => {
            fetchMock.getOnce(testRoutePath, {
                status: statusCodes.INTERNAL_SERVER_ERROR,
                body: testBody,
            }, {
                overwriteRoutes: true,
            });
            try {
                await api._makeAPIQuery(testURL, undefined);
                assert.fail("should not be called");
            } catch (err) {
                assert.deepEqual(err, { status: statusCodes.INTERNAL_SERVER_ERROR, msg: 'query failed', resetAt: testUtils.fakeNow + constants.MAX_AWAIT_DURATION_SEC });
            }
            assert.isNull(api.waitForReset);
        });

        it('5xx with 0 allowance should set timer', async () => {
            let t = testUtils.fakeNow + 10;
            fetchMock.getOnce(testRoutePath, {
                status: statusCodes.INTERNAL_SERVER_ERROR,
                body: testBody,
                headers: {
                    [constants.RATELIMIT_REMAINING]: 0,
                    [constants.RATELIMIT_RESET]: t,
                }
            }, {
                overwriteRoutes: true,
            });
            try {
                await api._makeAPIQuery(testURL, undefined);
                assert.fail("should not be called");
            } catch (err) {
                assert.deepEqual(err, { status: statusCodes.INTERNAL_SERVER_ERROR, msg: 'too many requests', resetAt: t });
            }
            assert.isNotNull(api.waitForReset);
            api.reset();
        });

        it('5xx with over limit max await duration should set to max await duration', async () => {
            t = testUtils.fakeNow + constants.MAX_AWAIT_DURATION_MS + 2000;
            fetchMock.getOnce(testRoutePath, {
                status: statusCodes.INTERNAL_SERVER_ERROR,
                body: testBody,
                headers: {
                    [constants.RATELIMIT_REMAINING]: 0,
                    [constants.RATELIMIT_RESET]: t,
                }
            }, {
                overwriteRoutes: true,
            });
            try {
                await api._makeAPIQuery(testURL, undefined);
                assert.fail("should not be called");
            } catch (err) {
                assert.deepEqual(err, {
                    status: statusCodes.INTERNAL_SERVER_ERROR,
                    msg: 'too many requests',
                    resetAt: testUtils.fakeNow + constants.MAX_AWAIT_DURATION_MS
                });
            }
            assert.isNotNull(api.waitForReset);
            api.reset();
        });

        it('too many requests should trigger throttling despite with reamining', async () => {
            fetchMock.getOnce(testRoutePath, {
                status: statusCodes.TOO_MANY_REQUESTS,
                body: testBody,
                headers: {
                    [constants.RATELIMIT_REMAINING]: 2,
                    [constants.RATELIMIT_RESET]: testUtils.fakeNow + 1,
                }
            }, {
                overwriteRoutes: true,
            });
            try {
                await api._makeAPIQuery(testURL, undefined);
                assert.fail("should not be called");
            } catch (err) {
                assert.deepEqual(err, {
                    status: statusCodes.TOO_MANY_REQUESTS,
                    msg: 'too many requests',
                    resetAt: testUtils.fakeNow + 1
                });
            }
            assert.isNotNull(api.waitForReset);

            // next call should be blocked
            fetchMock.getOnce(testRoutePath, {
                status: statusCodes.ACCEPTED,
                body: testBody,
            }, {
                overwriteRoutes: true,
            });
            const start = Date.now();
            assert.deepEqual(await api._makeAPIQuery(testURL, undefined), testBody);
            assert.isTrue((Date.now() - start) > 1000);
            assert.isNull(api.waitForReset);

            api.reset();
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
});