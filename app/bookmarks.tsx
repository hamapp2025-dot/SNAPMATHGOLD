import React, { useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../src/theme/ThemeContext';
import { useT } from '../src/config/LanguageContext';
import { useBookmarks, BookmarkItem } from '../src/hooks/useBookmarks';
import { withAlpha } from '../src/theme/colorUtils';

const MUTED = '#B8BED6';
const GREEN = '#2ED573';

function scoreColor(n: number | undefined, accent: string) {
  if (n === undefined) return accent;
  if (n >= 90) return GREEN;
  if (n >= 75) return accent;
  return '#E86B6B';
}

export default function BookmarksScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { isAr } = useT();
  const { bookmarks, removeBookmark } = useBookmarks();
  const [mode, setMode] = useState<'all' | 'topics'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const sections = useMemo(() => {
    if (mode === 'all') {
      return [{ key: 'all', title: '', items: bookmarks }];
    }

    const topicMap = new Map<string, { key: string; title: string; items: BookmarkItem[] }>();
    for (const bookmark of bookmarks) {
      const key = `${bookmark.topicEn}::${bookmark.topicAr}`;
      const title = isAr ? bookmark.topicAr : bookmark.topicEn;
      const existing = topicMap.get(key);

      if (existing) {
        existing.items.push(bookmark);
      } else {
        topicMap.set(key, { key, title, items: [bookmark] });
      }
    }

    return Array.from(topicMap.values()).sort((a, b) => a.title.localeCompare(b.title));
  }, [bookmarks, isAr, mode]);

  const summaryLabel =
    mode === 'topics'
      ? isAr
        ? `${sections.length} موضوع`
        : `${sections.length} topics`
      : isAr
        ? `${bookmarks.length} عنصر محفوظ`
        : `${bookmarks.length} saved items`;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === bookmarks.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(bookmarks.map((b) => b.id)));
    }
  };

  const deleteSelected = async () => {
    for (const id of Array.from(selected)) {
      await removeBookmark(id);
    }
    setSelected(new Set());
  };

  const confirmDeleteSelected = () => {
    Alert.alert(
      isAr ? 'حذف العناصر المحددة؟' : 'Delete selected bookmarks?',
      isAr
        ? `سيتم حذف ${selected.size} عنصر من الإشارات المرجعية.`
        : `${selected.size} bookmarked item${selected.size === 1 ? '' : 's'} will be removed.`,
      [
        { text: isAr ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isAr ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: () => void deleteSelected(),
        },
      ],
    );
  };

  return (
    <View style={[s.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[s.header, isAr && s.headerRtl]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: theme.text }]}>
          {isAr ? 'الإشارات المرجعية' : 'Bookmarks'}
        </Text>
        {selected.size > 0 ? (
          <TouchableOpacity onPress={confirmDeleteSelected} activeOpacity={0.8}>
            <Ionicons name="trash-outline" size={22} color={theme.danger} />
          </TouchableOpacity>
        ) : (
          <Text style={[s.headerMeta, { color: theme.muted }]}>{summaryLabel}</Text>
        )}
      </View>

      {/* Filter pills */}
      <View style={[s.topFilter, isAr && s.topFilterRtl]}>
        {(['all', 'topics'] as const).map((m) => {
          const active = mode === m;
          return (
            <TouchableOpacity
              key={m}
              style={[s.pill, { borderColor: theme.border }, active && { backgroundColor: theme.text, borderColor: theme.text }]}
              onPress={() => setMode(m)}
              activeOpacity={0.85}
            >
              <Text style={[s.pillText, { color: active ? theme.bg : theme.text }]}>
                {m === 'all' ? (isAr ? 'الكل' : 'All') : (isAr ? 'حسب المواضيع' : 'By Topics')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Summary + Select row */}
      <View style={[s.sortRow, isAr && s.sortRowRtl]}>
        <View style={[s.sortLeft, isAr && s.sortLeftRtl]}>
          <Ionicons name="bookmark-outline" size={18} color={theme.accent} />
          <Text style={[s.sortText, { color: theme.text }]}>{summaryLabel}</Text>
        </View>
        <TouchableOpacity style={[s.sortLeft, isAr && s.sortLeftRtl]} onPress={selectAll} activeOpacity={0.8}>
          <Ionicons name="checkmark-done-outline" size={18} color={theme.text} />
          <Text style={[s.sortText, { color: theme.text }]}>
            {selected.size === bookmarks.length && bookmarks.length > 0
              ? (isAr ? 'إلغاء الكل' : 'Deselect All')
              : (isAr ? 'تحديد الكل' : 'Select All')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {bookmarks.length === 0 ? (
        <View style={s.emptyWrap}>
          <Ionicons name="bookmark-outline" size={48} color={theme.muted} style={{ marginBottom: 12 }} />
          <Text style={[s.emptyTitle, { color: theme.text }]}>{isAr ? 'لا توجد إشارات بعد' : 'No bookmarks yet'}</Text>
          <Text style={[s.emptySub, { color: theme.muted }]}>
            {isAr
              ? 'عند تمريرك على سؤال صعب، اضغط على رمز الإشارة لحفظه هنا.'
              : 'When you encounter a tricky question, tap the bookmark icon to save it here.'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          {sections.map((section) => (
            <View key={section.key} style={mode === 'topics' ? s.sectionGroup : undefined}>
              {mode === 'topics' ? (
                <View style={[s.sectionHeader, isAr && s.sectionHeaderRtl]}>
                  <Text style={[s.sectionHeaderTitle, { color: theme.text }, isAr && s.textRtl]} numberOfLines={1}>
                    {section.title}
                  </Text>
                  <Text style={[s.sectionHeaderMeta, { color: theme.muted }]}>
                    {isAr ? `${section.items.length} عنصر` : `${section.items.length} item${section.items.length === 1 ? '' : 's'}`}
                  </Text>
                </View>
              ) : null}

              {section.items.map((item) => {
                const isSel = selected.has(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.85}
                    onPress={() => toggleSelect(item.id)}
                    style={[
                      s.row,
                      { borderBottomColor: theme.border },
                      isAr && s.rowRtl,
                      isSel && { backgroundColor: withAlpha(theme.accent, 0.08) },
                    ]}>
                    <View
                      style={[
                        s.check,
                        {
                          backgroundColor: isSel ? theme.accent : theme.surface,
                          borderColor: isSel ? theme.accent : theme.border,
                        },
                      ]}>
                      {isSel && <Ionicons name="checkmark" size={14} color={theme.primaryInk} />}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={[s.itemTitle, { color: theme.text }, isAr && s.textRtl]} numberOfLines={1}>
                        {isAr ? item.titleAr : item.titleEn}
                      </Text>
                      <Text style={[s.itemSub, { color: theme.muted }, isAr && s.textRtl]}>
                        {isAr ? item.topicAr : item.topicEn} · {item.attempts} {isAr ? 'محاولات' : 'attempts'}
                      </Text>
                    </View>

                    <View style={[s.scoreChip, { backgroundColor: scoreColor(item.score, theme.accent) }]}>
                      <Text style={s.scoreText}>{item.score !== undefined ? `${item.score}%` : '—'}</Text>
                    </View>

                    <TouchableOpacity onPress={() => removeBookmark(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name="close-circle-outline" size={18} color={theme.muted} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      {/* Bottom CTA */}
      {bookmarks.length > 0 && (
        <View style={s.bottomCta}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() =>
              router.push(
                selected.size > 0
                  ? {
                      pathname: '/bookmark-review',
                      params: { ids: JSON.stringify(Array.from(selected)) },
                    }
                  : '/bookmark-review',
              )
            }>
            <LinearGradient colors={theme.primary} style={s.bottomGrad}>
              <Ionicons name="play-circle" size={20} color={theme.primaryInk} />
              <Text style={[s.bottomText, { color: theme.primaryInk }]}>
                {selected.size > 0
                  ? (isAr ? `تدرّب على ${selected.size} محدد` : `Practice ${selected.size} selected`)
                  : (isAr ? `تدرّب على ${bookmarks.length} عناصر` : `Practice all ${bookmarks.length} items`)}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'ios' ? 56 : 36 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 14 },
  headerRtl: { flexDirection: 'row-reverse' },
  headerTitle: { fontSize: 24, fontWeight: '600', fontFamily: 'Amiri_700Bold' },
  headerMeta: { fontSize: 12, fontFamily: 'Amiri_400Regular' },

  topFilter: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 14 },
  topFilterRtl: { flexDirection: 'row-reverse' },
  pill: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 18, borderWidth: 1, backgroundColor: 'transparent' },
  pillText: { fontSize: 14, fontWeight: '600', fontFamily: 'Amiri_700Bold' },

  sortRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8 },
  sortRowRtl: { flexDirection: 'row-reverse' },
  sortLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sortLeftRtl: { flexDirection: 'row-reverse' },
  sortText: { fontSize: 15, fontWeight: '500', fontFamily: 'Amiri_700Bold' },

  list: { paddingBottom: 20 },
  sectionGroup: { marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 },
  sectionHeaderRtl: { flexDirection: 'row-reverse' },
  sectionHeaderTitle: { flex: 1, fontSize: 15, fontFamily: 'Amiri_700Bold' },
  sectionHeaderMeta: { fontSize: 12, fontFamily: 'Amiri_400Regular' },
  row: {
    minHeight: 66, borderBottomWidth: 1,
    paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  rowRtl: { flexDirection: 'row-reverse' },
  check: { width: 26, height: 26, borderRadius: 7, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontSize: 17, fontWeight: '600', fontFamily: 'Amiri_700Bold' },
  itemSub: { fontSize: 14, marginTop: 1, fontFamily: 'Amiri_400Regular' },
  scoreChip: { minWidth: 48, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8, alignItems: 'center' },
  scoreText: { color: '#081020', fontSize: 14, fontWeight: '800', fontFamily: 'Amiri_700Bold' },
  textRtl: { textAlign: 'right' },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Amiri_700Bold', marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 14, fontFamily: 'Amiri_400Regular', textAlign: 'center', lineHeight: 22 },

  bottomCta: { position: 'absolute', left: 20, right: 20, bottom: 24 },
  bottomGrad: { borderRadius: 24, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  bottomText: { fontSize: 18, fontWeight: '700', fontFamily: 'Amiri_700Bold' },
});
