const env = require('../env');
const signals = require('../helpers/signals').signals;

const localstorageKey = 'auth';
const scope = 'scope=user:read:email+bits:read+moderation:read+channel:read:subscriptions+analytics:read:games'

class Auth {
    constructor() {
        try {
            this._authToken = JSON.parse(localStorage.getItem(localstorageKey));
        } catch (err) {
            this._authToken = undefined;
            console.warn("failed to parse localstorage cache", err);
        }
    }

    _setAuthToken(authToken) {
        if (authToken) {
            this._authToken = authToken;
            localStorage.setItem(localstorageKey, JSON.stringify(this._authToken));
        }
    }

    async _authWithSecret() {
        if (!env.CLIENT_SECRET) {
            return;
        }
        const res = await fetch(`${env.TWITCH_ENDPOINT}/oauth2/token?client_id=${env.CLIENT_ID}&client_secret=${env.CLIENT_SECRET}&grant_type=client_credentials&${scope}`, {
            method: 'POST'
        });
        const json = await res.json();
        this._setAuthToken(json.access_token);
    }

    async authenticate(parsedHash) {
        if (this.isAuthenticated()) {
            // Valid auth, just return
            return;
        }

        if (parsedHash) {
            this._setAuthToken(parsedHash.get('access_token'));
        } else if (env.CLIENT_SECRET) {
            await this._authWithSecret();
        } else {
            return `${env.TWITCH_ENDPOINT}/oauth2/authorize?client_id=${env.CLIENT_ID}&redirect_uri=${env.REDIRECT_URL}&response_type=token&${scope}`;
        }

        if (this.isAuthenticated()) {
            signals.dispatch({ 'event': 'draw.nav.auth' });
            try {
                const res = await fetch(`${env.TWITCH_ENDPOINT}/helix/users`, this.getAuthObj());
                const json = await res.json();
                if (json) {
                    this._user = json.data[0];
                }
            } catch (err) {
                console.warn(`failed to fetch logged in user info: ${err}`);
            }

            if (this.isBroadcaster()) {
                signals.dispatch({ 'event': 'channel.changed', channel: this.getLogin() });
            }
        }
    }

    isAuthenticated() {
        return Boolean(this._authToken);
    }

    isBroadcaster() {
        return Boolean(this._user && this._user.broadcaster_type && this._user.broadcaster_type !== '');
    }

    getLogin() {
        return this._user && this._user.login;
    }

    getID() {
        return this._user && this._user.id;
    }

    logout() {
        if (!this.isAuthenticated()) {
            return;
        }

        this._authToken = undefined;
        this._user = undefined;
        localStorage.removeItem(localstorageKey);
        signals.dispatch({ 'event': 'draw.nav.auth' });
    }

    getAuthObj() {
        if (this.isAuthenticated()) {
            return {
                headers: {
                    'Client-ID': env.CLIENT_ID,
                    'Accept': 'application/vnd.twitchtv.v5+json',
                    'Authorization': `Bearer ${this._authToken}`,
                }
            }
        }
    }
}

const auth = new Auth();
module.exports = auth;