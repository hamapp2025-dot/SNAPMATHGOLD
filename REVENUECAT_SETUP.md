# RevenueCat Setup

The app is wired for RevenueCat in:

- `src/subscriptions/SubscriptionContext.tsx`
- `app/subscription.tsx`
- `app.config.js`

## 1. App Store Connect products

Create three auto-renewable subscriptions:

| Tier | Product ID |
|------|------------|
| Bronze | `snapmath_bronze_monthly` |
| Silver | `snapmath_silver_monthly` |
| Gold | `snapmath_gold_monthly` |

Each ID must contain `bronze`, `silver`, or `gold` so the app can map tiers.

## 2. RevenueCat dashboard

1. Connect iOS app `com.hamzaacademy.app` to App Store Connect.
2. Import the three products above.
3. Create entitlement `premium` and attach all three products.
4. Create offering `default`, add one package per tier, mark it **Current**.
5. Copy the **iOS public SDK key** (`appl_...`).

## 3. EAS secret (one command)

```bash
npm run billing:setup -- appl_your_key_here
```

This stores `REVENUECAT_IOS_API_KEY` in the EAS production environment. When the key is present, preview Gold access is disabled automatically in `app.config.js`.

## 4. Rebuild and test

```bash
npm run release:ios -- --no-wait
```

On TestFlight:

1. Open Subscription.
2. Confirm preview messaging is gone.
3. Buy Bronze/Silver/Gold in sandbox.
4. Tap Restore Purchases.
5. Verify Profile reflects the purchased tier.

## Mapping rule

The app resolves tiers from package/product/offering identifiers or metadata:

```json
{ "tier": "bronze" }
```

If no tier is found but entitlement `premium` is active, the app falls back to Gold.
