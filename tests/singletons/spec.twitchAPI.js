const { assert } = require('chai');
const sinon = require('sinon');

const twitchAPI = require("../../js/singletons/twitchAPI");
const api = require("../../js/simpletons/api");
const auth = require('../../js/simpletons/auth');

describe('twitchAPI.js', () => {
    afterEach(() => {
        reset();
    });

    it('getChannelInfo()', async () => {
        auth._setAuthToken('testToken');
        sinon.stub(api, 'queryTwitchApi')
            .withArgs(`helix/streams?user_login=abc`, auth.getAuthObj())
            .returns({ data: ['something'] });

        assert.deepEqual(await twitchAPI.getChannelInfo('abc'), { data: ['something'] });
    });

    it('getChannelSearch()', async () => {
        auth._setAuthToken('testToken');
        const stub = sinon.stub(api, 'queryTwitchApi')
            .withArgs(`helix/search/channels?query=abcdef&first=10`, auth.getAuthObj())
            .returns({ data: ['nanana'] });
        assert.deepEqual(await twitchAPI.getChannelSearch('!!!!'), {});
        sinon.assert.notCalled(stub);

        assert.deepEqual(await twitchAPI.getChannelSearch('abcdef'), { data: ['nanana'] });
        sinon.assert.calledOnce(stub);
    });

});