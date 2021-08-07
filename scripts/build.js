const fsSync = require('fs');
const fs = fsSync.promises;
const env = require('./env');
const less = require('less');
const glob = require('glob');
const mkdirp = require('mkdirp');
const path = require('path');
const browserify = require('browserify');
const htmlmin = require('htmlmin');
const Handlebars = require('handlebars');
const minifyStream = require('minify-stream');

const jsFiles = glob.sync('./js/**/*.js').
    map(jsFilename => {
        const parsedPath = path.parse(jsFilename);
        const objectName = parsedPath.base === 'index.js' ? path.basename(parsedPath.dir) : parsedPath.name;
        return {
            parsedPath: parsedPath,
            originalFilename: jsFilename,
            convertedFilename: `./public/js/${objectName}.js`,
            toExposeAs: `${env.SERVICE}/${objectName}`,
            objectName: objectName,
        }
    });

// convert `./less/**/*.less` files to css
const cssStep = async () => {
    console.log(`building cssStep...`);
    const lesses = glob.sync("./less/**/*.less");

    const css = (await Promise.all(lesses.map(async (lessFile) => {
        const input = await fs.readFile(lessFile);
        const output = await less.render(input.toString(), { filename: lessFile });
        return output.css;
    }))).join('\n');
    return fs.writeFile('./public/styles.css', css);
}

// Browserify `./js/**/*.js` codes so it would be easier to use within browser
const browserifyAll = async () => {
    console.log(`building browserifyAll...`);
    const b = browserify({
        entries: jsFiles.map(jsFileObj => jsFileObj.originalFilename),
        bundleExternal: false,
        builtins: false,
    }).transform('exposify', { expose: { moment: 'moment', lodash: '_', pako: 'pako' } });

    jsFiles.forEach(jsFileObj => {
        b.require(jsFileObj.originalFilename, { expose: jsFileObj.toExposeAs });
    });

    return (env.ENVIRONMENT === 'local' ? b : b.transform("babelify", { presets: ["@babel/preset-env"] })).
        bundle().
        pipe(minifyStream({ sourceMap: false, mangle: { reserved: ['moment', '_', 'Twitch'] } })).
        pipe(fsSync.createWriteStream(`./public/script.js`))
}

// Browserify external 3rd party libraries
const browserifyExternal = async () => {
    console.log(`building browserifyExternal...`);
    const pkgs = ['tmi.js', 'micro-signals', 'material-color-hash', 'http-status-codes', 'p-limit'];

    const b = browserify({
        noParse: ['window', 'lodash', 'moment', 'moment-timezone', 'node-localstorage'],
    });
    pkgs.forEach(pkg => b.require(pkg, { expose: pkg }));
    return (env.ENVIRONMENT === 'local' ? b : b.transform("babelify", { presets: ["@babel/preset-env"] })).bundle().
        pipe(minifyStream({ sourceMap: false, mangle: { reserved: ['moment', '_', 'Twitch'] } })).
        pipe(fsSync.createWriteStream('./public/bundle.js'));
}

// Minimize generated html
const htmlminStep = async () => {
    console.log(`building htmlMinStep...`);
    const html = (await fs.readFile('./html/index.html')).toString().
        replace(/{{HOST_ENDPOINT}}/g, env.HOST_ENDPOINT).
        replace(/{{TAG}}/g, env.TAG);
    const minifiedHtml = htmlmin(html, {
        collapseWhitespace: true,
        removeComments: true,
    });
    return fs.writeFile('./public/index.html', minifiedHtml);
}

// copy over some of the assets such as images and etc.
const copyOverAssetsStep = async () => {
    console.log(`building copyOverAssetsStep...`);
    const assets = glob.sync('./assets/**/*');

    return Promise.all(assets.map(async (file) => {
        fs.copyFile(file, `./public/${path.basename(file)}`)
    }));
}

// 
const handlebarsStep = async () => {
    console.log(`building handlebarsStep...`);
    const handlebars = glob.sync("./hbs/**/*.hbs");

    const preCompiled = handlebars.map((hbsFile) => {
        const fileContent = fsSync.readFileSync(hbsFile).toString();
        const compiled = Handlebars.precompile(fileContent, { namespace: 'templates' });
        return `this["templates"]['${hbsFile}'] = Handlebars.template(${compiled});`;
    }).join('\n\n');

    return fs.writeFile('./public/hbs-templates.js', `this["templates"] = this["templates"] || {};\n\n${preCompiled}`);
}

(async () => {
    await fs.rmdir('./public', { recursive: true });
    await mkdirp('./public');

    await Promise.all([
        browserifyAll(),
        browserifyExternal(),
        handlebarsStep(),
        cssStep(),
        htmlminStep(),
        copyOverAssetsStep(),
    ]);
})();
