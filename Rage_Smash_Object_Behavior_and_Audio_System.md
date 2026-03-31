# Rage Smash — Object Behavior, Rarity, and Audio System (Claude Code)

## Goal
Define how each Rage Smash object should behave in gameplay so the game feels more varied, more rewarding, and more monetizable.

This file covers:
- object categories
- break behavior
- sound identity
- reward value
- rarity
- progression hooks
- ElevenLabs voice opportunities
- integration rules for Claude Code

This system should turn Rage Smash from a generic smash loop into a richer satisfaction/collection/progression game.

---

# Core Design Principle

Not every object should feel the same.

Each object should differ in:
- how it looks
- how it sounds
- how it breaks
- how rewarding it is
- how rare it feels
- what kind of voice reaction it can trigger

The goal is:
- stronger variety
- stronger replayability
- stronger reward anticipation
- stronger monetization hooks

---

# Object Categories

## 1. Glass
Examples:
- bottle
- vase
- cup

### Feel
- crisp
- brittle
- instantly breakable

### Break Style
- fast shatter
- many small fragments
- quick outward burst

### Audio
- sharp glass crack
- glass shatter tail
- light debris

### Reward Identity
- satisfying common object
- low to mid reward

### Voice Opportunities
- “clean break”
- “that shattered”
- “perfect smash”

---

## 2. Ceramic / Porcelain
Examples:
- mug
- plate
- vase

### Feel
- brittle but heavier than glass

### Break Style
- chunkier shatter
- fewer larger fragments
- crack then break

### Audio
- ceramic crack
- plate break
- short debris drop

### Reward Identity
- low to mid reward
- slightly more weight than glass

### Voice Opportunities
- “that one broke nice”
- “smooth”
- “clean hit”

---

## 3. Electronics
Examples:
- old TV
- monitor
- keyboard
- laptop

### Feel
- emotionally satisfying
- visually destructive
- ad-friendly

### Break Style
- casing break
- screen crack
- sparks or special FX accent
- chunk fragments instead of tiny shards

### Audio
- plastic crack
- screen snap
- optional electric pop
- debris hit

### Reward Identity
- mid to high reward
- stronger reward than common house objects

### Voice Opportunities
- “ain’t no way”
- “that one was expensive”
- “absolutely cooked”
- “you destroyed that”

---

## 4. Luxury / Rare
Examples:
- gold trophy
- diamond
- cash safe
- rare decorative object

### Feel
- premium
- jackpot-like
- exciting

### Break Style
- dramatic burst
- gold spark accents
- high-value reveal or coin pop

### Audio
- premium hit
- bright reward chime
- optional sparkle layer
- richer impact stack

### Reward Identity
- high or very high reward
- should feel rare and exciting

### Voice Opportunities
- “big money”
- “jackpot”
- “that’s rare”
- “we’re rich”
- “let’s go”

---

## 5. Food
Examples:
- watermelon
- cake
- pizza
- fruit

### Feel
- messy
- visually funny
- highly satisfying

### Break Style
- juicy split
- chunks / splats
- softer debris behavior

### Audio
- wet slice-pop
- squish
- soft impact debris

### Reward Identity
- mid reward
- novelty and content variety

### Voice Opportunities
- “that was nasty”
- “juicy”
- “look at that”
- “that was satisfying”

---

## 6. Soft / Weird
Examples:
- pillow
- foam block
- rubber toy
- stuffed toy

### Feel
- contrast category
- low-fragment, high-deform or soft-break fantasy

### Break Style
- squish / compress / burst
- fewer hard fragments
- maybe particles like fluff or foam bits

### Audio
- soft thud
- squish
- tear / puff / soft burst

### Reward Identity
- low to mid reward
- keeps content from feeling repetitive

### Voice Opportunities
- “what even was that”
- “bro that was weird”
- “that felt different”

---

# Rarity System

Each object should have a rarity tag.

## Recommended rarity tiers

### Common
- appears often
- low reward
- foundation of gameplay

Examples:
- glass bottle
- mug
- plate
- chair
- simple fruit

### Uncommon
- appears regularly but not constantly
- better reward
- more interesting visuals / sounds

Examples:
- old TV
- laptop
- cake
- foam block
- watermelon

