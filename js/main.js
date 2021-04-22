const eventSignals = require('./helpers/signals').eventSignals;
const domSignals = require('./helpers/signals').domSignals;
const utils = require('./helpers/utils');
const constants = require('./helpers/constants');
const moment = require('./helpers/moment');

const twitchClient = require('./singletons/twitchClient');
const auth = require('./simpletons/auth');
const users = require('./singletons/users');
const chartFilter = require('./events/shared/chartFilter');
const dataCache = require('./simpletons/dataCache');

const ACTIVE = 'cir-active';
const INACTIVE = 'cir-inactive';
const ACTIVE_NO_AUTH = 'cir-active-no-auth';

let currentConnectivityLevel = undefined;

const getNearestId = (target) => {
    if (target.id) {
        return target.id;
    }

    if (target.parentElement) {
        return getNearestId(target.parentElement);
    }

    return 'undefined';
}

const getConnectivityLevel = () => {
    if (!twitchClient.isConnected()) {
        return INACTIVE;
    }
    if (!auth.isAuthenticated()) {
        return ACTIVE_NO_AUTH;
    }
    return ACTIVE;
}

const configureAuthView = () => {
    document.getElementById('nav-auth').innerHTML = templates[`./hbs/components/nav-auth.hbs`](auth);
}

const configureConnectivityStatus = () => {
    const newConnectivityLevel = getConnectivityLevel();

    if (currentConnectivityLevel === newConnectivityLevel) {
        return;
    }

    const activityStatusDom = document.getElementById('activity-status');

    switch (newConnectivityLevel) {
        case ACTIVE:
            activityStatusDom.className = `blink circle ${ACTIVE}`;
            break;
        case INACTIVE:
            activityStatusDom.className = `circle ${INACTIVE}`;
            break;
        case ACTIVE_NO_AUTH:
            activityStatusDom.className = `blink circle ${ACTIVE_NO_AUTH}`;
            break;
    }

    currentConnectivityLevel = newConnectivityLevel;
}

window.env = require('./env.js');

// default page load
window.onload = async () => {
    if (window.location.hash) {
        const parsedHash = new URLSearchParams(window.location.hash.substr(1));
        auth.authenticate(parsedHash);
    }

    await twitchClient.initializeClient();
    configureConnectivityStatus();
    configureAuthView();

    const activityStatusDom = document.getElementById('activity-status-popover');
    activityStatusDom.addEventListener("mouseenter", () => {
        let title, content;
        switch (getConnectivityLevel()) {
            case ACTIVE:
                title = 'Disconnected';
                content = 'Data collection is halted';
                break;
            case INACTIVE:
                title = 'Connected with no Auth';
                content = 'Data collection is limited';
                break;
            case ACTIVE_NO_AUTH:
                title = 'Connected';
                content = 'Data is being collected';
                break;
        }
        content += `</br>Last data collection: ${moment(dataCache.getLatestTimestampMS()).format('YYYY-MM-DD HH:mm:ss')}`;

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
    window.minTopTimeoutEvent = setTimeout(() => {
        eventSignals.dispatch({ event: 'main.minute.top' });
    }, tickAt + 5);
}

window.minuteEventInterval = setInterval(window.minuteEventDispatcher, 60 * 1000);

window.domEvent = (event, id) => {
    domSignals.dispatch({ id: id || getNearestId(event.target), type: event.type, event: event });
}

Handlebars.registerHelper('userFollowsCSS', (userName) => {
    const user = users.getUserByName(userName);

    if (!user) {
        return constants.CSS_UNKNOWN;
    }

    switch (user.isFollowing(twitchClient.getChannelID())) {
        case true:
            return constants.CSS_FOLLOWING;
        case false:
            return constants.CSS_NOT_FOLLOWING;
        default:
            return constants.CSS_UNKNOWN;
    }
});

eventSignals.add((payload) => {
    switch (true) {
        case payload.alert && payload.alert.body:
            document.getElementById('alerts').insertAdjacentHTML('afterbegin', templates[`./hbs/shared/alerts.hbs`](payload.alert));
            new BSN.Alert(document.querySelector('.alert'));
            break;
        case payload.event === 'draw.nav.auth':
            configureAuthView();
            configureConnectivityStatus();
            break;
        case payload.event === 'data.cache.updated':
        case payload.event === 'draw.nav.actvitiy-status':
            configureConnectivityStatus();
            break;
    }
});
