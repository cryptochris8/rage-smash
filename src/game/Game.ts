import * as THREE from 'three';
import { CONFIG } from './config';
import { Store, createInitialState } from './state';
import { createRenderer } from '../render/renderer';
import { createScene, switchRoom } from '../render/scene';
import { createCamera } from '../render/camera';
import { setupLighting, SceneLights } from '../render/lighting';
import { createPedestal } from '../render/objects/pedestal';
import { SmashableManager } from '../render/objects/smashable';
import { FragmentManager } from '../render/objects/fragments';
import { ModelManager } from '../render/ModelManager';
import { getPreloadPaths } from '../content/model-registry';
import { InputSystem } from '../systems/input';
import { SmashSystem } from '../systems/smash';
import { ParticleSystem } from '../systems/particles';
import { AudioManager } from '../audio/AudioManager';
import { SaveSystem } from '../systems/save';
import { SpawnSystem } from '../systems/spawn';
import { HapticsSystem } from '../systems/haptics';
import { AdManager } from '../ads/AdManager';
import { AdPrompts } from '../ui/ad-prompts';
import { DailyChallenge } from '../systems/daily';
import { initNative } from '../systems/native';
import { TimeScaleSystem } from '../systems/timescale';
import { ChargeSystem } from '../systems/charge';
import { LoginRewardSystem } from '../systems/login-reward';
import { JackpotSystem } from '../systems/jackpot';
import { StarterPackSystem } from '../systems/starter-pack';
import { SmartBoostSystem } from '../systems/smart-boost';
import { HUD } from '../ui/hud';
import { Shop } from '../ui/shop';
import { Overlays } from '../ui/overlays';
import { DailyUI } from '../ui/daily';
import { LeaderboardUI } from '../ui/leaderboard';
import { ChargeBar } from '../ui/chargebar';
import { LoginRewardUI } from '../ui/login-reward';
import { StarterPackUI } from '../ui/starter-pack';
import { PressSystem } from '../systems/press';
import { PressHUD } from '../ui/press-hud';
import { VoiceManager } from '../audio/VoiceManager';
import { SessionGoalSystem } from '../systems/session-goals';
import { RetentionChallengeSystem } from '../systems/retention-challenges';
import { EventSystem } from '../systems/events';
import { GoalsPanel } from '../ui/goals-panel';
import { ProgressPrompt } from '../ui/progress-prompt';
import { SettingsUI } from '../ui/settings';
import { Tutorial } from '../ui/tutorial';
import { GameAnalytics } from '../systems/analytics';
import { OBJECTS } from '../content/objects';
import { StoreKitManager, PRODUCT_IDS } from '../iap/StoreKitManager';

export class Game {
  private store: Store;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private lights: SceneLights;
  private modelManager: ModelManager;
  private smashableManager: SmashableManager;
  private fragmentManager: FragmentManager;
  private particleSystem: ParticleSystem;
  private smashSystem: SmashSystem;
  private spawnSystem: SpawnSystem;
  private inputSystem: InputSystem;
  private audioManager: AudioManager;
  private saveSystem: SaveSystem;
  private hapticsSystem: HapticsSystem;
  private adManager: AdManager;
  private adPrompts!: AdPrompts;
  private dailyChallenge: DailyChallenge;
  private timeScaleSystem: TimeScaleSystem;
  private chargeSystem: ChargeSystem;
  private loginRewardSystem: LoginRewardSystem;
  private jackpotSystem: JackpotSystem;
  private starterPackSystem: StarterPackSystem;
  private smartBoostSystem: SmartBoostSystem;
  private voiceManager: VoiceManager;
  private hud: HUD;
  private shop: Shop;
  private overlays: Overlays;
  private dailyUI: DailyUI;
  private leaderboardUI: LeaderboardUI;
  private chargeBar: ChargeBar;
  private loginRewardUI: LoginRewardUI;
  private starterPackUI: StarterPackUI;
  private sessionGoalSystem: SessionGoalSystem;
  private retentionChallengeSystem: RetentionChallengeSystem;
  private eventSystem: EventSystem;
  private goalsPanel: GoalsPanel;
  private progressPrompt: ProgressPrompt;
  private pressSystem: PressSystem;
  private pressHUD: PressHUD;
  private settingsUI: SettingsUI;
  private analytics: GameAnalytics;
  private storeKit: StoreKitManager;
  private nextIsPress: boolean = false;
  private clock: THREE.Clock;
  private prevCoins: number = 0;
  private lastCombo: number = 1;
  private lastStreak: number = 0;
  private inDailyChallenge: boolean = false;
  private container: HTMLElement;
  private lastSmashPower: number = 1;
  private lastSmashRarity: string = 'common';
  private lastBestCombo: number = 1;
  private streakIdleTimer: number = 0;
  private readonly streakTimeoutSec: number = 4;
  private lastEarnedCoins: number = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.store = new Store(createInitialState());
    this.clock = new THREE.Clock();

