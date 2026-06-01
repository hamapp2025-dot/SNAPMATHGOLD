import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import { useNavigation, useRouter } from 'expo-router';
import Pdf from 'react-native-pdf';

import { useAppTheme } from '../src/theme/ThemeContext';
import { useT } from '../src/config/LanguageContext';
import { withAlpha } from '../src/theme/colorUtils';

type WorkbookId = 'sem1' | 'sem2';

type WorkbookMeta = {
  id: WorkbookId;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  source: number;
};

const WORKBOOKS: WorkbookMeta[] = [
  {
    id: 'sem1',
    titleEn: 'Semester 1 Workbook',
    titleAr: 'كتاب التمارين - الفصل الأول',
    subtitleEn: 'Units 1-4 Jordanian exercises',
    subtitleAr: 'تمارين الوحدات 1-4 حسب المنهاج الأردني',
    source: require('../assets/pdfs/jordan-workbook-sem1.pdf'),
  },
  {
    id: 'sem2',
    titleEn: 'Semester 2 Workbook',
    titleAr: 'كتاب التمارين - الفصل الثاني',
    subtitleEn: 'Units 5-7 Jordanian exercises',
    subtitleAr: 'تمارين الوحدات 5-7 حسب المنهاج الأردني',
    source: require('../assets/pdfs/jordan-workbook-sem2.pdf'),
  },
];

