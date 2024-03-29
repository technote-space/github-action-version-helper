/* eslint-disable no-magic-numbers */
import { resolve } from 'path';
import { ApiHelper } from '@technote-space/github-action-helper';
import { Logger } from '@technote-space/github-action-log-helper';
import {
  generateContext,
  disableNetConnect,
  getApiFixture,
  getOctokit,
  spyOnStdout,
  stdoutCalledWith,
  getLogStdout,
} from '@technote-space/github-action-test-helper';
import nock from 'nock';
import { describe, expect, it } from 'vitest';
import { getCurrentVersion, whatBump, getNextVersionLevel, getNextVersion } from './version.js';

const fixtureRootDir = resolve(__dirname, '..', 'fixtures');
const octokit        = getOctokit();
const context        = generateContext({owner: 'hello', repo: 'world', ref: 'refs/pull/123/merge'}, {
  payload: {
    number: 123,
    'pull_request': {
      head: {
        ref: 'feature/change',
      },
    },
  },
});
const logger         = new Logger();
const helper         = new ApiHelper(octokit, context, logger);

describe('getCurrentVersion', () => {
  disableNetConnect(nock);

  it('should get current version 1', async() => {
    nock('https://api.github.com')
      .persist()
      .get('/repos/hello/world/git/matching-refs/tags%2F')
      .reply(200, () => getApiFixture(fixtureRootDir, 'repos.git.matching-refs'));

    expect(await getCurrentVersion(helper)).toBe('v2.0.0');
  });

  it('should get current version 2', async() => {
    nock('https://api.github.com')
      .persist()
      .get('/repos/hello/world/git/matching-refs/tags%2F')
      .reply(200, () => []);

    expect(await getCurrentVersion(helper)).toBe('v0.0.0');
  });
});

describe('whatBump', () => {
  it('should return major', () => {
    expect(whatBump([], [
      {notes: ['BREAKING CHANGE: test']},
      {type: 'chore', notes: []},
      {type: 'style', notes: []},
      {type: 'feat', notes: []},
    ])).toBe('major');
  });

  it('should return minor', () => {
    expect(whatBump(['feat'], [
      {type: 'chore', notes: []},
      {type: 'style', notes: []},
      {type: 'feat', notes: []},
    ])).toBe('minor');
  });

  it('should return patch', () => {
    expect(whatBump([], [])).toBe('patch');
    expect(whatBump(['feat'], [
      {type: 'chore', notes: []},
      {type: 'style', notes: []},
    ])).toBe('patch');
  });
});

describe('getNextVersionLevel', () => {
  it('should return major level', () => {
    expect(getNextVersionLevel([], [
      {type: 'test', notes: ['BREAKING CHANGE: test']},
    ])).toBe(0);
  });

  it('should return minor level', () => {
    expect(getNextVersionLevel(['feat'], [
      {type: 'feat', notes: []},
    ])).toBe(1);
  });

  it('should return patch level', () => {
    expect(getNextVersionLevel([], [])).toBe(2);
    expect(getNextVersionLevel(['feat'], [
      {type: 'chore', notes: []},
      {type: 'style', notes: []},
    ])).toBe(2);
  });
});

describe('getNextVersion', () => {
  disableNetConnect(nock);

  it('should get next version 1-1', async() => {
    nock('https://api.github.com')
      .persist()
      .get('/repos/hello/world/git/matching-refs/tags%2F')
      .reply(200, () => [])
      .get('/repos/hello/world/pulls/123/commits')
      .reply(200, () => getApiFixture(fixtureRootDir, 'commit.list1'));

    expect(await getNextVersion([], [], [], helper, octokit, context)).toBe('v0.0.1');
  });

  it('should get next version 1-2', async() => {
    nock('https://api.github.com')
      .persist()
      .get('/repos/hello/world/git/matching-refs/tags%2F')
      .reply(200, () => [])
      .get('/repos/hello/world/pulls/123/commits')
      .reply(200, () => getApiFixture(fixtureRootDir, 'commit.list1'));

    expect(await getNextVersion(['fix'], [], [], helper, octokit, context)).toBe('v0.1.0');
  });

  it('should get next version 1-3', async() => {
    nock('https://api.github.com')
      .persist()
      .get('/repos/hello/world/git/matching-refs/tags%2F')
      .reply(200, () => [])
      .get('/repos/hello/world/pulls/123/commits')
      .reply(200, () => getApiFixture(fixtureRootDir, 'commit.list1'));

    expect(await getNextVersion(['fix'], ['all the bugs'], [], helper, octokit, context)).toBe('v0.0.1');
  });

  it('should get next version 2', async() => {
    nock('https://api.github.com')
      .persist()
      .get('/repos/hello/world/git/matching-refs/tags%2F')
      .reply(200, () => getApiFixture(fixtureRootDir, 'repos.git.matching-refs'))
      .get('/repos/hello/world/pulls/123/commits')
      .reply(200, () => getApiFixture(fixtureRootDir, 'commit.list2'));

    expect(await getNextVersion([], [], ['BREAKING CHANGE'], helper, octokit, context)).toBe('v3.0.0');
  });

  it('should get next version 3', async() => {
    const mockStdout = spyOnStdout();

    nock('https://api.github.com')
      .persist()
      .get('/repos/hello/world/git/matching-refs/tags%2F')
      .reply(200, () => getApiFixture(fixtureRootDir, 'repos.git.matching-refs'))
      .get('/repos/hello/world/pulls/123/commits')
      .reply(200, () => getApiFixture(fixtureRootDir, 'commit.list3'));

    expect(await getNextVersion(['feat'], [], ['BREAKING CHANGE'], helper, octokit, context)).toBe('v2.1.0');

    stdoutCalledWith(mockStdout, []);
  });

  it('should get next version with stdout', async() => {
    const mockStdout = spyOnStdout();

    nock('https://api.github.com')
      .persist()
      .get('/repos/hello/world/git/matching-refs/tags%2F')
      .reply(200, () => getApiFixture(fixtureRootDir, 'repos.git.matching-refs'))
      .get('/repos/hello/world/pulls/123/commits')
      .reply(200, () => getApiFixture(fixtureRootDir, 'commit.list2'));

    expect(await getNextVersion(['style'], [], ['BREAKING CHANGE'], helper, octokit, context, logger)).toBe('v3.0.0');

    stdoutCalledWith(mockStdout, [
      '::group::Target commits:',
      getLogStdout([
        {
          'type': 'feat',
          'message': 'add new features',
          'notes': [
            'BREAKING CHANGE: changed',
          ],
          'sha': '3dcb09b5b57875f334f61aebed695e2e4193db5e',
        },
        {
          'type': 'style',
          'message': 'tweaks',
          'notes': [],
          'sha': '7dcb09b5b57875f334f61aebed695e2e4193db5e',
        },
      ]),
      '::endgroup::',
      '> Current version: v2.0.0',
      '> Next version: v3.0.0',
    ]);
  });
});
