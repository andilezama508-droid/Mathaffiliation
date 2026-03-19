import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

// ✅ Firebase configuration
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

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let editingId = null;

// ------------------- Add / Update Subject -------------------
window.addSubject = async () => {
  try {
    const nameInput = document.getElementById("new-subject");
    const name = nameInput.value.trim();
    if (!name) { 
      alert("Enter subject name"); 
      return; 
    }

    if (editingId) {
      await update(ref(db, "subjects/" + editingId), { name });
      editingId = null;
    } else {
      const subRef = push(ref(db, "subjects"));
      await set(subRef, { name, createdAt: new Date().toISOString() });
    }

    nameInput.value = "";
    loadSubjects();
  } catch (err) {
    console.error("Error adding/updating subject:", err);
    alert("Failed to save subject. See console for details.");
  }
};

// ------------------- Load Subjects -------------------
function loadSubjects() {
  const table = document.getElementById("subjectsTable");
  onValue(ref(db, "subjects"), snapshot => {
    table.innerHTML = "";

    if (!snapshot.exists()) {
      table.innerHTML = "<tr><td colspan='3'>No subjects found</td></tr>";
      return;
    }

    const fragment = document.createDocumentFragment();

    snapshot.forEach(child => {
      const data = child.val();
      const id = child.key;
      const created = new Date(data.createdAt).toLocaleString();

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${data.name}</td>
        <td>${created}</td>
        <td>
          <button class="action-btn edit-btn">Edit</button>
          <button class="action-btn delete-btn">Delete</button>
        </td>
      `;

      // Edit button
      tr.querySelector(".edit-btn").addEventListener("click", () => editSubject(id, data.name));

      // Delete button
      tr.querySelector(".delete-btn").addEventListener("click", () => deleteSubject(id));

      fragment.appendChild(tr);
    });

    table.appendChild(fragment);
  }, {
    onlyOnce: false // listens for real-time updates
  });
}

// ------------------- Edit Subject -------------------
window.editSubject = (id, name) => {
  document.getElementById("new-subject").value = name;
  editingId = id;
};

// ------------------- Delete Subject -------------------
window.deleteSubject = async (id) => {
  if (confirm("Delete this subject?")) {
    try {
      await remove(ref(db, "subjects/" + id));
    } catch (err) {
      console.error("Failed to delete subject:", err);
      alert("Error deleting subject. See console for details.");
    }
  }
};

// ------------------- Dark Mode -------------------
document.addEventListener("DOMContentLoaded", () => {
  if (
    localStorage.getItem("darkMode") === "enabled" ||
    (!localStorage.getItem("darkMode") && window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    document.body.classList.add("dark-mode");
  }

  // Load subjects on page load
  loadSubjects();
});