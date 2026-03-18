export interface FeaturedEvent {
  id: string;
  name: string;
  pack: string;
  rewardBonus: number;
  description: string;
}

const EVENTS: FeaturedEvent[] = [
  { id: 'office-meltdown', name: 'Office Meltdown', pack: 'everyday', rewardBonus: 0.25, description: 'Everyday objects +25% coins' },
  { id: 'sports-rage', name: 'Sports Rage', pack: 'sports', rewardBonus: 0.25, description: 'Sports objects +25% coins' },
  { id: 'weird-surge', name: 'Weird Surge', pack: 'weird', rewardBonus: 0.25, description: 'Weird objects +25% coins' },
  { id: 'jackpot-frenzy', name: 'Jackpot Frenzy', pack: '', rewardBonus: 0, description: 'Double jackpot chance today' },
];

export class EventSystem {
  private currentEvent: FeaturedEvent;

  constructor() {
    // Use day-of-year as index to rotate deterministically
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    this.currentEvent = EVENTS[dayOfYear % EVENTS.length];
  }

  getCurrentEvent(): FeaturedEvent { return this.currentEvent; }

  /** Get bonus multiplier for a given pack. Returns 0 if no bonus. */
  getRewardBonus(pack: string): number {
    if (this.currentEvent.pack === pack) return this.currentEvent.rewardBonus;
    return 0;
  }

  /** Check if jackpot chance should be doubled today */
  isJackpotBoosted(): boolean {
    return this.currentEvent.id === 'jackpot-frenzy';
  }
}
