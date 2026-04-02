import { auth, ini } from './firebase.js';
import { allPosts } from './requests.js';
import { allUsers } from './chat.js';

let filter = 'all';

window.setView = (v, el) => {
  document.querySelectorAll('.nav-btn').forEach(n => n.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('pageTitle').textContent = v === 'feed' ? 'Лента заявок' : 'Сообщения';
  document.getElementById('mainChips').style.display = v === 'feed' ? 'flex' : 'none';
  document.getElementById('feedView').style.display = v === 'feed' ? 'flex' : 'none';
  if (v === 'chats') switchTab('chat');
};

window.switchTab = t => {
  document.getElementById('tab-req').classList.toggle('active', t === 'req');
  document.getElementById('tab-chat').classList.toggle('active', t === 'chat');
  document.getElementById('panel-req').style.display = t === 'req' ? 'flex' : 'none';
  document.getElementById('panel-chat').style.display = t === 'chat' ? 'flex' : 'none';
};

window.setFilter = (f, el) => {
  filter = f;
  document.querySelectorAll('#fn-new,#fn-prog,#fn-done').forEach(e => e.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.chip').forEach((c, i) =>
    c.classList.toggle('active', ['all', 'new', 'progress', 'done'][i] === f));
  renderFeed();
};

window.setFilterChip = (f, el) => {
  filter = f;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderFeed();
};

document.getElementById('searchInput').addEventListener('input', renderFeed);

window.renderFeed = function renderFeed() {
  const feed = document.getElementById('feedView');
  let posts = filter === 'all' ? allPosts : allPosts.filter(p => (p.status || 'new') === filter);
  const sq = document.getElementById('searchInput').value.trim().toLowerCase();
  if (sq) posts = posts.filter(p =>
    (p.name || '').toLowerCase().includes(sq) ||
    (p.text || '').toLowerCase().includes(sq) ||
    (p.email || '').toLowerCase().includes(sq)
  );

  const c = { new: 0, progress: 0, done: 0 };
  allPosts.forEach(p => c[p.status || 'new'] = (c[p.status || 'new'] || 0) + 1);
  document.getElementById('nc-all').textContent = allPosts.length;
  document.getElementById('nc-new').textContent = c.new || 0;
  document.getElementById('nc-prog').textContent = c.progress || 0;
  document.getElementById('nc-done').textContent = c.done || 0;
  document.getElementById('st-total').textContent = allPosts.length;
  document.getElementById('st-done').textContent = c.done || 0;

  if (!posts.length) {
    feed.innerHTML = `<div class="empty-s"><span style="font-size:32px;margin-bottom:6px">📭</span><span>Нет заявок</span></div>`;
    return;
  }

  const sl = { new: 'Новая', progress: 'В работе', done: 'Выполнена' };
  const sc = { new: 'b-new', progress: 'b-progress', done: 'b-done' };
  const me = auth.currentUser?.uid;

  feed.innerHTML = posts.map(({ id, name, email, text, image, likes, time, status, photo, uid }) => {
    const st = status || 'new';
    const av = photo
      ? `<div class="c-av"><img src="${photo}" alt=""></div>`
      : `<div class="c-av">${ini(name)}</div>`;
    const isMine = uid === me;
    const safeN = encodeURIComponent(name);
    const chatBtn = isMine ? '' :
      `<button class="act-btn grn" onclick="openChatByUid('${uid}','${safeN}','${email}','${photo || ''}')">💬 Чат</button>`;

    return `<div class="card">
      <div class="card-head">
        ${av}
        <div class="c-info">
          <div class="c-name">${name}</div>
          <div class="c-email">${email}</div>
        </div>
        <div class="c-time">${time}</div>
      </div>
      ${text ? `<div class="c-body">${text}</div>` : ''}
      ${image ? `<img class="c-img" src="${image}" alt="">` : ''}
      <div class="c-foot">
        <span class="badge ${sc[st]}">${sl[st]}</span>
        <button class="act-btn" onclick="likeReq('${id}')">👍 ${likes || 0}</button>
        ${chatBtn}
        <span class="del-wrap">
          <button class="act-btn red" onclick="deleteReq('${id}','${name}')">✕ Удалить</button>
        </span>
      </div>
      <div class="status-row">
        <button class="act-btn ${st === 'new' ? 'st-active' : ''}" onclick="changeStatus('${id}','new','${name}')">Новая</button>
        <button class="act-btn ${st === 'progress' ? 'st-active' : ''}" onclick="changeStatus('${id}','progress','${name}')">В работе</button>
        <button class="act-btn ${st === 'done' ? 'st-active' : ''}" onclick="changeStatus('${id}','done','${name}')">Выполнена</button>
      </div>
    </div>`;
  }).join('');
};
