const { exec } = require('child_process');
const glob = require('glob');
const path = require('path');

const release = process.argv[2]; //"insights or insightsbeta"

async function getAssetPath(extension, noHash) {
    const files = glob.sync(`build/**/chrome${extension === 'js' ? '-root': ''}${noHash ? '' : '.*'}.${extension}`);
    return path.relative('build/', files[0]);
}

async function generate() {
    const noHash = process.argv[3] === 'nohash'; // look for CSS and JS with hashed name
    return Promise.all([getAssetPath('css', noHash), getAssetPath('js', noHash)]).then(([cssFileName, jsFileName]) => {
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
