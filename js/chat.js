import { auth, db, ini, toast } from './firebase.js';
import {
  collection, addDoc, setDoc, doc, query,
  orderBy, onSnapshot, serverTimestamp, updateDoc, getDocs
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

export let allUsers = [];
let currentChatId = null, chatUnsub = null;

function cid(a, b) { return [a, b].sort().join('_'); }

export async function loadUsers() {
  if (!auth.currentUser) return;
  try {
    const snap = await getDocs(collection(db, 'users'));
    allUsers = snap.docs.map(d => d.data()).filter(u => u.uid !== auth.currentUser.uid);
    document.getElementById('st-chats').textContent = allUsers.length;
    refreshChatList();
  } catch (e) { console.log('loadUsers', e); }
}

export function refreshChatList() {
  if (!auth.currentUser) return;
  const list = document.getElementById('chatListEl');
  document.getElementById('st-chats').textContent = allUsers.length;
  if (!allUsers.length) {
    list.innerHTML = '';
    document.getElementById('noChats').style.display = 'flex';
    return;
  }
  document.getElementById('noChats').style.display = 'none';
  list.innerHTML = allUsers.map(a => {
    const av = a.photo
      ? `<div class="ch-av"><img src="${a.photo}" alt=""></div>`
      : `<div class="ch-av">${ini(a.name)}</div>`;
    const active = currentChatId === cid(auth.currentUser.uid, a.uid) ? 'active' : '';
    return `<div class="chat-row ${active}" onclick="openChat('${a.uid}','${encodeURIComponent(a.name)}','${a.email}','${a.photo || ''}')">
      ${av}
      <div class="ch-info">
        <div class="ch-name">${a.name}</div>
        <div class="ch-prev">${a.email}</div>
      </div>
    </div>`;
  }).join('');
}

window.openChatByUid = (uid, name, email, photo) => {
  if (!auth.currentUser) { toast('Ошибка', 'Войдите в систему', 'error'); return; }
  if (uid === auth.currentUser.uid) { toast('Чат', 'Нельзя написать самому себе', 'warn'); return; }
  window.switchTab('chat');
  openChat(uid, name, email, photo);
};

window.openChat = (uid, rawName, email, photo) => {
  if (!auth.currentUser) { toast('Ошибка', 'Войдите в систему', 'error'); return; }
  const name = decodeURIComponent(rawName);
  const id = cid(auth.currentUser.uid, uid);
  currentChatId = id;

  document.getElementById('chatListWrap').style.display = 'none';
  document.getElementById('chatWin').classList.add('open');

  // Update header with avatar
  const cwAvEl = document.getElementById('cwAv');
  if (cwAvEl) {
    if (photo) cwAvEl.innerHTML = `<img src="${photo}" alt="">`;
    else cwAvEl.textContent = ini(name);
  }
  document.getElementById('cwName').textContent = name;
  document.getElementById('cwSub').textContent = email;
  document.getElementById('cwMsgs').innerHTML = '';

  if (chatUnsub) chatUnsub();

  setDoc(doc(db, 'chats', id), {
    participants: [auth.currentUser.uid, uid],
    names: { [auth.currentUser.uid]: auth.currentUser.displayName, [uid]: name },
    photos: { [auth.currentUser.uid]: auth.currentUser.photoURL || '', [uid]: photo || '' },
    updatedAt: serverTimestamp()
  }, { merge: true });

  const mq = query(collection(db, 'chats', id, 'messages'), orderBy('ts', 'asc'));
  chatUnsub = onSnapshot(mq, snap => {
    const c = document.getElementById('cwMsgs');
    c.innerHTML = '';
    snap.docs.forEach(d => {
      const m = d.data(), mine = m.uid === auth.currentUser.uid;
      const av = m.photo
        ? `<div class="m-av"><img src="${m.photo}" alt=""></div>`
        : `<div class="m-av">${ini(m.name || '?')}</div>`;
      const time = m.ts?.toDate().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) || '';
      c.innerHTML += `<div class="msg-row ${mine ? 'mine' : ''}">
        ${mine ? '' : av}
        <div class="msg-content">
          <div class="msg-t">${time}</div>
          <div class="bubble">${m.text}</div>
        </div>
        ${mine ? av : ''}
      </div>`;
    });
    c.scrollTop = c.scrollHeight;
  });

  refreshChatList();
};

window.closeChat = () => {
  currentChatId = null;
  if (chatUnsub) { chatUnsub(); chatUnsub = null; }
  document.getElementById('chatListWrap').style.display = 'block';
  document.getElementById('chatWin').classList.remove('open');
  refreshChatList();
};

window.sendMsg = async () => {
  if (!auth.currentUser || !currentChatId) return;
  const inp = document.getElementById('chatInp');
  const text = inp.value.trim(); if (!text) return;
  inp.value = '';
  try {
    await addDoc(collection(db, 'chats', currentChatId, 'messages'), {
      text, uid: auth.currentUser.uid,
      name: auth.currentUser.displayName,
      photo: auth.currentUser.photoURL || '',
      ts: serverTimestamp()
    });
    await updateDoc(doc(db, 'chats', currentChatId), { updatedAt: serverTimestamp() });
  } catch (err) {
    console.error(err);
    toast('Ошибка', 'Не удалось отправить', 'error');
    inp.value = text;
  }
};

document.getElementById('chatInp').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
});
