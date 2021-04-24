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
});