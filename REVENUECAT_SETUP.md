# RevenueCat Setup

The app is already wired for RevenueCat in these files:

- `src/subscriptions/SubscriptionContext.tsx`
- `app/subscription.tsx`
- `app/(tabs)/profile.tsx`
- `app.json`

## App config fields to fill

Add real values in `app.json`:

- `expo.extra.revenueCatIosApiKey`
- `expo.extra.revenueCatEntitlementId`
- `expo.extra.revenueCatOfferingId`

## Minimum dashboard setup

1. Create the iOS app in RevenueCat and connect it to App Store Connect.
2. Create the App Store subscription products for your plans.
3. Attach the products to an entitlement.
4. Create an offering and make it current.
5. Copy the iOS public SDK key into `revenueCatIosApiKey`.

## Important mapping rule in this codebase

The app needs to know which package is:

- `bronze`
- `silver`
- `gold`

The current code maps plan tiers by reading these values from RevenueCat:

- offering identifier
- offering description
- offering metadata `tier`
- package identifier
- product identifier
- product title
- product description

## Easiest safe setup

Make sure each plan contains its tier name somewhere obvious, for example:

- offering/package/product contains `bronze`
- offering/package/product contains `silver`
- offering/package/product contains `gold`

If you prefer custom identifiers that do not include those words, then add offering metadata:

```json
{
  "tier": "bronze"
}
```

and the equivalent values for `silver` and `gold`.

## Entitlement note

`revenueCatEntitlementId` is used as a fallback check for an active purchase.

For best results:

- keep the entitlement active for all paid plans
- still include `bronze` / `silver` / `gold` in package or product metadata so the app can show the correct tier

If you only configure a single entitlement and none of the identifiers reveal the tier, the app will fall back to treating the subscription as the highest paid tier.

## Product structure this UI expects

The current paywall UI shows three plans:

- Bronze
- Silver
- Gold

The app can display live RevenueCat pricing automatically once the mapped package exists. It uses:

- `pkg.product.priceString` for the visible price
- `pkg.product.title` for the price note line

## Restore flow

The restore button in `app/subscription.tsx` is live already. Once RevenueCat is configured and the app is rebuilt, users can:

- open Subscription
- tap `Restore Purchases`

## After configuration

1. Rebuild the iOS app so the new `app.json` values are bundled.
2. Open the subscription screen.
3. Confirm the screen switches from preview messaging to real purchase messaging.
4. Complete a sandbox purchase.
5. Verify the Profile tab reflects the purchased tier.

## What is still external

The remaining billing blockers are not code blockers anymore:

- RevenueCat iOS public SDK key
- RevenueCat offering and entitlement IDs
- Real App Store products connected to RevenueCat
