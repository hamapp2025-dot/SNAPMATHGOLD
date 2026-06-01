import React from 'react';
import AuthScreen from './AuthScreen';

export default function LoginScreen({ onLogin, onBack, navigation }) {
  return <AuthScreen onLogin={onLogin} onBack={onBack} navigation={navigation} />;
}
