import * as core from '@actions/core';
import * as github from '@actions/github';
import { getCommitsByPullRequest } from './graphql/queries';

async function run() {
  try {
    const octokit = github.getOctokit(core.getInput('token'));
    const { data: tags } = await octokit.rest.repos.listTags(github.context.repo);
    const latestTag = tags.map(tag => tag.name).filter(tag => tag.indexOf('-') < 0).filter(tag => tag.split('.').length ===3).sort().pop();
    const pr = github.context.payload.pull_request!;
    const repo = github.context.repo;
    const prCommitsResponse = await octokit.graphql({query: getCommitsByPullRequest(repo, pr.number)});
    const prCommits = prCommitsResponse.data.repository.pullRequest.commits.edges.map(edge => edge.node.commit);

  } catch (error) {

  }
}

// Get most recent tags

run();
// Get latest tag for main.
// Get list of commits from main and from feature branch.
// Get commit title for each commit that doesn't already appear in main.
// Get class of most 
const tags: {
  name: string;
  commit: {
      sha: string;
      url: string;
  };
  zipball_url: string;
  tarball_url: string;
  node_id: string;
}[]

async function getPRCommits(prNumber) {
}