// src/screens/AuthScreen.js - AR/EN toggle
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BG, SURFACE, SURFACE_BORDER, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, GOLD, GOLD_BUTTON_GRADIENT, GOLD_BTN_TEXT, FONTS, TYPE_SCALE } from '../config/theme';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useT } from '../config/LanguageContext';

const DEMO_EMAIL = 'demo@snapmathacademy.com', DEMO_PASSWORD = 'demo123456';
const BORDER = SURFACE_BORDER, MUTED = TEXT_SECONDARY;

export default function AuthScreen({ onLogin, onBack, navigation }) {
  const { t, isAr } = useT();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fontBold = isAr ? FONTS.headingAr : FONTS.headingEn;
  const fontReg  = isAr ? FONTS.bodyAr : FONTS.bodyEn;
  const textAlign = isAr ? 'right' : 'left';

  const handleDemoLogin = async () => {
    setLoading(true); setError('');
    try {
      const r = await signInWithEmailAndPassword(auth, DEMO_EMAIL, DEMO_PASSWORD);
      onLogin?.(r.user);
    } catch {
      try {
        const r = await createUserWithEmailAndPassword(auth, DEMO_EMAIL, DEMO_PASSWORD);
        await updateProfile(r.user, { displayName: isAr ? 'مستخدم تجريبي' : 'Demo User' });
        onLogin?.(r.user);
      } catch (e2) { setError(e2?.message || (isAr ? 'فشل تسجيل الدخول التجريبي' : 'Demo login failed')); }
    } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError(isAr ? 'يرجى إدخال البريد وكلمة المرور' : 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        const c = await signInWithEmailAndPassword(auth, email.trim(), password);
        onLogin?.(c.user);
      } else {
        if (password.length < 6) {
          setError(isAr ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
          setLoading(false); return;
        }
        const c = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) await updateProfile(c.user, { displayName: name.trim() });
        onLogin?.(c.user);
      }
    } catch (e) { setError(e.message || (isAr ? 'فشلت عملية تسجيل الدخول' : 'Authentication failed')); }
    setLoading(false);
  };

  return (
    <View style={s.container}>
      <SafeAreaView style={s.safe} edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={s.keyboard}>
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            <View style={[s.header, {flexDirection: isAr ? 'row-reverse' : 'row'}]}>
              <TouchableOpacity onPress={() => navigation?.canGoBack?.() ? navigation.goBack() : onBack?.()} activeOpacity={0.8}>
                <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={28} color={TEXT_PRIMARY}/>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.8}>
                  <Ionicons name="help-circle-outline" size={26} color={TEXT_TERTIARY}/>
              </TouchableOpacity>
            </View>

            <Text style={[s.title, {fontFamily: fontBold}]}>
              {mode==='login' ? t('login') : t('signup')}
            </Text>

            <View style={s.socialRow}>
              {['logo-google','logo-apple','logo-facebook'].map((icon,i) => (
                <TouchableOpacity key={i} style={s.socialCircle} activeOpacity={0.7}>
                  <Ionicons name={icon} size={28} color={TEXT_PRIMARY}/>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.divider}>
              <View style={s.dividerLine}/>
              <Text style={[s.dividerText, {fontFamily: fontReg}]}>{t('orDivider')}</Text>
              <View style={s.dividerLine}/>
            </View>

            {mode==='signup' && (
              <TextInput style={[s.input, {fontFamily: fontReg, textAlign}]}
                placeholder={t('name')} placeholderTextColor={TEXT_TERTIARY}
                value={name} onChangeText={setName} autoCapitalize="words"/>
            )}
            <TextInput style={[s.input, {fontFamily: fontReg, textAlign}]}
              placeholder={t('email')} placeholderTextColor={TEXT_TERTIARY}
              value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/>
            <TextInput style={[s.input, {fontFamily: fontReg, textAlign}]}
              placeholder={t('password')} placeholderTextColor={TEXT_TERTIARY}
              value={password} onChangeText={setPassword} secureTextEntry/>

            {mode==='login' && (
              <TouchableOpacity style={s.forgotWrap}>
                <Text style={[s.forgotText, {fontFamily: fontReg}]}>
                  {t('forgotPass')} <Text style={s.forgotLink}>{t('resetIt')}</Text>
                </Text>
              </TouchableOpacity>
            )}
            {error ? <Text style={[s.error, {fontFamily: fontReg}]}>{error}</Text> : null}
            <View style={s.flexSpacer}/>

            <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} disabled={loading}>
              <LinearGradient colors={GOLD_BUTTON_GRADIENT.colors} start={GOLD_BUTTON_GRADIENT.start} end={GOLD_BUTTON_GRADIENT.end} style={s.submitGrad}>
                <Text style={[s.submitText, {fontFamily: fontBold}]}>
                  {loading ? '...' : mode==='login' ? t('login') : t('signup')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={[s.footer, {fontFamily: fontReg}]}>{isAr ? 'الخصوصية · الشروط' : 'Privacy · Terms'}</Text>
            <TouchableOpacity style={s.toggleWrap} onPress={() => setMode(m => m==='login'?'signup':'login')}>
              <Text style={[s.toggleText, {fontFamily: fontReg}]}>
                {mode==='login' ? t('noAccount') : t('hasAccount')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.demoWrap} onPress={handleDemoLogin} disabled={loading}>
              <Text style={[s.demoText, {fontFamily: fontBold}]}>{t('demoLogin')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:BG},safe:{flex:1},keyboard:{flex:1},
  scroll:{paddingHorizontal:16,paddingBottom:40},
  header:{paddingTop:54,paddingHorizontal:16,justifyContent:'space-between',alignItems:'center',height:80},
  title:{color:TEXT_PRIMARY,fontSize:30,textAlign:'center',marginTop:32,marginBottom:40},
  socialRow:{flexDirection:'row',justifyContent:'center',gap:20,marginBottom:32},
  socialCircle:{width:56,height:56,borderRadius:28,backgroundColor:SURFACE,borderWidth:1,borderColor:SURFACE_BORDER,alignItems:'center',justifyContent:'center'},
  divider:{flexDirection:'row',alignItems:'center',marginBottom:24},
  dividerLine:{flex:1,height:1,backgroundColor:BORDER},
  dividerText:{color:MUTED,marginHorizontal:16,fontSize:14},
  input:{backgroundColor:SURFACE,borderRadius:28,height:56,paddingHorizontal:24,fontSize:TYPE_SCALE.body,color:TEXT_PRIMARY,marginBottom:12,borderWidth:1,borderColor:SURFACE_BORDER},
  forgotWrap:{alignItems:'center',marginTop:8},
  forgotText:{color:MUTED,fontSize:14},forgotLink:{textDecorationLine:'underline',color:MUTED},
  error:{color:'#FF3B30',fontSize:14,marginBottom:12,textAlign:'center'},
  flexSpacer:{flex:1,minHeight:40},
  submitBtn:{borderRadius:28,overflow:'hidden',height:56,marginHorizontal:16,marginBottom:8},
  submitGrad:{flex:1,justifyContent:'center',alignItems:'center'},
  submitText:{color:GOLD_BTN_TEXT,fontSize:TYPE_SCALE.h3},
  footer:{color:MUTED,fontSize:12,textAlign:'center',marginBottom:20},
  toggleWrap:{alignItems:'center',marginBottom:16},
  toggleText:{color:MUTED,fontSize:14},
  demoWrap:{alignItems:'center',paddingVertical:12,marginBottom:16},
  demoText:{color:GOLD,fontSize:TYPE_SCALE.body},
});
