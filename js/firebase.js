import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

const cfg = {
  apiKey: "AIzaSyCVz4TxqdDSSCn7Ztdt_c0rH9fuG3rYRIQ",
  authDomain: "project-1377923308705650525.firebaseapp.com",
  projectId: "project-1377923308705650525",
  storageBucket: "project-1377923308705650525.firebasestorage.app",
  messagingSenderId: "816182554603",
  appId: "1:816182554603:web:624159d3c9c89a046c73ae"
};

export const ADMIN_EMAIL = 'markshelkonogov003@gmail.com';

export const app = initializeApp(cfg);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const prov = new GoogleAuthProvider();

export function isAdmin() {
  return auth.currentUser?.email === ADMIN_EMAIL;
}

export function ini(n) {
  return (n || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export function toast(title, msg, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warn: '⚠️' };
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<div class="t-ico">${icons[type]}</div><div><div class="t-title">${title}</div>${msg ? `<div class="t-msg">${msg}</div>` : ''}</div>`;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .3s'; el.style.opacity = 0; }, 2700);
  setTimeout(() => el.remove(), 3100);
}
