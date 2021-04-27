const { assert } = require('chai');
const fetchMock = require('fetch-mock');
const statusCodes = require('http-status-codes').StatusCodes;
const sinon = require('sinon');

const auth = require('../../js/simpletons/auth');
const env = require('../../js/env');
const eventSignals = require('../../js/helpers/signals').eventSignals;

describe('auth.js', () => {
    beforeEach(() => {
        auth._authToken = undefined;
        localStorage.clear();
        fetchMock.reset();
        env.CLIENT_SECRET = undefined;
        auth.logout();
        reset();
    });

    it('_setAuthToken', () => {
        auth._setAuthToken('abc');
        assert.equal(auth._authToken, 'abc');

        auth._setAuthToken(undefined);
        assert.equal(auth._authToken, 'abc');
    });

    it('isAuthenticated', () => {
        assert.isFalse(auth.isAuthenticated());

        auth._setAuthToken('abc');
        assert.isTrue(auth.isAuthenticated());
    });

    it('isBroadcaster', () => {
        assert.isFalse(auth.isBroadcaster());

        auth._setAuthToken('abc');
        assert.isFalse(auth.isBroadcaster());

        auth._user = {};
        assert.isFalse(auth.isBroadcaster());


        auth._user = { broadcaster_type: 'yeah' };
        assert.isTrue(auth.isBroadcaster());
    });

    it('getLogin', () => {
        assert.isUndefined(auth.getLogin());

        auth._setAuthToken('abc');
        assert.isUndefined(auth.getLogin());

        auth._user = {};
        assert.isUndefined(auth.getLogin());


        auth._user = { login: 'someone' };
        assert.equal(auth.getLogin(), 'someone');
    });

    it('logout', () => {
        auth._setAuthToken('abc');
        auth._user = {};
        auth.logout();
        assert.isUndefined(auth._authToken);
        assert.isUndefined(auth._user);
        sinon.assert.calledOnce(eventSignals.dispatch.withArgs({ 'event': 'draw.nav.auth' }));
    });

    it('getAuthObj', () => {
        assert.isUndefined(auth.getAuthObj());

        auth._setAuthToken('abc');

        assert.deepEqual(auth.getAuthObj(), {
            headers: {
                "Accept": "application/vnd.twitchtv.v5+json",
                'Client-ID': env.CLIENT_ID,
                'Authorization': `Bearer abc`,
            }
        })
    });

    it('_authWithSecret', async () => {
        env.CLIENT_SECRET = undefined;
        await auth._authWithSecret();
        assert.isUndefined(auth._authToken);


        env.CLIENT_SECRET = 'secret';
        fetchMock.postOnce(`end:/oauth2/token?client_id=${env.CLIENT_ID}&client_secret=${env.CLIENT_SECRET}&grant_type=client_credentials&scope=user:read:email+bits:read+moderation:read+channel:read:subscriptions+analytics:read:games`, {
            status: statusCodes.OK,
            body: {
                access_token: 'abc'
            }
        }, {
            overwriteRoutes: true,
        });
        await auth._authWithSecret();
        assert.equal(auth._authToken, 'abc');
    });

    describe('authenticate', async () => {
        beforeEach(() => {
            auth.logout();
            reset();
        });

        it('do nothing if already authenticated', async () => {
            const isAuthenticated = sinon.stub(auth, 'isAuthenticated').returns(false);
            await auth.authenticate();
            sinon.assert.calledOnce(isAuthenticated);
        });

        it('parsedHash', async () => {
            let stub = sinon.stub(auth, 'isAuthenticated').returns(false);
            let searchParam = new URLSearchParams('');
            await auth.authenticate(searchParam);
            assert.isUndefined(auth._authToken);
            sinon.assert.calledTwice(stub);

            sinon.verifyAndRestore();

            stub = sinon.stub(auth, 'isAuthenticated').returns(false);
            searchParam = new URLSearchParams('access_token=1111');
            await auth.authenticate(searchParam);
            assert.equal(auth._authToken, '1111');
            sinon.assert.calledTwice(stub);
        });

        it('clientSecret', async () => {
            env.CLIENT_SECRET = 'abc'
            const stub = sinon.stub(auth, 'isAuthenticated').returns(false);
            const authWithSecretStub = sinon.stub(auth, '_authWithSecret');
            await auth.authenticate();
            sinon.assert.calledTwice(stub);
            sinon.assert.calledOnce(authWithSecretStub);
        });

        it('redirect', async () => {
            assert.isTrue((await auth.authenticate()).indexOf(`/oauth2/authorize?client_id=${env.CLIENT_ID}&redirect_uri=${env.REDIRECT_URL}&response_type=token`) > -1);
        });

        it('after auth', async () => {
            const searchParam = new URLSearchParams('access_token=1111');

            fetchMock.getOnce(`end:/helix/users`, {
                status: statusCodes.OK,
                body: {
                    data: [{
                        broadcaster_type: 'someone',
                        login: 'a-login'
                    }]
                },
                headers: {
                    'Client-ID': env.CLIENT_ID,
                    'Authorization': `Bearer 1111`,
                }
            }, {
                overwriteRoutes: true,
            });
            await auth.authenticate(searchParam);

            assert.equal(auth._authToken, '1111');
            assert.isTrue(auth.isBroadcaster());
            assert.deepEqual(auth._user, { broadcaster_type: 'someone', login: 'a-login' });
            sinon.assert.calledOnce(eventSignals.dispatch.withArgs({ 'event': 'draw.nav.auth' }));
            sinon.assert.calledOnce(eventSignals.dispatch.withArgs({ 'event': 'channel.changed', channel: 'a-login' }));
        });

        it('user fetch fail', async () => {
            const searchParam = new URLSearchParams('access_token=1111');

            fetchMock.getOnce(`end:/helix/users`, {
                status: statusCodes.OK,
                body: {
                    data: ['a_user']
                },
                headers: {
                    'Client-ID': env.CLIENT_ID,
                    'Authorization': `Bearer 1111`,
                },
                throws: new Error('something'),
            }, {
                overwriteRoutes: true,
            });
            await auth.authenticate(searchParam);

            assert.equal(auth._authToken, '1111');
            assert.isUndefined(auth._user);
            sinon.assert.calledOnce(eventSignals.dispatch.withArgs({ 'event': 'draw.nav.auth' }));
            sinon.assert.notCalled(eventSignals.dispatch.withArgs({ 'event': 'channel.changed', channel: sinon.match.any }));
        });
    });

    it('getID', () => {
        auth._user = undefined;
        assert.isUndefined(auth.getID());

        auth._user = {};
        assert.isUndefined(auth.getID());

        auth._user = { id: 1 };
        assert.equal(auth.getID(), 1);
    });
});