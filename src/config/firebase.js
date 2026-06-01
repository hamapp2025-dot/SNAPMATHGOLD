// src/config/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDHE4Q_rHO7lVEphW9V8yP5D4LP7hv_gNE',
  authDomain: 'hamza-academy-9d832.firebaseapp.com',
  projectId: 'hamza-academy-9d832',
  storageBucket: 'hamza-academy-9d832.firebasestorage.app',
  messagingSenderId: '287980652608',
  appId: '1:287980652608:web:1801e3fddffa474e19f7a5',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

const AUTH_SINGLETON_KEY = '__SNAPMATH_FIREBASE_AUTH__';
const IS_REACT_NATIVE_RUNTIME =
  typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

function getAuthSingleton() {
  if (globalThis[AUTH_SINGLETON_KEY]) {
    return globalThis[AUTH_SINGLETON_KEY];
  }

  if (IS_REACT_NATIVE_RUNTIME) {
    try {
      globalThis[AUTH_SINGLETON_KEY] = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch (error) {
      if (error?.code === 'auth/already-initialized') {
        globalThis[AUTH_SINGLETON_KEY] = getAuth(app);
      } else {
        throw error;
      }
    }
  } else {
    globalThis[AUTH_SINGLETON_KEY] = getAuth(app);
  }

  return globalThis[AUTH_SINGLETON_KEY];
}

export const auth = getAuthSingleton();
export default app;
