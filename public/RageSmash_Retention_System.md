# Rage Smash — Retention and Session Design System (Claude Code Implementation Brief)

## Goal

Implement a retention-focused session design system that increases:
- average session length
- repeat sessions per day
- next-day return rate
- long-term progression motivation

This system must make players feel:
- “one more run”
- “I can unlock that soon”
- “I should come back later”

Retention should come from excitement, goals, and rewards — not grind alone.

---

# Core Retention Philosophy

The game should create three loops:

## 1. Immediate Loop
smash → reward → feedback → next smash

## 2. Session Loop
play → earn coins → unlock / progress → chase next target

## 3. Return Loop
daily reward → new challenge → unfinished goal → limited-time bonus

The player should always have:
- something that just happened
- something they are working toward
- something waiting for them later

---

# Retention Systems to Implement

## 1. Session Goals

Add lightweight, short-term goals visible during play.

Examples:
- Smash 10 objects
- Reach x3 multiplier
- Earn 500 coins in one session
- Land 3 perfect hits
- Trigger 1 jackpot

### Rules
- show 1 to 3 goals max
- goals should be easy to understand instantly
- goals should complete within 1 to 5 minutes

### Rewards
- coins
- temporary boost
- cosmetic progress
- room unlock progress

### UI
Display as small cards or compact task chips.
Do not clutter the screen.

---

## 2. Daily Challenges

Add rotating daily objectives.

Examples:
- Smash 25 objects today
- Get 5 perfect hits
- Unlock one upgrade
- Earn 2,500 coins total
- Use the 2x boost once

### Rules
- reset once per day
- 3 daily challenges active at a time
- 1 easy, 1 medium, 1 stretch goal

### Rewards
- larger coin payouts
- special object unlock
- rage room progress
- rare jackpot chance bonus

### Purpose
Give players a reason to return even after they’ve seen the core loop.

---

## 3. Streak System

Implement a daily play streak.

### Rules
- opening and playing once per day counts
- streak increases each day
- streak resets after missing 1 full day unless grace system is used later

### Rewards
Example:
- Day 1 streak = 100 coins
- Day 2 = 250
- Day 3 = 500
- Day 4 = 1,000
- Day 5 = 2,000
- Day 6 = 5,000
- Day 7 = special reward

### Day 7 special reward ideas
- exclusive hammer skin
- bonus room unlock token
- jackpot boost
- temporary premium coin multiplier

### UI
Make streak visible but not huge.
It should feel motivational, not demanding.

---

## 4. Near-Miss Progression

Players should often feel close to getting something.

### Add visible progress bars for:
- next room unlock
- next hammer unlock
- next session goal
- next daily challenge completion

### Rule
Avoid letting players feel like progress disappears into nothing.

### Purpose
Visible partial progress increases return behavior.

---

## 5. Unlock Cadence

Distribute rewards so players get meaningful unlocks at predictable intervals.

### Early game
Unlock something in first 2 to 5 minutes:
- hammer skin
- object type
- room progress
- new voice line pack teaser

### Mid game
Unlock something every few sessions:
- new smashable object
- rage room theme
- stronger jackpot effect
- premium-looking visual effect

### Late game
Use bigger goals:
- prestige-like milestones
- premium room unlocks
- rare cosmetics
- rotating events

---

## 6. “One More Run” Triggers

At the end of a round or after a fail state, show a strong reason to continue.

### Examples
- “12 coins away from next upgrade”
- “1 perfect hit away from challenge completion”
- “Next jackpot chance boosted”
- “Daily task 80% complete”

### Rule
End-of-session prompts should highlight near completion, not generic encouragement.

### Bad example
“Keep going!”

### Good example
“Just 1 smash away from your bonus reward”

---

## 7. Return Incentives

Create reasons to reopen later in the day.

### Add systems like:
- daily challenge reset
- refreshed reward ad bonus
- limited jackpot window
- “happy hour” bonus coins for short windows later
- rotating featured object or room

### Simple starting recommendation
Use:
- daily challenges
- daily streak
- one refreshable bonus object event

---

## 8. Featured Smash Event

Add a rotating event object or themed mini-event.

### Examples
- Office Meltdown Day
- Sports Rage Hour
- Jackpot Trophy Event
- Double Bottle Break Event

### Rules
- simple, low-tech system first
- rotate featured object with boosted rewards
- event lasts one day or one session window

### Purpose
Freshness without building a large live ops system.

---

## 9. Reward Reveal Moments

Important rewards should feel earned and celebratory.

### Add:
- reveal animation
- special audio cue
- voice line
- particles
- progress bar fill

### Use for:
- room unlocks
- streak milestones
- challenge completion
- jackpot rewards

### Reason
Small celebration moments strengthen memory and return behavior.

---

## 10. Friction-Free Re-entry

When player returns, make it easy to resume immediately.

### Requirements
- restore last known state cleanly
- auto-show daily reward if claimable
- highlight active challenge progress
- surface next best action immediately

### Best first screen on return
Show:
- collect daily reward
- challenge progress
- next unlock progress
- big play button

Do not bury the player in menus.

---

# Session Length Design

