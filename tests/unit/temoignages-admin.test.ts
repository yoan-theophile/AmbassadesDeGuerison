import { describe, it, expect } from 'vitest';

// Logique metier extraite de TemoignagesAdmin

// Supabase renvoie une relation FK many-to-one (event_id -> events) comme un
// objet simple, pas un tableau — voir app/admin/temoignages/page.tsx.
interface Temoignage {
  id: string;
  content: string;
  is_visible: boolean;
  host_profile: { first_name: string; city: string } | null;
  event: { title: string } | null;
}

type Filter = 'all' | 'visible' | 'hidden';

function applyTabFilter(items: Temoignage[], filter: Filter): Temoignage[] {
  if (filter === 'visible') return items.filter((t) => t.is_visible);
  if (filter === 'hidden')  return items.filter((t) => !t.is_visible);
  return items;
}

function applySearch(items: Temoignage[], search: string): Temoignage[] {
  if (!search.trim()) return items;
  return items.filter((t) => {
    const haystack = [
      t.content,
      t.host_profile?.first_name,
      t.host_profile?.city,
      t.event?.title,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return search
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .every((word) => haystack.includes(word));
  });
}

function applyEventFilter(items: Temoignage[], eventTitle: string): Temoignage[] {
  if (!eventTitle) return items;
  return items.filter((t) => t.event?.title === eventTitle);
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  return {
    paginated: items.slice((safePage - 1) * pageSize, safePage * pageSize),
    totalPages,
    safePage,
  };
}

const sample: Temoignage[] = [
  { id: '1', content: 'Guerison miraculeuse ce soir',  is_visible: true,
    host_profile: { first_name: 'Marie', city: 'Paris' },    event: { title: 'Live #14' } },
  { id: '2', content: 'Moment de paix intense',        is_visible: false,
    host_profile: { first_name: 'Ahmed', city: 'Lyon' },     event: { title: 'Live #15' } },
  { id: '3', content: 'Priere collective puissante',   is_visible: false,
    host_profile: { first_name: 'Marie', city: 'Bordeaux' }, event: { title: 'Live #14' } },
  { id: '4', content: 'Transformation profonde',       is_visible: true,
    host_profile: null,                                       event: { title: 'Live #15' } },
];

describe("TemoignagesAdmin — filtrage par onglet", () => {
  it("hidden retourne uniquement les non-publies", () => {
    const result = applyTabFilter(sample, 'hidden');
    expect(result).toHaveLength(2);
    expect(result.every((t) => !t.is_visible)).toBe(true);
  });

  it("visible retourne uniquement les publies", () => {
    const result = applyTabFilter(sample, 'visible');
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.is_visible)).toBe(true);
  });

  it("all retourne tous les temoignages", () => {
    expect(applyTabFilter(sample, 'all')).toHaveLength(4);
  });
});

describe("TemoignagesAdmin — recherche plein texte multi-mots", () => {
  it("recherche par contenu (un mot)", () => {
    const result = applySearch(sample, 'guerison');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it("recherche par prenom ambassadeur", () => {
    const result = applySearch(sample, 'Marie');
    expect(result).toHaveLength(2);
  });

  it("multi-mots — les deux doivent correspondre (AND)", () => {
    const result = applySearch(sample, 'Marie Bordeaux');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  it("un mot manquant fait echouer la correspondance", () => {
    const result = applySearch(sample, 'Marie Marseille');
    expect(result).toHaveLength(0);
  });

  it("recherche vide retourne tout", () => {
    expect(applySearch(sample, '')).toHaveLength(4);
    expect(applySearch(sample, '   ')).toHaveLength(4);
  });

  it("recherche par titre de live", () => {
    const result = applySearch(sample, 'Live #14');
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id).sort()).toEqual(['1', '3']);
  });
});

describe("TemoignagesAdmin — filtre par live", () => {
  it("filtre par titre exact", () => {
    const result = applyEventFilter(sample, 'Live #14');
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.event?.title === 'Live #14')).toBe(true);
  });

  it("filtre vide retourne tout", () => {
    expect(applyEventFilter(sample, '')).toHaveLength(4);
  });

  it("titre inconnu retourne zero resultat", () => {
    expect(applyEventFilter(sample, 'Live #99')).toHaveLength(0);
  });

  it("regression: event comme objet Supabase (pas tableau) — bug carte 'temoignages recus'", () => {
    // Reproduit le shape reel retourne par .select('event:events(title)') sur une
    // relation FK many-to-one : un objet, jamais un tableau. Avant le fix,
    // applyEventFilter utilisait t.event?.[0]?.title, qui vaut toujours undefined
    // sur un objet -> 0 resultat des qu'un eventFilter (venant de ?event_id=)
    // etait applique, meme si des temoignages existaient bel et bien pour ce live.
    const result = applyEventFilter(sample, 'Live #15');
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id).sort()).toEqual(['2', '4']);
  });
});

describe("TemoignagesAdmin — pagination", () => {
  const items = Array.from({ length: 23 }, (_, i) => `item-${i}`);

  it("page 1 de 23 avec pageSize=10 retourne les 10 premiers", () => {
    const { paginated, totalPages } = paginate(items, 1, 10);
    expect(paginated).toHaveLength(10);
    expect(paginated[0]).toBe('item-0');
    expect(totalPages).toBe(3);
  });

  it("page 3 retourne les 3 derniers elements", () => {
    const { paginated } = paginate(items, 3, 10);
    expect(paginated).toHaveLength(3);
    expect(paginated[0]).toBe('item-20');
  });

  it("page superieure au total est ramenee a totalPages (safePage)", () => {
    const { safePage, totalPages } = paginate(items, 99, 10);
    expect(safePage).toBe(totalPages);
    expect(safePage).toBe(3);
  });

  it("liste vide donne totalPages=1 et safePage=1", () => {
    const { totalPages, safePage, paginated } = paginate([], 1, 10);
    expect(totalPages).toBe(1);
    expect(safePage).toBe(1);
    expect(paginated).toHaveLength(0);
  });

  it("pageSize=20 sur 23 elements donne 2 pages", () => {
    const { totalPages } = paginate(items, 1, 20);
    expect(totalPages).toBe(2);
  });
});