export default function TextbookScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { theme } = useAppTheme();
  const { t, isAr } = useT();
  const loadRequestIdRef = useRef(0);
  const [activeWorkbookId, setActiveWorkbookId] = useState<WorkbookId>('sem1');
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(true);
  const [isPdfLoading, setIsPdfLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const activeWorkbook = useMemo(
    () => WORKBOOKS.find((book) => book.id === activeWorkbookId) ?? WORKBOOKS[0],
    [activeWorkbookId],
  );

  const loadWorkbook = useCallback(async () => {
    const requestId = loadRequestIdRef.current + 1;
    loadRequestIdRef.current = requestId;
    setIsPreparing(true);
    setIsPdfLoading(true);
    setLoadFailed(false);
    setPdfUri(null);

    try {
      const asset = Asset.fromModule(activeWorkbook.source);
      await asset.downloadAsync();
      const resolvedUri = asset.localUri ?? asset.uri;

      if (!resolvedUri) {
        throw new Error('missing-pdf-uri');
      }

      if (loadRequestIdRef.current !== requestId) {
        return;
      }
      setPdfUri(resolvedUri);
    } catch {
      if (loadRequestIdRef.current !== requestId) {
        return;
      }
      setLoadFailed(true);
    } finally {
      if (loadRequestIdRef.current === requestId) {
        setIsPreparing(false);
      }
    }
  }, [activeWorkbook.source]);

  useEffect(() => {
    void loadWorkbook();
  }, [loadWorkbook]);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)/profile');
  }, [navigation, router]);

  return (
    <View style={[s.container, { backgroundColor: theme.bg }]}>
      <View style={[s.header, isAr && s.headerRtl]}>
        <TouchableOpacity onPress={handleBack} style={[s.iconBtn, { backgroundColor: theme.surface }]}>
          <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={s.headerText}>
          <Text style={[s.title, { color: theme.text }, isAr && s.textRtl]}>{t('textbookTitle')}</Text>
          <Text style={[s.subtitle, { color: theme.muted }, isAr && s.textRtl]}>{t('textbookSubtitle')}</Text>
        </View>
        <TouchableOpacity
          onPress={() => void loadWorkbook()}
          style={[s.iconBtn, { backgroundColor: theme.surface }]}
          activeOpacity={0.85}>
          <Ionicons name="refresh-outline" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={[s.toolbar, { backgroundColor: theme.surface, borderColor: theme.border }, isAr && s.rowRtl]}>
        <View style={[s.toolbarPill, { backgroundColor: withAlpha(theme.accent, 0.12) }]}>
          <Ionicons name="document-text-outline" size={16} color={theme.accent} />
          <Text style={[s.toolbarPillText, { color: theme.accent }]}>{t('textbookBuiltInBadge')}</Text>
        </View>
        <Text style={[s.toolbarCopy, { color: theme.muted }, isAr && s.textRtl]}>
          {t('textbookWorkbookCollectionBody')}
        </Text>
      </View>

      <View style={s.bookList}>
        {WORKBOOKS.map((book) => {
          const selected = book.id === activeWorkbook.id;

          return (
            <TouchableOpacity
              key={book.id}
              activeOpacity={0.85}
              onPress={() => setActiveWorkbookId(book.id)}
              style={[
                s.bookOption,
                {
                  backgroundColor: selected ? withAlpha(theme.accent, theme.id === 'light' ? 0.1 : 0.14) : theme.surface,
                  borderColor: selected ? withAlpha(theme.accent, 0.34) : theme.border,
                },
                isAr && s.rowRtl,
              ]}>
              <View
                style={[
                  s.bookIcon,
                  {
                    backgroundColor: withAlpha(theme.accent, selected ? 0.16 : 0.1),
                    borderColor: withAlpha(theme.accent, selected ? 0.3 : 0.2),
                  },
                ]}>
                <Ionicons name={book.id === 'sem1' ? 'book-outline' : 'library-outline'} size={20} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.bookTitle, { color: theme.text }, isAr && s.textRtl]}>
                  {isAr ? book.titleAr : book.titleEn}
                </Text>
                <Text style={[s.bookSubtitle, { color: theme.muted }, isAr && s.textRtl]}>
                  {isAr ? book.subtitleAr : book.subtitleEn}
                </Text>
              </View>
              <Ionicons
                name={selected ? 'checkmark-circle' : isAr ? 'chevron-back' : 'chevron-forward'}
                size={selected ? 20 : 16}
                color={selected ? theme.accent : theme.muted}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[s.viewerHeader, isAr && s.rowRtl]}>
        <Text style={[s.viewerTitle, { color: theme.text }, isAr && s.textRtl]}>
          {isAr ? activeWorkbook.titleAr : activeWorkbook.titleEn}
        </Text>
        <View style={[s.viewerBadge, { backgroundColor: withAlpha(theme.accent, 0.12) }]}>
          <Text style={[s.viewerBadgeText, { color: theme.accent }]}>PDF</Text>
        </View>
      </View>

      <View style={[s.webWrap, { borderColor: theme.border }]}>
        {isPreparing ? (
          <View style={s.stateCard}>
            <ActivityIndicator color={theme.accent} />
            <Text style={[s.stateTitle, { color: theme.text }, isAr && s.textRtl]}>{t('textbookLoading')}</Text>
          </View>
        ) : loadFailed || !pdfUri ? (
          <View style={s.stateCard}>
            <View style={[s.emptyIcon, { backgroundColor: withAlpha(theme.accent, 0.14) }]}>
              <Ionicons name="alert-circle-outline" size={28} color={theme.accent} />
            </View>
            <Text style={[s.stateTitle, { color: theme.text }, isAr && s.textRtl]}>{t('textbookLoadErrorTitle')}</Text>
            <Text style={[s.stateBody, { color: theme.muted }, isAr && s.textRtl]}>{t('textbookLoadErrorBody')}</Text>
            <TouchableOpacity
              onPress={() => void loadWorkbook()}
              activeOpacity={0.85}
              style={[s.stateButton, { backgroundColor: withAlpha(theme.accent, 0.12) }]}>
              <Text style={[s.stateButtonText, { color: theme.accent }]}>{t('textbookReload')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.pdfLayer}>
            <Pdf
              key={activeWorkbook.id}
              source={{ uri: pdfUri, cache: true }}
              trustAllCerts={false}
              onLoadComplete={() => {
                setIsPdfLoading(false);
                setLoadFailed(false);
              }}
              onError={() => {
                setIsPdfLoading(false);
                setLoadFailed(true);
              }}
              style={s.pdf}
            />
            {isPdfLoading ? (
              <View style={[s.pdfLoadingOverlay, { backgroundColor: withAlpha(theme.bg, 0.82) }]}>
                <ActivityIndicator color={theme.accent} />
                <Text style={[s.stateBody, { color: theme.muted }, isAr && s.textRtl]}>{t('textbookLoading')}</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>

      {loadFailed ? (
        <View style={[s.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/curriculum')}
            activeOpacity={0.85}
            style={[s.backBtn, { backgroundColor: withAlpha(theme.accent, 0.12) }]}>
            <Text style={[s.backBtnText, { color: theme.accent }]}>{t('textbookBackToCurriculum')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 12,
  },
  headerRtl: { flexDirection: 'row-reverse' },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: { fontSize: 22, fontFamily: 'Amiri_700Bold' },
  subtitle: { marginTop: 2, fontSize: 13, fontFamily: 'Amiri_400Regular' },
  toolbar: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  toolbarCopy: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Amiri_400Regular',
  },
  toolbarPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolbarPillText: { fontSize: 13, fontFamily: 'Amiri_700Bold' },
  bookList: {
    marginHorizontal: 20,
    marginBottom: 12,
    gap: 10,
  },
  bookOption: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bookIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 15,
    fontFamily: 'Amiri_700Bold',
  },
  bookSubtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Amiri_400Regular',
  },
  viewerHeader: {
    marginHorizontal: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  viewerTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Amiri_700Bold',
  },
  viewerBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  viewerBadgeText: {
    fontSize: 12,
    fontFamily: 'Amiri_700Bold',
  },
  webWrap: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pdfLayer: { flex: 1 },
  pdf: { flex: 1 },
  pdfLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stateCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stateTitle: {
    marginTop: 12,
    fontSize: 18,
    fontFamily: 'Amiri_700Bold',
    textAlign: 'center',
  },
  stateBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'Amiri_400Regular',
    textAlign: 'center',
  },
  stateButton: {
    marginTop: 18,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  stateButtonText: {
    fontSize: 14,
    fontFamily: 'Amiri_700Bold',
  },
  emptyCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Amiri_700Bold',
    textAlign: 'center',
  },
  emptyBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'Amiri_400Regular',
    textAlign: 'center',
  },
  backBtn: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtnText: { fontSize: 14, fontFamily: 'Amiri_700Bold' },
  rowRtl: { flexDirection: 'row-reverse' },
  textRtl: { textAlign: 'right' },
});
