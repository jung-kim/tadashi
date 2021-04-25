const eventSignals = require('./helpers/signals').eventSignals;
const domSignals = require('./helpers/signals').domSignals;
const utils = require('./helpers/utils');
const constants = require('./helpers/constants');
const moment = require('./helpers/moment');

const twitchClient = require('./singletons/twitchClient');
const auth = require('./simpletons/auth');
const users = require('./singletons/users');
const chartFilter = require('./events/shared/chartFilter');

const ACTIVE = 'cir-active';
const INACTIVE = 'cir-inactive';
const ACTIVE_NO_AUTH = 'cir-active-no-auth';

class Main {
    constructor() {
        this.currentConnectivityLevel = undefined
        this.activityStatusDom = document.getElementById('activity-status');
        this.updateLatestProcessTime = _.throttle(this._updateLatestProcessTime.bind(this), 1000);
        this._latestProcessTime = 0;
        eventSignals.add(this._eventSignalFunc.bind(this));
    }

    _eventSignalFunc(payload) {
        if (payload.alert && payload.alert.body) {
            document.getElementById('alerts').insertAdjacentHTML('afterbegin', templates[`./hbs/shared/alerts.hbs`](payload.alert));
            new BSN.Alert(document.querySelector('.alert'));
        } else if (payload.event === 'draw.nav.auth') {
            this.configureAuthView();
            this.configureConnectivityStatus();
        } else if (payload.event === 'data.cache.updated') {
            this.configureConnectivityStatus();
            this.updateLatestProcessTime();
        } else if (payload.event === 'draw.nav.actvitiy-status') {
            this.configureConnectivityStatus();
        }
    }

    getNearestId(target) {
        if (target.id) {
            return target.id;
        }

        if (target.parentElement) {
            return this.getNearestId(target.parentElement);
        }

        return 'undefined';
    }

    getConnectivityLevel() {
        if (!twitchClient.isConnected()) {
            return INACTIVE;
        }
        if (!auth.isAuthenticated()) {
            return ACTIVE_NO_AUTH;
        }
        return ACTIVE;
    }

    configureAuthView() {
        document.getElementById('nav-auth').innerHTML = templates[`./hbs/components/nav-auth.hbs`](auth);
    }

    _updateLatestProcessTime() {
        this._latestProcessTime = moment.now();
    }

    getLatestProcessTimeMS() {
        return this._latestProcessTime;
    }

    configureConnectivityStatus() {
        const newConnectivityLevel = this.getConnectivityLevel();

        if (this.currentConnectivityLevel === newConnectivityLevel) {
            return;
        }

        switch (newConnectivityLevel) {
            case ACTIVE:
                this.activityStatusDom.className = `blink circle ${ACTIVE}`;
                break;
            case INACTIVE:
                this.activityStatusDom.className = `circle ${INACTIVE}`;
                break;
            case ACTIVE_NO_AUTH:
                this.activityStatusDom.className = `blink circle ${ACTIVE_NO_AUTH}`;
                break;
        }

        this.currentConnectivityLevel = newConnectivityLevel;
    }

    userFollowsCSS(userName) {
        const user = users.getUserByName(userName);

        if (!user) {
            return constants.CSS_UNKNOWN;
        }

        if (user.isFollowing(twitchClient.getChannelID())) {
            return constants.CSS_FOLLOWING;
        } else {
            return constants.CSS_NOT_FOLLOWING;
        }
    }
}

window.env = require('./env.js');

// default page load
window.onload = async () => {
    if (window.location.hash) {
        const parsedHash = new URLSearchParams(window.location.hash.substr(1));
        auth.authenticate(parsedHash);
    }

    await twitchClient.initializeClient();
    main.configureConnectivityStatus();
    main.configureAuthView();

    const activityStatusDom = document.getElementById('activity-status-popover');
    activityStatusDom.addEventListener("mouseenter", () => {
        let title, content;
        switch (main.getConnectivityLevel()) {
            case INACTIVE:
                title = 'Disconnected';
                content = 'Data collection is halted';
                break;
            case ACTIVE_NO_AUTH:
                title = 'Connected with no Auth';
                content = 'Data collection is limited';
                break;
            case ACTIVE:
                title = 'Connected';
                content = 'Data is being collected';
                break;
        }
        content += `</br>Last data collection: ${moment(main.getLatestProcessTimeMS()).format('YYYY-MM-DD HH:mm:ss')}`;

        new BSN.Popover(activityStatusDom, {
            title: title,
            content: content,
            placement: 'bottom'
        }).show();
    });
    activityStatusDom.addEventListener('mouseleave', () => {
        const dispose = (activityStatusDom.Popover || {}).dispose;
        if (dispose) {
            dispose();
        }
    });
    eventSignals.dispatch({ event: `stream.load` });
};

window.authenticate = async () => {
    // authenticate
    const redirectURL = await auth.authenticate();
    if (redirectURL) {
        window.location = redirectURL;
    }
}

window.authLogout = () => {
    auth.logout();
}

window.minuteEventDispatcher = () => {
    eventSignals.dispatch({
        event: 'main.minute',
        channel: twitchClient.getChannel(),
        filter: chartFilter.getUserFilter(),
    });

    const nextTopOfMin = utils.getNow().add(1, 'minute').valueOf();
    const tickAt = nextTopOfMin - moment.now();
    window.setMinTopTimeoutEvent(tickAt + 5);
}

window.setMinTopTimeoutEvent = (tickAt) => {
    window.minTopTimeoutEvent = setTimeout(() => {
        eventSignals.dispatch({ event: 'main.minute.top' });
    }, tickAt);
}

window.minuteEventInterval = setInterval(window.minuteEventDispatcher, 60 * 1000);

window.domEvent = (event, id) => {
    domSignals.dispatch({ id: id || main.getNearestId(event.target), type: event.type, event: event });
}

const main = new Main();

Handlebars.registerHelper('userFollowsCSS', main.userFollowsCSS);

module.exports = main;
