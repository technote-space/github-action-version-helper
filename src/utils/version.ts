import type { Commit } from '../types.js';
import type { Context } from '@actions/github/lib/context.js';
import type { ApiHelper, Octokit } from '@technote-space/github-action-helper';
import type { Logger } from '@technote-space/github-action-log-helper';
import { Utils } from '@technote-space/github-action-helper';
import { VERSION_BUMP } from '../constant.js';
import { getCommits } from './commit.js';
import { log } from './misc.js';

export const getCurrentVersion = async(helper: ApiHelper): Promise<string> => helper.getLastTag();

export const whatBump = (minorUpdateCommitTypes: Array<string>, commits: Array<Pick<Commit, 'notes' | 'type'>>): keyof typeof VERSION_BUMP => {
  if (commits.filter(commit => commit.notes.length).length) {
    return 'major';
  }

  if (minorUpdateCommitTypes.length && commits.filter(commit => commit.type && minorUpdateCommitTypes.includes(commit.type)).length) {
    return 'minor';
  }

  return 'patch';
};

export const getNextVersionLevel = (minorUpdateCommitTypes: Array<string>, commits: Array<Pick<Commit, 'notes' | 'type'>>): number => VERSION_BUMP[whatBump(minorUpdateCommitTypes, commits)];

export const getNextVersion = async(minorUpdateCommitTypes: Array<string>, excludeMessages: Array<string>, breakingChangeNotes: Array<string>, helper: ApiHelper, octokit: Octokit, context: Context, logger?: Logger): Promise<string> => {
  const commits = await getCommits(minorUpdateCommitTypes, excludeMessages, breakingChangeNotes, octokit, context);
  log(logger => logger.startProcess('Target commits:'), logger);
  log(() => console.log(
    commits
      .filter(item => item.notes.length || item.type)
      .map(item => ({
        type: item.type,
        message: item.message,
        notes: item.notes,
        sha: item.sha,
      })),
  ), logger);
  log(logger => logger.endProcess(), logger);

  const current = await getCurrentVersion(helper);
  log(logger => logger.info('Current version: %s', current), logger);

  const next = Utils.generateNewVersion(
    current,
    getNextVersionLevel(minorUpdateCommitTypes, commits),
  );
  log(logger => logger.info('Next version: %s', next), logger);

  return next;
};