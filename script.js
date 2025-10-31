const db = firebase.database().ref("users");

document.getElementById("registerBtn").addEventListener("click", () => {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (name && email && password) {
    db.push({ name, email, password });
    alert("Account created successfully!");
  } else {
    alert("Please fill all fields");
  }
});

document.getElementById("loginBtn").addEventListener("click", () => {
  const loginEmail = document.getElementById("loginEmail").value.trim();
  const loginPassword = document.getElementById("loginPassword").value.trim();

  db.once("value", (snapshot) => {
    let found = false;
    snapshot.forEach((child) => {
      const user = child.val();
      if (user.email === loginEmail && user.password === loginPassword) {
        found = true;
        document.getElementById("login").style.display = "none";
        document.getElementById("register").style.display = "none";
        document.getElementById("userDashboard").style.display = "block";
        document.getElementById("userName").textContent = user.name;
      }
    });
    if (!found) alert("Invalid email or password");
  });
});
