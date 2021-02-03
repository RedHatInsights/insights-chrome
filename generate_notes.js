const { execSync } = require('child_process');
const { repository } = require('./package.json');
const { Octokit } = require("@octokit/rest");

const refs = process.argv[2];
if (!refs) {
  console.error('must pass refs (ie v1.15.2...v1.16-rc2)');
  process.exit(1);
}
if (!process.env.GH_TOKEN) {
  console.error('Must set GH_TOKEN or ratelimit will be hit');
  process.exit(1);
}

const octokit = new Octokit({
  auth: process.env.GH_TOKEN
});

function getCommitType(subject) {
  if (subject.match(/ dep/i) || subject.match(/$depend/i)) {
    return 'dependencies';
  }
  else if (subject.match(/doc/i) || subject.match(/readme/i)) {
    return 'docs';
  }
  else if (subject.match(/fix/i)) {
    return 'fix';
  }
  else if (subject.match(/feature/i) || subject.match(/add/i)) {
    return 'feature';
  }
  return 'general';
}

const split = repository.url
  .replace('git+', '')
  .replace('https://github.com/', '')
  .replace(/.git$/, '')
  .split('/');
const owner = split[0];
const repo = split[1];
async function getCommitTypeGithub(prnum) {
  const res = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prnum
  });
  if (res.data) {
    if (res.data.labels && res.data.labels.length > 0) {
      if (res.data.labels.includes(label => label.name === 'bug')) {
        return 'fix';
      }
      else if (res.data.labels.includes(label => ['dependencies', 'depfu'].includes(label.name))) {
        return 'dependencies';
      }
      else if (res.data.labels.includes(label => label.name === 'enhancement')) {
        return 'feature';
      }
    }
    const titleType = getCommitType(res.data.title);
    if (titleType !== 'general') {
      return titleType;
    }
    if (res.data.body) {
      return getCommitType(res.data.body);
    }
  }

  return 'general';
}

function getCommits() {
  const subjects = execSync(`git log ${refs} --format="%s"`).toString().split('\n').filter(Boolean);
  const authors  = execSync(`git log ${refs} --format="%an"`).toString().split('\n').filter(Boolean);
  const shas     = execSync(`git log ${refs} --format="%h"`).toString().split('\n').filter(Boolean);

  return subjects.map((subject, i) => {
    const match = subject.match(/#(\d+)/);

    return {
      subject,
      author: authors[i],
      sha: shas[i],
      type: getCommitType(subject),
      prnum: match && match[1]
    };
  });
}

function getGroupedCommits(commits) {
  return commits.reduce((acc, cur) => {
    acc[cur.type] = acc[cur.type] || [];
    acc[cur.type].push(cur);

    return acc;
  }, {});
}

const typeOrder = {
  'dependencies': 1,
  'features': 2,
  'fix': 3
};
const defaultOrder = 99;
const sortTypes = (t1, t2) => {
  const t1Index = typeOrder[t1] || defaultOrder;
  const t2Index = typeOrder[t2] || defaultOrder;
  if (t1Index === defaultOrder && t2Index === defaultOrder) {
    return t1.localeCompare(t2);
  }

  return t1Index > t2Index ? 1 : -1;
}
function capitalize(input) {
  return input[0].toUpperCase() + input.substring(1);
}

async function addCommitTypes(commits) {
  for (const commit of commits) {
    if (commit.type === 'general' && commit.prnum) {
      commit.type = await getCommitTypeGithub(commit.prnum);
    }
  }
}

async function printReleaseNotes() {
  const commits = getCommits();
  await addCommitTypes(commits);
  
  const groupedCommits = getGroupedCommits(commits);

  Object.keys(groupedCommits).sort(sortTypes).forEach(type => {
    console.log('\n#', capitalize(type));
    groupedCommits[type].forEach(commit => {
      console.log(`- ${commit.subject}`);
    });
  });
}

printReleaseNotes();


