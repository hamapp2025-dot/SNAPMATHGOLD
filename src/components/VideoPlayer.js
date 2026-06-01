import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useT } from '../config/LanguageContext';
import { SURFACE, SURFACE_BORDER, TEXT_PRIMARY, TEXT_SECONDARY, GOLD, FONTS, TYPE_SCALE, BG, GOLD_BTN_TEXT } from '../config/theme';

export default function VideoPlayer({ videoUrl }) {
  const { isAr } = useT();
  const openVideo = async () => {
    if (!videoUrl) return;
    const ok = await Linking.canOpenURL(videoUrl).catch(() => false);
    if (ok) Linking.openURL(videoUrl);
  };

  return (
    <View style={s.wrap}>
      <View style={s.preview}>
        <View style={s.playCircle}>
          <Ionicons name="play" size={22} color={TEXT_PRIMARY} />
        </View>
      </View>
      <View style={s.info}>
        <Text style={[s.title, { fontFamily: isAr ? FONTS.headingAr : FONTS.headingEn }]}>{isAr ? 'فيديو الدرس' : 'Lesson Video'}</Text>
        <Text style={s.sub} numberOfLines={1}>
          {videoUrl || (isAr ? 'مصدر الفيديو غير متاح' : 'Video source unavailable')}
        </Text>
        <TouchableOpacity style={s.btn} onPress={openVideo} activeOpacity={0.85}>
          <Text style={[s.btnText, { fontFamily: isAr ? FONTS.headingAr : FONTS.semiEn }]}>{isAr ? 'فتح الفيديو' : 'Open Video'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: SURFACE_BORDER,
    backgroundColor: SURFACE,
  },
  preview: {
    height: 184,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BG,
  },
  playCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(201,168,76,0.25)',
    borderWidth: 1,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  info: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  title: { color: TEXT_PRIMARY, fontSize: TYPE_SCALE.body, fontWeight: '700' },
  sub: { color: TEXT_SECONDARY, fontSize: TYPE_SCALE.caption, marginTop: 4, fontFamily: FONTS.bodyEn },
  btn: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  btnText: { color: GOLD_BTN_TEXT, fontSize: TYPE_SCALE.caption, fontWeight: '700' },
});
