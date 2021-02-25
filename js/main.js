const signals = require('./helpers/signals').signals;
const domSignals = require('./helpers/signals').domSignals;
const utils = require('./helpers/utils');
const constants = require('./helpers/constants');
const moment = require('./helpers/moment');

const twitchClient = require('./singletons/twitchClient');
const auth = require('./simpletons/auth');
const users = require('./singletons/users');
const chartFilter = require('./events/shared/chartFilter');

let currentTab = {};

window.env = require('./env.js');

// default page load
window.onload = () => {
    signals.dispatch({ event: 'draw.nav.auth' });

    document.querySelectorAll('ul.navbar-nav a').forEach((value) => {
        value.onclick = (ev) => {
            ev.preventDefault();
            if (currentTab.tab) {
                document.getElementById(`nav-${currentTab.tab}`).classList.remove('active');
            }
            window.location.hash = value.hash;
            navigate();
        };
    })
    navigate();
};

window.authenticate = async () => {
    if (auth.isAuthenticated()) {
        // Valid auth, just return
        return;
    }

    // authenticate
    const redirectURL = await auth.authenticate();
    if (redirectURL) {
        window.location = redirectURL;
    }
}

window.authLogout = () => {
    if (!auth.isAuthenticated()) {
        // nothing to logged out of
        return;
    }

    auth.logout();
}

const navigate = async () => {
    const tabObj = utils.extractTabObj(window.location.hash);
    document.getElementById(`nav-${tabObj.tab}`).classList.add('active');

    if (currentTab.tab !== tabObj.tab) {
        if (currentTab.tab) {
            currentTab.event = `${currentTab.tab}.cleanup`;
            signals.dispatch(currentTab);
        }

        if (window.location.hash) {
            const parsedHash = new URLSearchParams(window.location.hash.substr(1));
            auth.authenticate(parsedHash);
        }

        await twitchClient.initializeClient();
        signals.dispatch({ event: `${tabObj.tab}.load`, tab: tabObj });
    }

    currentTab = tabObj;
}

window.getCurrentTab = () => {
    return currentTab;
}

const setTopOfMinEvent = () => {
    const nextTopOfMin = utils.getNow().add(1, 'minute').valueOf();
    const tickAt = nextTopOfMin - moment.now();
    window.minTopTimeoutEvent = setTimeout(() => {
        signals.dispatch({ event: 'main.minute.top' });
    }, tickAt + 5);
}
setTopOfMinEvent();

window.minIntervalEvent = setInterval(() => {
    signals.dispatch({
        event: 'main.minute',
        currentTab: currentTab,
        channel: twitchClient.getChannel(),
        filter: chartFilter.getFilter(),
    });
    setTopOfMinEvent();
}, 60 * 1000);

window.domEvent = (event, id) => {
    domSignals.dispatch({ id: id || getNearestId(event.target), type: event.type, event: event });
}

const getNearestId = (target) => {
    if (target.id) {
        return target.id;
    }

    if (target.parentElement) {
        return getNearestId(target.parentElement);
    }

    return 'undefined'
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

signals.add((payload) => {
    if (!payload) {
        return;
    }

    if (payload.alert && payload.alert.body) {
        document.getElementById('alerts').insertAdjacentHTML('afterbegin', templates[`./hbs/shared/alerts.hbs`](payload.alert));
        new BSN.Alert(document.querySelector('.alert'));
        return;
    }

    switch (payload.event) {
        case 'draw.nav.auth': {
            document.getElementById('nav-auth').innerHTML = templates[`./hbs/components/nav-auth.hbs`](auth);
            break;
        }
    }
});
