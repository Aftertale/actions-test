import * as core from '@actions/core';
import * as github from '@actions/github';
import { Octokit } from 'octokit';
import { getCommitsByPullRequest, GitHubCommitResponse, GitHubRepository } from './graphql/queries';

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
    const octokit = github.getOctokit(core.getInput('token'));
    const repo = github.context.repo;
    const latestTag = await getLatestTag(octokit, repo);

    const mainCommits = await getCommits(octokit, repo, 'refs/heads/main'); 
    const branchCommits = await getCommits(octokit, repo, github.context.ref)
    const newCommits = branchCommits.filter(commit => mainCommits.indexOf(commit) < 0);
    const newCommitMessages = branchCommits.slice(0, branchCommits.findIndex(x => x.sha === latestTag?.sha || null)).map(commit => commit.commit.message);
    let changeLevel = ChangeClass.None;
    for (const commit of newCommitMessages) {
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