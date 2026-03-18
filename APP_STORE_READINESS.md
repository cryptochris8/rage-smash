# Rage Smash — App Store Readiness

## Status: ~85% Ready (blockers resolved)

### Resolved
- [x] Bundle ID synced to `com.ragesmash.app` across iOS + Android
- [x] App name synced to "Rage Smash" across iOS + Android
- [x] Privacy manifest (`PrivacyInfo.xcprivacy`) created
- [x] Android MainActivity moved to `com.ragesmash.app` package
- [x] Splash screen configured (3 scales)
- [x] Version set to 1.0 / build 1
- [x] Ads stubbed safely (no fake SDK calls)
- [x] IAP stubbed safely (no StoreKit calls)
- [x] Audio/voice all local files, no API calls

### Before Submission
- [ ] **App Icons**: Generate full icon set from source artwork (1024x1024)
- [ ] **Code Signing**: Set Team ID in Xcode, enable automatic signing
- [ ] **Add PrivacyInfo.xcprivacy to Xcode target**: Verify it appears in "Copy Bundle Resources" build phase
- [ ] **App Store Connect**: Create app listing, upload screenshots, write description
- [ ] **Privacy Policy URL**: Required for App Store listing
- [ ] **Physical Device Testing**: Test on real iPhone before submission

### Optional (post-launch)
- [ ] Real AdMob integration (replace stubs)
- [ ] Real StoreKit 2 integration (replace starter pack stub)
- [ ] Analytics/telemetry (update privacy manifest if added)

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
