const source = 'https://www.studiograckle.com/work/hades';

const grackleCredit = 'Jane Bak · Studio Grackle · Hades';
const tranCredit = 'Joanne Tran · Supergiant Games · Hades';

// Scene labels describe the images; they are not official artwork titles.
export const artworks = [
  {
    title: 'Hades · The underworld',
    credit: grackleCredit,
    src: '/art/hades-grackle-01.webp',
    position: '65% center',
    source,
  },
  {
    title: 'Hades · Ruined temple',
    credit: grackleCredit,
    src: '/art/hades-grackle-02.webp',
    position: '65% center',
    source,
  },
  {
    title: 'Hades · Lava arena',
    credit: grackleCredit,
    src: '/art/hades-grackle-03.webp',
    position: '65% center',
    source,
  },
  {
    title: 'Hades · Palace stairway',
    credit: grackleCredit,
    src: '/art/hades-grackle-04.webp',
    position: '72% center',
    source,
  },
  {
    title: 'Hades · Tartarus',
    credit: tranCredit,
    src: '/art/hades-tran-01.webp',
    position: '65% center',
    source: 'https://joannetran.artstation.com/projects/lV6YgJ',
  },
  {
    title: 'Hades · Asphodel',
    credit: tranCredit,
    src: '/art/hades-tran-02.webp',
    position: '65% center',
    source: 'https://joannetran.artstation.com/projects/v2401Y',
  },
  {
    title: 'Hades · Elysium',
    credit: tranCredit,
    src: '/art/hades-tran-03.webp',
    position: '65% center',
    source: 'https://joannetran.artstation.com/projects/Ga6gXd',
  },
] as const;

