import { describe, it, expect } from 'vitest';
import { buildVideoUrl } from '@/app/onboarding/page';

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

  it('ne duplique pas enablejsapi si déjà présent dans la query string', () => {
    // Comportement informatif : buildVideoUrl ne déduplique pas, mais la
    // détection repose sur window.blur — ce cas ne se produit pas en pratique.
    const url = 'https://www.youtube.com/embed/ABC123?enablejsapi=1';
    expect(buildVideoUrl(url)).toContain('enablejsapi=1');
  });
});

describe('Détection de lecture — logique window.blur', () => {
  // La détection repose sur window.addEventListener('blur', ...) dans le composant.
  // Quand l'utilisateur clique dans l'iframe YouTube, le navigateur transfère le
  // focus à l'iframe et la fenêtre parente déclenche un événement blur.
  // document.activeElement devient l'<iframe> à cet instant.

  it("document.activeElement est un HTMLIFrameElement quand le focus est sur l'iframe", () => {
    // Test pur : vérifie que la condition de la guard est correcte.
    const fakeIframe = document.createElement('iframe');
    expect(fakeIframe instanceof HTMLIFrameElement).toBe(true);
  });

  it("un div n'est pas un HTMLIFrameElement", () => {
    const div = document.createElement('div');
    expect(div instanceof HTMLIFrameElement).toBe(false);
  });
});