    // Persistence — load saved state first
    this.saveSystem = new SaveSystem(this.store);
    this.saveSystem.load();
    this.saveSystem.autoSave();

    // Analytics
    this.analytics = new GameAnalytics();

    // StoreKit IAP
    this.storeKit = new StoreKitManager();
    this.storeKit.init().then(() => {
      // Verify entitlements on launch (handles reinstalls/new devices)
      this.storeKit.checkEntitlements().then((entitlements) => {
        if (entitlements.includes(PRODUCT_IDS.removeAds)) {
          this.store.update({ adsRemoved: true });
        }
        if (entitlements.includes(PRODUCT_IDS.starterPack)) {
          this.store.update({ starterPackPurchased: true });
        }
      });
    }).catch((err) => console.warn('[Game] StoreKit init error:', err));

    this.prevCoins = this.store.state.coins;
    this.lastCombo = this.store.state.combo;
    this.lastStreak = this.store.state.streak;
    this.lastBestCombo = this.store.state.bestCombo;

    // Rendering
    this.renderer = createRenderer(container);
    this.scene = createScene(this.store.state.selectedRoom);
    this.camera = createCamera(container);
    this.lights = setupLighting(this.scene);
    createPedestal(this.scene);

    // 3D model manager — preload registered GLB assets
    this.modelManager = new ModelManager();
    this.modelManager.preload(getPreloadPaths()).catch((err) =>
      console.warn('[Game] Model preload error:', err),
    );

    // 3D object managers
    this.smashableManager = new SmashableManager(this.scene, this.modelManager);
    this.fragmentManager = new FragmentManager(this.scene);
    this.particleSystem = new ParticleSystem(this.scene);

    // Audio — new layered AudioManager (replaces old AudioSystem)
    this.audioManager = new AudioManager(this.store);
    this.voiceManager = new VoiceManager(this.store);

    // Haptics & Ads
    this.hapticsSystem = new HapticsSystem();
    this.adManager = new AdManager(this.store);
    this.adManager.setAudioManager(this.audioManager);
    this.adManager.init().catch((err) => console.warn('[Game] Ad init error:', err));

    // Daily challenge
    this.dailyChallenge = new DailyChallenge();

    // New systems
    this.timeScaleSystem = new TimeScaleSystem();
    this.chargeSystem = new ChargeSystem(this.store);
    this.loginRewardSystem = new LoginRewardSystem();
    // Sync streak state from login system into store
    this.store.update({
      dailyStreak: this.loginRewardSystem.getStreak(),
      jackpotBoostExpiresAt: this.loginRewardSystem.getJackpotBoostExpiresAt(),
    });
    this.jackpotSystem = new JackpotSystem();
    this.starterPackSystem = new StarterPackSystem(this.store);
    this.smartBoostSystem = new SmartBoostSystem(this.store);
    this.sessionGoalSystem = new SessionGoalSystem();
    this.retentionChallengeSystem = new RetentionChallengeSystem();
    this.eventSystem = new EventSystem();

