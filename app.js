/* app.js — rotation state machine + UI. State lives in localStorage only. */

const STORE_KEY = 'kids_chores_v1';
const L = CONFIG.lang === 'en' ? 'en' : 'he';
const RTL = L === 'he';

const T = {
  he: {
    today: 'היום', bonus: 'בונוס', rewards: 'פרסים', history: 'היסטוריה',
    todaysChore: 'המשימה של היום', done: 'עשיתי ✓', skip: 'דלג',
    instead: 'במקום זה…', chooseSub: 'בחרי משימת בונוס במקום המשימה של היום',
    cancel: 'ביטול', next: 'הבא בתור', tomorrow: 'מחר', allDone: 'סיימת להיום! 🎉',
    stillOwed: 'המשימה שהחלפת מחכה למחר',
    pts: 'נק׳', balance: 'היתרה שלך', asExtra: 'כתוספת', insteadShort: 'במקום היום',
    tooCheap: 'משימות שוות פחות מהמשימה של היום לא יכולות להחליף אותה',
    redeem: 'לממש', notEnough: 'אין מספיק נקודות', streak: 'ימים ברצף',
    noHistory: 'עדיין אין היסטוריה', undo: 'ביטול הפעולה האחרונה',
    lDone: 'עשתה', lSkip: 'דילגה', lSub: 'החליפה', lExtra: 'בונוס', lRedeem: 'מימשה',
    extraDone: 'יופי! נוספו לך', confirmRedeem: 'לממש את הפרס הזה?',
  },
  en: {
    today: 'Today', bonus: 'Bonus', rewards: 'Rewards', history: 'History',
    todaysChore: "Today's chore", done: 'Done ✓', skip: 'Skip',
    instead: 'Instead…', chooseSub: "Pick a bonus chore to do instead of today's",
    cancel: 'Cancel', next: 'Next up', tomorrow: 'Tomorrow', allDone: 'Finished for today! 🎉',
    stillOwed: 'The chore you swapped out is waiting for tomorrow',
    pts: 'pts', balance: 'Your balance', asExtra: 'As extra', insteadShort: "Instead of today",
    tooCheap: "Bonus chores worth less than today's chore can't replace it",
    redeem: 'Redeem', notEnough: 'Not enough points', streak: 'day streak',
    noHistory: 'No history yet', undo: 'Undo last action',
    lDone: 'did', lSkip: 'skipped', lSub: 'swapped', lExtra: 'bonus', lRedeem: 'redeemed',
    extraDone: 'Nice! You earned', confirmRedeem: 'Redeem this reward?',
  },
}[L];

const name = o => o[L] ?? o.he;
const skipLabel = o => (L === 'en' ? o.skipEn : o.skipHe) || T.skip;

/* ---------- state ---------- */

const blank = () => ({ v: 1, pointer: 0, points: 0, log: [] });

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (s && typeof s.pointer === 'number') {
      s.pointer = ((s.pointer % CONFIG.rotation.length) + CONFIG.rotation.length) % CONFIG.rotation.length;
      return s;
    }
  } catch {}
  return blank();
}
function save() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

let state = load();
let tab = 'today';
let subOpen = false;

const todayKey = () => new Date().toLocaleDateString('en-CA');
const assigned = () => CONFIG.rotation[state.pointer];
const upNext   = () => CONFIG.rotation[(state.pointer + 1) % CONFIG.rotation.length];
const dayDone  = () => state.log.some(e => e.date === todayKey() && (e.type === 'done' || e.type === 'substitute'));
const bonusById = id => CONFIG.bonus.find(b => b.id === id);

