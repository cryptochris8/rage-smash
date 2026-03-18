# Rage Smash — Economy Tuning Sheet (Claude Code Implementation)

## Goal

Create a balanced, addictive in-game economy that:
- keeps players engaged
- creates natural scarcity (need more coins)
- encourages rewarded ads
- supports monetization without frustration

---

# Core Economy Loop

Player flow:

smash → earn coins → upgrade → feel stronger → costs increase → coins feel scarce → watch ad or keep playing → repeat

---

# Currency

## Primary Currency
Coins

---

# Starting Values

## Starting Coins
500

## Base Smash Reward
10–25 coins per smash (randomized slightly)

---

# Reward Scaling

## Multiplier System

Multiplier increases rewards:

x1 → base  
x2 → 2x coins  
x5 → 5x coins  

---

## Combo Bonus

Add bonus coins based on combo:

combo 2 → +10%  
combo 3 → +20%  
combo 5 → +40%  
combo 10+ → +75%

---

# Upgrade System

## Upgrade Categories

- Power (more coins per smash)
- Speed (faster smashing / recharge)
- Multiplier Boost (faster combo build)

---

## Upgrade Cost Curve

Use exponential scaling:

level 1 → 100 coins  
level 2 → 250 coins  
level 3 → 600 coins  
level 4 → 1,500 coins  
level 5 → 4,000 coins  
level 6 → 10,000 coins  

General formula:

cost = baseCost * (2.2 ^ level)

---

## Upgrade Impact

Each upgrade should feel noticeable:

Power:
+10–15% coin gain per level

Speed:
-5–10% cooldown per level

Multiplier:
+5–10% faster combo gain

---

# Soft Currency Pressure (IMPORTANT)

Players should occasionally feel:

“I need more coins”

This drives:
- longer sessions
- ad usage

---

## Target Timing

- first upgrade: within 30–60 seconds
- second upgrade: within 2–3 minutes
- mid upgrades: require 5–10 minutes or ads

---

# Rewarded Ad Value

## 2X Coins Boost

Duration:
30 seconds

Expected Value:
Should equal ~2–3 minutes of normal gameplay

---

## Balance Rule

Watching 1 ad should feel like:
“that was worth it”

---

# Jackpot System

## Trigger Chance

5–10% chance on smash

---

## Reward

5x–10x normal coin reward

---

## Effects

- special sound
- voice line
- particle explosion

---

# Daily Rewards

Day 1 → 100 coins  
Day 2 → 500 coins  
Day 3 → 2,000 coins  
Day 4 → 5,000 coins  
Day 7 → 10,000 coins  

---

## Streak Bonus

Maintain streak:
+20% bonus rewards

---

# Rage Room Unlock Costs

Office Room → 5,000 coins  
Sports Room → 10,000 coins  
Luxury Room → 25,000 coins  
Neon Room → 50,000 coins  

---

# Cosmetic Pricing (IAP)

$0.99 → simple skins  
$1.99 → premium skins  
$2.99 → bundles  

---

# Economy Red Flags (Avoid)

- upgrades too cheap (no challenge)
- upgrades too expensive (player quits)
- rewards feel meaningless
- ads feel required (bad UX)

---

# Metrics to Monitor

- time to first upgrade
- session length
- ad usage rate
- coin balance trends
- drop-off points

---

# Implementation Tasks for Claude Code

## Task 1
Set base coin rewards and scaling

## Task 2
Implement exponential upgrade cost curve

## Task 3
Add combo bonus multipliers

## Task 4
Implement jackpot reward system

## Task 5
Add rewarded ad multiplier logic

## Task 6
Tune early-game progression speed

## Task 7
Add rage room unlock costs

## Task 8
Hook economy into UI (clear feedback)

---

# Acceptance Criteria

- early game feels fast and rewarding
- mid game introduces mild grind
- players choose to watch ads willingly
- upgrades feel impactful
- economy supports long-term play

---

# Final Instruction

Balance for:
- fun first
- monetization second

A good economy makes players WANT more — not feel forced.
