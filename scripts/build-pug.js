const { exec } = require('child_process');
const glob = require('glob');
const path = require('path');

const release = process.argv[2]; //"insights or insightsbeta"

async function getAssetPath(extension) {
    const files = glob.sync(`build/**/chrome.*.${extension}`);
    return path.relative('build/', files[0]);
}

async function generate() {
    return Promise.all([getAssetPath('css'), getAssetPath('js')]).then(([cssFileName, jsFileName]) => {
        const pugvars = `{release: '${ release }', chromeCSS:'${ cssFileName }', chromeJS:'${ jsFileName }'}`;

        exec(`pug src/pug -o build/snippets -O "${ pugvars }"`, (err, stdout, stderr) => {
            if (err) {throw err;}
            console.log(stdout);
            console.log(stderr);
        });
    });
}

try {
    generate();
} catch (error) {
    console.error(error);
    process.exit(1);
}
