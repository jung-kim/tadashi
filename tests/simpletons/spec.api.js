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

    describe('_makeTwitchAPIQuery', () => {
        const defaultAuth = {
            'Client-ID': env.CLIENT_ID,
            Accept: 'application/vnd.twitchtv.v5+json',
        }

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

            sinon.assert.calledOnce(_getEffectiveTimeout.withArgs(0));
            sinon.assert.calledOnce(_getEffectiveTimeout.withArgs(1));
            sinon.assert.calledOnce(_getEffectiveTimeout.withArgs(2));
            sinon.assert.calledOnce(_getEffectiveTimeout.withArgs(3));
            sinon.assert.calledOnce(_getEffectiveTimeout.withArgs(4));
        });


    });

    it('queryTwitchApi', async () => {
        api._pLimit = require('p-limit')(2);

        let startedCounter = 0;
        let finishedCounter = 0;
        sinon.stub(api, '_queryTwitchApi')
            .callsFake(async (...args) => {
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