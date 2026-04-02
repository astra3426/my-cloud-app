import { auth, prov, db, isAdmin, ini, toast } from './firebase.js';
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { setDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { loadUsers } from './chat.js';

document.getElementById('logoutX').onclick = () => signOut(auth).then(() => {
  window.location.href = 'login.html';
});

async function saveUserToRegistry(u) {
  try {
    await setDoc(doc(db, 'users', u.uid), {
      uid: u.uid,
      name: u.displayName,
      email: u.email,
      photo: u.photoURL || '',
      lastSeen: serverTimestamp()
    }, { merge: true });
  } catch (e) { console.log('registry', e); }
}

onAuthStateChanged(auth, async u => {
  if (u) {
    document.getElementById('loginTopBtn').style.display = 'none';
    document.getElementById('userPill').classList.add('show');
    if (u.photoURL) {
      document.getElementById('pillPhoto').src = u.photoURL;
    } else {
      document.getElementById('uAvBox').textContent = ini(u.displayName);
    }
    document.getElementById('pillName').textContent = u.displayName.split(' ')[0];
    document.getElementById('guestBox').style.display = 'none';
    document.getElementById('reqForm').style.display = 'flex';
    document.getElementById('fName').value = u.displayName;
    document.getElementById('fEmail').value = u.email;
    document.getElementById('adminPill').style.display = isAdmin() ? 'flex' : 'none';
    await saveUserToRegistry(u);
    await loadUsers();
    // No welcome toast - removed
  } else {
    window.location.href = 'login.html';
  }
});

window.toggleAdmin = () => {
  if (!isAdmin()) { toast('Нет доступа', '', 'error'); return; }
  const on = document.body.classList.toggle('admin-mode');
  const btn = document.getElementById('adminPill');
  btn.classList.toggle('active', on);
  toast(on ? 'Панель управления ВКЛ' : 'Панель управления ВЫКЛ', '', on ? 'warn' : 'info');
};
