# Rage Smash — Ad System Implementation (Claude Code Brief)

## Goal

Implement a clean, mobile-friendly ad system that maximizes revenue without harming retention.

Priority order:
1. Rewarded ads
2. Light interstitial ads
3. Future expansion hooks

Primary network for v1:
- Google AdMob

The ad system must feel fair, optional where possible, and integrated into the game loop.

---

## Core Monetization Philosophy

Ads should feel like:
- acceleration
- bonus value
- optional help

Ads should NOT feel like:
- punishment
- interruption
- spam

The player should often think:
“Yeah, that ad was worth it.”

---

# Ad Types to Implement

## 1. Rewarded Ads (Primary Revenue Driver)

### Main rewarded placement
Button:
- “2X Coins”
- “2X Coins for 30 Seconds”

### Reward
- double all coin rewards for 30 seconds

### Additional optional rewarded placements
- “Finish upgrade faster”
- “Claim bonus jackpot”
- “Extra coins after big session”

### Rules
- rewarded ads should always feel valuable
- reward must be large enough to matter
- do not hide core gameplay behind ads

### Reward target value
One rewarded ad should feel worth about:
- 2 to 3 minutes of normal play
or
- enough coins to noticeably accelerate progression

---

## 2. Interstitial Ads (Light Use Only)

Interstitials should be used carefully.

### Show only when:
- session is over
- fail state occurs
- player has completed multiple rounds
- enough time has passed since last interstitial

### Recommended rules
- never show during active smashing
- never show during combo moments
- never show in the first session
- do not show more often than every 2 to 4 minutes
- do not show every round

### Minimum logic
Only allow interstitial if:
- player completed at least 3 sessions
- session length > 60 seconds
- cooldown timer passed

---

# Ad Network Recommendation

## Primary v1
Google AdMob

Reason:
- easiest iOS path
- strong rewarded ad support
- common and stable
- good for first launch

### Future optional networks
- Unity Ads
- AppLovin

Do not add mediation complexity in v1 unless already needed.

---

# Required Ad System Modules

Suggested files:
- src/ads/AdManager.ts
- src/ads/adConfig.ts
- src/ads/adTypes.ts
- src/ads/adState.ts

Optional:
- src/ads/providers/AdMobProvider.ts
- src/ads/hooks/useRewardedAd.ts

Adapt naming to project conventions.

---

# Required Features

## 1. AdManager

Create a centralized AdManager.

Responsibilities:
- initialize ad provider
- preload rewarded ads
- preload interstitials
- expose safe methods to show ads
- handle reward callbacks
- track cooldowns
- handle load failures gracefully

Suggested API:
- initAds()
- preloadRewarded()
- preloadInterstitial()
- canShowRewarded()
- canShowInterstitial()
- showRewarded(adPlacement)
- showInterstitial(adPlacement)
- onRewardGranted(rewardType)
- trackAdEvent(event)

---

## 2. Rewarded Ad Placements

Create placement IDs so analytics stay organized.

Suggested placement keys:
- boost_2x_main
- upgrade_finish_bonus
- session_end_bonus
- jackpot_bonus
- daily_bonus_optional

Every rewarded ad should know:
- placement key
- reward type
- reward value
- success callback

---

## 3. Interstitial Placement Rules

Suggested placement keys:
- session_end
- fail_state
- room_unlock_transition

### Important
Keep v1 simple:
Use only one or two interstitial placements at first.

Recommended v1:
- session_end only

---

# Reward Rules

## Main Boost Reward
Placement:
boost_2x_main

Reward:
- 2x all coin earnings for 30 seconds

### Required UI behavior
- show timer visibly on HUD
- show active boost indicator
- play reward sound
- optionally play voice line

---

## Session-End Reward Option
Offer a rewarded ad after some sessions.

Example prompt:
- “Watch for bonus coins?”
- “Double your session payout?”

Reward:
- 1.5x to 2x session-end bonus
or
- flat bonus coins based on session performance

---

## Upgrade Rescue Option
If player is close to an upgrade:
- offer rewarded ad to gain bonus coins

Example:
- “Need 120 more coins? Watch for a bonus.”

This should feel helpful, not manipulative.

---

# Cooldowns and Anti-Spam Rules

## Rewarded Ads
Do not fully block rewarded ads unless testing requires it.

But add protection:
- small button cooldown after use
- ad request retry if unavailable
- no duplicate reward grant

Suggested button cooldown:
- 10 to 20 seconds before re-pressing if same reward is active

