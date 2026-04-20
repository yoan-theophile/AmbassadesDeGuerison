import { describe, it, expect } from 'vitest';

// Tests logique de filtrage témoignages
describe('Témoignages — filtres', () => {
  const allTestimonials = [
    { id: '1', is_visible: true, content: 'Guérison remarquable' },
    { id: '2', is_visible: false, content: 'Cachée' },
    { id: '3', is_visible: true, content: 'Témoignage fort' },
  ];

  it('ne retourne que les témoignages visibles', () => {
    const visible = allTestimonials.filter((t) => t.is_visible);
    expect(visible).toHaveLength(2);
    expect(visible.every((t) => t.is_visible)).toBe(true);
  });

  it('retourne un tableau vide si aucun témoignage visible', () => {
    const hidden = allTestimonials.map((t) => ({ ...t, is_visible: false }));
    const visible = hidden.filter((t) => t.is_visible);
    expect(visible).toHaveLength(0);
  });

  it('retourne tous les témoignages si tous visibles', () => {
    const allVisible = allTestimonials.map((t) => ({ ...t, is_visible: true }));
    const visible = allVisible.filter((t) => t.is_visible);
    expect(visible).toHaveLength(3);
  });
});
