import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const ACCENT = '#0A7AFF';
const BG = '#F6FAFF';
const TEXT = '#16233B';
const MUTED = '#6B7C98';
const LANG_KEY = '@snapmathacademy_language';

type Props = { children: ReactNode; isAr?: boolean };
type State = { hasError: boolean; error: Error | null; errorInfo: ErrorInfo | null; isAr: boolean };

function isNetworkError(error: Error): boolean {
  const msg = (error?.message || '').toLowerCase();
  return ['network', 'fetch', 'failed', 'unavailable', 'timeout', 'connection', 'econnrefused', 'econnreset', 'enotfound', 'could not connect'].some((t) => msg.includes(t));
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: null, isAr: false };

  async componentDidMount() {
    try {
      const lang = await AsyncStorage.getItem(LANG_KEY);
      this.setState({ isAr: lang === 'ar' });
    } catch {
      // Keep English fallback if storage is unavailable.
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    if (__DEV__) console.error('[ErrorBoundary]', error, errorInfo?.componentStack);
  }

  retry = () => this.setState({ hasError: false, error: null, errorInfo: null });

  render() {
    if (this.state.hasError && this.state.error) {
      const isNetwork = isNetworkError(this.state.error);
      const isAr = this.props.isAr ?? this.state.isAr;

      return (
        <View style={styles.container}>
          {/* Icon */}
          <View style={styles.iconWrap}>
            <LinearGradient colors={['rgba(10,122,255,0.22)', 'rgba(10,122,255,0.05)']} style={styles.iconGrad}>
              <Ionicons
                name={isNetwork ? 'cloud-offline-outline' : 'warning-outline'}
                size={52}
                color={ACCENT}
              />
            </LinearGradient>
          </View>

          <Text style={[styles.title, isAr && styles.rtlText]}>
            {isAr
              ? (isNetwork ? 'تعذر الاتصال بالخادم' : 'حدث خطأ غير متوقع')
              : (isNetwork ? 'Cannot reach server' : 'Something went wrong')}
          </Text>
          <Text style={[styles.message, isAr && styles.rtlText]}>
            {isAr
              ? (isNetwork
                ? 'تحقق من اتصالك بالإنترنت ثم اضغط إعادة المحاولة. تقدمك محفوظ محلياً.'
                : 'حدث خلل غير متوقع. اضغط إعادة المحاولة للمتابعة.')
              : (isNetwork
                ? 'Check your internet connection and tap Retry. Your progress is saved locally.'
                : 'An unexpected error occurred. Tap Retry to continue.')}
          </Text>

          {/* Debug (dev only) */}
          {__DEV__ && (
            <Text style={[styles.debug, isAr && styles.rtlText]} numberOfLines={4}>
              {this.state.error.message}
            </Text>
          )}

          {/* Retry button */}
          <Pressable style={styles.retryBtn} onPress={this.retry}>
            <LinearGradient colors={['#2590FF', ACCENT]} style={styles.retryGrad}>
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.retryText}>{isAr ? 'إعادة المحاولة' : 'Retry'}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  iconWrap: { width: 110, height: 110, borderRadius: 55, overflow: 'hidden', marginBottom: 24 },
  iconGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: {
    color: TEXT,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Amiri_700Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    color: MUTED,
    fontSize: 14,
    fontFamily: 'Amiri_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 18,
    maxWidth: 320,
  },
  rtlText: { writingDirection: 'rtl' },
  debug: {
    color: 'rgba(22,35,59,0.45)',
    fontSize: 11,
    fontFamily: 'Amiri_400Regular',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryBtn: { borderRadius: 27, overflow: 'hidden', marginTop: 8 },
  retryGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  retryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
});
