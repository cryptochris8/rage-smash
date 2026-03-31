# 3D Asset Pipeline — Studio-Wide Model Strategy (Claude Code)

## Goal
Define a reusable 3D asset pipeline for the app studio so Claude Code can help integrate better-looking 3D models without sacrificing:
- mobile performance
- fast ship speed
- simplicity
- App Store readiness
- shared architecture reuse

This pipeline applies across the fast-ship game portfolio.

---

# Core Principle

Better 3D models are allowed and encouraged, but they must serve the product goals.

The goal is NOT:
- AAA realism
- ultra-high-poly assets
- heavy cinematic rendering

The goal IS:
- clean
- readable
- stylized
- optimized
- high perceived quality on mobile

The correct target is:

## Stylized high-quality low-poly / mid-poly
This gives the best balance of:
- speed
- visual quality
- Three.js performance
- mobile safety
- easy iteration

---

# Studio Asset Strategy

## What the user may provide manually
The user may source or generate 3D models from:
- Blender
- Meshy
- Sloyd
- Sketchfab
- other approved 3D sources

Claude Code should be ready to integrate manually supplied assets.

## What Claude Code should handle
Claude Code should:
- organize assets
- validate formats
- help standardize naming
- wire assets into scenes
- optimize loading and reuse
- flag assets that are too heavy
- create reusable loaders and registries
- support fallback primitives when needed

Claude Code should NOT assume every imported 3D asset is production-safe.
It should evaluate and optimize integration around mobile constraints.

---

# Preferred File Formats

## Primary format
- GLB / GLTF

This is the preferred format for Three.js because it:
- loads well
- supports materials and textures cleanly
- works well with mobile web/capacitor pipelines

## Acceptable secondary formats
- PNG / JPG textures
- basis / compressed textures if pipeline later supports them

## Avoid for runtime unless necessary
- FBX
- OBJ + MTL combos
- highly fragmented export formats
- oversized texture bundles

If the user supplies non-GLB assets, Claude Code should prefer converting workflow recommendations rather than integrating messy raw formats directly.

---

# Model Quality Target

## Correct quality target
Use:
- clean, stylized, readable models
- simple silhouettes
- visually strong materials
- modest geometry

Avoid:
- highly realistic asset packs that demand heavy lighting
- millions of triangles
- large uncompressed textures
- unnecessarily complex rigs for simple objects

---

# Poly Count Guidelines

These are practical studio targets for the current stack.

## Small repeatable gameplay objects
Examples:
- blocks
- fruit
- soap
- tools
- stack objects
- simple props

Target:
- 200 to 2,000 triangles ideal
- up to ~3,000 if visually justified

## Hero interactive objects
Examples:
- premium smash objects
- centerpiece slice materials
- key reveal objects
- signature props in marketing shots

Target:
- 2,000 to 8,000 triangles
- only go above this when very rare and clearly worth it

## Scene-support props
Examples:
- small furniture pieces
- simple foreground props
- support objects for app identity

Target:
- 500 to 4,000 triangles depending on importance

## Avoid by default
- large gameplay objects exceeding ~10,000 triangles
- environments made of many unique heavy meshes
- many simultaneous mid/high poly objects on screen

Claude Code should flag assets that are likely too expensive.

---

# Texture Guidelines

## Standard texture sizes
- 512x512 for normal props
- 1024x1024 for hero assets only

## Avoid by default
- 2048+ textures for normal gameplay objects
- multiple large textures on repeated assets
- oversized normal maps unless they materially improve the result

## Strategy
Prefer:
- small clean textures
- baked detail
- readable materials
- consistent texture reuse

This matters more for mobile than extreme texture sharpness.

---

# Material Strategy

## Preferred materials
- simple PBR materials
- baked textures
- lightweight roughness/metalness usage
- simple emissive accents when needed

## Avoid by default
- heavy transparency stacks
- expensive real-time reflections
- complex layered shader graphs
- many unique material instances on repeated objects

Claude Code should prioritize runtime simplicity.

---

# Asset Categories by App

Claude Code should think about 3D assets differently depending on the app.

## Rage Smash
Better models matter a lot for:
- smashable hero objects
- special reward objects
- rare objects
- visually satisfying break targets

The focus is on:
- readable silhouette
- breakability illusion
- high visual punch

## Slice Game
Better models matter most here.

Focus on:
- materials with strong slicing appeal
- clear exterior/interior contrast
- clean forms that slice well visually

Examples:
- soap
- jelly
- fruit
- sand blocks
- foam

## Stack Balance Game
Model quality matters less than readability.

