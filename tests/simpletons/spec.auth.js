const { assert } = require('chai');
const fetchMock = require('fetch-mock');
const statusCodes = require('http-status-codes').StatusCodes;
const sinon = require('sinon');

const auth = require('../../js/simpletons/auth');
const env = require('../../js/env');
const eventSignals = require('../../js/helpers/signals').eventSignals;

describe('auth.js', () => {
    beforeEach(() => {
        env.CLIENT_SECRET = undefined;
        reset();
    });

    describe('_initialize', () => {
        it('success', () => {
            const _postAuth = sinon.stub(auth, '_postAuth');
            localStorage.setItem('auth', '{1:1}');

            auth._initialize();

            sinon.assert.calledOnce(_postAuth);
            assert.deepEqual(auth._authToken);
        });

        it('error', () => {
            const _postAuth = sinon.stub(auth, '_postAuth');
            localStorage.setItem('auth', '{1}');

            auth._initialize();

            sinon.assert.calledOnce(_postAuth);
            assert.isUndefined(auth._authToken);
        });
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
        afterEach(() => { env.CLIENT_SECRET = undefined; });

        it('already authenticated', async () => {
            sinon.stub(auth, 'isAuthenticated').returns(true);
            sinon.stub(auth, '_setAuthToken').throws('something');

            await auth.authenticate();
        });

        it('parsed hash', async () => {
            sinon.stub(auth, 'isAuthenticated').returns(false);
            const _postAuth = sinon.stub(auth, '_postAuth');

            assert.isUndefined(await auth.authenticate({
                get: (accessToken) => {
                    assert.equal(accessToken, 'access_token')
                }
            }));

            sinon.assert.calledOnce(_postAuth);
        });


        it('client secret', async () => {
            sinon.stub(auth, 'isAuthenticated').returns(false);
            const _postAuth = sinon.stub(auth, '_postAuth');
            const _authWithSecret = sinon.stub(auth, '_authWithSecret');
            env.CLIENT_SECRET = 'abc'

            assert.isUndefined(await auth.authenticate());

            sinon.assert.calledOnce(_authWithSecret);
            sinon.assert.calledOnce(_postAuth);
        });

        it('redirect', async () => {
            sinon.stub(auth, 'isAuthenticated').returns(false);
            const _postAuth = sinon.stub(auth, '_postAuth');
            const _authWithSecret = sinon.stub(auth, '_authWithSecret');
            const redirect = `${env.AUTH_ENDPOINT}/oauth2/authorize?client_id=${env.CLIENT_ID}&redirect_uri=${env.REDIRECT_URL}&response_type=token&scope=user:read:email+bits:read+moderation:read+channel:read:subscriptions+analytics:read:games`;

            assert.equal(await auth.authenticate(), redirect);

            sinon.assert.notCalled(_authWithSecret);
            sinon.assert.notCalled(_postAuth);
        });
    });

    describe('_postAuth', () => {
        it('not authenticated', async () => {
            sinon.stub(auth, 'isAuthenticated').returns(false);

            await auth._postAuth();

            assert.deepEqual(auth._user, {
                profile_image_url: 'https://static-cdn.jtvnw.net/user-default-pictures-uv/294c98b5-e34d-42cd-a8f0-140b72fba9b0-profile_image-300x300.png',
                login: 'unknown-user'
            });
            sinon.assert.calledOnce(eventSignals.dispatch);
        });

        it('authenticated and not broacaster', async () => {
            sinon.stub(auth, 'isAuthenticated').returns(true);
            sinon.stub(auth, 'isBroadcaster').returns(false);
            sinon.stub(auth, 'getLogin').returns('abc');
            sinon.stub(auth, 'getAuthObj').returns({ Authorization: 'auth' });

            fetchMock.getOnce(`end:/helix/users`, {
                status: statusCodes.OK,
                body: {
                    data: ['a_user']
                },
                headers: { Authorization: 'auth' },
            }, {
                overwriteRoutes: true,
            });

            await auth._postAuth();
            assert.equal(auth._user, 'a_user');
            sinon.assert.calledOnce(eventSignals.dispatch.withArgs({ 'event': 'draw.nav.auth' }));
            sinon.assert.notCalled(eventSignals.dispatch.withArgs({ 'event': 'channel.changed', channel: 'abc' }))
        });

        it('authenticated and broacaster', async () => {
            sinon.stub(auth, 'isAuthenticated').returns(true);
            sinon.stub(auth, 'isBroadcaster').returns(true);
            sinon.stub(auth, 'getLogin').returns('abc');
            sinon.stub(auth, 'getAuthObj').returns({ Authorization: 'auth' });

            fetchMock.getOnce(`end:/helix/users`, {
                status: statusCodes.OK,
                body: {
                    data: ['a_user']
                },
                headers: { Authorization: 'auth' },
            }, {
                overwriteRoutes: true,
            });

            await auth._postAuth();

            assert.equal(auth._user, 'a_user');
            sinon.assert.calledOnce(eventSignals.dispatch.withArgs({ 'event': 'draw.nav.auth' }));
            sinon.assert.calledOnce(eventSignals.dispatch.withArgs({ 'event': 'channel.changed', channel: 'abc' }))
        });


        it('authenticated and broacaster', async () => {
            sinon.stub(auth, 'isAuthenticated').returns(true);
            sinon.stub(auth, 'isBroadcaster').returns(true);
            sinon.stub(auth, 'getLogin').returns('abc');
            sinon.stub(auth, 'getAuthObj').returns({ Authorization: 'auth' });
            fetchMock.getOnce(`end:/helix/users`, {
                status: statusCodes.OK,
                body: {
                    data: ['a_user']
                },
                headers: { Authorization: 'auth' },
                throws: new Error('an-error')
            }, {
                overwriteRoutes: true,
            });

            await auth._postAuth();

            assert.deepEqual(auth._user, {
                profile_image_url: 'https://static-cdn.jtvnw.net/user-default-pictures-uv/294c98b5-e34d-42cd-a8f0-140b72fba9b0-profile_image-300x300.png',
                login: 'unknown-user'
            });
            sinon.assert.calledOnce(eventSignals.dispatch.withArgs({ 'event': 'draw.nav.auth' }));
            sinon.assert.calledOnce(eventSignals.dispatch.withArgs({ 'event': 'channel.changed', channel: 'abc' }))
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