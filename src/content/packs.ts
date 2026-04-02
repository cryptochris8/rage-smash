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
  {
    id: 'meme',
    name: 'Meme Pack',
    cost: 1500,
    description: 'Chaotic, funny, and absurd objects from the internet',
  },
  {
    id: 'soft',
    name: 'Soft Pack',
    cost: 400,
    description: 'Pillows, plushies, and squishy things to destroy',
  },
  {
    id: 'food',
    name: 'Food Pack',
    cost: 500,
    description: 'Smash cakes, fruit, and other tasty treats',
  },
  {
    id: 'luxury',
    name: 'Luxury Pack',
    cost: 3000,
    description: 'Rare premium objects with gold sparkles and big rewards',
  },
];
