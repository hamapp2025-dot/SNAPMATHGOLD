import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '../../firebaseConfig';
import {
  LEGACY_SUBSCRIPTION_STORAGE,
  PLAN_PREVIEW_STORAGE,
  SUBSCRIPTION_TIER_STORAGE,
  coerceSubscriptionTier,
  getHigherTier,
  inferTierFromText,
  isPaidPlanKey,
  type PaidPlanKey,
  type SubscriptionTier,
} from './subscriptionAccess';

type BillingMode = 'preview' | 'revenuecat' | 'unconfigured';

export type SubscriptionDuration = 'monthly' | 'semester' | 'annual';

type SubscriptionContextValue = {
  currentTier: SubscriptionTier;
  currentPeriodEndsAt: string | null;
  isLoading: boolean;
  hasRevenueCatConfig: boolean;
  billingMode: BillingMode;
  customerInfo: CustomerInfo | null;
  currentOffering: PurchasesOffering | null;
  packagesByTier: Partial<Record<PaidPlanKey, PurchasesPackage>>;
  packagesByDuration: Partial<Record<SubscriptionDuration, PurchasesPackage>>;
  refresh: () => Promise<void>;
  purchaseTier: (tier: PaidPlanKey) => Promise<'purchased' | 'cancelled' | 'preview' | 'unavailable'>;
  purchaseDuration: (duration: SubscriptionDuration) => Promise<'purchased' | 'cancelled' | 'preview' | 'unavailable'>;
  restorePurchases: () => Promise<boolean>;
};

