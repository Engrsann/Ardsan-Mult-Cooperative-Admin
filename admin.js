const ADMIN_EMAILS = ["kabironifade@gmail.com","yakububilyaminu44@gmail.com","abalhafsa@gmail.com","msanusi2009@yahoo.co.uk"];
const STORAGE_KEY = 'ardsan_data_v1';

function loadData(){ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
function saveData(d){ localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function ensureData(){ let d = loadData(); if(!d.users){ d.users = {}; d.meta={nextId:0}; d.commodities={}; d.loanRequests={}; d.requests={}; saveData(d);} return d; }

document.getElementById('addCommBtn').addEventListener('click', ()=>{ const name=prompt('Item name'); const price=prompt('Price'); if(name && price){ let d=ensureData(); const id='c_'+Date.now(); d.commodities[id]={id,name,price:Number(price)}; saveData(d); loadAdminData(); } });

document.getElementById('adminLoginBtn').addEventListener('click', ()=>{
  const email = (document.getElementById('adminEmail').value || '').trim().toLowerCase();
  if(!ADMIN_EMAILS.includes(email)){ document.getElementById('adminMsg').innerText='Access denied'; return; }
  document.getElementById('loginBox').style.display='none'; document.getElementById('adminArea').style.display='block'; loadAdminData();
});

function loadAdminData(){
  const d = ensureData();
  const users = Object.values(d.users||{});
  const totalUsers = users.length;
  const totalSavings = users.reduce((s,u)=>s+(Number(u.balance||0)),0);
  const pendingRegs = users.filter(u=>!u.approved);
  const loanReqs = Object.values(d.loanRequests||{});
  document.getElementById('stats').innerHTML = `<p>Total users: ${totalUsers}</p><p>Total savings: ₦${totalSavings.toLocaleString()}</p><p>Pending regs: ${pendingRegs.length}</p>`;

  let ph = '<table class="table"><tr><th>UID</th><th>Name</th><th>Email</th><th>Reqs</th><th>Actions</th></tr>';
  pendingRegs.forEach(u=>{ ph+=`<tr><td>${u.uid}</td><td>${u.name}</td><td>${u.email}</td><td>${u.requirements||''}</td><td><button onclick="approve('${u.uid}')">Approve</button> <button onclick="delUser('${u.uid}')">Delete</button></td></tr>`; });
  ph += '</table>'; document.getElementById('pending').innerHTML = ph;

  let ah = '<table class="table"><tr><th>UID</th><th>Name</th><th>Email</th><th>Phone</th><th>Dept</th><th>Bal</th><th>Loan</th><th>Actions</th></tr>';
  users.forEach(u=>{ ah+=`<tr><td>${u.uid}</td><td>${u.name}</td><td>${u.email}</td><td>${u.phone}</td><td>${u.dept}</td><td>₦${(u.balance||0).toLocaleString()}</td><td>₦${(u.loan||0).toLocaleString()}</td><td><button onclick="editUser('${u.uid}')">Edit</button> <button onclick="delUser('${u.uid}')">Delete</button></td></tr>`; });
  ah += '</table>'; document.getElementById('allUsers').innerHTML = ah;

  let lh = '<table class="table"><tr><th>User</th><th>Amount</th><th>Type</th><th>Status</th><th>Actions</th></tr>';
  loanReqs.forEach(r=>{ lh+=`<tr><td>${r.uid}</td><td>₦${r.amount}</td><td>${r.type}</td><td>${r.status}</td><td>${r.status==='pending'?`<button onclick="approveLoan('${r.id}')">Approve</button> <button onclick="rejectLoan('${r.id}')">Reject</button>`:''}</td></tr>`; });
  lh += '</table>'; document.getElementById('loans').innerHTML = lh;

  const comms = Object.values(d.commodities||{});
  let ch = '<table class="table"><tr><th>Item</th><th>Price</th><th>Action</th></tr>';
  comms.forEach(c=>{ ch+=`<tr><td>${c.name}</td><td>₦${c.price}</td><td><button onclick="delComm('${c.id}')">Delete</button></td></tr>`; });
  ch += '</table>'; document.getElementById('commodities').innerHTML = ch;
}

function approve(uid){ let d=ensureData(); const u = Object.values(d.users).find(x=>x.uid===uid); if(u){ u.approved=true; saveData(d); loadAdminData(); } }
function delUser(uid){ if(!confirm('Delete user?')) return; let d=ensureData(); const key = Object.keys(d.users).find(k=>d.users[k].uid===uid); if(key) delete d.users[key]; saveData(d); loadAdminData(); }
function editUser(uid){ let d=ensureData(); const key = Object.keys(d.users).find(k=>d.users[k].uid===uid); if(!key) return; const u=d.users[key]; const name=prompt('Name',u.name); const phone=prompt('Phone',u.phone||''); const dept=prompt('Dept',u.dept||''); const bal=prompt('Balance',u.balance||0); const loan=prompt('Loan',u.loan||0); if(name!==null) u.name=name; if(phone!==null) u.phone=phone; if(dept!==null) u.dept=dept; if(bal!==null) u.balance=Number(bal); if(loan!==null) u.loan=Number(loan); saveData(d); loadAdminData(); }
function approveLoan(id){ let d=ensureData(); const r = (d.loanRequests||[]).find(x=>x.id===id); if(!r) return; r.status='approved'; const ukey = Object.keys(d.users).find(k=>d.users[k].uid===r.uid); if(ukey) d.users[ukey].loan = r.amount; saveData(d); loadAdminData(); }
function rejectLoan(id){ let d=ensureData(); const r = (d.loanRequests||[]).find(x=>x.id===id); if(!r) return; r.status='rejected'; saveData(d); loadAdminData(); }
function delComm(id){ let d=ensureData(); delete d.commodities[id]; saveData(d); loadAdminData(); }
document.getElementById('processMonthlyBtn').addEventListener('click', ()=>{ if(!confirm('Process monthly now?')) return; let d=ensureData(); Object.keys(d.users||{}).forEach(k=>{ const u=d.users[k]; const last = u.lastDeduction||0; const now = Date.now(); if(!u.lastDeduction || (now - last) > 30*24*60*60*1000){ u.balance = (u.balance||0) + (u.monthlyDeduction||0); u.lastDeduction = now; } }); saveData(d); loadAdminData(); });
document.getElementById('logoutAdmin').addEventListener('click', ()=>{ location.reload(); });

// normalize loanRequests object to array
(function normalize(){ let d=ensureData(); if(d.loanRequests && !Array.isArray(d.loanRequests)){ const arr=[]; Object.keys(d.loanRequests).forEach(k=>{ const v=d.loanRequests[k]; v.id=v.id||k; arr.push(v); }); d.loanRequests=arr; saveData(d); } })();

ensureData(); loadAdminData();
