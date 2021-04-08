# contributing guidelines

These are the contributing guidelines as well as some documentation on how the code is structured. Read up before contributing to make everything as smooth as possible.

## posting issues

Just common sense; do a quick search before posting, someone might already have created an issue (or resolved the problem!). If you're posting a bug; try to include as much relevant information as possible (ungit version, node and npm version, OS, any Git errors displayed, the output from CLI console and output from the browser console).

## getting started

### code structures

These are the folders and what files are in each folders.  There are other generated folders such as `./coverage`, `./public` and etc. but they are not included in here.

- ./.github
    - github config files such as github actions
- ./assets
    - static assets such as images
- ./env
    - env templates used for configurations
- ./hbs
    - [handlebar](https://handlebarsjs.com/) templates that generated html fragments
- ./html
    - index.html, entry point of the page
- [./js](./js/README.md)
    - bulk of js codes.
- ./less
    - less files that gets translated into css
- [./proxy-server](./proxy-server/README.md)
    - proxy server is to help with local testing and get around cors issues
- ./scripts
    - instrumentation codes for deploys and configurations  
- ./tests
    - all test files are here.

### requirements

Tadashi is mostly a front end app therefor node and npm dependencies are mostly for instrumentation purposes.

1. `node >= 14.4.0`
2. `npm >= 7.5.2`

### unit tests

There are automatic tests that tests bulk of the logics.

- `npm run test`

### test coverages

Runs test coverage and relevant data and files will be generated at `./coverage` folder.  `open ./coverage/index.html` will show detailed coverage reports.

Code coverages are automatically posted to [codecov.io](https://codecov.io/gh/jung-kim/tadashi)

- `npm run cov`

### build and run local instance

1. create new [twitch application](https://dev.twitch.tv/console/apps/create) for free and get the `CLIENT_ID`
2. Build the project
    - `npm run install`
    - `CLIENT_ID=${CLIENT_ID} npm run build`
3. start the [helper proxy server](./proxy-server/README.md).
    - `npm --prefix ./proxy-server i` 
    - `npm --prefix ./proxy-server run start`
4. navigate to the local instance
    - `open ./public/index.html`

Technically, one could skip step 1 and run build the project without the client_id by doing `npm run install; npm run build`.  But some [Twitch API calls](https://dev.twitch.tv/docs/api/reference) that requires client id will not work.


## dev faq

### What are some of the libraries that are being used?
not exhaustive

- handlebars
- less
- browserify
- babelify
- chartjs
- lodash
- moment
- pako
- awesomplete
- flatpickr
- micro-signal

### Why is it not in react?
Short answer is because I don't want to.  Long answer is that I'm a backend grunt who've actually never done JS devlopment professionally, I've been doing Scala, Java, Python and GoLang.  I wanted to something fun, simple and different before doing things the way others do.

### Where is the twitch API refernce?
[twitch api](https://dev.twitch.tv/docs/api/)

### API throttling limit
Twitch have [api limit](https://dev.twitch.tv/docs/api/guide#rate-limits) of 800 points per minute.  [api.js](./js/simpletons/api.js) does catch response codes and automatically retry it when rate limit bucket refilled.

### How is code structured?
Latest information on this can be found at the separate [documentation](./js/README.md)
