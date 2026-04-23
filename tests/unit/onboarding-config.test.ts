import { describe, it, expect } from 'vitest';

// Logique de resolution config : DB row ou fallback constants

const FALLBACK = {
  VIDEO_URL: 'https://www.youtube.com/embed/DEFAULT',
  PDF_PATH:  '/docs/guide-ambassade.pdf',
};

interface DbRow {
  video_url: string;
  pdf_url:   string;
}

function resolveConfig(row: DbRow | null | undefined): { video_url: string; pdf_url: string } {
  return {
    video_url: row?.video_url || FALLBACK.VIDEO_URL,
    pdf_url:   row?.pdf_url   || FALLBACK.PDF_PATH,
  };
}

describe("Config onboarding — resolution avec fallback", () => {
  it("utilise les valeurs DB quand elles sont presentes", () => {
    const result = resolveConfig({ video_url: 'https://www.youtube.com/embed/ABC123', pdf_url: '/docs/guide-v2.pdf' });
    expect(result.video_url).toBe('https://www.youtube.com/embed/ABC123');
    expect(result.pdf_url).toBe('/docs/guide-v2.pdf');
  });

  it("bascule sur le fallback si la row DB est null", () => {
    const result = resolveConfig(null);
    expect(result.video_url).toBe(FALLBACK.VIDEO_URL);
    expect(result.pdf_url).toBe(FALLBACK.PDF_PATH);
  });

  it("bascule sur le fallback si la row DB est undefined", () => {
    const result = resolveConfig(undefined);
    expect(result.video_url).toBe(FALLBACK.VIDEO_URL);
    expect(result.pdf_url).toBe(FALLBACK.PDF_PATH);
  });

  it("bascule sur le fallback si video_url est une chaine vide", () => {
    const result = resolveConfig({ video_url: '', pdf_url: '/docs/guide.pdf' });
    expect(result.video_url).toBe(FALLBACK.VIDEO_URL);
    expect(result.pdf_url).toBe('/docs/guide.pdf');
  });

  it("bascule sur le fallback si pdf_url est une chaine vide", () => {
    const result = resolveConfig({ video_url: 'https://www.youtube.com/embed/XYZ', pdf_url: '' });
    expect(result.video_url).toBe('https://www.youtube.com/embed/XYZ');
    expect(result.pdf_url).toBe(FALLBACK.PDF_PATH);
  });

  it("les deux champs peuvent etre mis a jour independamment", () => {
    const result = resolveConfig({ video_url: 'https://www.youtube.com/embed/NEW', pdf_url: '' });
    expect(result.video_url).not.toBe(FALLBACK.VIDEO_URL);
    expect(result.pdf_url).toBe(FALLBACK.PDF_PATH);
  });
});
