# Smash Loop — Voice / Meme Audio System (ElevenLabs Integration)

## Goal
Add a reactive voice system that injects humor, surprise, and viral moments into gameplay using ElevenLabs-generated voice lines.

This system should:
- enhance player emotion (hype, fail, reward)
- create shareable / meme-worthy moments
- avoid spam and repetition
- remain lightweight and mobile-friendly

---

## Core Concept

Voice lines are NOT constant.

They are:
- rare
- contextual
- impactful

Each line should feel like:
"wait… did the game just say that?"

---

## Voice Categories

### 1. Brainrot / Random (low chance)
Triggered randomly during gameplay.

Examples:
- “BRO WHAT WAS THAT”
- “AIN’T NO WAY”
- “THIS IS INSANE”

Trigger chance:
5–10% on smash

---

### 2. Combo / Skill
Triggered at combo milestones.

Milestones:
2, 3, 5, 10+

Examples:
- “OKAYYYY”
- “YOU’RE COOKING”
- “DON’T STOP”

---

### 3. Perfect Hit / High Power
Triggered when hitPower > 0.9

Examples:
- “BOOM!”
- “THAT’S CRAZY”
- “ABSOLUTE DESTRUCTION”

---

### 4. Fail / Miss
Triggered on overcharge or missed smash.

Examples:
- “NOOOO”
- “YOU SOLD”
- “TRY AGAIN”

Always play (no randomness)

---

### 5. Jackpot / Big Reward
Triggered on large coin rewards or rare objects.

Examples:
- “LET’S GOOOO”
- “BIG MONEY”
- “WE UP”

---

## System Architecture

Create a centralized system:

File:
src/audio/VoiceManager.ts

Responsibilities:
- preload voice assets
- manage cooldowns
- handle probabilities
- route playback
- avoid overlapping spam

---

## Suggested API

- playRandomVoice()
- playComboVoice(level)
- playPerfectVoice()
- playFailVoice()
- playRewardVoice()
- canPlayVoice()

---

## Cooldown Rules (CRITICAL)

Prevent spam.

Global cooldown:
- 2–4 seconds between voice lines

Per-category cooldown:
- brainrot: 5s
- combo: 3s
- perfect: 2s

---

## Trigger Logic Example

On smash:

if (canPlayVoice()) {
  if (isFail) playFailVoice()
  else if (hitPower > 0.9) playPerfectVoice()
  else if (comboLevel >= threshold) playComboVoice(comboLevel)
  else if (random < 0.08) playRandomVoice()
}

---

## Audio Mixing

Voice must sit above SFX but not overpower.

Do:
- slightly lower SFX volume when voice plays (ducking)
- keep voice clips under 1.5 seconds
- normalize volume across all clips

---

## ElevenLabs Generation Guidelines

Voice style:
- energetic
- casual
- slightly exaggerated
- internet / streamer vibe

Avoid:
- robotic tone
- slow narration
- overly dramatic cinematic voices

---

## File Organization

/audio/voice/
  brainrot/
  combo/
  perfect/
  fail/
  reward/

Use consistent naming:
voice_brainrot_01.mp3
voice_combo_01.mp3
etc.

---

## Optional Feature (Highly Recommended)

### Voice Toggle

UI setting:
Voice: ON / OFF

Default:
ON

---

## Future Expansion

Voice Packs:
- Streamer Pack
- Sports Pack
- Funny / Toxic Pack

---

## Acceptance Criteria

System is successful when:

- voice lines feel rare and funny
- no spam or repetition fatigue
- lines match gameplay moments
- audio mix remains clean
- players occasionally laugh or are surprised

---

## Final Instruction

This system should add personality without overwhelming gameplay.

Focus on:
- timing
- restraint
- impact

Make players think:
"that was hilarious… do it again"
