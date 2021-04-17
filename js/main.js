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

let currentActiveLevel = undefined;
let activityStatusPopup = undefined;

const getNearestId = (target) => {
    if (target.id) {
        return target.id;
    }

    if (target.parentElement) {
        return getNearestId(target.parentElement);
    }

    return 'undefined';
}

const getActivity = () => {
    if (!twitchClient.isConnected()) {
        return INACTIVE;
    }
    if (!auth.isAuthenticated()) {
        return ACTIVE_NO_AUTH;
    }
    return ACTIVE;
}

const getActivityTitle = (activity) => {
    if (activity === INACTIVE) {
        return 'Disconnected - data collection is halted';
    } else if (activity === ACTIVE_NO_AUTH) {
        return 'Connected with no Auth - data collection is limited';
    } else {
        return 'Connected - data is being collected';
    }
}

const updateAuth = () => {
    const newActiveLevel = getActivity();
    if (newActiveLevel !== currentActiveLevel) {
        currentActiveLevel = newActiveLevel;

        if (activityStatusPopup) {
            activityStatusPopup.dispose();
        }

        document.getElementById('nav-auth').innerHTML = templates[`./hbs/components/nav-auth.hbs`](auth, currentActiveLevel);
        activityStatusPopup = new BSN.Popover(document.getElementById('activity-status'), {
            title: getActivityTitle(currentActiveLevel),
            content: '',
            placement: 'left'
        });
        activityStatusPopup.on('show.bs.popover', () => {
            activityStatusPopup.data('bs.popover').options.content(` tests = ${moment().toString()}`);
        });
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

    updateAuth();
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
            updateAuth();
            break;
    }
});
