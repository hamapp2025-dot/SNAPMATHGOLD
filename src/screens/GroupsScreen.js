// src/screens/GroupsScreen.js - theme, LanguageContext, RTL
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Animated, Alert, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LanguageToggle from '../components/LanguageToggle';
import { useT } from '../config/LanguageContext';
import { BG, SURFACE as CARD, SURFACE_BORDER as BORDER, INPUT_BG, TEXT_PRIMARY as WHITE, TEXT_SECONDARY as MUTED, TEXT_TERTIARY, GOLD, GOLD_DIM, GOLD_TINT, GOLD_BTN_TEXT, FONTS } from '../config/theme';

const MOCK_GROUPS = [
  {
    id: 'g1',
    name: 'Tawjihi 2026 — الجبر',
    nameEn: 'Algebra Masters',
    topicAr: 'الوحدة 1 · الدوال والجبر',
    topicEn: 'Unit 1 · Functions & Algebra',
    members: 12, maxMembers: 20,
    online: 4,
    code: 'ALG-2026',
    emoji: '',
    activity: 'Discussing partial fractions',
    activityAr: 'مناقشة الكسور الجزئية',
    joined: true,
    messages: [
      { id:1, user:'Zain', text:'هل حل أحد المسألة رقم 5؟', time:'4:12', isMe:false },
      { id:2, user:'Sara',  text:'نعم! استخدم نظرية الباقي أولاً', time:'4:13', isMe:false },
      { id:3, user:'Me',    text:'شكراً سارة! جربت وفهمت الآن', time:'4:15', isMe:true },
      { id:4, user:'Khalid',text:'ما هي أسئلة التوجيهي المتكررة؟', time:'4:18', isMe:false },
    ],
  },
  {
    id: 'g2',
    name: 'مجموعة التفاضل',
    nameEn: 'Calculus Study Room',
    topicAr: 'الوحدة 3 · التفاضل',
    topicEn: 'Unit 3 · Differentiation',
    members: 8, maxMembers: 15,
    online: 3,
    code: 'CALC-303',
    emoji: '',
    activity: 'Chain rule practice',
    activityAr: 'تمارين قاعدة السلسلة',
    joined: true,
    messages: [
      { id:1, user:'Lina',  text:'قاعدة السلسلة صعبة جداً عليّ', time:'3:50', isMe:false },
      { id:2, user:'Omar',  text:'dy/dx = dy/du × du/dx — هذا كل شيء!', time:'3:52', isMe:false },
      { id:3, user:'Me',    text:'دعوني أشارك مثالاً...', time:'3:55', isMe:true },
    ],
  },
  {
    id: 'g3',
    name: 'Tawjihi Final Sprint',
    nameEn: 'Tawjihi Final Sprint',
    topicAr: 'كل الوحدات · مراجعة شاملة',
    topicEn: 'All Units · Full Revision',
    members: 24, maxMembers: 30,
    online: 9,
    code: 'TWJI-24',
    emoji: '',
    activity: 'Mock exam discussion',
    activityAr: 'مناقشة الامتحان التجريبي',
    joined: false,
    messages: [],
  },
  {
    id: 'g4',
    name: 'الأعداد المركبة',
    nameEn: 'Complex Numbers',
    topicAr: 'الوحدة 4 · الأعداد المركبة',
    topicEn: 'Unit 4 · Complex Numbers',
    members: 6, maxMembers: 10,
    online: 2,
    code: 'CMPLX-4',
    emoji: '',
    activity: 'Polar form help',
    activityAr: 'مساعدة في الصورة القطبية',
    joined: false,
    messages: [],
  },
];

const AVATAR_COLORS = [BORDER, BORDER, BORDER, BORDER, INPUT_BG, BORDER, INPUT_BG, BORDER];
const AVATAR_INITIALS = ['A','S','K','L','O','M','R','H'];

