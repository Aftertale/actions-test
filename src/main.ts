import * as core from '@actions/core';
import * as github from '@actions/github';
import { Octokit } from 'octokit';

interface tagElement {
  name: string,
  sha?: string
}

enum ChangeClass {
  Major = 3,
  Minor = 2,
  Patch = 1,
  None = 0
}

async function run() {
  try {
    const prefix = core.getInput('prefix') || '';
    const octokit = github.getOctokit(core.getInput('token'));
    const repo = github.context.repo;
    const latestTag = await getLatestTag(octokit, repo);
    github.context.eventName

    const mainCommits = await getCommits(octokit, repo, 'refs/heads/main'); 
    const branchCommits = await getCommits(octokit, repo, github.context.ref)
    const newCommits = branchCommits.filter(bc => mainCommits.find(mc => mc.sha === bc.sha) === undefined);
    //const newCommitMessages = newCommits.slice(0, branchCommits.findIndex(x => x.sha === latestTag?.sha || null)).map(commit => commit.commit.message);
    let changeLevel = ChangeClass.None;
    for (const commit of newCommits.map(c => c.message)) {
      const change = getChangeLevel(commit);
      if (change > changeLevel) {
        changeLevel = change;
      }
    }
    

  } catch (error) {

  }
}

// Get most recent tags

run();
// Get latest tag for main.
// Get list of commits from main and from feature branch.
// Get commit title for each commit that doesn't already appear in main.
// Get class of most significant change.

async function processPushEvent(octokit: Octokit, event: { ref: string, after: string, repository: { owner: string, repo: string } }) {
  const { data: commits } = await octokit.rest.repos.listCommits({...event.repository, ref: event.ref});
  const newCommits = commits.filter(commit => commit.sha === event.after);
  const newCommitMessages = newCommits.map(commit => commit.commit.message);
  const changeLevel = getChangeLevel(newCommitMessages[0]);
  const latestTag = await getLatestTag(octokit, event.repository);
  const latestTagCommit = commits.find(commit => commit.sha === latestTag.sha);
  const latestTagMessage = latestTagCommit ? latestTagCommit.commit.message : '';
  const latestTagChangeLevel = getChangeLevel(latestTagMessage);
  const latestTagChangeClass = latestTagChangeLevel > changeLevel ? latestTagChangeLevel : changeLevel;
  const latestTagChangeClassName = latestTagChangeClass === ChangeClass.Major ? 'major' : latestTagChangeClass === ChangeClass.Minor ? 'minor' : 'patch';
}

async function getCommits(octokit: any, repo: { owner: string, repo: string }, ref: string) {
  const { data: commits } = await octokit.rest.repos.listCommits({...repo, ref});
  return commits.map(commit => ({ message: commit.commit.message, sha: commit.sha }));
}

async function getLatestTag(octokit, repo: { owner: string, repo: string }) {
  const { data: allTags } = await octokit.rest.repos.listTags(repo);


  return allTags.map(tag => ({ name: tag.name, sha: tag.commit.sha }))
                .filter(tag => tag.name.indexOf('-') < 0)
                .filter(tag => tag.name.split('.').length ===3)
                .sort()
                .pop()
                || { name: 'v0.0.0' };
}

function getChangeLevel(commitMessage: string) {
  if (commitMessage.split(':')[0].indexOf('!') > -1) {
    return ChangeClass.Major;
  }
  switch (commitMessage.split(":")[0].split("(")[0]) {
    case 'feat':
      return ChangeClass.Minor;
    case 'fix':
      return ChangeClass.Patch;
    case 'chore':
      return ChangeClass.None;
    case 'docs':
      return ChangeClass.None;
    case 'refactor':
      return ChangeClass.None;
    default:
      return ChangeClass.Major;
  }
}