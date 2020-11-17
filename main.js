const { exec } = require('child_process');

// github actions pass inputs as environment variables prefixed with INPUT_ and uppercased
function getInput(key) {
    var variable = 'INPUT_'+key;
    var result = process.env[variable.toUpperCase()];
    console.log(`Using input for ${key}: ${result}`);
    return result;
}

// rather than npm install @actions/core, output using the console logging syntax
// see https://help.github.com/en/actions/reference/workflow-commands-for-github-actions#setting-an-output-parameter
function setOutput(key, value) {
    console.log(`::set-output name=${key}::${value}`)
}

try {
    const include = getInput('include');
    const exclude = getInput('exclude');
    const commitIsh = getInput('commit-ish');
    const skipUnshallow = getInput('skip-unshallow') === 'true';

    var includeOption = '';
    var excludeOption = '';
    var commitIshOption = '';

    if (typeof include === 'string' && include.length > 0) {
        includeOption = `--match '${include}'`;
    }

    if (typeof exclude === 'string' && exclude.length > 0) {
        excludeOption = `--exclude '${exclude}'`;
    }

    if (typeof commitIsh === 'string') {
        if (commitIsh === '' || commitIsh === 'HEAD') {
            console.warn('Passing empty string or HEAD to commit-ish will get the "current" tag rather than "previous". For previous tag, try "HEAD~".');
        }
        commitIshOption = `'${commitIsh}'`;
    }

    var unshallowCmd = skipUnshallow ? '' : 'git fetch --prune --unshallow &&'

    // actions@checkout performs a shallow checkout. Need to unshallow for full tags access.
    var cmd = `${unshallowCmd} git describe --tags --always ${includeOption} ${excludeOption} ${commitIshOption}`.replace(/[ ]+/, ' ').trim();
    console.log(`Executing: ${cmd}`);

    exec(cmd, (err, tag, stderr) => {
        if (err) {
            console.error(`Unable to find an earlier tag.\n${stderr}`);
            return process.exit(1);
        }
        console.log(`Outputting tag: ${tag.trim()}`)
        return setOutput('tag', tag.trim());
    });
} catch (error) {
    core.setFailed(error.message);
}
