const appJson = require('./app.json');

const baseExtra = appJson.expo.extra ?? {};

function readEnv(name) {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : '';
}

const revenueCatIosApiKey =
  readEnv('REVENUECAT_IOS_API_KEY') ||
  readEnv('EXPO_PUBLIC_REVENUECAT_IOS_API_KEY') ||
  String(baseExtra.revenueCatIosApiKey ?? '').trim();

/** @type {import('@expo/config').ExpoConfig} */
module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...baseExtra,
      revenueCatIosApiKey,
      revenueCatEntitlementId:
        readEnv('REVENUECAT_ENTITLEMENT_ID') || baseExtra.revenueCatEntitlementId || 'premium',
      revenueCatOfferingId:
        readEnv('REVENUECAT_OFFERING_ID') || baseExtra.revenueCatOfferingId || 'default',
      subscriptionPreviewTier: revenueCatIosApiKey
        ? readEnv('SUBSCRIPTION_PREVIEW_TIER') || ''
        : baseExtra.subscriptionPreviewTier || 'gold',
    },
  },
};