### Rare
- appears occasionally
- strong reward spike
- stronger audiovisual treatment

Examples:
- gold trophy
- diamond
- safe
- premium collectible object

### Event / Special
- appears only during temporary conditions, milestones, or themed packs
- major reward spike
- special voice and FX treatment

Examples:
- limited sports trophy
- event crate
- golden object
- holiday item

---

# Reward Value Strategy

The values should be tuned to the live economy, but the relative structure should feel like this:

## Common
- baseline value
- 1.0x reward band

## Uncommon
- 1.5x to 2.5x common reward band

## Rare
- 3x to 8x common reward band

## Event / Special
- 5x to 15x common reward band depending on frequency

Important:
The player should instantly feel when a better object appears.

---

# Spawn Logic

## Baseline
Most spawns should be common.

## Recommended starting distribution
- Common: 65% to 75%
- Uncommon: 20% to 25%
- Rare: 4% to 8%
- Event/Special: 1% to 3%

These values can be adjusted later based on retention and economy tuning.

## Dynamic possibilities later
- raise rare chance during boosts
- event packs rotate certain categories
- daily challenge can feature one object family

---

# Break Behavior Rules

Not every object should just explode the same way.

## Required break properties per object
- breakType
- fragmentCount
- fragmentScale
- debrisSpread
- impactWeight
- specialFxType
- audioProfile

## Example break types
- shatter
- crackBurst
- juicySplit
- chunkBreak
- softBurst
- premiumBurst

Claude Code should map each object to one of these behavior families.

---

# Object Data Structure

Claude Code should implement a data-driven registry for objects.

Suggested fields:
- id
- displayName
- category
- rarity
- modelPath
- iconPath optional
- breakType
- fragmentProfile
- audioProfile
- coinValue
- weightClass
- spawnWeight
- unlockPack
- voiceProfile
- isEventOnly
- visualFxProfile

This allows easy tuning without rewriting logic.

---

# Audio Profile System

Each object should map to an audio profile, not just one file.

## Audio profile categories
- glass
- ceramic
- tech
- luxury
- food
- soft

Each profile should include layered sound logic such as:
- impact layer
- break layer
- reward layer
- optional accent layer

## Example

### glass audio profile
- impactThudLight
- breakGlassSharp
- tinyDebrisTinkle

### tech audio profile
- impactThudMedium
- screenCrack
- casingSnap
- optionalElectricPop

### luxury audio profile
- impactThudRich
- premiumBreak
- rewardSparkle
- jackpotChime

Claude Code should continue using layered playback with slight randomization.

---

# ElevenLabs Voice Integration

The ElevenLabs API should be used to enhance rare moments, strong hits, and funny/reactive gameplay moments.

This should remain:
- contextual
- rare enough to stay funny
- not spammy

## Voice Categories

### 1. Common Hit Reactions (low chance)
Use sparingly.

Examples:
- “clean hit”
- “nice”
- “smooth”
- “there it is”

### 2. Strong Smash Reactions
Triggered on very satisfying or high-power hits.

Examples:
- “that was perfect”
- “bro shattered it”
- “look at that”

### 3. Rare Object Reactions
Triggered on rare/luxury spawns or rare breaks.

Examples:
- “big money”
- “jackpot”
- “that one’s rare”
- “don’t miss this”
- “we’re rich”

### 4. Funny / Brainrot Style Reactions
Use carefully and not too often.

Examples:
- “ain’t no way”
- “bro what was that”
- “you absolutely cooked that”
- “that was insane”

### 5. Pack-Specific Reactions
If themed packs exist, voices can reference the object type.

Examples:
- tech pack: “that monitor is gone”
- luxury pack: “there goes the trophy”
- food pack: “that was juicy”

---

# Voice Trigger Rules

## Core Rule
Voice should enhance standout moments, not every smash.

## Recommended trigger logic
- common objects: low chance
- uncommon objects: moderate chance
- rare objects: high chance
- event objects: very high chance
- jackpot / high-reward moments: high chance

## Cooldown Rules
Claude Code should preserve all voice anti-spam protections:
- global cooldown
- per-category cooldown
- avoid repeated same line
- preserve funny/rare feel

---

# Object Pack System

