# Rage Smash — App Store Readiness

## Status: ~95% Ready

### Resolved
- [x] Bundle ID synced to `com.athletedomains.ragesmash` across iOS + Android + CI/CD
- [x] App name synced to "Rage Smash" across iOS + Android
- [x] Privacy manifest (`PrivacyInfo.xcprivacy`) created
- [x] Android MainActivity moved to `com.athletedomains.ragesmash` package
- [x] Splash screen configured (3 scales)
- [x] Version set to 1.0 / build 1
- [x] App icon source (1024x1024) in Xcode asset catalog (single-size format)
- [x] Ad system: production/test toggle via `AD_PRODUCTION` flag in `src/ads/config.ts`
- [x] AdMob testing mode tied to `AD_PRODUCTION` flag (auto-disables for release)
- [x] ATT (App Tracking Transparency) consent flow in AdMobProvider
- [x] `NSUserTrackingUsageDescription` added to Info.plist
- [x] `GADApplicationIdentifier` set to real iOS AdMob app ID in Info.plist
- [x] `SKAdNetworkItems` added to Info.plist (Google SKAdNetwork ID)
- [x] AdMob native dependency added to iOS Package.swift
- [x] Release xcconfig created (`CAPACITOR_DEBUG = false`)
- [x] Release build configurations linked to `release.xcconfig` in Xcode project
- [x] Codemagic CI/CD bundle ID fixed to `com.athletedomains.ragesmash`
- [x] Audio/voice all local files, no API calls
- [x] iOS AdMob ad unit IDs configured (rewarded + interstitial)
- [x] Privacy policy written (`public/privacy.html`)

### Before Submission (manual steps)
- [ ] **Android AdMob**: Create Android app in AdMob, get ad unit IDs, replace placeholders
- [x] **Code Signing**: Codemagic integration `Codemagic-Rage-Smash` configured with App Store Connect API key
- [x] **Privacy Policy URL**: Hosted on Netlify, add URL to App Store Connect
- [ ] **App Store Connect**: Upload screenshots, write description
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
