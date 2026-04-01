# Rage Smash — Meme Pack System (Claude Code)

## Goal
Introduce a “Meme Pack” system that adds humor, virality, and personality to Rage Smash using culturally recognizable, funny, or absurd objects.

This system should:
- increase retention
- increase shareability (TikTok, social)
- enhance audio/voice payoff
- introduce rare/funny moments
- plug into existing object, rarity, and audio systems

---

# Core Concept

Meme Pack = objects that make players react emotionally:
- laugh
- recognize
- say “what is this 😂”

These are NOT normal objects.
They are:
- weird
- exaggerated
- internet-inspired
- voice-reactive

---

# Meme Pack Identity

## Feel
- chaotic
- funny
- unexpected
- slightly absurd

## Player Reaction Target
- “no way 😂”
- “what even is that”
- “I need to smash that again”

---

# Meme Object Categories

## 1. Brainrot Objects
Examples:
- skull
- brain
- distorted blob
- weird face

### Behavior
- exaggerated break FX
- weird sound layers

### Voice
- “brainrot activated”
- “what am I looking at”
- “this is cursed”

---

## 2. Number Meme Objects

Examples:
- number 7
- number 6
- floating numbers

### Behavior
- slight glow
- bounce or wobble before smash

### Voice
- “seven???”
- “why is that a number”
- “nahhh 💀”

---

## 3. Emoji Objects

Examples:
- laughing face
- skull emoji
- crying face
- angry face

### Behavior
- squash before break
- expressive deformation

### Voice
- “that’s wild”
- “I’m crying bro”
- “💀”

---

## 4. Chaos Objects

Examples:
- banana
- rubber chicken
- toilet
- traffic cone

### Behavior
- exaggerated physics
- goofy reactions

### Voice
- “bro what”
- “that’s ridiculous”
- “why is that here”

---

## 5. Gamer Objects

Examples:
- controller
- RGB keyboard
- headset

### Behavior
- sharper break
- tech + meme crossover

### Voice
- “you broke the setup”
- “no way you smashed that”

---

# Rarity System

Meme objects should feel special.

## Recommended:
- Common: 0%
- Uncommon: 60%
- Rare: 30%
- Event: 10%

They should NOT appear constantly.

---

# Reward System

Meme objects should give slightly boosted rewards.

## Suggested:
- Uncommon: 1.5x
- Rare: 2.5x–4x
- Event: 5x+

---

# Voice System (ElevenLabs)

## Rules
- DO NOT spam
- use cooldown
- trigger mostly on:
  - rare objects
  - funny outcomes
  - high reward events

## Categories

### Light reactions
- “nice”
- “okayyy”
- “clean”

### Meme reactions
- “ain’t no way”
- “bro what is that”
- “this is cursed”

### Rare reactions
- “jackpot”
- “you got lucky”
- “that’s huge”

---

# FX System

Meme objects should feel different visually.

## Add:
- glitch flashes
- color pops
- screen distortions
- exaggerated particles

---

# Spawn Logic

Meme pack should:
- unlock after initial gameplay
- appear randomly
- optionally boosted via ads or events

---

# Monetization

## Options

1. Unlock with coins  
2. Watch ad to unlock  
3. Premium pack purchase  
4. Limited-time event pack  

---

# Data Structure

Claude Code should add:

memeObjectRegistry:
- id
- category
- rarity
- modelPath
- breakType
- audioProfile
- voiceProfile
- rewardMultiplier
- fxProfile

---

# Integration Rules

- Must plug into existing object system
- Must reuse audio layering system
- Must respect performance limits
- Must follow selection checklist

---

# Testing Goals

- players react to meme objects
- voice lines feel funny, not annoying
- meme objects feel distinct from normal ones
- no performance issues

---

# Acceptance Criteria

System is successful when:
- meme objects create emotional reactions
- players remember and look forward to them
- retention increases
- game feels more alive and shareable

---

# Final Instruction

Meme Pack should feel like:
👉 chaos + humor + surprise

NOT:
- random clutter
- spammy noise
- overused jokes

Used correctly, this becomes one of the strongest retention and viral features in Rage Smash.