## Interstitial Ads
Use a strict cooldown.

Suggested rules:
- minimum 180 seconds between interstitials
- at least 2 to 3 completed rounds since last interstitial
- never in first session
- do not show if player just watched rewarded ad recently

---

# Failure Handling

Ads will sometimes fail to load or fail to show.

Handle this cleanly.

## Required behavior
If rewarded ad fails:
- do not crash
- show simple feedback:
  - “Ad unavailable, try again soon”
- optionally queue preload retry

If interstitial fails:
- skip it and continue gameplay
- do not block progression

---

# Analytics Hooks

Track ad events even if analytics are lightweight for now.

Suggested events:
- rewarded_requested
- rewarded_shown
- rewarded_completed
- rewarded_failed
- interstitial_requested
- interstitial_shown
- interstitial_failed
- reward_granted
- reward_rejected

Track placement key with each event.

This will help later with:
- revenue tuning
- placement optimization
- retention analysis

---

# UI Guidance

## Rewarded Ad Button
Primary CTA should be clear and attractive.

Examples:
- “2X Coins”
- “2X for 30s”
- “Watch for Boost”

### Visual treatment
- noticeable color
- small pulse or glow
- visible but not overwhelming
- must not block core play area

## Interstitials
No special UI needed beyond natural transition points.

---

# Recommended Placement Strategy (v1)

## Use these first:

### Rewarded
1. Main 2x Coins button
2. Session-end bonus prompt
3. Upgrade rescue prompt

### Interstitial
1. Session end only

Do not add more until data supports it.

---

# Economy Integration

Reward values must match the economy tuning.

## General principles
- rewarded ads should feel clearly worth it
- interstitials should be rare enough that they do not annoy
- reward value should scale with progression where possible

### Suggested examples
- flat bonus early game: 300 to 750 coins
- flat bonus mid game: 1000+ coins
- 2x boost remains universally strong

---

# First Session Protection

Important for retention:

Do NOT show:
- interstitial ads in first session
- aggressive monetization prompts immediately

### Allowed in first session
- visible 2x coins button
- optional prompt only after player understands the loop

The first session should prioritize:
- satisfaction
- clarity
- fun

---

# Ad Trigger Logic Examples

## Rewarded 2x boost
If player taps boost button:
- check canShowRewarded()
- if true, show rewarded
- on completion, activate 2x timer
- update HUD state

## Session-end interstitial
On round end:
- if canShowInterstitial() and sessionLength > 60s and roundsSinceLastInterstitial >= 3
- show interstitial
- otherwise skip

## Upgrade rescue prompt
If player is within threshold of upgrade cost:
- show optional reward prompt

Suggested threshold:
- within 10 to 20 percent of upgrade cost
or
- within a fixed value like 100 to 300 coins early game

---

# Privacy and Compliance Notes

Claude Code should keep implementation compatible with App Store expectations.

### Requirements
- initialize ads properly
- handle denied tracking scenarios gracefully
- do not gate core functionality behind forced ads
- prepare app for App Tracking Transparency support if needed later

Do not overcomplicate ATT implementation in this file unless already part of the app architecture.

---

# Testing Requirements

## Must test:
- rewarded ad success path
- rewarded ad failure path
- duplicate reward prevention
- interstitial cooldown behavior
- ad unavailable fallback
- HUD timer and boost expiration
- background/foreground behavior during active boost

---

# Suggested Implementation Tasks for Claude Code

## Task 1
Create AdManager and provider abstraction.

## Task 2
Wire Google AdMob as v1 provider.

## Task 3
Implement rewarded ad flow for:
- 2x boost
- session-end bonus
- upgrade rescue

## Task 4
Implement light interstitial logic with strict cooldowns.

## Task 5
Add HUD indicator for active rewarded boost.

## Task 6
Add analytics event hooks for all ad actions.

## Task 7
Add failure handling and fallback messages.

## Task 8
Protect first-session experience from aggressive ads.

---

# Acceptance Criteria

This update is successful when:
- rewarded ads are easy to access and feel valuable
- interstitials are rare and non-disruptive
- no ad placement interrupts core satisfaction moments
- rewards are granted exactly once
- ad failures do not harm gameplay
- system is modular enough to tune later

---

# Final Instruction

Implement ads as a support system for fun and progression.

Rewarded ads should feel like a smart choice.
Interstitials should feel infrequent and tolerable.

The player should feel:
- “That helped me”
not
- “This game is forcing ads on me”

Optimize for long-term retention and repeat rewarded-ad usage.
