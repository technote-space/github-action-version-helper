/* eslint-disable no-magic-numbers */
import { resolve } from 'path';
import {
  generateContext,
  disableNetConnect,
  getApiFixture,
  getOctokit,
} from '@technote-space/github-action-test-helper';
import nock from 'nock';
import { describe, expect, it } from 'vitest';
import { getCommits } from './commit.js';

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

describe('getCommits', () => {
  disableNetConnect(nock);

  it('should list commits 1', async() => {
    nock('https://api.github.com')
      .persist()
      .get('/repos/hello/world/pulls/123/commits')
      .reply(200, () => getApiFixture(fixtureRootDir, 'commit.list1'));

    const commits = await getCommits(['feat', 'chore'], ['trigger workflow'], ['BREAKING CHANGE'], octokit, context);

    expect(commits).toHaveLength(0);
  });

  it('should list commits 2', async() => {
    nock('https://api.github.com')
      .persist()
      .get('/repos/hello/world/pulls/123/commits')
      .reply(200, () => getApiFixture(fixtureRootDir, 'commit.list2'));

    const commits = await getCommits(['feat', 'chore'], ['trigger workflow'], ['BREAKING CHANGE'], octokit, context);

    expect(commits).toHaveLength(4);
    expect(commits).toEqual([
      {
        'type': 'chore',
        'message': 'tweaks',
        'normalized': 'chore: tweaks',
        'original': 'chore: tweaks',
        'children': [],
        'notes': [],
        'sha': '2dcb09b5b57875f334f61aebed695e2e4193db5e',
      },
      {
        'type': 'feat',
        'message': 'add new features',
        'normalized': 'feat: add new features',
        'original': 'feat!: add new features',
        'children': [
          {
            'type': 'feat',
            'message': 'add new feature1 (#123)',
            'normalized': 'feat: add new feature1 (#123)',
            'original': 'feat: add new feature1 (#123)',
          },
          {
            'type': 'feat',
            'message': 'add new feature2 (#234)',
            'normalized': 'feat: add new feature2 (#234)',
            'original': 'feat: add new feature2 (#234)',
          },
        ],
        'notes': ['BREAKING CHANGE: changed'],
        'sha': '3dcb09b5b57875f334f61aebed695e2e4193db5e',
      },
      {
        'type': 'feat',
        'message': 'add new feature3',
        'normalized': 'feat: add new feature3',
        'original': 'feat :  add new feature3',
        'children': [],
        'notes': [],
        'sha': '4dcb09b5b57875f334f61aebed695e2e4193db5e',
      },
      {
        'type': 'chore',
        'message': 'tweaks',
        'normalized': 'chore: tweaks',
        'original': 'chore: tweaks',
        'children': [],
        'notes': [],
        'sha': '9dcb09b5b57875f334f61aebed695e2e4193db5e',
      },
    ]);
  });

  it('should list commits 3', async() => {
    nock('https://api.github.com')
      .persist()
      .get('/repos/hello/world/pulls/123/commits')
      .reply(200, () => getApiFixture(fixtureRootDir, 'commit.list3'));

    const commits = await getCommits(['feat', 'chore'], ['trigger workflow'], ['BREAKING CHANGE'], octokit, context);

    expect(commits).toEqual([
      {
        'type': 'chore',
        'message': 'tweaks',
        'normalized': 'chore: tweaks',
        'original': 'chore: tweaks',
        'children': [],
        'notes': [],
        'sha': '2dcb09b5b57875f334f61aebed695e2e4193db5e',
      },
      {
        'type': 'feat',
        'message': 'add new feature3',
        'normalized': 'feat: add new feature3',
        'original': 'feat :  add new feature3',
        'children': [],
        'notes': [],
        'sha': '4dcb09b5b57875f334f61aebed695e2e4193db5e',
      },
      {
        'type': 'chore',
        'message': 'trigger workflow',
        'normalized': 'chore: trigger workflow',
        'original': 'chore: trigger workflow',
        'children': [
          {
            'type': 'feat',
            'message': 'test',
            'normalized': 'feat: test',
            'original': 'feat: test',
          },
        ],
        'notes': [],
        'sha': '8dcb09b5b57875f334f61aebed695e2e4193db5e',
      },
      {
        'type': 'chore',
        'message': 'tweaks',
        'normalized': 'chore: tweaks',
        'original': 'chore: tweaks',
        'children': [],
        'notes': [],
        'sha': '9dcb09b5b57875f334f61aebed695e2e4193db5e',
      },
    ]);
  });
});
