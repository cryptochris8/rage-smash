# Rage Smash — Monetization Strategy (Claude Code Implementation Brief)

## Goal

Implement a simple, high-converting monetization system that maximizes:
- early revenue (ads)
- mid-term revenue (IAP)
- long-term retention (progression + unlocks)

This system must feel fair, rewarding, and addictive — NOT greedy.

---

# Core Monetization Pillars

## 1. Rewarded Ads (PRIMARY REVENUE DRIVER)

### Feature: 2X Coins Boost

UI Button:
“💰 2X Coins for 30 Seconds”

### Rules:
- Always available
- No cooldown initially (test later)
- Must feel powerful

### Implementation:
- Multiply all coin rewards by 2
- Add visual indicator (glow, UI badge)
- Add activation sound + voice line

### Trigger Points:
- Main screen button
- After big smash
- After player runs out of coins

---

## 2. Interstitial Ads (LIGHT USAGE)

### Rules:
- ONLY show after:
  - 3–5 rounds
  - OR major event (fail, session end)

### DO NOT:
- interrupt gameplay
- spam ads

### Goal:
- 1 ad every 2–4 minutes max

---

## 3. Starter Pack (HIGH CONVERSION)

### Offer:
$1.99

Includes:
- 2x coins for 24 hours
- exclusive hammer skin
- 5,000 coins

### Rules:
- show after 2–3 sessions
- show after first “fun moment”

---

## 4. Cosmetic Skins (MID-TERM REVENUE)

### Categories:
- hammer skins
- smash effects
- rage room themes

### Examples:
- gold hammer
- neon hammer
- fire smash effect

### Pricing:
$0.99 – $2.99

---

## 5. Unlockable Rage Rooms (SOFT CURRENCY)

### Examples:
- Office Rage Room
- Sports Rage Room
- Luxury Room
- Neon Room

### Unlock Method:
- coins OR purchase unlock

### Purpose:
- progression
- retention
- monetization bridge

---

## 6. Economy Tuning

### Goals:
- player runs low on coins occasionally
- upgrades feel meaningful
- rewards feel exciting

### Rules:
- early game = fast rewards
- mid game = slight grind
- late game = prestige feel

---

## 7. Jackpot Moments (RETENTION BOOST)

### Add:
- rare high coin bursts
- special objects worth more

### Effects:
- special sound
- voice line
- visual explosion

---

## 8. Voice Monetization (FUTURE)

### Add later:
Voice Packs

Examples:
- Streamer Pack
- Sports Pack
- Meme Pack

---

## 9. UI Placement

### Must Have Buttons:
- “2X Coins” (top priority placement)
- Shop
- Daily Reward

### Visual Rules:
- bright
- animated
- always visible but not annoying

---

## 10. Daily Rewards

### Structure:
Day 1: 100 coins  
Day 2: 500 coins  
Day 3: 2,000 coins  
Day 7: 10,000 coins  

### Add:
- streak bonus
- special sound + voice

---

# Implementation Tasks for Claude Code

## Task 1
Add rewarded ad system with 2x coin multiplier

## Task 2
Add interstitial ad logic with timing rules

## Task 3
Create starter pack UI + purchase flow

## Task 4
Implement cosmetic skins system

## Task 5
Add unlockable rage rooms tied to currency

## Task 6
Tune economy values (cost vs reward)

## Task 7
Add jackpot event system

## Task 8
Hook audio + voice system into rewards

## Task 9
Add daily reward system

---

# Acceptance Criteria

- players frequently use rewarded ads
- no ad spam complaints
- upgrades feel rewarding
- at least 1 monetization option visible at all times
- gameplay remains fun without paying

---

# Final Instruction

Monetization must feel like:
- acceleration, not requirement
- reward, not punishment

Focus on:
- clarity
- fairness
- excitement

Goal:
turn engagement into revenue WITHOUT hurting retention.
