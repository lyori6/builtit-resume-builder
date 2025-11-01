export type FeatureFlags = {
  enableJsonImport: boolean
  enableFineTunePanel: boolean
  enableAnalytics: boolean
}

export const defaultFeatureFlags: FeatureFlags = {
  enableJsonImport: false,
  enableFineTunePanel: false,
  enableAnalytics: false
}

// TODO: replace with runtime-loaded config (e.g., fetch('/config/launch.json'))
