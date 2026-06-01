import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppTheme } from '../src/theme/ThemeContext';
import { withAlpha } from '../src/theme/colorUtils';

type ApiKeyPromptModalProps = {
  visible: boolean;
  title: string;
  subtitle: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  isAr: boolean;
  error?: string | null;
  hint?: string;
  saveLabel: string;
  cancelLabel: string;
};

export default function ApiKeyPromptModal({
  visible,
  title,
  subtitle,
  placeholder,
  value,
  onChangeText,
  onClose,
  onSave,
  isAr,
  error = null,
  hint,
  saveLabel,
  cancelLabel,
}: ApiKeyPromptModalProps) {
  const { theme } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[s.headerRow, isAr && s.rowRtl]}>
            <View style={[s.iconWrap, { backgroundColor: withAlpha(theme.accent, 0.14) }]}>
              <Ionicons name="key-outline" size={20} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.title, { color: theme.text }, isAr && s.textRtl]}>{title}</Text>
              <Text style={[s.subtitle, { color: theme.muted }, isAr && s.textRtl]}>{subtitle}</Text>
            </View>
          </View>

          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={theme.muted}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            textContentType="none"
            selectionColor={theme.accent}
            style={[
              s.input,
              {
                backgroundColor: theme.surfaceSoft,
                borderColor: error ? '#FF3B30' : theme.border,
                color: theme.text,
              },
              isAr && s.textRtl,
            ]}
          />

          {hint ? (
            <Text style={[s.hint, { color: theme.muted }, isAr && s.textRtl]}>{hint}</Text>
          ) : null}

          {error ? (
            <View style={[s.errorRow, isAr && s.rowRtl]}>
              <Ionicons name="alert-circle-outline" size={16} color="#FF3B30" />
              <Text style={[s.errorText, isAr && s.textRtl]}>{error}</Text>
            </View>
          ) : null}

          <View style={[s.actions, isAr && s.rowRtl]}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onClose}
              style={[s.secondaryBtn, { borderColor: theme.border, backgroundColor: theme.surfaceSoft }]}>
              <Text style={[s.secondaryBtnText, { color: theme.text }]}>{cancelLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.9} onPress={onSave} style={s.primaryBtnWrap}>
              <LinearGradient colors={theme.primary} style={s.primaryBtn}>
                <Text style={[s.primaryBtnText, { color: theme.primaryInk }]}>{saveLabel}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6,8,22,0.6)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Amiri_700Bold',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Amiri_400Regular',
  },
  input: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: 'Amiri_400Regular',
  },
  hint: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Amiri_400Regular',
  },
  errorRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#FF3B30',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Amiri_400Regular',
  },
  actions: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontFamily: 'Amiri_700Bold',
  },
  primaryBtnWrap: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  primaryBtn: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  primaryBtnText: {
    fontSize: 14,
    fontFamily: 'Amiri_700Bold',
  },
  textRtl: {
    textAlign: 'right',
  },
});
