const db = firebase.database();

const adminEmails = [
  "msanusi2009@yahoo.co.uk",
  "Yakububilyaminu44@gmail.com",
  "kabironifade@gmail.com"
];

firebase.auth().onAuthStateChanged(user => {
  if (!user || !adminEmails.includes(user.email)) {
    alert("Access denied. Admins only.");
    window.location.href = "login.html";
  } else {
    loadUsers();
    loadLoans();
    loadSales();
  }
});

// Load all registered users
function loadUsers() {
  const userRef = db.ref("users/");
  userRef.on("value", snapshot => {
    const userList = document.getElementById("userList");
    userList.innerHTML = "";
    snapshot.forEach(child => {
      const u = child.val();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.email}</td>
        <td>${u.name}</td>
        <td>${u.department}</td>
        <td>${u.phone}</td>
        <td>${u.balance || 0}</td>
        <td>${u.status || "Pending"}</td>
        <td>
          <button onclick="approveUser('${child.key}')">Approve</button>
          <button onclick="deleteUser('${child.key}')">Delete</button>
        </td>`;
      userList.appendChild(tr);
    });
  });
}

// Approve user
function approveUser(userId) {
  db.ref("users/" + userId + "/status").set("Approved");
  alert("User approved successfully!");
}

// Delete user
function deleteUser(userId) {
  if (confirm("Are you sure you want to delete this user?")) {
    db.ref("users/" + userId).remove();
  }
}

// Load loan applications
function loadLoans() {
  const loanRef = db.ref("loans/");
  loanRef.on("value", snapshot => {
    const loanList = document.getElementById("loanList");
    loanList.innerHTML = "";
    snapshot.forEach(child => {
      const l = child.val();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${l.email}</td>
        <td>${l.type}</td>
        <td>${l.amount}</td>
        <td>${l.status || "Pending"}</td>
        <td>
          <button onclick="approveLoan('${child.key}')">Approve</button>
          <button onclick="rejectLoan('${child.key}')">Reject</button>
        </td>`;
      loanList.appendChild(tr);
    });
  });
}

// Approve loan
function approveLoan(loanId) {
  db.ref("loans/" + loanId + "/status").set("Approved");
  alert("Loan approved!");
}

// Reject loan
function rejectLoan(loanId) {
  db.ref("loans/" + loanId + "/status").set("Rejected");
  alert("Loan rejected!");
}

// Load posted sales / commodities
function loadSales() {
  const salesRef = db.ref("sales/");
  salesRef.on("value", snapshot => {
    const salesList = document.getElementById("salesList");
    salesList.innerHTML = "";
    snapshot.forEach(child => {
      const s = child.val();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${s.item}</td>
        <td>${s.price}</td>
        <td>${s.postedBy}</td>`;
      salesList.appendChild(tr);
    });
  });
}