Focus on:
- clean shapes
- distinct silhouettes
- easy stack readability
- themed object packs

## Cleaning Game
Model quality matters a lot for:
- dirty/clean transformation
- surface readability
- reveal contrast

The key is:
- before/after clarity
- not geometry complexity alone

## Sorting Game
Readability matters more than realism.

Focus on:
- recognizable shapes
- clean icons / objects
- fast comprehension

## ASMR Sleep App
Models should be simple, atmospheric, and support calm scenes.

Focus on:
- a few high-quality foreground elements
- touchable props
- minimal scene complexity

---

# Manual vs Claude Responsibilities

# Part 1 — User Responsibilities

The user may manually provide:
- GLB models
- optimized Blender exports
- purchased/licensed assets
- AI-generated 3D assets after review
- hero props for marketing / app feel

The user should manually choose or approve:
- signature hero models
- premium object sets
- scene-defining props

These are the assets where taste matters most.

---

# Part 2 — Claude Code Responsibilities

Claude Code should:
- create asset folder structure
- build model registry systems
- validate runtime format
- map assets to app systems
- reuse loaders across apps
- lazy load when appropriate
- instantiate repeated objects efficiently
- dispose assets properly when scenes change
- provide primitive fallbacks if assets are missing
- flag suspiciously heavy or unsuitable assets

Claude Code should also create the integration architecture so swapping models later is easy.

---

# Preferred Folder Structure

Recommended reusable structure:

- /shared/assets/models/
- /shared/assets/textures/
- /apps/rage-smash/assets/models/
- /apps/slice-game/assets/models/
- /apps/stack-balance-game/assets/models/
- /apps/cleaning-game/assets/models/
- /apps/sorting-game/assets/models/
- /apps/sleep-satisfy/assets/models/

Within each app, use categories such as:
- /props/
- /hero/
- /tools/
- /materials/
- /fx/

Claude Code should keep app-specific assets separate while allowing shared reusable loaders.

---

# Naming Convention

Claude Code should enforce clear names.

Examples:
- smash_glass_bottle_01.glb
- smash_trophy_gold_01.glb
- slice_soap_block_01.glb
- slice_jelly_cube_01.glb
- stack_block_wood_01.glb
- clean_mirror_dirty_01.glb
- sort_shape_cube_red_01.glb
- sleep_window_frame_01.glb

If variants exist:
- slice_soap_block_01_low.glb
- slice_soap_block_01_hero.glb
- stack_block_wood_01_altA.glb

---

# Asset Intake Rules

When a new model is added, Claude Code should evaluate:

## 1. Format
Is it GLB/GLTF and runtime-friendly?

## 2. Complexity
Is the triangle count reasonable?

## 3. Texture load
Are texture sizes reasonable for mobile?

## 4. Material count
Does it use too many materials?

## 5. Gameplay relevance
Is the detail level justified by on-screen importance?

## 6. Reusability
Can the model be reused or instanced?

If the answer is poor in several of these areas, Claude should flag it as a risk.

---

# Integration Rules

## Rule 1
Use high-quality models sparingly where they matter most.

## Rule 2
Do not make every object a hero asset.

## Rule 3
Fallback primitives are acceptable for prototypes or low-priority props.

## Rule 4
The game feel still matters more than polygon count.

## Rule 5
A few excellent assets are better than many mediocre heavy assets.

---

# Loader Architecture

Claude Code should create a reusable loader system for models.

Suggested modules:
- ModelManager
- assetRegistry
- modelPreloadMap
- sceneAssetConfig
- modelCache

Suggested responsibilities:
- load GLB assets
- cache them
- clone or instance them
- expose simple spawn/get APIs
- unload or dereference when scenes change

This should become part of the studio template.

---

# Reuse and Instancing

For repeated objects, Claude Code should prefer:
- geometry reuse
- material reuse
- instancing where practical
- cloning cached scenes carefully

This is especially important for:
- stack objects
- sorting objects
- repeated smash targets
- repeated slice materials
- repeated props in cleaning scenes

---

# Asset Fallback Policy

If a better model is not yet available, Claude Code should:
- use clean primitives or simplified placeholders
- structure code so replacement later is easy
- avoid hardcoding game logic tightly to a specific mesh

This protects shipping speed.

The app should still work even if some premium models are added later.

---

# Lighting Compatibility Rules

Imported assets should fit the studio’s preferred visual approach.

## Preferred approach
- simple lighting
- baked feeling where possible
- strong readability
- low-cost highlights

