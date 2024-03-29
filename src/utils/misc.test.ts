import { describe, expect, it } from 'vitest';
import { parseLine, parseCommitMessage } from './misc.js';

describe('parseLine', () => {
  it('should return empty', () => {
    expect(parseLine('')).toBeUndefined();
    expect(parseLine('test message')).toBeUndefined();
  });

  it('should parse line', () => {
    expect(parseLine('chore: test message')).toEqual({
      type: 'chore',
      message: 'test message',
      normalized: 'chore: test message',
      original: 'chore: test message',
    });
    expect(parseLine('feat!: test message')).toEqual({
      type: 'feat',
      message: 'test message',
      normalized: 'feat: test message',
      original: 'feat!: test message',
    });
  });
});

describe('parseCommitMessage', () => {
  it('should return empty', () => {
    expect(parseCommitMessage('', [], [], [])).toBeUndefined();
    expect(parseCommitMessage('abc: test message', ['feat'], [], [])).toBeUndefined();
    expect(parseCommitMessage('feat: test message\nBREAKING CHANGE: test', ['feat'], ['TEST MESSAGE'], [])).toBeUndefined();
  });

  it('should parse commit message', () => {
    expect(parseCommitMessage('feat: test message', ['feat'], [], [])).toEqual({
      type: 'feat',
      message: 'test message',
      normalized: 'feat: test message',
      original: 'feat: test message',
      children: [],
      notes: [],
    });
  });

  it('should parse commit message with children', () => {
    expect(parseCommitMessage(
      'feat : add features  \nfeat: feature1\nfeat: feature2\n\nchore: tweaks\nBREAKING CHANGE: changed',
      ['feat'],
      ['feature1'],
      ['BREAKING CHANGE']),
    ).toEqual({
      type: 'feat',
      message: 'add features',
      normalized: 'feat: add features',
      original: 'feat : add features',
      children: [
        {
          type: 'feat',
          message: 'feature2',
          normalized: 'feat: feature2',
          original: 'feat: feature2',
        },
      ],
      notes: [
        'BREAKING CHANGE: changed',
      ],
    });
  });
});