type ExtraBillingConfig = {
  revenueCatIosApiKey?: unknown;
  revenueCatEntitlementId?: unknown;
  revenueCatOfferingId?: unknown;
  subscriptionPreviewTier?: unknown;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraBillingConfig;

const IOS_API_KEY =
  typeof extra.revenueCatIosApiKey === 'string' ? extra.revenueCatIosApiKey.trim() : '';
const ENTITLEMENT_ID =
  typeof extra.revenueCatEntitlementId === 'string' ? extra.revenueCatEntitlementId.trim() : '';
const OFFERING_ID =
  typeof extra.revenueCatOfferingId === 'string' ? extra.revenueCatOfferingId.trim() : '';
const CONFIGURED_PREVIEW_TIER =
  coerceSubscriptionTier(
    typeof extra.subscriptionPreviewTier === 'string' ? extra.subscriptionPreviewTier.trim() : null,
  ) ?? 'free';
const PREVIEW_FALLBACK_TIER: SubscriptionTier = IOS_API_KEY.length > 0 ? 'free' : CONFIGURED_PREVIEW_TIER;
const INITIAL_SUBSCRIPTION_TIER: SubscriptionTier = PREVIEW_FALLBACK_TIER;

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

function pickPrimaryPackage(offering: PurchasesOffering): PurchasesPackage | null {
  return (
    offering.monthly ??
    offering.annual ??
    offering.sixMonth ??
    offering.threeMonth ??
    offering.twoMonth ??
    offering.weekly ??
    offering.lifetime ??
    offering.availablePackages[0] ??
    null
  );
}

function resolveTierHint(...parts: Array<string | null | undefined>): SubscriptionTier | null {
  let highest: SubscriptionTier | null = null;
  for (const part of parts) {
    const tier = inferTierFromText(part);
    if (!tier) continue;
    highest = highest ? getHigherTier(highest, tier) : tier;
  }
  return highest;
}

function resolvePackageTier(pkg: PurchasesPackage): PaidPlanKey | null {
  const tier = resolveTierHint(
    pkg.identifier,
    pkg.offeringIdentifier,
    pkg.product.identifier,
    pkg.product.title,
    pkg.product.description,
  );

  return tier && isPaidPlanKey(tier) ? tier : null;
}

function mapPackagesByTier(offerings: PurchasesOfferings | null): Partial<Record<PaidPlanKey, PurchasesPackage>> {
  if (!offerings) return {};

  const packages: Partial<Record<PaidPlanKey, PurchasesPackage>> = {};

  for (const offering of Object.values(offerings.all ?? {})) {
    const metadataTier =
      typeof offering.metadata?.tier === 'string' ? inferTierFromText(offering.metadata.tier) : null;
    const tier = resolveTierHint(offering.identifier, offering.serverDescription, metadataTier ?? undefined);
    if (!tier || !isPaidPlanKey(tier) || packages[tier]) continue;

    const candidate = pickPrimaryPackage(offering);
    if (candidate) {
      packages[tier] = candidate;
    }
  }

  for (const offering of Object.values(offerings.all ?? {})) {
    for (const pkg of offering.availablePackages) {
      const tier = resolvePackageTier(pkg);
      if (tier && !packages[tier]) {
        packages[tier] = pkg;
      }
    }
  }

  return packages;
}

function mapPackagesByDuration(
  offering: PurchasesOffering | null,
): Partial<Record<SubscriptionDuration, PurchasesPackage>> {
  if (!offering) return {};
  const out: Partial<Record<SubscriptionDuration, PurchasesPackage>> = {};
  if (offering.monthly) out.monthly = offering.monthly;
  if (offering.sixMonth) out.semester = offering.sixMonth;
  if (offering.annual) out.annual = offering.annual;
  for (const pkg of offering.availablePackages) {
    const id = `${pkg.identifier} ${pkg.product.identifier}`.toLowerCase();
    if (!out.monthly && /month/.test(id)) out.monthly = pkg;
    if (!out.semester && /(semester|six|6.?month|half)/.test(id)) out.semester = pkg;
    if (!out.annual && /(annual|year)/.test(id)) out.annual = pkg;
  }
  return out;
}

function resolveTierFromCustomerInfo(customerInfo: CustomerInfo | null): SubscriptionTier {
  if (!customerInfo) return 'free';

  let highest: SubscriptionTier = 'free';
  const activeEntitlements = Object.values(customerInfo.entitlements.active ?? {});

  for (const entitlement of activeEntitlements) {
    const tier = resolveTierHint(entitlement.identifier, entitlement.productIdentifier);
    if (tier) {
      highest = getHigherTier(highest, tier);
    }
  }

  for (const productId of customerInfo.activeSubscriptions) {
    const tier = inferTierFromText(productId);
    if (tier) {
      highest = getHigherTier(highest, tier);
    }
  }

  if (highest !== 'free') {
    return highest;
  }

  if (ENTITLEMENT_ID && customerInfo.entitlements.active[ENTITLEMENT_ID]?.isActive) {
    return 'gold';
  }

  if (activeEntitlements.length > 0) {
    return 'gold';
  }

  return 'free';
}

function resolveCurrentPeriodEndsAt(customerInfo: CustomerInfo | null): string | null {
  if (!customerInfo) return null;

  const activeEntitlements = Object.values(customerInfo.entitlements.active ?? {});
  if (activeEntitlements.length === 0) return null;

  let selectedEntitlement = activeEntitlements[0];
  let selectedTier: SubscriptionTier = 'free';

  for (const entitlement of activeEntitlements) {
    const entitlementTier =
      resolveTierHint(entitlement.identifier, entitlement.productIdentifier) ??
      (ENTITLEMENT_ID && entitlement.identifier === ENTITLEMENT_ID ? 'gold' : 'free');

    if (getHigherTier(selectedTier, entitlementTier) === entitlementTier) {
      selectedTier = entitlementTier;
      selectedEntitlement = entitlement;
    }
  }

  return selectedEntitlement?.expirationDate ?? null;
}

async function readStoredTier(): Promise<SubscriptionTier> {
  try {
    const entries = await AsyncStorage.multiGet([
      SUBSCRIPTION_TIER_STORAGE,
      PLAN_PREVIEW_STORAGE,
      LEGACY_SUBSCRIPTION_STORAGE,
    ]);
    const directTier = coerceSubscriptionTier(entries[0]?.[1]);
    if (directTier) return getHigherTier(directTier, PREVIEW_FALLBACK_TIER);

    const previewTier = coerceSubscriptionTier(entries[1]?.[1]) ?? coerceSubscriptionTier(entries[2]?.[1]);
    return getHigherTier(previewTier ?? 'free', PREVIEW_FALLBACK_TIER);
  } catch {
    return PREVIEW_FALLBACK_TIER;
  }
}

async function persistResolvedTier(nextTier: SubscriptionTier) {
  try {
    await AsyncStorage.setItem(SUBSCRIPTION_TIER_STORAGE, nextTier);
    if (nextTier !== 'free') {
      await AsyncStorage.multiRemove([PLAN_PREVIEW_STORAGE, LEGACY_SUBSCRIPTION_STORAGE]);
    }
  } catch {
    // Ignore cache write failures.
  }
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>(INITIAL_SUBSCRIPTION_TIER);
  const [currentPeriodEndsAt, setCurrentPeriodEndsAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [packagesByTier, setPackagesByTier] = useState<Partial<Record<PaidPlanKey, PurchasesPackage>>>({});
  const packagesByDuration = useMemo(() => mapPackagesByDuration(currentOffering), [currentOffering]);
  const configuredRef = useRef(false);
  const hasRevenueCatConfig = Platform.OS === 'ios' && IOS_API_KEY.length > 0;

  const applyCustomerInfo = useCallback(async (info: CustomerInfo | null) => {
    setCustomerInfo(info);
    const nextTier = resolveTierFromCustomerInfo(info);
    setCurrentPeriodEndsAt(resolveCurrentPeriodEndsAt(info));
    setCurrentTier(nextTier);
    await persistResolvedTier(nextTier);
  }, []);

  const refresh = useCallback(async () => {
    const previewTier = await readStoredTier();

    if (!hasRevenueCatConfig) {
      setCustomerInfo(null);
      setCurrentPeriodEndsAt(null);
      setCurrentOffering(null);
      setPackagesByTier({});
      setCurrentTier(previewTier);
      setIsLoading(false);
      return;
    }

    try {
      const offerings = await Purchases.getOfferings();
      const selectedOffering =
        (OFFERING_ID && offerings.all?.[OFFERING_ID]) || offerings.current || null;
      setCurrentOffering(selectedOffering);
      setPackagesByTier(mapPackagesByTier(offerings));

      const info = await Purchases.getCustomerInfo();
      await applyCustomerInfo(info);
    } catch {
      setCustomerInfo(null);
      setCurrentPeriodEndsAt(null);
      setCurrentOffering(null);
      setPackagesByTier({});
      setCurrentTier(previewTier);
    } finally {
      setIsLoading(false);
    }
  }, [applyCustomerInfo, hasRevenueCatConfig]);

  useEffect(() => {
    let cancelled = false;
    let listenerRegistered = false;

    const handleCustomerInfoUpdate = (info: CustomerInfo) => {
      if (cancelled) return;
      void applyCustomerInfo(info);
    };

    async function bootstrap() {
      const previewTier = await readStoredTier();
      if (!hasRevenueCatConfig) {
        if (!cancelled) {
          setCustomerInfo(null);
          setCurrentPeriodEndsAt(null);
          setCurrentOffering(null);
          setPackagesByTier({});
          setCurrentTier(previewTier);
          setIsLoading(false);
        }
        return;
      }

      try {
        if (__DEV__) {
          await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
        }

        const alreadyConfigured = await Purchases.isConfigured();
        if (!alreadyConfigured) {
          configuredRef.current = true;
          Purchases.configure({
            apiKey: IOS_API_KEY,
            appUserID: auth.currentUser?.uid ?? undefined,
          });
        } else {
          configuredRef.current = true;
        }

        Purchases.addCustomerInfoUpdateListener(handleCustomerInfoUpdate);
        listenerRegistered = true;

        if (!cancelled) {
          await refresh();
        }
      } catch {
        if (!cancelled) {
          setCustomerInfo(null);
          setCurrentPeriodEndsAt(null);
          setCurrentOffering(null);
          setPackagesByTier({});
          setCurrentTier(previewTier);
          setIsLoading(false);
        }
      }
    }

    void bootstrap();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!hasRevenueCatConfig || !configuredRef.current) return;

      try {
        if (user?.uid) {
          const result = await Purchases.logIn(user.uid);
          await applyCustomerInfo(result.customerInfo);
        } else {
          const info = await Purchases.logOut();
          await applyCustomerInfo(info);
        }
      } catch {
        // Ignore auth sync issues and keep the current cached subscription state.
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
      if (listenerRegistered) {
        Purchases.removeCustomerInfoUpdateListener(handleCustomerInfoUpdate);
      }
    };
  }, [applyCustomerInfo, hasRevenueCatConfig, refresh]);

  const purchaseTier = useCallback(
    async (tier: PaidPlanKey) => {
      if (!hasRevenueCatConfig) {
        const nextPreviewTier = getHigherTier(tier, PREVIEW_FALLBACK_TIER);
        await AsyncStorage.multiSet([
          [PLAN_PREVIEW_STORAGE, nextPreviewTier],
          [SUBSCRIPTION_TIER_STORAGE, nextPreviewTier],
        ]);
        setCurrentTier(nextPreviewTier);
        return 'preview' as const;
      }

      const selectedPackage = packagesByTier[tier];
      if (!selectedPackage) {
        return 'unavailable' as const;
      }

      try {
        const result = await Purchases.purchasePackage(selectedPackage);
        await applyCustomerInfo(result.customerInfo);
        return 'purchased' as const;
      } catch (error: any) {
        if (error?.userCancelled) {
          return 'cancelled' as const;
        }
        throw error;
      }
    },
    [applyCustomerInfo, hasRevenueCatConfig, packagesByTier],
  );

  const purchaseDuration = useCallback(
    async (duration: SubscriptionDuration) => {
      if (!hasRevenueCatConfig) {
        const previewTier = getHigherTier('gold', PREVIEW_FALLBACK_TIER);
        await AsyncStorage.multiSet([
          [PLAN_PREVIEW_STORAGE, previewTier],
          [SUBSCRIPTION_TIER_STORAGE, previewTier],
        ]);
        setCurrentTier(previewTier);
        return 'preview' as const;
      }

      const selectedPackage = packagesByDuration[duration];
      if (!selectedPackage) {
        return 'unavailable' as const;
      }

      try {
        const result = await Purchases.purchasePackage(selectedPackage);
        await applyCustomerInfo(result.customerInfo);
        return 'purchased' as const;
      } catch (error: any) {
        if (error?.userCancelled) {
          return 'cancelled' as const;
        }
        throw error;
      }
    },
    [applyCustomerInfo, hasRevenueCatConfig, packagesByDuration],
  );

  const restorePurchases = useCallback(async () => {
    if (!hasRevenueCatConfig) {
      return false;
    }

    const info = await Purchases.restorePurchases();
    await applyCustomerInfo(info);
    return Object.keys(info.entitlements.active ?? {}).length > 0;
  }, [applyCustomerInfo, hasRevenueCatConfig]);

  const value = useMemo<SubscriptionContextValue>(() => {
    const billingMode: BillingMode = hasRevenueCatConfig
      ? 'revenuecat'
      : currentTier === 'free'
        ? 'unconfigured'
        : 'preview';

    return {
      currentTier,
      currentPeriodEndsAt,
      isLoading,
      hasRevenueCatConfig,
      billingMode,
      customerInfo,
      currentOffering,
      packagesByTier,
      packagesByDuration,
      refresh,
      purchaseTier,
      purchaseDuration,
      restorePurchases,
    };
  }, [
    currentTier,
    currentPeriodEndsAt,
    customerInfo,
    currentOffering,
    hasRevenueCatConfig,
    isLoading,
    packagesByTier,
    packagesByDuration,
    purchaseTier,
    purchaseDuration,
    refresh,
    restorePurchases,
  ]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used inside SubscriptionProvider');
  }
  return context;
}
