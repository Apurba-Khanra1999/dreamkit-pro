// Firebase configuration and authentication setup
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDqXqxrmpODfoD2hhLCeMxQwWfg0YdLz4c",
  authDomain: "smart-investment-pro.firebaseapp.com",
  projectId: "smart-investment-pro",
  storageBucket: "smart-investment-pro.firebasestorage.app",
  messagingSenderId: "55517857814",
  appId: "1:55517857814:web:e68ab166a8ea3debde4d37"
};

// Initialize Firebase only once
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Sign in with Google Popup (Gmail)
 */
export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Sign in with Email and Password
 */
export async function loginWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

/**
 * Register / Sign up with Email, Password and optional Display Name
 */
export async function registerWithEmail(email, password, displayName = '') {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName && result.user) {
    try {
      await updateProfile(result.user, { displayName });
    } catch {
      // Continue even if profile update fails
    }
  }
  return result.user;
}

/**
 * Send password reset email
 */
export async function resetPassword(email) {
  return await sendPasswordResetEmail(auth, email);
}

/**
 * Sign out current user
 */
export async function logoutUser() {
  return await signOut(auth);
}

export { auth, googleProvider, onAuthStateChanged };
export default app;
