import type { Pack } from '../game/state';

export const PACKS: Pack[] = [
  {
    id: 'everyday',
    name: 'Everyday Stuff',
    cost: 0,
    description: 'Cans, mugs, and everyday things to smash',
  },
  {
    id: 'sports',
    name: 'Sports Pack',
    cost: 300,
    description: 'Balls, trophies, and sports gear',
  },
  {
    id: 'weird',
    name: 'Weird Internet Pack',
    cost: 750,
    description: 'Strange objects from the internet',
  },
];
