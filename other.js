import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, onValue, update, remove, set } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

// ------------------- Firebase Config -------------------
const firebaseConfig = {
  apiKey: "AIzaSyD9I6EBsk4k2hykZo0Yzp67CHrJQjIf2ts",
  authDomain: "online-tutoring-system-d2a40.firebaseapp.com",
  databaseURL: "https://online-tutoring-system-d2a40-default-rtdb.firebaseio.com",
  projectId: "online-tutoring-system-d2a40",
  storageBucket: "online-tutoring-system-d2a40.appspot.com",
  messagingSenderId: "476767991196",
  appId: "1:476767991196:web:98d6814aa85c3c9603c459",
  measurementId: "G-M4N6FFX2F6"
};

// ------------------- Initialize Firebase -------------------
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ------------------- Global Variables -------------------
let users = [], current = [], activeCard = null;
let currentEditId = null, currentEditRole = null;

// Cache DOM elements
const learnersCount = document.getElementById("learnersCount");
const tutorsCount = document.getElementById("tutorsCount");
const totalCount = document.getElementById("totalCount");
const table = document.getElementById("userTable");
const grid = document.getElementById("cardGrid");
const searchInput = document.getElementById("search");
const gradeFilter = document.getElementById("gradeFilter");

// ------------------- Load Users -------------------
function loadUsers() {
  users = [];

  onValue(ref(db, "users"), snap => {
    const learners = [];
    snap.forEach(c => {
      const u = c.val();
      if (!u || u.role !== "learner") return;
      if ((u.email || "").toLowerCase().includes("admin")) return;

      learners.push({
        id: c.key,
        name: u.name || "-",
        email: u.email || "-",
        role: "learner",
        subjects: Array.isArray(u.subjects) ? u.subjects.join(", ") : u.subjects || "-",
        grades: Array.isArray(u.grades) ? u.grades.join(", ") : u.grade || "-",
        createdAt: u.createdAt || null
      });
    });

    users = users.filter(u => u.role !== "learner");
    users = [...users, ...learners];
    updateCounts();
  });

  onValue(ref(db, "tutors"), snap => {
    const tutors = [];
    snap.forEach(c => {
      const t = c.val();
      tutors.push({
        id: c.key,
        name: t.name || "-",
        email: t.email || "-",
        role: "tutor",
        subjects: Array.isArray(t.subjects) ? t.subjects.join(", ") : t.subject || "-",
        grades: Array.isArray(t.grades) ? t.grades.join(", ") : t.grade || "-",
        createdAt: t.createdAt || null
      });
    });

    users = users.filter(u => u.role !== "tutor");
    users = [...users, ...tutors];
    updateCounts();
  });
}

function updateCounts() {
  learnersCount.textContent = users.filter(u => u.role === "learner").length;
  tutorsCount.textContent = users.filter(u => u.role === "tutor").length;
  totalCount.textContent = users.length;
}

loadUsers();

// ------------------- Render Users -------------------
window.showUsers = function(role) {
  const cards = [...grid.children];
  const section = document.getElementById("users-section");
  if (activeCard === role) {
    activeCard = null;
    cards.forEach(c => c.style.display = "block");
    section.style.display = "none";
    return;
  }

  activeCard = role;
  cards.forEach(card => {
    if ((role === "learner" && !card.classList.contains("learners")) ||
        (role === "tutor" && !card.classList.contains("tutors")) ||
        (role === "all" && !card.classList.contains("total"))) {
      card.style.display = "none";
    } else {
      card.style.display = "block";
    }
  });

  section.style.display = "block";
  current = role === "all" ? users : users.filter(u => u.role === role);
  document.getElementById("listTitle").textContent = role === "all" ? "All Users" : role === "learner" ? "Learners" : "Tutors";
  render(current);
};

function render(data) {
  table.innerHTML = "";
  const fragment = document.createDocumentFragment();

  data.forEach(u => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td>${u.role}</td>
      <td>${u.subjects}</td>
      <td>${u.grades}</td>
      <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}</td>
      <td>
        <button class="action-btn edit-btn">Edit</button>
        <button class="action-btn delete-btn">Delete</button>
      </td>
    `;
    tr.querySelector(".edit-btn").addEventListener("click", () => editUser(u.id, u.role));
    tr.querySelector(".delete-btn").addEventListener("click", () => deleteUser(u.id, u.role));
    fragment.appendChild(tr);
  });

  table.appendChild(fragment);
}

// ------------------- Search & Filter -------------------
searchInput.addEventListener("input", e => {
  const term = e.target.value.toLowerCase();
  render(current.filter(u => (u.name || "").toLowerCase().includes(term) || (u.email || "").toLowerCase().includes(term)));
});

gradeFilter.addEventListener("change", e => {
  const g = e.target.value;
  render(g === "all" ? current : current.filter(u => (u.grades + "").includes(g)));
});

// ------------------- Edit / Delete -------------------
window.editUser = function(id, role) {
  currentEditId = id; 
  currentEditRole = role;
  const user = users.find(u => u.id === id && u.role === role);
  if (!user) return alert("User not found");

  document.getElementById("editName").value = user.name;
  document.getElementById("editEmail").value = user.email;
  document.getElementById("editGrades").value = Array.isArray(user.grades) ? user.grades.join(",") : user.grades;
  document.getElementById("editSubjects").value = Array.isArray(user.subjects) ? user.subjects.join(",") : user.subjects;
  document.getElementById("editUserModal").style.display = "block";
};

document.getElementById("closeEditUserModal").onclick = () => document.getElementById("editUserModal").style.display = "none";

document.getElementById("saveUserBtn").onclick = async () => {
  if (!currentEditId || !currentEditRole) return;
  const updates = {
    name: document.getElementById("editName").value.trim(),
    email: document.getElementById("editEmail").value.trim(),
    grades: document.getElementById("editGrades").value.split(",").map(g => g.trim()).filter(g => g),
    subjects: document.getElementById("editSubjects").value.split(",").map(s => s.trim()).filter(s => s)
  };
  const path = currentEditRole === "learner" ? `users/${currentEditId}` : `tutors/${currentEditId}`;
  try {
    await update(ref(db, path), updates);
    const index = users.findIndex(u => u.id === currentEditId && u.role === currentEditRole);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
    }
    render(current);
    alert("User updated successfully");
    document.getElementById("editUserModal").style.display = "none";
  } catch (err) {
    console.error(err);
    alert("Failed to update user: " + err.message);
  }
};

window.deleteUser = function(id, role) {
  if (confirm(`Are you sure you want to delete this ${role}?`)) {
    const path = role === "learner" ? `users/${id}` : `tutors/${id}`;
    remove(ref(db, path))
      .then(() => alert("Deleted successfully"))
      .catch(err => alert("Delete failed: " + err.message));
  }
};

// ------------------- Save Site Info -------------------
const modal = document.getElementById("modal");
document.getElementById("editBtn").onclick = () => modal.style.display = "block";
document.getElementById("closeModal").onclick = () => modal.style.display = "none";

window.saveInfo = async () => {
  try {
    await set(ref(db, "info"), {
      aboutUs: document.getElementById("aboutUs").value,
      contact: {
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        facebook: document.getElementById("facebook").value,
        youtube: document.getElementById("youtube").value
      }
    });
    alert("Info saved");
    modal.style.display = "none";
  } catch (err) {
    console.error(err);
    alert("Failed to save info: " + err.message);
  }
};

// ------------------- Dark Mode -------------------
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "enabled" || 
      (!localStorage.getItem("darkMode") && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add("dark-mode");
  }
});