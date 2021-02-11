module.exports = Object.freeze({
    MY_CONSTANT: 'some value',
    ANOTHER_CONSTANT: 'another value',
    TYPE_CHAT: 0,
    TYPE_RESUB: 1,
    TYPE_CHEER: 2,
    TYPE_SUB: 3,
    TYPE_BAN: 4,
    TYPE_ANONGIFT: 5,
    TYPE_SUBGIFT: 6,
    TYPE_SUBMYSTERY: 7,

    NUM_TYPES: 8,

    CHART_LABEL: ["chat", "re-subscription", "cheer", "subscription", "ban", "anonymous gift", "subscription gift", "subscription mystery"],
    CHART_BACKGROUND_COLOR: [
        "rgb(255, 255, 0, 0.3)",   // yellow
        "rgb(153, 255, 51, 0.3)",  // teal
        "rgb(51, 255, 255, 0.3)",  // sky blue
        "rgb(0, 128, 225, 0.3)",   // navy blue
        "rgb(255, 51, 153, 0.3)",  // red
        "rgb(102, 0, 204, 0.3)",   // purple
        "rgb(255, 128, 0, 0.3)",   // teal
        "rgb(128, 128, 128, 0.3)"  // grey
    ],
    CHART_BORDER_COLOR: [
        "rgb(255, 255, 0, 1.0)",   // yellow
        "rgb(153, 255, 51, 1.0)",  // teal
        "rgb(51, 255, 255, 1.0)",  // sky blue
        "rgb(0, 128, 225, 1.0)",   // navy blue
        "rgb(255, 51, 153, 1.0)",  // red
        "rgb(102, 0, 204, 1.0)",   // purple
        "rgb(255, 128, 0, 1.0)",   // teal
        "rgb(128, 128, 128, 1.0)"  // grey
    ],

    KEY_AGG: 'agg',
    KEY_UNIQUE_USERS: 'unique_users',
    KEY_RAWS: 'raws',
    KEY_USERS: 'users',

    KEY_CURRENT: '_current',
    KEY_STREAMLEVEL: 'streamLevel',


    TIMEFORMAT_DISPLAY: "YYYY/MM/DD HH:mm",

    // for chatter
    KEY_CHATTERS: 'chatters',
    KEY_CHATTERS_UPDATED_AT: 'chatters_updated_at',
    NUM_CHATTERS_DISPLAY: 250,

    //// under chatters
    KEY_BROADCASTER: 'broadcaster',
    KEY_VIPS: 'vips',
    KEY_MODERATORS: 'moderators',
    KEY_STAFF: 'staff',
    KEY_ADMIN: 'admins',
    KEY_GLOBAL_MODS: 'global_mods',
    KEY_VIEWERS: 'viewers',

    PIE_NUM_USERS_TO_SHOW: 10,

    BUCKET_MIN: 60,
    BUCKET_FIVE: 300,
    BUCKET_HOUR: 3600,
    BUCKET_DAY: 86400,
    INTERVAL_BUCKETS: [60, 300, 3600, 86400],             // time bucket to collect on, in minutes
    INTERVAL_BUCKETS_STRING: ['1 minute', '5 minutes', '1 hour', '1 day'],

    BUCKET_LAST: 86400,
    SUGGESTED_DATA_COUNT: 150,


    TABS_OPTIONS: [
        'stream',
    ],

    AUTH_NO_AUTH: -1,
    AUTH_EXPIRED: 0,
    AUTH_VALID: 1,

    HELP_EMAIL: "help@sonso.io",

    // DISPLAY_TIME_BUCKETS_IN_MINS: [1, 5, 20, 60, 360, 1440],    // this is for displays, in minutes

    FAILED_USER_GRACE_PERIOD: 60 * 60, // for invalid, allow retry 1 hour later
    USERS_SYNC_VALID_DURATION: 24 * 60 * 60 * 7, // sync users data after 7days

    // api.js
    RATELIMIT_REMAINING: 'Ratelimit-Remaining',
    RATELIMIT_RESET: 'Ratelimit-Reset',
    MAX_AWAIT_DURATION_SEC: 15,

    // users.js
    TIMESTAMP_SEC_ATTR: 'timestamp_sec',
    MAX_PARALLEL_USER_FOLLOWS_FETCH_LIMIT: 10,

    MOMENT_DISPLAY_FORMAT: 'YYYY-MM-DD HH:mm',

    CSS_UNKNOWN: 'text-muted',
    CSS_FOLLOWING: 'stream-following',
    CSS_NOT_FOLLOWING: 'stream-not-following',

    // 
    MAX_VIEWERS_COUNTS_FOR_PROCESS: 1000,
});
