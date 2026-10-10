import { describe, it, expect } from 'vitest';
import { isSoundOn, setSound, setSoundScene, onSoundChange } from '../src/audio/sfx.ts';

describe('sound defaults per scene', () => {
  it('is on in the intro and in YOU PLAY, off while browsing, until the visitor chooses', () => {
    const changes: boolean[] = [];
    onSoundChange((on) => changes.push(on));
    expect(isSoundOn()).toBe(false); // browsing
    setSoundScene('intro');
    expect(isSoundOn()).toBe(true);
    setSoundScene('browse');
    expect(isSoundOn()).toBe(false);
    setSoundScene('play');
    expect(isSoundOn()).toBe(true);
    expect(changes).toEqual([true, false, true]);

    // The visitor's own choice (sound button) wins in every scene.
    setSound(false);
    setSoundScene('intro');
    expect(isSoundOn()).toBe(false);
    setSoundScene('browse');
    expect(isSoundOn()).toBe(false);
  });
});
