import { auth, db, isAdmin, ini, toast } from './firebase.js';
import {
  collection, addDoc, deleteDoc, query, orderBy,
  onSnapshot, serverTimestamp, updateDoc, doc, increment
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// PHOTO
let photoB64 = null;

document.getElementById('photoFile').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  if (f.size > 2 * 1024 * 1024) { toast('Ошибка', 'Файл больше 2 МБ', 'error'); return; }
  const r = new FileReader();
  r.onload = ev => {
    photoB64 = ev.target.result;
    document.getElementById('phPrev').src = photoB64;
    document.getElementById('photoBox').classList.add('filled');
  };
  r.readAsDataURL(f);
});

document.getElementById('rmPh').onclick = e => {
  e.preventDefault(); e.stopPropagation();
  photoB64 = null;
  document.getElementById('phPrev').src = '';
  document.getElementById('photoFile').value = '';
  document.getElementById('photoBox').classList.remove('filled');
};

// SUBMIT
document.getElementById('submitBtn').onclick = async () => {
  const u = auth.currentUser; if (!u) { toast('Ошибка', 'Войдите в систему', 'error'); return; }
  const text = document.getElementById('fText').value.trim(); if (!text) { toast('Ошибка', 'Введите текст заявки', 'error'); return; }
  const btn = document.getElementById('submitBtn'); btn.disabled = true; btn.textContent = 'Отправка…';
  try {
    await addDoc(collection(db, 'requests'), {
      name: u.displayName, email: u.email, photo: u.photoURL || '',
      text, image: photoB64 || null, likes: 0, status: 'new', uid: u.uid, timestamp: serverTimestamp()
    });
    document.getElementById('fText').value = '';
    photoB64 = null;
    document.getElementById('phPrev').src = '';
    document.getElementById('photoFile').value = '';
    document.getElementById('photoBox').classList.remove('filled');
    toast('Готово', 'Заявка отправлена', 'success');
  } catch (err) { console.error(err); toast('Ошибка', 'Проверьте правила Firestore', 'error'); }
  btn.disabled = false; btn.textContent = 'Отправить заявку →';
};

// ADMIN ACTIONS
window.deleteReq = async (id, name) => {
  if (!isAdmin()) { toast('Нет доступа', 'Только администратор', 'error'); return; }
  if (!confirm(`Удалить заявку от "${name}"?`)) return;
  try { await deleteDoc(doc(db, 'requests', id)); toast('Удалено', name, 'warn'); }
  catch (err) { console.error(err); toast('Ошибка', err.code || err.message, 'error'); }
};

window.changeStatus = async (id, st, name) => {
  if (!isAdmin()) { toast('Нет доступа', 'Только администратор', 'error'); return; }
  const l = { new: 'Новая', progress: 'В работе', done: 'Выполнена' };
  try { await updateDoc(doc(db, 'requests', id), { status: st }); toast('Статус', `${name} → ${l[st]}`, st === 'done' ? 'success' : 'info'); }
  catch (err) { console.error(err); toast('Ошибка', err.code || err.message, 'error'); }
};

window.likeReq = async id => {
  if (!auth.currentUser) { toast('Ошибка', 'Войдите для лайка', 'error'); return; }
  try { await updateDoc(doc(db, 'requests', id), { likes: increment(1) }); }
  catch (err) { console.error(err); toast('Ошибка', err.code, 'error'); }
};

// REALTIME FEED
export let allPosts = [];

const q = query(collection(db, 'requests'), orderBy('timestamp', 'desc'));
onSnapshot(q, snap => {
  allPosts = snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id, name: data.name || '', email: data.email || '',
      text: data.text || '', image: data.image || null,
      likes: data.likes || 0, status: data.status || 'new',
      photo: data.photo || '', uid: data.uid || '',
      time: data.timestamp?.toDate().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) || '…'
    };
  });
  window.renderFeed && window.renderFeed();
});
