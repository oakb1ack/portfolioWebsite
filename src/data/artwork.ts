// The House is the starting environment; Tartarus is the first region.
export const regions = {
  house: {
    title: 'The House',
    subtitle: 'A moment of respite',
    credit: 'Supergiant Games · Hades',
    src: '/art/hades-house.webp',
    position: '55% center',
    source: 'https://www.supergiantgames.com/games/hades/',
  },
  tartarus: {
    title: 'Tartarus',
    subtitle: 'The depths of the Underworld',
    credit: 'Joanne Tran · Supergiant Games · Hades',
    src: '/art/hades-tran-01.webp',
    position: '65% center',
    source: 'https://joannetran.artstation.com/projects/lV6YgJ',
  },
} as const;
export type Region = keyof typeof regions;