## Target Session Lengths

### Early user
2 to 5 minutes

### Engaged user
5 to 10 minutes

### High-value user
10+ minutes with multiple loops and boosts

### Goal
Do not force long sessions.
Make short sessions satisfying and leave hooks for replay.

---

# Reward Pacing

## Within first 60 seconds
Player should experience:
- at least one satisfying smash streak
- one progress update
- one opportunity to earn or spend

## Within first 3 minutes
Player should hit:
- at least one goal completion
- one meaningful upgrade or visible near-upgrade moment

## Within first 10 minutes
Player should feel:
- stronger than when they started
- close to a room, skin, or challenge reward
- tempted to watch a reward ad or continue

---

# Retention UX Rules

## Rule 1
Always show the next meaningful target.

## Rule 2
Never let the player wonder “why keep playing?”

## Rule 3
Stack multiple motivations:
- upgrade target
- challenge target
- streak target
- event target

## Rule 4
Keep objectives legible and lightweight.

---

# Suggested Data Structures

## Player Progress
Track:
- total coins
- total smashes
- total perfect hits
- current streak
- challenges completed today
- unlock progress
- last session timestamp

## Challenge Definitions
Store:
- id
- type
- target value
- reward type
- reward value
- expiration
- difficulty

## Session Stats
Track:
- smashes this session
- coins earned this session
- jackpots hit
- perfect hits
- ads watched
- upgrades purchased

---

# Recommended File / Module Structure

Suggested modules:

- src/systems/RetentionManager.ts
- src/systems/ChallengeSystem.ts
- src/systems/StreakSystem.ts
- src/systems/SessionGoalSystem.ts
- src/systems/EventSystem.ts
- src/ui/retention/
  - DailyChallengePanel.tsx
  - SessionGoalsWidget.tsx
  - ProgressPrompt.tsx
  - StreakRewardModal.tsx

Use project conventions if different.

---

# Challenge Types to Support

Start with simple event counters.

## Recommended types
- smash_count
- perfect_hit_count
- coin_earn_total
- multiplier_reach
- jackpot_trigger_count
- ad_boost_use_count
- upgrade_purchase_count

These are easy to implement and easy for players to understand.

---

# Starter Challenge Set

## Session Goals
- Smash 10 objects → 150 coins
- Reach x3 multiplier → 100 coins
- Land 2 perfect hits → 200 coins

## Daily Challenges
- Smash 25 objects → 500 coins
- Earn 2,000 coins → 750 coins
- Trigger 1 jackpot → 1,000 coins

These numbers should be tuned after testing.

---

# Event System (Simple V1)

## Featured Event Example
“Office Meltdown”

### Effect
- office-themed objects appear more often
- office object rewards +25%
- themed voice line chance increased slightly

## Rotation
- one daily featured event
- chosen from a small pool

## Purpose
Give freshness without large engineering overhead.

---

# Return Messaging Guidance

When player comes back, surface context-aware messaging.

### Examples
- “Daily reward ready”
- “You’re 70% to unlocking Office Rage Room”
- “Today’s Sports Smash event is live”
- “1 more perfect hit completes your challenge”

Do not use generic notifications or meaningless text.

---

# End-of-Session Prompts

When player slows down or fails:
- suggest ad boost if coins are low
- show near-complete challenge
- highlight almost-unlocked room
- offer one more run incentive

### Example prompts
- “2 more smashes to finish your session goal”
- “Watch a boost and finish your upgrade now”
- “You’re close to unlocking the Sports Room”

---

# Metrics to Track

Track these retention-related metrics:

- average session length
- sessions per user per day
- day 1 return rate
- day 7 return rate
- challenge completion rate
- streak continuation rate
- reward ad usage rate
- time to first room unlock
- time to first cosmetic unlock

Even if analytics are basic at first, structure the code for easy tracking.

---

# Implementation Tasks for Claude Code

## Task 1
Create a RetentionManager that coordinates streaks, challenges, and return prompts.

## Task 2
Implement Session Goals with 1 to 3 active goals and compact UI.

## Task 3
Implement Daily Challenges with daily reset logic and reward claiming.

## Task 4
Implement Daily Streak tracking and streak reward modal.

## Task 5
Add visible progress bars for next unlocks and challenge progress.

## Task 6
Create end-of-session and fail-state prompts that surface near-complete goals.

## Task 7
Implement a simple Featured Smash Event rotation system.

## Task 8
On app return, surface the next best action immediately.

## Task 9
Persist all retention data locally for now, with architecture ready to move server-side later.

---

# Acceptance Criteria

This update is successful when:

- players always have at least one visible reason to continue
- returning players immediately see daily rewards or progress opportunities
- session goals complete regularly
- daily challenges create a reason to come back
- unlock progress feels tangible and motivating
- end-of-session prompts meaningfully increase replay behavior

---

# Final Instruction

Implement this as a focused retention layer on top of the existing game.

Do not bloat the experience.
Do not create a complicated meta game yet.

Use simple, clear, motivating systems that make the player think:

- “I’m close”
- “one more run”
- “I should check back later”

The game should feel fun in the moment and sticky over time.