    // Record session for starter pack trigger
    this.starterPackSystem.recordSession();

    // Core systems
    this.smashSystem = new SmashSystem(
      this.scene,
      this.store,
      this.smashableManager,
      this.fragmentManager,
      this.particleSystem,
      this.audioManager,
      this.adManager,
      this.jackpotSystem,
      this.starterPackSystem,
      this.eventSystem,
    );
    this.pressSystem = new PressSystem(
      this.scene,
      this.store,
      this.smashableManager,
      this.fragmentManager,
      this.particleSystem,
      this.audioManager,
      this.adManager,
      this.jackpotSystem,
      this.starterPackSystem,
      this.eventSystem,
    );
    this.spawnSystem = new SpawnSystem(this.store, this.smashableManager);

    // Input — branches on chargeEnabled
    if (CONFIG.chargeEnabled) {
      this.inputSystem = new InputSystem(
        container,
        {
          onChargeStart: () => this.onChargeStart(),
          onChargeRelease: () => this.onChargeRelease(),
          onChargeCancel: () => this.onChargeCancel(),
        },
        true,
      );
    } else {
      this.inputSystem = new InputSystem(
        container,
        { onTap: () => this.onTap() },
        false,
      );
    }

    // UI
    this.overlays = new Overlays(container);
    this.hud = new HUD(
      container,
      this.store,
      () => this.toggleShop(),
      () => this.toggleMute(),
      () => this.showDailyChallenge(),
      () => this.showLoginRewards(),
      () => this.onBoostTap(),
      () => this.toggleSettings(),
    );
    this.shop = new Shop(container, this.store, (roomId) => {
      switchRoom(this.scene, roomId);
    }, () => {
      this.retentionChallengeSystem.recordUpgrade();
      this.updateGoalsPanel();
    }, (itemName) => {
      this.overlays.showUnlockCelebration(itemName);
      this.audioManager.playJackpotSound();
    }, (needed, upgradeName) => {
      this.adPrompts.showUpgradeRescue(needed, upgradeName);
    });
    this.dailyUI = new DailyUI(
      container,
      this.store,
      this.dailyChallenge,
      () => this.startDailyChallenge(),
      () => this.closeDailyChallenge(),
    );
    this.leaderboardUI = new LeaderboardUI(container, this.store, this.dailyChallenge);
    this.chargeBar = new ChargeBar(container, this.store);
    this.loginRewardUI = new LoginRewardUI(container, this.store, this.loginRewardSystem, this.audioManager, () => {
      this.overlays.showUnlockCelebration('JACKPOT BOOST');
      this.audioManager.playJackpotSound();
    }, (coins) => {
      if (this.adManager.canShowRewarded('daily_bonus_optional')) {
        setTimeout(() => this.adPrompts.showDailyBonusDouble(coins), 500);
      }
    });
    this.starterPackUI = new StarterPackUI(container, this.store, this.starterPackSystem, this.audioManager, this.storeKit);
    this.goalsPanel = new GoalsPanel(
      container,
      this.store,
      (goalId) => {
        const reward = this.sessionGoalSystem.claimReward(goalId);
        if (reward > 0) {
          this.store.update({ coins: this.store.state.coins + reward });
          this.audioManager.playDailyReward();
        }
        this.updateGoalsPanel();
      },
      (challengeId) => {
        const reward = this.retentionChallengeSystem.claimReward(challengeId);
        if (reward > 0) {
          this.store.update({ coins: this.store.state.coins + reward });
          this.audioManager.playDailyReward();
        }
        this.updateGoalsPanel();
      },
    );
    this.progressPrompt = new ProgressPrompt(container);
    this.pressHUD = new PressHUD(container, this.store);
    this.adPrompts = new AdPrompts(container, this.store, this.adManager, this.audioManager);
    this.settingsUI = new SettingsUI(container, this.store, this.analytics, (enabled) => {
      this.hapticsSystem.setEnabled(enabled);
    }, async () => {
      // Remove Ads IAP
      const success = await this.storeKit.purchase(PRODUCT_IDS.removeAds);
      if (success) {
        this.store.update({ adsRemoved: true });
        this.audioManager.playDailyReward();
      }
      return success;
    }, async () => {
      // Restore Purchases
      const entitlements = await this.storeKit.restorePurchases();

      const restored: string[] = [];
      if (entitlements.includes(PRODUCT_IDS.removeAds)) {
        this.store.update({ adsRemoved: true });
        restored.push('Remove Ads');
      }
      if (entitlements.includes(PRODUCT_IDS.starterPack)) {
        this.store.update({ starterPackPurchased: true });
        restored.push('Starter Pack');
      }
      return restored;
    }, () => {
      // Reset — stop auto-save before localStorage is cleared
      this.saveSystem.stopAutoSave();
    });