## Avoid
- assets that only look good with expensive HDR/SSR/post stacks
- materials that break under simple mobile lighting

Claude Code should favor assets that still look good in a modest render setup.

---

# Physics Compatibility Rules

For gameplay objects, Claude Code should consider:
- collider simplicity
- shape readability
- center of mass behavior
- break / cut / stack friendliness

Examples:
- Rage Smash objects should support satisfying break illusions
- Slice objects should cut or fake-cut cleanly
- Stack objects should balance predictably
- Cleaning objects should reveal surfaces clearly
- Sorting objects should fit slots cleanly

Good gameplay geometry matters more than visual micro-detail.

---

# Recommended Source Workflow

## Best practical workflow
1. User finds or generates model
2. User or Blender pass exports/cleans to GLB
3. Model is placed into correct app folder
4. Claude Code registers it
5. Claude Code integrates it into scene/object systems
6. Claude Code flags any performance or readability issues
7. Asset is tuned or replaced as needed

This is the safest and fastest loop.

---

# AI 3D Asset Guidance

AI-generated 3D models are acceptable as long as they are reviewed and optimized.

Good uses:
- quick concept prototypes
- low-risk props
- ideation
- placeholder hero objects
- stylized assets that clean up well

Be careful with:
- messy topology
- broken normals
- unusable UVs
- excessive geometry
- inconsistent materials

Claude Code should assume AI-generated models may need cleanup and should integrate them cautiously.

---

# App-Specific Priority Recommendations

## Rage Smash — prioritize first
Upgrade:
- 2 to 5 key smashable objects
- glass object
- ceramic object
- premium rare object
- metallic special object

## Slice Game — high priority
Upgrade:
- soap block
- jelly cube
- fruit
- sand block
- foam block

## Cleaning Game — high priority
Upgrade:
- mirror/window foreground props
- dirt reveal surfaces
- signature cleanable objects

## Stack Balance Game — lower priority
Keep readable shapes first.
Upgrade only after feel is locked.

## Sorting Game — lowest 3D priority
Favor readability over fancy assets.

## ASMR Sleep App — selective priority
Use a few strong foreground props, not a heavy scene.

---

# Performance Rules for Claude Code

Claude Code must optimize around the actual stack:
- Three.js
- Vite
- Capacitor
- mobile devices

## Required rules
- lazy load large assets when possible
- cache loaded GLBs
- dispose materials/textures/geometry when scenes unload
- keep draw calls low
- limit simultaneous unique hero assets
- keep texture memory under control
- test fallback paths

## Important
Do not let model quality destroy the fast-ship advantage.

---

# Decision Framework

When deciding whether to use a better model, Claude Code should ask:

## 1.
Will the player notice this asset often?

## 2.
Does better visual quality meaningfully improve feel, retention, or conversion?

## 3.
Is the model performant enough for mobile?

## 4.
Would a simpler asset do the same gameplay job?

If the answer is:
- noticeable + meaningful + performant = use better model
- not noticeable or too expensive = use simpler model

---

# Suggested Metadata Fields

Claude Code should support metadata for models such as:
- id
- app
- category
- sourceType
- isHeroAsset
- isPlaceholder
- triangleBudgetClass
- textureBudgetClass
- colliderType
- gameplayUse
- reuseAllowed
- needsReview

This will make the asset pipeline scalable.

---

# Implementation Tasks for Claude Code

## Task 1
Create a studio-wide model ingestion and registration system.

## Task 2
Create reusable GLB loader/cache utilities.

## Task 3
Establish app-specific asset folders and naming rules.

## Task 4
Integrate fallback primitives so gameplay is never blocked by missing models.

## Task 5
Support asset metadata and validation checks.

## Task 6
Wire models cleanly into gameplay systems per app.

## Task 7
Optimize loading, reuse, and cleanup for mobile.

## Task 8
Flag models that are too heavy or visually mismatched for the current app.

---

# Acceptance Criteria

This asset pipeline is successful when:
- better 3D models can be added without breaking the studio workflow
- models remain mobile-friendly
- hero assets improve perceived quality where it matters most
- fallback systems keep development fast
- Claude Code can swap and integrate assets easily across apps
- the portfolio looks better without losing speed or simplicity

---

# Final Instruction

Use better 3D models selectively and intelligently.

The studio’s advantage is:
- speed
- feel
- iteration
- visual punch where it matters

Do not chase realism for its own sake.
Do not let heavy assets slow down shipping.

The correct strategy is:
- a few strong hero assets
- clean optimized GLBs
- reusable loaders
- simple fallback paths
- mobile-first discipline
