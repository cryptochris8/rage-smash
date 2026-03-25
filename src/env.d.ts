/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMOB_APP_ID_IOS: string;
  readonly VITE_ADMOB_APP_ID_ANDROID: string;
  readonly VITE_ADMOB_IOS_REWARDED: string;
  readonly VITE_ADMOB_IOS_INTERSTITIAL: string;
  readonly VITE_ADMOB_ANDROID_REWARDED: string;
  readonly VITE_ADMOB_ANDROID_INTERSTITIAL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