    // Initial goals panel update
    this.updateGoalsPanel();

    // React to state changes for juice effects
    this.store.subscribe(() => {
      const { coins, combo, streak, bestCombo, jackpotActive, jackpotMultiplier } = this.store.state;

      // Coin popup + screen shake + flash + zoom punch on earn
      if (coins > this.prevCoins) {
        this.streakIdleTimer = 0;
        const earned = coins - this.prevCoins;
        this.lastEarnedCoins = earned;
        this.adManager.trackCoinsEarned(earned);
        this.analytics.recordSmash();
        this.analytics.recordCoins(earned);
        this.analytics.recordCombo(combo);
        this.analytics.recordStreak(streak);
        this.overlays.showCoinPopup(earned);

        // Scale shake intensity with combo level
        const shakeIntensity = CONFIG.screenShakeIntensity + (combo - 1) * 1.5;
        this.overlays.screenShake(container, shakeIntensity);

        // Impact flash
        this.overlays.showImpactFlash();

        // Camera zoom punch
        this.triggerZoomPunch();

        // Voice line (handles cooldowns/probability internally)
        this.voiceManager.onSmash(this.lastSmashPower, streak, this.lastSmashRarity);

        // Smart boost suggestion
        if (this.smartBoostSystem.checkTrigger(earned)) {
          this.overlays.showBoostSuggestion(() => this.onBoostTap());
        }

        // Retention: record smash for goals and challenges
        const isPerfect = this.lastSmashPower >= 0.9;
        const isJackpot = jackpotActive;

        // Track perfect hits
        if (isPerfect) {
          this.store.update({ totalPerfectHits: this.store.state.totalPerfectHits + 1 });
        }

        // Session goals
        const completedGoals = this.sessionGoalSystem.recordSmash(earned, combo, isPerfect, isJackpot);
        for (const goal of completedGoals) {
          this.goalsPanel.showGoalComplete(goal.label);
        }

        // Daily challenges
        const completedChallenges = this.retentionChallengeSystem.recordSmash(earned, combo, isPerfect, isJackpot);
        for (const challenge of completedChallenges) {
          this.goalsPanel.showGoalComplete(challenge.label);
        }

        this.updateGoalsPanel();

        // Periodic session-end bonus offer (every 10 smashes)
        if (this.adManager.shouldOfferSessionBonus()) {
          this.adManager.markSessionBonusOffered();
          setTimeout(() => this.offerSessionEndBonus(), 800);
        }
      }
      this.prevCoins = coins;

      // Jackpot effects
      if (jackpotActive) {
        this.overlays.showJackpotLabel(jackpotMultiplier);
        this.overlays.showImpactFlash('#ffd700');
        this.overlays.screenShake(container, CONFIG.screenShakeIntensity * 2, 200);
        this.audioManager.playJackpotSound();
        this.voiceManager.playRewardVoice();
        // Reset jackpot flag
        this.store.update({ jackpotActive: false });

        // Offer jackpot double ad after a brief delay for effects to land
        const jackpotCoins = coins - this.prevCoins;
        if (jackpotCoins > 0 && this.adManager.canShowRewarded('jackpot_bonus')) {
          setTimeout(() => this.adPrompts.showJackpotBonus(jackpotCoins), 1200);
        }
      }

      // Combo flash + HUD pulse
      if (combo > this.lastCombo && combo > 1) {
        this.overlays.showCombo(combo);
        this.hud.pulseCombo();
      }
      this.lastCombo = combo;

      // Combo label on streak increase
      if (streak > this.lastStreak) {
        this.overlays.showComboLabel(streak);

        // Confetti burst + success haptic at combo milestones
        if ((CONFIG.confettiComboThresholds as number[]).includes(streak)) {
          this.particleSystem.emitConfetti();
          this.hapticsSystem.notifySuccess();
        }
      }
      this.lastStreak = streak;

      // Streak heat lighting
      this.updateStreakHeat(streak);

      // "NEW BEST!" when beating personal best combo
      if (bestCombo > this.lastBestCombo && bestCombo > 1) {
        this.overlays.showNewBest();
      }
      this.lastBestCombo = bestCombo;
    });

