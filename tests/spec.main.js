const { assert } = require('chai');
const sinon = require('sinon');

const userFollowsCSS = sinon.stub(Handlebars, 'registerHelper').
    withArgs('userFollowsCSS', sinon.match.func);
const main = require('../js/main');
const auth = require('../js/simpletons/auth');
const twitchClient = require('../js/singletons/twitchClient');
const moment = require('../js/helpers/moment');

describe('main.js', () => {
    afterEach(() => {
        reset();
    });

    it('initialize', () => {
        sinon.assert.calledOnce(userFollowsCSS);
        assert.deepEqual(window.env, require('../js/env'));
        assert.isFunction(window.onload);
        assert.isFunction(window.authenticate);
        assert.isFunction(window.authLogout);
        assert.isFunction(window.minuteEventDispatcher);
        assert.isObject(window.minuteEventInterval);
        assert.isFunction(window.domEvent);

        clearInterval(window.minIntervalEvent);
    });

    describe('_eventSignalFunc', () => {
        it('alert', () => {
            const insertAdjacentHTML = sinon.stub();
            document.getElementById.withArgs('alerts').returns({
                insertAdjacentHTML: insertAdjacentHTML
            });

            main._eventSignalFunc({ alert: { body: 'hi' } });

            sinon.assert.calledOnce(insertAdjacentHTML);
            sinon.assert.calledOnce(BSN.Alert);
        });

        it('draw.nav.auth', () => {
            const configureAuthView = sinon.stub(main, 'configureAuthView');
            const configureConnectivityStatus = sinon.stub(main, 'configureConnectivityStatus');

            main._eventSignalFunc({ event: 'draw.nav.auth' });

            sinon.assert.calledOnce(configureAuthView);
            sinon.assert.calledOnce(configureConnectivityStatus);
        });

        it('data.cache.updated', () => {
            const configureConnectivityStatus = sinon.stub(main, 'configureConnectivityStatus');
            const updateLatestProcessTime = sinon.stub(main, 'updateLatestProcessTime');

            main._eventSignalFunc({ event: 'data.cache.updated' });

            sinon.assert.calledOnce(configureConnectivityStatus);
            sinon.assert.calledOnce(updateLatestProcessTime);
        });

        it('draw.nav.actvitiy-status', () => {
            const configureConnectivityStatus = sinon.stub(main, 'configureConnectivityStatus');

            main._eventSignalFunc({ event: 'draw.nav.actvitiy-status' });

            sinon.assert.calledOnce(configureConnectivityStatus);
        });
    });

    describe('getNearestId', () => {
        it('nested', () => {
            const nearestID = main.getNearestId({
                parentElement: {
                    id: undefined,
                    parentElement: {
                        id: 111,
                        parentElement: {
                            id: 222,
                        },
                    }
                }
            });

            assert.equal(nearestID, 111);
        });

        it('missing', () => {
            assert.equal(main.getNearestId({}), 'undefined');
        });
    });

    describe('getConnectivityLevel', () => {
        it('inactive', () => {
            sinon.stub(twitchClient, 'isConnected').returns(false);

            assert.equal(main.getConnectivityLevel(), 'cir-inactive');
        });

        it('active-no-auth', () => {
            sinon.stub(twitchClient, 'isConnected').returns(true);
            sinon.stub(auth, 'isAuthenticated').returns(false);

            assert.equal(main.getConnectivityLevel(), 'cir-active-no-auth');
        });

        it('active', () => {
            sinon.stub(twitchClient, 'isConnected').returns(true);
            sinon.stub(auth, 'isAuthenticated').returns(true);

            assert.equal(main.getConnectivityLevel(), 'cir-active');
        });
    });

    it('configureAuthView', () => {
        const navAuth = {};
        document.getElementById.withArgs('nav-auth').returns(navAuth);

        main.configureAuthView();

        assert.isString(navAuth.innerHTML);
    });

    it('_updateLatestProcessTime', () => {
        sinon.stub(moment, 'now').returns(88888);

        main._updateLatestProcessTime();

        assert.equal(main._latestProcessTime, 88888);
    });

    it('getLatestProcessTimeMS', () => {
        main._latestProcessTime = 999;

        assert.equal(main.getLatestProcessTimeMS(), 999);
    });

    describe('configureConnectivityStatus', () => {
        const ACTIVE = 'cir-active';
        const INACTIVE = 'cir-inactive';
        const ACTIVE_NO_AUTH = 'cir-active-no-auth';

        it('no change', () => {
            sinon.stub(main, 'getConnectivityLevel').returns('cir-active');

            main.activityStatusDom = {};
            main.currentConnectivityLevel = 'cir-active';

            main.configureConnectivityStatus();

            assert.deepEqual(main.activityStatusDom, {});
            assert.equal(main.currentConnectivityLevel, 'cir-active');
        });

        it('to active', () => {
            sinon.stub(main, 'getConnectivityLevel').returns('cir-active');

            main.activityStatusDom = {};
            main.currentConnectivityLevel = 'cir-inactive';

            main.configureConnectivityStatus();

            assert.deepEqual(main.activityStatusDom, {
                className: `blink circle cir-active`
            });
            assert.equal(main.currentConnectivityLevel, 'cir-active');
        });

        it('to inactive', () => {
            sinon.stub(main, 'getConnectivityLevel').returns('cir-inactive');

            main.activityStatusDom = {};
            main.currentConnectivityLevel = 'cir-active';

            main.configureConnectivityStatus();

            assert.deepEqual(main.activityStatusDom, {
                className: `circle cir-inactive`
            });
            assert.equal(main.currentConnectivityLevel, 'cir-inactive');
        });

        it('to active no auth', () => {
            sinon.stub(main, 'getConnectivityLevel').returns('cir-active-no-auth');

            main.activityStatusDom = {};
            main.currentConnectivityLevel = 'cir-active';

            main.configureConnectivityStatus();

            assert.deepEqual(main.activityStatusDom, {
                className: `blink circle cir-active-no-auth`
            });
            assert.equal(main.currentConnectivityLevel, 'cir-active-no-auth');
        });
    });

    it('env', () => {
        assert.deepEqual(window.env, require('./../js/env'));
    });

    describe('authenticate', () => {
        it('undefined', async () => {
            sinon.stub(auth, 'authenticate').returns(undefined);

            await window.authenticate();

            assert.isUndefined(window.location);
        });

        it('redirect', async () => {
            sinon.stub(auth, 'authenticate').returns('https://somewhere..com');

            await window.authenticate();

            assert.equal(window.location, 'https://somewhere..com');
        });
    });

    it('authLogout', () => {
        const logout = sinon.stub(auth, 'logout');

        window.authLogout();

        sinon.assert.calledOnce(logout);
    });
});