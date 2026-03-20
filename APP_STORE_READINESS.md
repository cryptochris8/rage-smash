# Rage Smash — App Store Readiness

## Status: ~90% Ready

### Resolved
- [x] Bundle ID synced to `com.ragesmash.app` across iOS + Android + CI/CD
- [x] App name synced to "Rage Smash" across iOS + Android
- [x] Privacy manifest (`PrivacyInfo.xcprivacy`) created
- [x] Android MainActivity moved to `com.ragesmash.app` package
- [x] Splash screen configured (3 scales)
- [x] Version set to 1.0 / build 1
- [x] App icon source (1024x1024) in Xcode asset catalog (single-size format)
- [x] Ad system: production/test toggle via `AD_PRODUCTION` flag in `src/ads/config.ts`
- [x] AdMob testing mode tied to `AD_PRODUCTION` flag (auto-disables for release)
- [x] ATT (App Tracking Transparency) consent flow in AdMobProvider
- [x] `NSUserTrackingUsageDescription` added to Info.plist
- [x] `GADApplicationIdentifier` placeholder added to Info.plist
- [x] `SKAdNetworkItems` added to Info.plist (Google SKAdNetwork ID)
- [x] AdMob native dependency added to iOS Package.swift
- [x] Release xcconfig created (`CAPACITOR_DEBUG = false`)
- [x] Release build configurations linked to `release.xcconfig` in Xcode project
- [x] Codemagic CI/CD bundle ID fixed to `com.ragesmash.app`
- [x] Audio/voice all local files, no API calls

### Before Submission (manual steps)
- [ ] **AdMob Account**: Create AdMob account, get real ad unit IDs, replace `ca-app-pub-XXXXX` placeholders in:
  - `src/ads/config.ts` — `PRODUCTION_IDS` object
  - `ios/App/App/Info.plist` — `GADApplicationIdentifier`
- [ ] **Flip AD_PRODUCTION**: Set `AD_PRODUCTION = true` in `src/ads/config.ts`
- [ ] **Code Signing**: Set Team ID in Xcode, enable automatic signing
- [ ] **Privacy Policy URL**: Write policy, host publicly, add URL to App Store Connect
- [ ] **App Store Connect**: Create app listing, upload screenshots, write description
- [ ] **Physical Device Testing**: Test on real iPhone before submission
- [ ] **PrivacyInfo.xcprivacy**: Verify it appears in Xcode "Copy Bundle Resources" build phase

### Optional (post-launch)
- [ ] Real StoreKit 2 integration (replace starter pack stub)
- [ ] Analytics/crash reporting (Sentry or Firebase Crashlytics)
- [ ] GDPR/CCPA consent management for EU/California users

## Build Commands
```
npm run build          # Production build
npm run cap:sync       # Build + sync to native
npm run cap:ios        # Build + sync + open Xcode
npm run cap:android    # Build + sync + open Android Studio
```

## Key Files
- `capacitor.config.ts` — root Capacitor config
- `ios/App/App/Info.plist` — iOS app metadata
- `ios/App/App/PrivacyInfo.xcprivacy` — Apple privacy manifest
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/` — App icons
- `src/ads/config.ts` — Ad unit IDs and `AD_PRODUCTION` toggle
- `src/ads/AdMobProvider.ts` — Native ad provider with ATT consent
- `ios/release.xcconfig` — Release build settings
- `codemagic.yaml` — CI/CD pipeline config
