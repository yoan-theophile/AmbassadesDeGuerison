import { describe, it, expect } from 'vitest';
import { buildVideoUrl, parseYouTubeMessage } from '@/app/onboarding/page';

describe('buildVideoUrl — ajout de enablejsapi=1', () => {
  it('ajoute enablejsapi=1 à une URL sans paramètre', () => {
    expect(buildVideoUrl('https://www.youtube.com/embed/ABC123'))
      .toBe('https://www.youtube.com/embed/ABC123?enablejsapi=1');
  });

  it('ajoute enablejsapi=1 avec & si la URL a déjà des paramètres', () => {
    expect(buildVideoUrl('https://www.youtube.com/embed/ABC123?rel=0'))
      .toBe('https://www.youtube.com/embed/ABC123?rel=0&enablejsapi=1');
  });

  it('retourne la chaîne vide inchangée', () => {
    expect(buildVideoUrl('')).toBe('');
  });
});

describe('parseYouTubeMessage — décodage des événements iframe', () => {
  it('détecte "playing" quand info=1 (objet)', () => {
    expect(parseYouTubeMessage({ event: 'onStateChange', info: 1 })).toBe('playing');
  });

  it('détecte "paused" quand info=2', () => {
    expect(parseYouTubeMessage({ event: 'onStateChange', info: 2 })).toBe('paused');
  });

  it('détecte "ended" quand info=0', () => {
    expect(parseYouTubeMessage({ event: 'onStateChange', info: 0 })).toBe('ended');
  });

  it('détecte "playing" depuis un message JSON string (format mobile)', () => {
    const msg = JSON.stringify({ event: 'onStateChange', info: 1 });
    expect(parseYouTubeMessage(msg)).toBe('playing');
  });

  it('retourne null pour un événement onReady (pas onStateChange)', () => {
    expect(parseYouTubeMessage({ event: 'onReady' })).toBeNull();
  });

  it('retourne null pour un message non-YouTube (string quelconque)', () => {
    expect(parseYouTubeMessage('hello world')).toBeNull();
  });

  it('retourne null pour null', () => {
    expect(parseYouTubeMessage(null)).toBeNull();
  });

  it('retourne null pour un JSON malformé', () => {
    expect(parseYouTubeMessage('{broken json')).toBeNull();
  });

  it('retourne null pour info=3 (buffering — non géré)', () => {
    expect(parseYouTubeMessage({ event: 'onStateChange', info: 3 })).toBeNull();
  });
});