function streak() {
  const days = new Set(state.log.filter(e => e.type === 'done' || e.type === 'substitute').map(e => e.date));
  let n = 0;
  const d = new Date();
  if (!days.has(d.toLocaleDateString('en-CA'))) d.setDate(d.getDate() - 1);
  while (days.has(d.toLocaleDateString('en-CA'))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/* ---------- actions ---------- */

function push(entry) {
  state.log.unshift({ date: todayKey(), ts: Date.now(), ...entry });
  save(); render();
}
const advance = () => { state.pointer = (state.pointer + 1) % CONFIG.rotation.length; };

function actDone()  { const c = assigned(); advance(); push({ type: 'done', choreId: c.id }); }
function actSkip()  { const c = assigned(); if (!c.skippable) return; advance(); push({ type: 'skip', choreId: c.id }); }

function actSubstitute(bonusId) {
  const b = bonusById(bonusId), c = assigned();
  if (!b || b.points < c.weight) return;          // gate: must be worth at least as much
  state.points += b.points;                        // pointer deliberately NOT advanced
  subOpen = false;
  push({ type: 'substitute', choreId: c.id, bonusId: b.id, points: b.points });
}

function actExtra(bonusId) {
  const b = bonusById(bonusId); if (!b) return;
  state.points += b.points;
  push({ type: 'extra', bonusId: b.id, points: b.points });
  toast(`${T.extraDone} ${b.points} ${T.pts}`);
}

function actRedeem(rewardId) {
  const r = CONFIG.rewards.find(x => x.id === rewardId);
  if (!r || state.points < r.cost) return;
  if (!confirm(`${T.confirmRedeem}\n\n${name(r)} — ${r.cost} ${T.pts}`)) return;
  state.points -= r.cost;
  push({ type: 'redeem', rewardId: r.id, points: -r.cost });
}

function actUndo() {
  const e = state.log[0];
  if (!e || e.date !== todayKey()) return;
  state.log.shift();
  if (e.type === 'done' || e.type === 'skip') state.pointer = (state.pointer - 1 + CONFIG.rotation.length) % CONFIG.rotation.length;
  else if (e.type === 'redeem') state.points += -e.points;
  else if (e.points) state.points -= e.points;
  save(); render();
}

/* ---------- render ---------- */

const el = (t, cls, txt) => { const n = document.createElement(t); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };

function toast(msg) {
  const t = el('div', 'toast', msg);
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, 1800);
}

function viewToday() {
  const w = el('div', 'view');
  const complete = dayDone();

  const card = el('div', 'card' + (complete ? ' card-done' : ''));
  card.appendChild(el('div', 'card-label', complete ? T.allDone : T.todaysChore));

  if (complete) {
    const last = state.log.find(e => e.date === todayKey() && (e.type === 'done' || e.type === 'substitute'));
    card.appendChild(el('div', 'card-chore small', last?.type === 'substitute'
      ? `${name(bonusById(last.bonusId))} (+${last.points} ${T.pts})` : ''));
    const nx = el('div', 'nextline');
    nx.appendChild(el('span', 'nextlabel', T.tomorrow));
    nx.appendChild(el('span', 'nextname', name(assigned())));
    card.appendChild(nx);
    if (last?.type === 'substitute') card.appendChild(el('div', 'owed', T.stillOwed));
  } else {
    const c = assigned();
    card.appendChild(el('div', 'card-chore', name(c)));

    const b = el('button', 'btn btn-primary', T.done);
    b.onclick = actDone; card.appendChild(b);

    const row = el('div', 'btnrow');
    if (c.skippable) { const s = el('button', 'btn btn-ghost', skipLabel(c)); s.onclick = actSkip; row.appendChild(s); }
    if (CONFIG.bonus.some(x => x.points >= c.weight)) {
      const s = el('button', 'btn btn-ghost', T.instead);
      s.onclick = () => { subOpen = !subOpen; render(); };
      row.appendChild(s);
    }
    if (row.children.length) card.appendChild(row);

    if (subOpen) {
      const box = el('div', 'subbox');
      box.appendChild(el('div', 'subhint', T.chooseSub));
      let anyLocked = false;
      CONFIG.bonus.forEach(bn => {
        const ok = bn.points >= c.weight;
        if (!ok) anyLocked = true;
        const r = el('button', 'subitem' + (ok ? '' : ' disabled'));
        r.appendChild(el('span', 'subname', name(bn)));
        r.appendChild(el('span', 'subpts', ok ? `+${bn.points}` : `${bn.points} \u{1F512}`));
        if (ok) r.onclick = () => actSubstitute(bn.id);
        box.appendChild(r);
      });
      if (anyLocked) box.appendChild(el('div', 'subnote', T.tooCheap));
      card.appendChild(box);
    }

    const nx = el('div', 'nextline');
    nx.appendChild(el('span', 'nextlabel', T.next));
    nx.appendChild(el('span', 'nextname', name(upNext())));
    card.appendChild(nx);
  }
  w.appendChild(card);

  const st = el('div', 'stats');
  const a = el('div', 'stat'); a.appendChild(el('div', 'statnum', String(state.points))); a.appendChild(el('div', 'statlabel', T.pts)); st.appendChild(a);
  const b2 = el('div', 'stat'); b2.appendChild(el('div', 'statnum', String(streak()))); b2.appendChild(el('div', 'statlabel', T.streak)); st.appendChild(b2);
  w.appendChild(st);

  const last = state.log[0];
  if (last && last.date === todayKey()) {
    const u = el('button', 'undo', T.undo); u.onclick = actUndo; w.appendChild(u);
  }
  return w;
}

function viewBonus() {
  const w = el('div', 'view');
  w.appendChild(el('div', 'balance', `${T.balance}: ${state.points} ${T.pts}`));
  CONFIG.bonus.forEach(b => {
    const row = el('div', 'brow');
    const top = el('div', 'browtop');
    top.appendChild(el('span', 'bname', name(b)));
    top.appendChild(el('span', 'bpts', `+${b.points}`));
    row.appendChild(top);
    const acts = el('div', 'bacts');
    const x = el('button', 'btn btn-small', T.asExtra); x.onclick = () => actExtra(b.id); acts.appendChild(x);
    if (!dayDone() && b.points >= assigned().weight) {
      const s = el('button', 'btn btn-small btn-alt', T.insteadShort); s.onclick = () => actSubstitute(b.id); acts.appendChild(s);
    }
    row.appendChild(acts);
    w.appendChild(row);
  });
  return w;
}

function viewRewards() {
  const w = el('div', 'view');
  w.appendChild(el('div', 'balance', `${T.balance}: ${state.points} ${T.pts}`));
  CONFIG.rewards.forEach(r => {
    const can = state.points >= r.cost;
    const row = el('div', 'brow');
    const top = el('div', 'browtop');
    top.appendChild(el('span', 'bname', name(r)));
    top.appendChild(el('span', 'bpts', `${r.cost}`));
    row.appendChild(top);
    const btn = el('button', 'btn btn-small' + (can ? '' : ' btn-off'), can ? T.redeem : T.notEnough);
    if (can) btn.onclick = () => actRedeem(r.id);
    row.appendChild(btn);
    w.appendChild(row);
  });
  return w;
}

function viewHistory() {
  const w = el('div', 'view');
  if (!state.log.length) { w.appendChild(el('div', 'empty', T.noHistory)); return w; }
  const verb = { done: T.lDone, skip: T.lSkip, substitute: T.lSub, extra: T.lExtra, redeem: T.lRedeem };
  state.log.slice(0, 120).forEach(e => {
    const row = el('div', 'hrow' + (e.type === 'skip' ? ' hskip' : ''));
    let what = '';
    if (e.type === 'done' || e.type === 'skip') what = name(CONFIG.rotation.find(c => c.id === e.choreId) || {he:'?',en:'?'});
    else if (e.type === 'substitute') what = `${name(bonusById(e.bonusId) || {he:'?',en:'?'})} ← ${name(CONFIG.rotation.find(c => c.id === e.choreId) || {he:'?',en:'?'})}`;
    else if (e.type === 'extra') what = name(bonusById(e.bonusId) || {he:'?',en:'?'});
    else if (e.type === 'redeem') what = name(CONFIG.rewards.find(r => r.id === e.rewardId) || {he:'?',en:'?'});
    row.appendChild(el('span', 'hdate', e.date.slice(5).split('-').reverse().join('.')));
    row.appendChild(el('span', 'hverb', verb[e.type] || e.type));
    row.appendChild(el('span', 'hwhat', what));
    if (e.points) row.appendChild(el('span', 'hpts' + (e.points < 0 ? ' neg' : ''), (e.points > 0 ? '+' : '') + e.points));
    w.appendChild(row);
  });
  return w;
}

function render() {
  const root = document.getElementById('app');
  root.textContent = '';
  root.appendChild({ today: viewToday, bonus: viewBonus, rewards: viewRewards, history: viewHistory }[tab]());
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.tab === tab));
}

function boot() {
  document.documentElement.lang = L;
  document.documentElement.dir = RTL ? 'rtl' : 'ltr';
  if (CONFIG.kidName) document.getElementById('kidname').textContent = CONFIG.kidName;
  const bar = document.getElementById('tabs');
  [['today', T.today], ['bonus', T.bonus], ['rewards', T.rewards], ['history', T.history]].forEach(([k, label]) => {
    const b = el('button', 'tab', label); b.dataset.tab = k;
    b.onclick = () => { tab = k; subOpen = false; render(); };
    bar.appendChild(b);
  });
  render();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { state = load(); render(); } });
}
boot();