export default function GroupsScreen({ navigation }) {
  const { t, isAr } = useT();
  const rowDir = isAr ? 'row-reverse' : 'row';
  const textAlign = isAr ? 'right' : 'left';
  const fontBold = isAr ? FONTS.headingAr : FONTS.headingEn;
  const fontReg = isAr ? FONTS.bodyAr : FONTS.bodyEn;
  const bilingual = (ar, en) => (isAr ? ar : en);
  const [groups, setGroups]           = useState(MOCK_GROUPS);
  const [activeGroup, setActiveGroup] = useState(null);
  const [chatMsg, setChatMsg]         = useState('');
  const [showJoin, setShowJoin]       = useState(false);
  const [showCreate, setShowCreate]   = useState(false);
  const [joinCode, setJoinCode]       = useState('');
  const [newName, setNewName]         = useState('');
  const [newTopic, setNewTopic]       = useState('');
  const [tab, setTab]                 = useState('my'); // my | discover
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue:1, duration:400, useNativeDriver:true }),
      Animated.timing(slideAnim, { toValue:0, duration:400, useNativeDriver:true }),
    ]).start();
  }, []);

  const myGroups      = groups.filter(g => g.joined);
  const discoverGroups = groups.filter(g => !g.joined);

  const joinGroup = (group) => {
    if (group.members >= group.maxMembers) {
      Alert.alert(isAr ? 'المجموعة ممتلئة' : 'Group is full', isAr ? 'هذه المجموعة ممتلئة.' : 'This group is full');
      return;
    }
    setGroups(prev => prev.map(g => g.id === group.id ? { ...g, joined:true, members: g.members+1 } : g));
    Alert.alert(isAr ? 'تم الانضمام' : (t('joined') || 'Joined'), isAr ? `تم الانضمام إلى "${group.name}"` : `Joined "${group.nameEn}"`);
  };

  const sendMessage = () => {
    if (!chatMsg.trim() || !activeGroup) return;
      const newMsg = { id: Date.now(), user: isAr ? 'أنا' : 'Me', text: chatMsg, time: new Date().toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'}), isMe:true };
    setGroups(prev => prev.map(g =>
      g.id === activeGroup.id ? { ...g, messages:[...g.messages, newMsg] } : g
    ));
    setActiveGroup(prev => ({ ...prev, messages:[...prev.messages, newMsg] }));
    setChatMsg('');
  };

  const handleJoinCode = () => {
    const found = groups.find(g => g.code.toLowerCase() === joinCode.trim().toLowerCase());
    if (found) { joinGroup(found); setShowJoin(false); setJoinCode(''); }
    else Alert.alert(isAr ? 'خطأ' : (t('error') || 'Error'), isAr ? 'رمز غير صحيح' : 'Invalid code');
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    const newGroup = {
      id: `g${Date.now()}`,
      name: newName, nameEn: newName,
      topicAr: newTopic || 'دراسة عامة',
      topicEn: newTopic || 'General Study',
      members:1, maxMembers:20, online:1,
      code: newName.slice(0,4).toUpperCase()+'-'+Math.floor(Math.random()*900+100),
      emoji:'', activity:'Just created!', activityAr:'تم الإنشاء للتو!',
      joined:true, messages:[],
    };
    setGroups(prev => [newGroup, ...prev]);
    setShowCreate(false); setNewName(''); setNewTopic('');
    Alert.alert(isAr ? 'تم' : (t('done') || 'Done'), isAr ? `تم إنشاء المجموعة! الرمز: ${newGroup.code}` : `Group created! Code: ${newGroup.code}`);
  };

  // ── CHAT VIEW ──
  if (activeGroup) {
    const grp = groups.find(g => g.id === activeGroup.id) || activeGroup;
    return (
      <SafeAreaView style={s.safe}>
        {/* Chat Header */}
        <View style={[s.chatHeader, { flexDirection: rowDir }]}>
          <TouchableOpacity onPress={() => setActiveGroup(null)} style={s.chatBackBtn} activeOpacity={0.8}>
            <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={24} color={WHITE} />
          </TouchableOpacity>
          <LanguageToggle />
          <View style={{ flex:1 }}>
            <Text style={[s.chatTitle, {fontFamily: fontBold}]}>{isAr ? grp.name : grp.nameEn}</Text>
            <Text style={[s.chatSub, {fontFamily: fontReg}]}>{grp.online} {t('online')} · {grp.members} {t('members')}</Text>
          </View>
          <View style={s.onlinePile}>
            {AVATAR_INITIALS.slice(0, Math.min(grp.online, 4)).map((a,i) => (
              <View key={i} style={[s.avatarCircle, { marginLeft: i > 0 ? -8 : 0, backgroundColor: AVATAR_COLORS[i] }]}>
                <Text style={[s.avatarInitial, {fontFamily: FONTS.semiEn}]}>{a}</Text>
              </View>
            ))}
            {grp.online > 4 && <Text style={[s.moreOnline, {fontFamily: FONTS.semiEn}]}>+{grp.online-4}</Text>}
          </View>
        </View>

        {/* Messages */}
        <ScrollView style={s.chatScroll} contentContainerStyle={{ padding:16, gap:10 }}>
          {/* Session card */}
          <View style={s.sessionCard}>
            <View style={s.sessionIconWrap}><Ionicons name="chatbubbles-outline" size={28} color={GOLD} /></View>
            <View>
              <Text style={[s.sessionTitle, {fontFamily: fontBold}]}>{t('activeStudySession')}</Text>
              <Text style={[s.sessionSub, {fontFamily: fontReg}]}>{isAr ? grp.activityAr : grp.activity}</Text>
            </View>
          </View>

          {grp.messages.map(msg => (
            <View key={msg.id} style={[s.msgRow, msg.isMe && s.msgRowMe]}>
              {!msg.isMe && (
              <View style={[s.avatarCircle, { backgroundColor: AVATAR_COLORS[msg.user.length % AVATAR_COLORS.length] }]}>
                <Text style={[s.avatarInitial, {fontFamily: FONTS.semiEn}]}>{msg.user[0]}</Text>
              </View>
            )}
              <View style={[s.bubble, msg.isMe ? s.bubbleMe : s.bubbleThem]}>
                {!msg.isMe && <Text style={[s.msgUser, {fontFamily: fontReg}]}>{msg.user}</Text>}
                <Text style={[s.msgText, { fontFamily: fontReg }, msg.isMe && { color:BG }]}>{msg.text}</Text>
                <Text style={[s.msgTime, { fontFamily: fontReg }, msg.isMe && { color:TEXT_TERTIARY }]}>{msg.time}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Input */}
        <View style={s.inputRow}>
          <TextInput
            style={[s.chatInput, { fontFamily: fontReg }]}
            placeholder={t('typeMessage')}
            placeholderTextColor={TEXT_TERTIARY}
            value={chatMsg}
            onChangeText={setChatMsg}
            multiline
          />
          <TouchableOpacity style={[s.sendBtn, !chatMsg.trim() && { opacity:0.4 }]} onPress={sendMessage}>
            <Text style={[s.sendTxt, {fontFamily: fontBold}]}>{isAr ? '←' : '→'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── GROUPS LIST ──
  return (
    <SafeAreaView style={s.safe}>
      <Animated.View style={{ flex:1, opacity:fadeAnim, transform:[{translateY:slideAnim}] }}>

        {/* Header — back left (chevron-back), then toggle, then title, then buttons */}
        <View style={[s.header, { flexDirection: rowDir }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.8}>
            <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={24} color={WHITE} />
          </TouchableOpacity>
          <LanguageToggle />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[s.headerTitle, {fontFamily: fontBold}]}>{t('studyGroups')}</Text>
            <Text style={[s.headerSub, {fontFamily: fontReg}]}>{t('learnTogether')}</Text>
          </View>
          <View style={s.headerBtns}>
            <TouchableOpacity style={s.iconBtn} onPress={() => setShowJoin(true)}>
              <Ionicons name="link-outline" size={20} color={GOLD} />
            </TouchableOpacity>
            <TouchableOpacity style={s.createBtn} onPress={() => setShowCreate(true)}>
              <Text style={[s.createBtnTxt, {fontFamily: fontBold}]}>+ {t('create')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={s.tabs}>
          <TouchableOpacity style={[s.tabBtn, tab==='my' && s.tabActive]} onPress={() => setTab('my')}>
            <Text style={[{fontFamily: fontBold},s.tabTxt, tab==='my' && s.tabTxtActive]}>{t('myGroups')} ({myGroups.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tabBtn, tab==='discover' && s.tabActive]} onPress={() => setTab('discover')}>
            <Text style={[{fontFamily: fontBold},s.tabTxt, tab==='discover' && s.tabTxtActive]}>{t('discover')} ({discoverGroups.length})</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding:16, gap:12 }}>
          {(tab === 'my' ? myGroups : discoverGroups).map(group => (
            <TouchableOpacity
              key={group.id}
              style={s.groupCard}
              onPress={() => group.joined ? setActiveGroup(group) : null}
              activeOpacity={0.8}
            >
              {/* Online indicator */}
              <View style={s.cardTop}>
                <View style={s.emojiWrap}>
                  <Ionicons name="people-outline" size={24} color={GOLD} />
                </View>
                <View style={{ flex:1 }}>
                  <Text style={[s.groupName, {fontFamily: isAr ? FONTS.headingAr : FONTS.semiEn}]}>{isAr ? group.name : group.nameEn}</Text>
                  <Text style={[s.groupTopic, {fontFamily: fontReg}]}>{bilingual(group.topicAr, group.topicEn)}</Text>
                </View>
                <View style={s.onlineBadge}>
                  <View style={s.onlineDot} />
                  <Text style={[s.onlineCount, {fontFamily: FONTS.semiEn}]}>{group.online}</Text>
                </View>
              </View>

              {/* Activity */}
              <Text style={[s.activityTxt, {fontFamily: fontReg}]}>
                {isAr ? group.activityAr : group.activity}
              </Text>

              {/* Footer */}
              <View style={s.cardFooter}>
                {/* Member avatars */}
                <View style={s.membersRow}>
                  {AVATAR_INITIALS.slice(0,4).map((a,i) => (
                  <View key={i} style={[s.memberAvatarCircle, { marginLeft: i>0 ? -6:0, backgroundColor: AVATAR_COLORS[i] }]}>
                    <Text style={[s.memberAvatarTxt, {fontFamily: FONTS.semiEn}]}>{a}</Text>
                  </View>
                ))}
                  <Text style={[s.memberCount, {fontFamily: FONTS.semiEn}]}> {group.members}/{group.maxMembers}</Text>
                </View>

                {/* Progress bar */}
                <View style={s.memberBar}>
                  <View style={[s.memberFill, { width: `${(group.members/group.maxMembers)*100}%` }]} />
                </View>

                {group.joined ? (
                  <TouchableOpacity style={s.enterBtn} onPress={() => setActiveGroup(group)}>
                    <Text style={[s.enterBtnTxt, {fontFamily: fontBold}]}>{t('enter')}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={s.joinBtn} onPress={() => joinGroup(group)}>
                    <Text style={[s.joinBtnTxt, {fontFamily: fontBold}]}>{t('join')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))}

          {tab === 'my' && myGroups.length === 0 && (
            <View style={s.empty}>
              <Ionicons name="people-outline" size={48} color={GOLD} />
              <Text style={[s.emptyTxt, {fontFamily: fontReg}]}>{t('noGroupsYet')}</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => setTab('discover')}>
                <Text style={[s.emptyBtnTxt, {fontFamily: fontBold}]}>{t('discoverGroups')}</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={{ height:20 }} />
        </ScrollView>
      </Animated.View>

      {/* JOIN MODAL */}
      <Modal visible={showJoin} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <Text style={[s.modalTitle, {fontFamily: fontBold}]}>{t('joinWithCode')}</Text>
            <Text style={[s.modalSub, {fontFamily: fontReg}]}>{t('enterGroupCode')}</Text>
            <TextInput
              style={[s.modalInput, { fontFamily: fontReg }]}
              placeholder={isAr ? 'مثال: ALG-2026' : 'e.g. ALG-2026'}
              placeholderTextColor={TEXT_TERTIARY}
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="characters"
            />
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setShowJoin(false)}>
                <Text style={[s.modalCancelTxt, {fontFamily: fontReg}]}>{t('cancelLabel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalConfirm} onPress={handleJoinCode}>
                <Text style={[s.modalConfirmTxt, {fontFamily: fontBold}]}>{t('join')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CREATE MODAL */}
      <Modal visible={showCreate} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <Text style={[s.modalTitle, {fontFamily: fontBold}]}>{t('createGroup')}</Text>
            <TextInput
              style={[s.modalInput, { marginBottom:10, fontFamily: fontReg }]}
              placeholder={t('groupName')}
              placeholderTextColor={TEXT_TERTIARY}
              value={newName}
              onChangeText={setNewName}
            />
            <TextInput
              style={[s.modalInput, { fontFamily: fontReg }]}
              placeholder={t('topic')}
              placeholderTextColor={TEXT_TERTIARY}
              value={newTopic}
              onChangeText={setNewTopic}
            />
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setShowCreate(false)}>
                <Text style={[s.modalCancelTxt, {fontFamily: fontReg}]}>{t('cancelLabel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalConfirm} onPress={handleCreate}>
                <Text style={[s.modalConfirmTxt, {fontFamily: fontBold}]}>{t('create')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor: BG },

  // Header
  backBtn:     { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center', marginEnd: 8 },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 54, paddingBottom: 14, gap: 8 },
  headerTitle: { fontFamily: FONTS.semiEn, color: WHITE, fontSize:22, fontWeight:'700' },
  headerSub:   { fontFamily: FONTS.semiEn, color:MUTED, fontSize:12, marginTop:2 },
  headerBtns:  { flexDirection:'row', gap:8, alignItems:'center' },
  iconBtn:     { width:38, height:38, borderRadius:10, backgroundColor:CARD, borderWidth:1, borderColor:BORDER, justifyContent:'center', alignItems:'center' },
  iconBtnTxt:  { fontFamily: FONTS.semiEn, fontSize:18 },
  createBtn:   { backgroundColor: GOLD, borderRadius:10, paddingHorizontal:14, paddingVertical:9 },
  createBtnTxt:{ fontFamily: FONTS.semiEn, color:GOLD_BTN_TEXT, fontWeight:'800', fontSize:13 },

  // Tabs
  tabs:        { flexDirection:'row', marginHorizontal:16, backgroundColor:CARD, borderRadius:12, padding:4, marginBottom:8, borderWidth:1, borderColor:BORDER },
  tabBtn:      { flex:1, paddingVertical:10, borderRadius:8, alignItems:'center' },
  tabActive:   { backgroundColor:INPUT_BG, borderWidth:1, borderColor: GOLD },
  tabTxt:      { fontFamily: FONTS.semiEn, color:TEXT_TERTIARY, fontSize:13, fontWeight:'600' },
  tabTxtActive:{ fontFamily: FONTS.semiEn, color: WHITE, fontSize:13, fontWeight:'700' },

  // Group Card
  groupCard:   { backgroundColor:CARD, borderRadius:14, borderWidth:1, borderColor:BORDER, padding:16 },
  cardTop:     { flexDirection:'row', alignItems:'center', gap:12, marginBottom:10 },
  emojiWrap:   { width:46, height:46, borderRadius:14, backgroundColor:INPUT_BG, borderWidth:1, borderColor:BORDER, justifyContent:'center', alignItems:'center' },
  groupEmoji:  { fontFamily: FONTS.semiEn, fontSize:22 },
  groupName:   { fontFamily: FONTS.semiEn, color:WHITE, fontSize:16, fontWeight:'700' },
  groupTopic:  { fontFamily: FONTS.semiEn, color:TEXT_TERTIARY, fontSize:12, marginTop:2 },
  onlineBadge: { flexDirection:'row', alignItems:'center', backgroundColor:INPUT_BG, borderWidth:1, borderColor:BORDER, borderRadius:20, paddingHorizontal:8, paddingVertical:4, gap:4 },
  onlineDot:   { width:6, height:6, borderRadius:3, backgroundColor:GOLD },
  onlineCount: { fontFamily: FONTS.semiEn, color:GOLD, fontSize:12, fontWeight:'700' },
  activityTxt: { fontFamily: FONTS.semiEn, color:TEXT_TERTIARY, fontSize:12, marginBottom:12, paddingLeft:4 },
  cardFooter:  { flexDirection:'row', alignItems:'center', gap:10 },
  membersRow:  { flexDirection:'row', alignItems:'center' },
  memberAvatarCircle: { width:22, height:22, borderRadius:11, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:BORDER },
  memberAvatarTxt: { fontFamily: FONTS.semiEn, color:TEXT_TERTIARY, fontSize:9, fontWeight:'700' },
  memberCount: { fontFamily: FONTS.semiEn, color:TEXT_TERTIARY, fontSize:11 },
  memberBar:   { flex:1, height:3, backgroundColor:GOLD_DIM, borderRadius:2 },
  memberFill:  { height:3, backgroundColor: GOLD, borderRadius:2 },
  enterBtn:    { backgroundColor:GOLD_TINT, borderRadius:10, paddingHorizontal:14, paddingVertical:8, borderWidth:1, borderColor:GOLD },
  enterBtnTxt: { fontFamily: FONTS.semiEn, color: GOLD, fontWeight:'700', fontSize:13 },
  joinBtn:     { backgroundColor: GOLD, borderRadius:10, paddingHorizontal:14, paddingVertical:8 },
  joinBtnTxt:  { fontFamily: FONTS.semiEn, color:BG, fontWeight:'800', fontSize:13 },

  // Empty
  empty:       { alignItems:'center', paddingTop:60, gap:12 },
  emptyTxt:    { fontFamily: FONTS.semiEn, color:TEXT_TERTIARY, fontSize:14, textAlign:'center' },
  emptyBtn:    { backgroundColor: GOLD, borderRadius:12, paddingHorizontal:20, paddingVertical:10 },
  emptyBtnTxt: { fontFamily: FONTS.semiEn, color:BG, fontWeight:'800', fontSize:14 },

  // Chat
  chatHeader:  { flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingVertical:14, borderBottomWidth:1, borderBottomColor:BORDER, gap:10 },
  chatBackBtn:{ minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center', padding: 8 },
  chatTitle:   { fontFamily: FONTS.semiEn, color:WHITE, fontSize:16, fontWeight:'700' },
  chatSub:     { fontFamily: FONTS.bodyEn, color:TEXT_SECONDARY, fontSize:11, marginTop:1 },
  onlinePile:  { flexDirection:'row', alignItems:'center' },
  avatarEmoji: { fontFamily: FONTS.semiEn, fontSize:20 },
  moreOnline:  { fontFamily: FONTS.semiEn, color:TEXT_TERTIARY, fontSize:11, marginLeft:4 },
  chatScroll:  { flex:1 },
  sessionCard: { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:'rgba(191,160,68,0.08)', borderRadius:16, padding:14, borderWidth:1, borderColor:'rgba(191,160,68,0.2)', marginBottom:8 },
  sessionIconWrap: {},
  sessionTitle:{ fontFamily: FONTS.semiEn, color: GOLD, fontWeight:'700', fontSize:14 },
  sessionSub:  { fontFamily: FONTS.semiEn, color:MUTED, fontSize:12, marginTop:2 },
  msgRow:      { flexDirection:'row', alignItems:'flex-end', gap:8 },
  msgRowMe:    { justifyContent:'flex-end' },

  bubble:      { maxWidth:'75%', borderRadius:16, padding:12 },
  bubbleThem:  { backgroundColor:'#1A1608', borderTopLeftRadius:4 },
  bubbleMe:    { backgroundColor: GOLD, borderTopRightRadius:4 },
  msgUser:     { fontFamily: FONTS.semiEn, color:MUTED, fontSize:11, fontWeight:'700', marginBottom:4 },
  msgText:     { fontFamily: FONTS.semiEn, color:WHITE, fontSize:14, lineHeight:20 },
  msgTime:     { fontFamily: FONTS.semiEn, color:TEXT_TERTIARY, fontSize:10, marginTop:4, textAlign:'right' },
  inputRow:    { flexDirection:'row', alignItems:'flex-end', padding:12, gap:10, borderTopWidth:1, borderTopColor:'#111' },
  chatInput:   { fontFamily: FONTS.bodyEn, flex:1, backgroundColor:INPUT_BG, borderRadius:16, paddingHorizontal:16, paddingVertical:12, color:WHITE, fontSize:14, borderWidth:1, borderColor:BORDER, maxHeight:100 },
  sendBtn:     { width:46, height:46, backgroundColor: GOLD, borderRadius:14, justifyContent:'center', alignItems:'center' },
  sendTxt:     { fontFamily: FONTS.semiEn, color:BG, fontSize:20, fontWeight:'900' },

  // Modal
  modalOverlay:  { flex:1, backgroundColor:'rgba(0,0,0,0.85)', justifyContent:'center', alignItems:'center', padding:24 },
  modal:         { backgroundColor:CARD, borderRadius:20, padding:24, width:'100%', borderWidth:1, borderColor:BORDER },
  modalTitle:    { fontFamily: FONTS.semiEn, color:WHITE, fontSize:20, fontWeight:'700', marginBottom:6 },
  modalSub:      { fontFamily: FONTS.bodyEn, color:TEXT_SECONDARY, fontSize:13, marginBottom:16 },
  modalInput:    { fontFamily: FONTS.bodyEn, backgroundColor:INPUT_BG, borderRadius:12, paddingHorizontal:16, paddingVertical:14, color:WHITE, fontSize:15, borderWidth:1, borderColor:BORDER, marginBottom:20 },
  modalBtns:     { flexDirection:'row', gap:10 },
  modalCancel:   { flex:1, backgroundColor:'#1A1608', borderRadius:12, paddingVertical:14, alignItems:'center', borderWidth:1, borderColor:BORDER },
  modalCancelTxt:{ fontFamily: FONTS.semiEn, color:TEXT_TERTIARY, fontWeight:'600', fontSize:14 },
  modalConfirm:  { flex:1, backgroundColor: GOLD, borderRadius:12, paddingVertical:14, alignItems:'center' },
  modalConfirmTxt:{ fontFamily: FONTS.semiEn, color:BG, fontWeight:'800', fontSize:14 },
});
