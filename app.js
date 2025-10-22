// LocalStorage-backed Ardsan user app (no Firebase)
const STORAGE_KEY = 'ardsan_data_v1';

function loadData(){ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
function saveData(d){ localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function ensureData(){ let d = loadData(); if(!d.users){ d.users = {}; d.meta = {nextId:0}; d.commodities = {}; d.loanRequests = {}; d.requests = {}; saveData(d);} return d; }
function genId(n){ return String(n).padStart(4,'0'); }
function findUserByEmail(email){ const d = ensureData(); return Object.values(d.users).find(u=>u.email===email); }

const authMsg = document.getElementById('authMsg'), regMsg = document.getElementById('regMsg');

document.getElementById('toRegisterBtn').onclick = ()=>{ document.getElementById('auth').style.display='none'; document.getElementById('register').style.display='block'; }
document.getElementById('toLoginBtn').onclick = ()=>{ document.getElementById('register').style.display='none'; document.getElementById('auth').style.display='block'; }

document.getElementById('registerBtn').onclick = ()=>{
  const name = document.getElementById('r_name').value.trim();
  const email = (document.getElementById('r_email').value || '').trim().toLowerCase();
  const pwd = document.getElementById('r_password').value;
  const file = document.getElementById('r_file').value.trim();
  const ippis = document.getElementById('r_ippis').value.trim();
  const dept = document.getElementById('r_dept').value.trim();
  const phone = document.getElementById('r_phone').value.trim();
  const monthly = Number(document.getElementById('r_monthly').value) || 0;
  const req = document.getElementById('r_requirements').value || '';
  if(!name||!email||!pwd){ regMsg.textContent='Please fill name, email and password'; return; }
  let d = ensureData();
  if(findUserByEmail(email)){ regMsg.textContent='Email already registered'; return; }
  d.meta.nextId++; const uid = genId(d.meta.nextId);
  d.users[uid] = { uid, name, file, ippis, dept, phone, email, password:pwd, approved:false, balance:0, loan:0, monthlyDeduction:monthly, lastDeduction:null, requirements:req, createdAt:Date.now() };
  saveData(d);
  regMsg.textContent = 'Registered. Await admin approval. Your unique ID: '+uid;
  // clear fields
  ['r_name','r_file','r_ippis','r_dept','r_phone','r_email','r_password','r_monthly','r_requirements'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
};

document.getElementById('loginBtn').onclick = ()=>{
  const email = (document.getElementById('loginEmail').value || '').trim().toLowerCase();
  const pwd = document.getElementById('loginPassword').value;
  let d = ensureData();
  const user = Object.values(d.users).find(u=>u.email===email && u.password===pwd);
  if(!user){ authMsg.textContent='Invalid credentials'; return; }
  if(!user.approved){ authMsg.textContent='Your account is pending admin approval'; return; }
  sessionStorage.setItem('ardsan_session', user.uid);
  showDashboard(user.uid);
};

function showDashboard(uid){
  const d = ensureData();
  const u = d.users[uid];
  if(!u) return;
  document.getElementById('m_name').textContent = u.name;
  document.getElementById('m_balance').textContent = '₦' + (u.balance||0).toLocaleString();
  document.getElementById('m_loan').textContent = '₦' + (u.loan||0).toLocaleString();
  document.getElementById('m_monthly').textContent = '₦' + (u.monthlyDeduction||0).toLocaleString();
  document.getElementById('auth').style.display='none';
  document.getElementById('register').style.display='none';
  document.getElementById('dashboard').style.display='block';
  processAutoDeduction(uid);
}

function processAutoDeduction(uid){
  let d = ensureData(); let u = d.users[uid];
  const now = Date.now();
  if(!u.lastDeduction || (now - (u.lastDeduction||0)) > 30*24*60*60*1000){
    u.balance = (u.balance||0) + (u.monthlyDeduction||0);
    u.lastDeduction = now;
    saveData(d);
  }
}

document.getElementById('logout').onclick = ()=>{ sessionStorage.removeItem('ardsan_session'); location.reload(); }

document.getElementById('viewCommodities').onclick = ()=>{
  const d = ensureData();
  const items = Object.values(d.commodities||{});
  let html = '<div class="card"><h3>Available Commodities</h3>';
  if(!items.length) html += '<p class="muted">No items yet</p>';
  else{ html += '<table class="table"><tr><th>Item</th><th>Price</th><th>Action</th></tr>'; items.forEach(it=>{ html += `<tr><td>${it.name}</td><td>₦${it.price}</td><td><button onclick="requestItem('${it.id}')">Request</button></td></tr>`; }); html += '</table>'; }
  html += '</div>';
  document.getElementById('content').innerHTML = html;
};

window.requestItem = function(id){
  const uid = sessionStorage.getItem('ardsan_session');
  if(!uid) return alert('Not logged in');
  let d = ensureData();
  const reqId = 'req_' + Date.now();
  d.requests = d.requests || {};
  d.requests[reqId] = { id:reqId, uid, commodityId:id, status:'pending', createdAt:Date.now() };
  saveData(d);
  alert('Request submitted (pending admin approval)');
};

document.getElementById('applyLoan').onclick = ()=>{
  const form = `<div class="card"><h3>Apply for Loan</h3>
    <select id="loanType"><option>Business Loan</option><option>Short-Term Loan</option><option>Long-Term Loan</option></select>
    <input id="loanAmount" placeholder="Amount" type="number"><button id="submitLoanBtn">Submit Loan Request</button></div>`;
  document.getElementById('content').innerHTML = form;
  document.getElementById('submitLoanBtn').addEventListener('click', ()=>{
    const amt = Number(document.getElementById('loanAmount').value);
    const type = document.getElementById('loanType').value;
    if(!amt||amt<=0) return alert('Enter valid amount');
    const uid = sessionStorage.getItem('ardsan_session');
    let d = ensureData();
    const key = 'loan_' + Date.now();
    d.loanRequests = d.loanRequests || {};
    d.loanRequests[key] = { id:key, uid, amount:amt, type, status:'pending', createdAt:Date.now() };
    saveData(d);
    alert('Loan request submitted (pending admin approval)');
    document.getElementById('content').innerHTML='';
  });
};

// auto-login if session present
const sess = sessionStorage.getItem('ardsan_session');
if(sess) showDashboard(sess);
