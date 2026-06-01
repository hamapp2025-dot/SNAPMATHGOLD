// src/screens/ExamsScreen.js - AR/EN toggle
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, BG, SURFACE, SURFACE_BORDER, GOLD, GOLD_TINT, GOLD_BTN_TEXT, TEXT_PRIMARY as WHITE, TEXT_SECONDARY as MUTED, TYPE_SCALE } from '../config/theme';
import LanguageToggle from '../components/LanguageToggle';
import { useT } from '../config/LanguageContext';

const CARD = SURFACE;
const BORDER = SURFACE_BORDER;
const ACCENT = GOLD;

const EXAMS = [
  { id:'exam_2024', titleEn:'Tawjihi 2024', titleAr:'توجيهي 2024', questions:10, timeLimit:7200, diffEn:'Hard', diffAr:'صعب', year:2024 },
  { id:'exam_2023', titleEn:'Tawjihi 2023', titleAr:'توجيهي 2023', questions:10, timeLimit:7200, diffEn:'Hard', diffAr:'صعب', year:2023 },
  { id:'quiz_unit1',titleEn:'Unit 1 Quiz',  titleAr:'اختبار الوحدة 1', questions:5, timeLimit:1800, diffEn:'Medium', diffAr:'متوسط', year:null },
];

export default function ExamsScreen({ navigation }) {
  const { isAr } = useT();
  const [refreshing, setRefreshing] = useState(false);
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  const fontBold = isAr ? FONTS.headingAr : FONTS.headingEn;
  const fontReg  = isAr ? FONTS.bodyAr : FONTS.bodyEn;
  const fontSemi = isAr ? FONTS.headingAr : FONTS.semiEn;
  const textAlign = isAr ? 'right' : 'left';
  const rowDir   = isAr ? 'row-reverse' : 'row';

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(shimmerAnim,{toValue:1,duration:1500,useNativeDriver:true}),
      Animated.timing(shimmerAnim,{toValue:0,duration:1500,useNativeDriver:true}),
    ])).start();
  },[]);

  const startExam = (exam) => {
    const title = isAr ? exam.titleAr : exam.titleEn;
    const msg = isAr
      ? `${exam.questions} سؤال · ${Math.floor(exam.timeLimit/60)} دقيقة\nهل أنت مستعد؟`
      : `${exam.questions} questions · ${Math.floor(exam.timeLimit/60)} minutes\nAre you ready?`;
    Alert.alert(title, msg, [
      { text: isAr ? 'إلغاء' : 'Cancel', style:'cancel' },
      { text: isAr ? 'ابدأ' : 'Start', onPress: () => Alert.alert(isAr?'قريباً':'Coming Soon', isAr?'محاكي الامتحانات قادم قريباً!':'Exam simulator launching soon!') },
    ]);
  };

  const shimmerOpacity = shimmerAnim.interpolate({inputRange:[0,1],outputRange:[0.7,1]});

  const BACK_COLOR = '#F0F0F0';
  return (
    <SafeAreaView style={s.safe}>
      <View style={[s.headerRow, { flexDirection: rowDir }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.8}>
          <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={24} color={BACK_COLOR} />
        </TouchableOpacity>
        <LanguageToggle />
      </View>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>setRefreshing(false)} tintColor={ACCENT}/>}>
        <View style={s.pageHeader}>
          <Text style={[s.headerTitle,{fontFamily:fontBold,textAlign}]}>{isAr?'الامتحانات':'Exams'}</Text>
          <Text style={[s.headerSub,{fontFamily:fontReg,textAlign}]}>{isAr?'محاكي الامتحانات':'Exam Simulator'}</Text>
        </View>

        <Animated.View style={{opacity:shimmerOpacity}}>
          <TouchableOpacity style={s.bigCard} onPress={()=>startExam(EXAMS[0])}>
            <View style={[s.bigCardTop,{flexDirection:rowDir}]}>
              <Ionicons name="document-text-outline" size={36} color={GOLD} />
              <View style={s.hotBadge}><Text style={[s.hotTxt,{fontFamily:fontBold}]}>{isAr?'مميز':'HOT'}</Text></View>
            </View>
            <Text style={[s.bigCardTitle,{fontFamily:fontBold,textAlign}]}>{isAr?'نموذج امتحان التوجيهي - Tawjihi Mock Exam':'Tawjihi Mock Exam'}</Text>
            <Text style={[s.bigCardSub,{fontFamily:fontReg,textAlign}]}>{isAr?'امتحان كامل · 10 أسئلة · ساعتان':'Full Mock · 10 Qs · 2 Hours'}</Text>
            <View style={[s.bigCardStats,{flexDirection:rowDir}]}>
              <Text style={[s.bigCardStat,{fontFamily:fontReg}]}>{isAr?'كل الوحدات - All Units':'All Units'}</Text>
              <Text style={[s.bigCardStat,{fontFamily:fontReg}]}>{isAr?'ساعتان':'2 Hours'}</Text>
              <Text style={[s.bigCardStat,{fontFamily:fontReg}]}>+100 XP</Text>
            </View>
            <View style={s.startBtn}>
              <Text style={[s.startBtnTxt,{fontFamily:fontBold}]}>{isAr?'ابدأ الامتحان ←':'Start Exam →'}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity style={[s.tipsBtn,{flexDirection:rowDir}]} onPress={()=>Alert.alert(isAr?'نصائح':'Tips','Coming soon!')}>
          <Ionicons name="bulb-outline" size={20} color={GOLD} />
          <Text style={[s.tipsText,{fontFamily:fontSemi}]}>{isAr?'نصائح واستراتيجيات الامتحان ←':'Exam Tips & Strategies →'}</Text>
        </TouchableOpacity>

        <Text style={[s.sectionTitle,{fontFamily:fontBold,textAlign}]}>{isAr?'جميع الامتحانات':'All Exams'}</Text>

        {EXAMS.map(exam=>(
          <TouchableOpacity key={exam.id} style={[s.examCard,{flexDirection:rowDir}]} onPress={()=>startExam(exam)}>
            <View style={s.examIcon}><Ionicons name="document-outline" size={22} color={GOLD} /></View>
            <View style={{flex:1,marginLeft:isAr?0:12,marginRight:isAr?12:0}}>
              <Text style={[s.examTitle,{fontFamily:fontBold,textAlign}]}>{isAr ? exam.titleAr : exam.titleEn}</Text>
              <Text style={[s.examMeta,{fontFamily:fontReg,textAlign}]}>
                {exam.questions} {isAr?'سؤال':'Qs'} · {Math.floor(exam.timeLimit/60)} {isAr?'دقيقة':'min'}
              </Text>
            </View>
            <View style={s.diffBadge}>
              <Text style={[s.diffText,{fontFamily:fontSemi}]}>{isAr?exam.diffAr:exam.diffEn}</Text>
            </View>
            <Ionicons name={isAr?'chevron-back':'chevron-forward'} size={18} color={MUTED}/>
          </TouchableOpacity>
        ))}
        <View style={{height:100}}/>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:BG},center:{flex:1,backgroundColor:BG,justifyContent:'center',alignItems:'center'},
  scroll:{flex:1},
  headerRow:{ paddingHorizontal:16,paddingTop:8,paddingBottom:4,flexDirection:'row',alignItems:'center',gap:12 },
  backBtn:{ minWidth:44,minHeight:44,justifyContent:'center',alignItems:'center' },
  pageHeader:{paddingTop:16,paddingHorizontal:20,paddingBottom:8},
  headerTitle:{fontSize:TYPE_SCALE.h1,color:WHITE},headerSub:{fontSize:TYPE_SCALE.bodySmall,color:MUTED,marginTop:4},
  bigCard:{backgroundColor:CARD,borderRadius:20,padding:20,marginHorizontal:16,marginTop:16,borderWidth:1,borderColor:BORDER},
  bigCardTop:{justifyContent:'space-between',alignItems:'center',marginBottom:12},
  hotBadge:{backgroundColor:GOLD_TINT,borderRadius:12,paddingHorizontal:12,paddingVertical:4,borderWidth:1,borderColor:ACCENT},
  hotTxt:{fontSize:TYPE_SCALE.caption,color:GOLD_BTN_TEXT},
  bigCardTitle:{fontSize:TYPE_SCALE.h2,color:WHITE,marginBottom:6},
  bigCardSub:{fontSize:TYPE_SCALE.bodySmall,color:MUTED,marginBottom:16},
  bigCardStats:{gap:12,marginBottom:16,flexWrap:'wrap'},
  bigCardStat:{fontSize:TYPE_SCALE.bodySmall,color:MUTED},
  startBtn:{backgroundColor:ACCENT,borderRadius:24,paddingVertical:14,alignItems:'center'},
  startBtnTxt:{fontSize:TYPE_SCALE.body,color:GOLD_BTN_TEXT},
  tipsBtn:{alignItems:'center',gap:8,marginHorizontal:16,marginTop:12,backgroundColor:CARD,borderRadius:16,padding:16,borderWidth:1,borderColor:BORDER},
  tipsText:{fontSize:TYPE_SCALE.body,color:ACCENT},
  sectionTitle:{fontSize:TYPE_SCALE.h2,color:WHITE,marginTop:24,marginBottom:12,marginHorizontal:20},
  examCard:{alignItems:'center',backgroundColor:CARD,borderRadius:16,padding:16,marginHorizontal:16,marginBottom:8,borderWidth:1,borderColor:BORDER},
  examIcon:{width:48,height:48,borderRadius:24,backgroundColor:'rgba(201,168,76,0.15)',alignItems:'center',justifyContent:'center'},
  examTitle:{fontSize:TYPE_SCALE.body,color:WHITE,marginBottom:4},examMeta:{fontSize:TYPE_SCALE.bodySmall,color:MUTED},
  diffBadge:{backgroundColor:'#1A1608',borderRadius:8,paddingHorizontal:10,paddingVertical:4,borderWidth:1,borderColor:BORDER},
  diffText:{fontSize:12,color:ACCENT},
});
