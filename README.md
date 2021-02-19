# tadashi
=========

[![example workflow name](https://github.com/jung-kim/tadashi/workflows/Unit%20Tests/badge.svg)](https://github.com/jung-kim/tadashi/actions?query=workflow%3A%22Unit+Tests%22)
[![codecov.io](https://codecov.io/github/jung-kim/tadashi/coverage.svg?branch=master)]
(https://codecov.io/github/jung-kim/tadashi?branch=master)

[tadashi](https://jung-kim.github.io/tadashi/index.html) is an web application to visualize various public activities and events during [twitch](http://twitch.com/) streaming sessions to help each streamers to understand their own streams better in realtime.

Tadashi helps one visualize following data points in realtime.

- count of various events, chats, bans, subscriptions and etc, within time periods
- count of chats by users
- sum of proceeds by users
- sum of proceeds by proceeds types


## limitations

- Twitch API request limits
    - Twitch API has request [rate limits](https://dev.twitch.tv/docs/api/guide).  800 request limit is enforced and some of the 
    features maybe throttled for streams with large viewer counts due to this rate limiting issues.
- Data is not collected when browser is not open
    - Browser is the one collects data and displays data. There are ways to make this happen but that would requrie additional backend infrastructures which would require additional resources.
- Data is not persisted
    - Once browser is closed, collected data is lost.  But really 


## contributing
---------------

This was more of a learning effort by me.  But if someone wants to contribute and make it better, or just want to learn coding and understands how it works, feel free to check out the documentation below and send me issues, pull requests or questions.

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License (MIT)

[LICENSE.md](./LICENSE.md)