The first 20 assets should be grouped into packs.

## Pack 1 — Core Smash Pack
- bottle
- mug
- plate
- chair

### Role
Default free foundation

### Reward Level
Common to low uncommon

---

## Pack 2 — Tech Smash Pack
- old TV
- laptop
- keyboard
- monitor

### Role
High-engagement unlock pack

### Reward Level
Uncommon

### Good Monetization Uses
- coin unlock
- ad unlock
- starter IAP bundle

---

## Pack 3 — Luxury Pack
- gold trophy
- diamond
- cash pile
- safe

### Role
Rare reward pack

### Reward Level
Rare

### Good Monetization Uses
- high-value unlock
- jackpot feature
- featured weekly pack

---

## Pack 4 — Food Pack
- watermelon
- cake
- pizza
- fruit

### Role
Variety / satisfying content pack

### Reward Level
Common to uncommon

### Good Monetization Uses
- ad unlock
- timed event
- fun seasonal content

---

## Pack 5 — Soft / Weird Pack
- pillow
- foam block
- rubber toy
- stuffed toy

### Role
Novelty contrast pack

### Reward Level
Common to uncommon

### Good Monetization Uses
- early progression reward
- variety retention hook

---

# Unlock Strategy

## Recommended unlock logic
- Core Pack = default
- Food Pack = early unlock
- Tech Pack = mid unlock
- Soft Pack = optional early-mid unlock
- Luxury Pack = late unlock / rare milestone / special offer

This creates a stronger progression arc.

---

# Visual FX Profiles

Each object category should have a matching visual FX identity.

## Glass
- sharp shards
- small reflective particles
- quick outward burst

## Ceramic
- chunk fragments
- dust motes
- crack splinters

## Tech
- chunk breaks
- screen-like particles
- optional tiny sparks

## Luxury
- gold sparkles
- bright coin burst
- premium glow

## Food
- juicy chunks
- droplets
- splat accents

## Soft
- foam bits
- fluff particles
- soft puff

---

# Weight and Impact Class

Objects should not all feel equally heavy.

## Suggested classes
- light
- medium
- heavy
- premium heavy

This can influence:
- impact sound intensity
- camera reaction
- particle spread
- reward weight

## Example
- glass bottle = light
- mug = medium
- old TV = heavy
- safe = premium heavy

---

# Recommended Initial Priority

Claude Code should implement this in stages.

## Phase 1 — Immediate Upgrade
Integrate first:
- glass bottle
- ceramic mug
- old TV
- gold trophy
- watermelon

For each of these, define:
- category
- rarity
- break type
- audio profile
- reward value
- optional voice profile

## Phase 2 — Pack Expansion
Integrate remaining core + tech objects

## Phase 3 — Full Pack Identity
Integrate luxury + food + soft with distinct FX and voice logic

---

# Object Registry Example Directions

Claude Code should build something like:

- src/data/objectRegistry.ts
- src/audio/objectAudioProfiles.ts
- src/data/objectPacks.ts
- src/audio/voiceProfiles.ts

Suggested registries:
- objectRegistry
- rarityTable
- breakTypeProfiles
- audioProfiles
- voiceProfiles
- packUnlockRules

Keep this all data-driven.

---

# Testing Goals

Claude Code should verify:
- different objects feel noticeably different
- rare objects feel exciting
- reward pacing matches rarity
- voice triggers feel funny and rewarding, not spammy
- object packs create progression goals
- audio, visuals, and rewards are aligned

---

# Acceptance Criteria

This system is successful when:
- the player can feel the difference between object categories
- rare/luxury objects create excitement
- object packs make progression clearer
- the ElevenLabs voice system enhances standout moments
- audio/visual behavior is more varied and satisfying than before
- Rage Smash feels more like a real content-rich product

---

# Final Instruction

Turn objects into content pillars, not interchangeable props.

Every object category should feel like it has its own:
- personality
- sound
- break behavior
- reward identity
- progression role

Use ElevenLabs voice lines strategically to amplify standout moments, especially for rare objects, jackpots, and funny destruction beats.

The player should begin to anticipate:
- what kind of object is next
- how good it will feel to smash
- whether it might be rare
- what reward they might get

That anticipation is part of the retention loop.
