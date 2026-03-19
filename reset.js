import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { getAuth, onAuthStateChanged, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  databaseURL: "...",
  projectId: "...",
  storageBucket: "online-tutoring-system-d2a40.appspot.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

/* Secure reset */
window.manualReset = async function(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    alert("Reset email sent to " + email);
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};

// Admin-only access
const admins = ["admin@gmail.com"];
onAuthStateChanged(auth, user => {
  if (!user || !admins.includes(user.email)) {
    alert("Access denied. Only admin can view this page.");
    location.href = "dashboard.html";
    return;
  }
  loadUsers();
});

// Load all users with their role field
function loadUsers() {
  usersMap.clear();

  // Users node (learners)
  onValue(ref(db, "users"), snap => {
    snap.forEach(c => {
      const u = c.val();
      if(!u || !u.email || u.email.toLowerCase().includes("admin")) return;
      const role = u.role || "learner"; // use role from DB
      usersMap.set(u.email.toLowerCase(), {
        id: c.key,
        name: u.fullName || "-",
        email: u.email,
        role: role
      });
    });
    renderTable(Array.from(usersMap.values()));
  });

  // Tutors node
  onValue(ref(db, "tutors"), snap => {
    snap.forEach(c => {
      const t = c.val();
      if(!t || !t.email) return;
      const role = t.role || "tutor"; // use role from DB
      usersMap.set(t.email.toLowerCase(), {
        id: c.key,
        name: t.name || "-",
        email: t.email,
        role: role
      });
    });
    renderTable(Array.from(usersMap.values()));
  });
}

// Render table
function renderTable(data) {
  current = data;
  tableBody.innerHTML = "";
  if(data.length === 0){
    tableBody.innerHTML = "<tr><td colspan='4'>No users found.</td></tr>";
    return;
  }
  data.forEach(u => {
    tableBody.innerHTML += `
      <tr>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td><button class="resetBtn" onclick="manualReset('${u.role}','${u.id}','${u.email}')">Set New Password</button></td>
        <td>${u.role}</td>
      </tr>
    `;
  });
}

// Search
document.getElementById("search").addEventListener("input", e => {
  const term = e.target.value.toLowerCase();
  renderTable(current.filter(u =>
    (u.name || "").toLowerCase().includes(term) ||
    (u.email || "").toLowerCase().includes(term)
  ));
});

// Role filter
document.getElementById("roleFilter").addEventListener("change", e => {
  const r = e.target.value;
  if(r === "all") renderTable(Array.from(usersMap.values()));
  else renderTable(Array.from(usersMap.values()).filter(u => u.role === r));
});

// Manual reset password
window.manualReset = async function(role, id, email) {
  const newPass = prompt(`Enter new password for ${email}:`);
  if(!newPass) return alert("Cancelled.");
  
  const path = role === "learner" ? `users/${id}/tempPassword` : `tutors/${id}/tempPassword`;
  try {
    await set(ref(db, path), newPass);
    alert(`Password updated for ${email}.`);
  } catch(err) {
    console.error(err);
    alert(`Failed to update password: ${err.message}`);
  }
};