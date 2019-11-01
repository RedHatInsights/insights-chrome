const { exec } = require('child_process');
const glob = require('glob');
const path = require('path');

glob("build/chrome.*.css", (err, files) => {
    if (err) throw err;

    release = process.argv[2]; //"insights or insightsbeta"
    chromeFileName = path.relative('build/',files[0]);

    let pugvars = `{release: '${ release }', chrome:'${ chromeFileName }'}`;

    exec(`pug src/pug -o build/snippets -O "${ pugvars }"`, (err, stdout, stderr) => {
        if (err) throw err;
        console.log(stdout);
        console.log(stderr);
    });

});