    // Update gift notification
    this.hud.setGiftNotification(this.loginRewardSystem.canClaim());

    // Tutorial for first-time players
    if (Tutorial.shouldShow()) {
      this.store.update({ canTap: false });
      new Tutorial(container, () => {
        this.store.update({ canTap: true });
      });
    }

    // Eagerly unlock audio on first touch so buffers preload before first smash
    const earlyUnlock = () => {
      this.audioManager.unlock();
      this.voiceManager.setAudioContext(this.audioManager.getContext()!);
      container.removeEventListener('pointerdown', earlyUnlock);
    };
    container.addEventListener('pointerdown', earlyUnlock);

    // Always try to resume audio on any tap (catches post-ad suspension on iOS)
    container.addEventListener('pointerdown', () => {
      this.audioManager.resume();
    });

    // Save session on page unload
    window.addEventListener('beforeunload', () => this.analytics.endSession());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.analytics.endSession();
      } else if (document.visibilityState === 'visible') {
        // Resume audio after returning from ad or background
        this.audioManager.resume();
      }
    });

    // Spawn first object and start loop
    this.spawnSystem.spawnNext();
    this.animate();

    // Initialize native plugins (Capacitor)
    initNative();

    // Auto-show login rewards if claimable
    if (this.loginRewardSystem.canClaim()) {
      setTimeout(() => this.showLoginRewards(), 300);
    }

    // Auto-show starter pack after session threshold
    if (this.starterPackSystem.shouldShow()) {
      setTimeout(() => this.starterPackUI.show(), 800);
    }
  }

  // --- Tap (non-charge mode) ---

  private onTap() {
    const { canTap, isSmashing, shopOpen } = this.store.state;
    if (!canTap || isSmashing || shopOpen) return;

    this.audioManager.unlock();
    this.voiceManager.setAudioContext(this.audioManager.getContext()!);

    // Track smash context for voice system
    this.lastSmashPower = 1;
    const objDef = this.store.state.currentObjectId
      ? OBJECTS.find((o) => o.id === this.store.state.currentObjectId)
      : null;
    this.lastSmashRarity = objDef?.rarity ?? 'common';

    // Check if this smash should be a press bonus
    if (this.nextIsPress && CONFIG.pressEnabled) {
      this.nextIsPress = false;
      this.smashSystem.hideHammer();
      this.pressHUD.show();
      this.pressSystem.execute();
      this.hapticsSystem.impact();
      // No setTimeout — PressSystem.update() handles timing and re-enables canTap
      // Spawn next after press completes
      const checkDone = () => {
        if (!this.store.state.pressActive) {
          this.smashSystem.showHammer();
          this.pressHUD.hide();
          if (this.inDailyChallenge) {
            this.handleDailySmash();
          } else {
            this.spawnSystem.spawnNext();
          }
        } else {
          setTimeout(checkDone, 50);
        }
      };
      setTimeout(checkDone, 100);
    } else {
      this.smashSystem.execute();
      this.hapticsSystem.impact();
      this.timeScaleSystem.triggerSlowmo();

      const speedMul = 1 - this.store.state.speedLevel * CONFIG.upgradeSpeedBonus;
      const delay = (CONFIG.smashDuration + CONFIG.spawnDelay) * speedMul * 1000;
      setTimeout(() => {
        if (this.inDailyChallenge) {
          this.handleDailySmash();
        } else {
          this.spawnSystem.spawnNext();
        }
      }, delay);
    }

    if (!this.inDailyChallenge) {
      this.adManager.onSmash();
    }

    // Track press counter
    if (CONFIG.pressEnabled && !this.inDailyChallenge) {
      const newCount = this.store.state.smashesSincePress + 1;
      if (newCount >= CONFIG.pressSmashInterval) {
        this.store.update({ smashesSincePress: 0 });
        this.nextIsPress = true;
      } else {
        this.store.update({ smashesSincePress: newCount });
      }
    }
  }

  // --- Charge mode ---

  private onChargeStart(): void {
    const { canTap, isSmashing, shopOpen } = this.store.state;
    if (!canTap || isSmashing || shopOpen) return;

    this.audioManager.unlock();
    this.voiceManager.setAudioContext(this.audioManager.getContext()!);
    this.chargeSystem.startCharge();
    this.audioManager.playChargeStart();
  }

  private onChargeRelease() {
    if (!this.chargeSystem.isActive()) return;

    const result = this.chargeSystem.releaseCharge();

    this.hapticsSystem.resetChargeBuzz();

    if (!result.success) {
      // Overcharge fail
      this.audioManager.playOverchargeFail();
      this.overlays.showOvercharge();
      this.voiceManager.playFailVoice();
      this.hapticsSystem.notifyError();
      this.store.update({ streak: 0, combo: 1 });
      this.lastStreak = 0;
      this.lastCombo = 1;

      // Show near-miss progress prompt on fail
      this.showProgressPrompt();

      // Try interstitial first, then session-end bonus
      if (this.adManager.shouldShowInterstitial()) {
        this.adManager.showInterstitial().then(() => {
          this.offerSessionEndBonus();
        });
      } else {
        setTimeout(() => this.offerSessionEndBonus(), 1500);
      }
      return;
    }

    // Track smash context for voice system
    const chargePower = Math.min(result.multiplier / CONFIG.chargeMultiplierOptimalMax, 1);
    this.lastSmashPower = chargePower;
    const objDef = this.store.state.currentObjectId
      ? OBJECTS.find((o) => o.id === this.store.state.currentObjectId)
      : null;
    this.lastSmashRarity = objDef?.rarity ?? 'common';

    // Check if this smash should be a press bonus
    if (this.nextIsPress && CONFIG.pressEnabled) {
      this.nextIsPress = false;
      this.smashSystem.hideHammer();
      this.pressHUD.show();
      this.pressSystem.execute();
      this.hapticsSystem.impact();
      const checkDone = () => {
        if (!this.store.state.pressActive) {
          this.smashSystem.showHammer();
          this.pressHUD.hide();
          if (this.inDailyChallenge) {
            this.handleDailySmash();
          } else {
            this.spawnSystem.spawnNext();
          }
        } else {
          setTimeout(checkDone, 50);
        }
      };
      setTimeout(checkDone, 100);
    } else {
      // Successful charge release → smash
      this.smashSystem.setChargeMultiplier(result.multiplier);
      this.smashSystem.execute();
      this.hapticsSystem.impact(chargePower);
      this.timeScaleSystem.triggerSlowmo();

      const speedMul = 1 - this.store.state.speedLevel * CONFIG.upgradeSpeedBonus;
      const delay = (CONFIG.smashDuration + CONFIG.spawnDelay) * speedMul * 1000;
      setTimeout(() => {
        if (this.inDailyChallenge) {
          this.handleDailySmash();
        } else {
          this.spawnSystem.spawnNext();
        }
      }, delay);
    }

    if (!this.inDailyChallenge) {
      this.adManager.onSmash();
    }

    // Track press counter
    if (CONFIG.pressEnabled && !this.inDailyChallenge) {
      const newCount = this.store.state.smashesSincePress + 1;
      if (newCount >= CONFIG.pressSmashInterval) {
        this.store.update({ smashesSincePress: 0 });
        this.nextIsPress = true;
      } else {
        this.store.update({ smashesSincePress: newCount });
      }
    }
  }

  private onChargeCancel() {
    if (this.chargeSystem.isActive()) {
      this.chargeSystem.cancelCharge();
    }
  }

  // --- Camera Zoom Punch ---

  private triggerZoomPunch(): void {
    const baseFov = CONFIG.cameraFov;
    const punchFov = baseFov - CONFIG.zoomPunchFov;
    this.camera.fov = punchFov;
    this.camera.updateProjectionMatrix();

    const start = performance.now();
    const duration = CONFIG.zoomPunchDuration;

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);

      this.camera.fov = punchFov + (baseFov - punchFov) * eased;
      this.camera.updateProjectionMatrix();

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  // --- Streak Heat Lighting ---

  private updateStreakHeat(streak: number): void {
    const thresholds = CONFIG.streakHeatThresholds as number[];
    let tier = 0;
    for (let i = 0; i < thresholds.length; i++) {
      if (streak >= thresholds[i]) tier = i + 1;
    }

    const ambientColors = CONFIG.streakHeatColors.ambient as number[];
    const directionalColors = CONFIG.streakHeatColors.directional as number[];

    const ambientColor = ambientColors[Math.min(tier, ambientColors.length - 1)];
    const directionalColor = directionalColors[Math.min(tier, directionalColors.length - 1)];

    this.lights.ambient.color.setHex(ambientColor);
    this.lights.directional.color.setHex(directionalColor);
  }

  // --- 2X Boost ---

  private onBoostTap() {
    if (this.store.state.adBoostActive) return;
    if (!this.adManager.canShowRewarded('boost_2x_main')) {
      this.adPrompts.showAdUnavailable();
      return;
    }
    this.audioManager.playUIButton();
    this.overlays.showAdLoading(async () => {
      const success = await this.adManager.showRewarded('boost_2x_main');
      if (success) {
        this.retentionChallengeSystem.recordAdWatch();
        this.updateGoalsPanel();
        this.audioManager.playBoostActivate();
      } else {
        this.adPrompts.showAdUnavailable();
      }
    });
  }

  // --- Login Rewards ---

  private showLoginRewards() {
    this.loginRewardUI.show();
  }

  // --- Daily Challenge ---

  private showDailyChallenge() {
    this.audioManager.playUIButton();
    this.dailyUI.show();
  }

  private startDailyChallenge() {
    const state = this.dailyChallenge.start();
    this.inDailyChallenge = true;

    this.store.update({ streak: 0, combo: 1 });
    this.lastCombo = 1;
    this.lastStreak = 0;

    const firstObj = this.dailyChallenge.getNextObject();
    if (firstObj) {
      this.smashableManager.spawn(firstObj);
      this.store.update({ currentObjectId: firstObj.id });
    }

    this.dailyUI.updateProgress(0, state.sequence.length, 0);
  }

  private handleDailySmash() {
    const coinsEarned = this.lastEarnedCoins;
    this.lastEarnedCoins = 0;
    const { done, result } = this.dailyChallenge.recordSmash(Math.max(0, coinsEarned));
    const challengeState = this.dailyChallenge.getState();

    if (done && result) {
      this.inDailyChallenge = false;
      this.dailyUI.showResults(result);
      this.spawnSystem.spawnNext();

      // Interstitial after daily challenge
      if (this.adManager.shouldShowInterstitial()) {
        this.adManager.showInterstitial();
      }
    } else {
      const nextObj = this.dailyChallenge.getNextObject();
      if (nextObj) {
        this.smashableManager.spawn(nextObj);
        this.store.update({ currentObjectId: nextObj.id });
      }

      if (challengeState) {
        this.dailyUI.updateProgress(
          challengeState.currentIndex,
          challengeState.sequence.length,
          challengeState.score,
        );
      }
    }
  }

  private closeDailyChallenge() {
    if (this.inDailyChallenge) {
      this.dailyChallenge.abort();
      this.inDailyChallenge = false;
    }
    this.dailyUI.hide();
  }

  // --- Shop / Mute / Settings ---

  private toggleShop() {
    this.audioManager.playUIButton();
    if (this.store.state.shopOpen) {
      this.shop.hide();
    } else {
      this.shop.show();
    }
  }

  private toggleMute() {
    this.store.update({ muted: !this.store.state.muted });
  }

  private toggleSettings() {
    this.audioManager.playUIButton();
    if (this.settingsUI.isOpen()) {
      this.settingsUI.hide();
    } else {
      this.settingsUI.show();
    }
  }

  // --- Session-End Ad Offers ---

  private offerSessionEndBonus(): void {
    const sessionCoins = this.adManager.getSessionCoinsEarned();
    if (sessionCoins > 0 && this.adManager.canShowRewarded('session_end_bonus')) {
      this.adPrompts.showSessionEndBonus(sessionCoins);
    }
  }

  // --- Retention Goals/Challenges ---

  private updateGoalsPanel(): void {
    this.goalsPanel.update(
      this.sessionGoalSystem.getGoals(),
      this.retentionChallengeSystem.getChallenges(),
      this.eventSystem.getCurrentEvent(),
    );
  }

  private showProgressPrompt(): void {
    const messages: string[] = [];

    // Check near-complete session goals
    for (const goal of this.sessionGoalSystem.getGoals()) {
      if (!goal.completed && goal.current > 0) {
        const remaining = goal.target - goal.current;
        if (remaining <= 3 || goal.current / goal.target >= 0.7) {
          messages.push(`${remaining} more to complete: ${goal.label}`);
        }
      }
    }

    // Check near-complete daily challenges
    for (const ch of this.retentionChallengeSystem.getChallenges()) {
      if (!ch.completed && ch.current > 0 && ch.current / ch.target >= 0.6) {
        const remaining = ch.target - ch.current;
        messages.push(`${remaining} away from: ${ch.label}`);
      }
    }

    // Show up to 2 messages
    if (messages.length > 0) {
      this.progressPrompt.show(messages.slice(0, 2));
    }
  }

  // --- Game Loop ---

  private animate() {
    requestAnimationFrame(() => this.animate());
    const rawDt = this.clock.getDelta();

    // TimeScale: update in real-time, produce scaled dt for game systems
    this.timeScaleSystem.update(rawDt);
    const dt = this.timeScaleSystem.getDt(rawDt);

    // Charge system uses raw dt (fills at real-time rate)
    if (CONFIG.chargeEnabled) {
      this.chargeSystem.update(rawDt);
      this.hapticsSystem.updateChargeBuzz(rawDt, this.store.state.chargeLevel);
    }

    // Streak idle timeout: reset combo if no smash for N seconds
    if (this.store.state.streak > 0 && !this.store.state.isSmashing && !this.store.state.isCharging) {
      this.streakIdleTimer += rawDt;
      if (this.streakIdleTimer >= this.streakTimeoutSec) {
        this.store.update({ streak: 0, combo: 1 });
        this.lastStreak = 0;
        this.lastCombo = 1;
        this.streakIdleTimer = 0;
      }
    }

    // Ad system uses raw dt (countdown in real time)
    this.adManager.update(rawDt);

    // Game systems use scaled dt
    this.smashableManager.update(dt);
    this.fragmentManager.update(dt);
    this.particleSystem.update(dt);
    this.smashSystem.update(dt);
    this.pressSystem.update(dt);

    this.renderer.render(this.scene, this.camera);
  }
}
