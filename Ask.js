import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getDatabase, ref, push, set, get } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyD9I6EBsk4k2hykZo0Yzp67CHrJQjIf2ts",
  authDomain: "online-tutoring-system-d2a40.firebaseapp.com",
  databaseURL: "https://online-tutoring-system-d2a40-default-rtdb.firebaseio.com",
  projectId: "online-tutoring-system-d2a40",
  storageBucket: "online-tutoring-system-d2a40.firebasestorage.app",
  messagingSenderId: "476767991196",
  appId: "1:476767991196:web:98d6814aa85c3c9603c459",
  measurementId: "G-M4N6FFX2F6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);

const submitBtn = document.getElementById("submit");
const subjectSelect = document.getElementById("subject");
let currentUser = null;

async function loadSubjects() {
  subjectSelect.innerHTML = `<option value="">Select Subject</option>`;
  const snap = await get(ref(db, "subjects"));
  if (!snap.exists()) {
    subjectSelect.innerHTML = `<option value="">No subjects found</option>`;
    return;
  }
  snap.forEach(child => {
    const opt = document.createElement("option");
    opt.value = child.val().name;
    opt.textContent = child.val().name;
    subjectSelect.appendChild(opt);
  });
}

onAuthStateChanged(auth, async user => {
  if (!user) {
    alert("You must be logged in");
    location.href = "index.html";
    return;
  }
  currentUser = user;
  await loadSubjects();
  submitBtn.disabled = false;
});

submitBtn.onclick = async () => {
  try {
    const subject = subjectSelect.value;
    const text = document.getElementById("question").value.trim();
    const file = document.getElementById("image").files[0];

    if (!subject || !text) {
      alert("Subject and question are required");
      return;
    }

    let imageUrl = "";
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Only images allowed");
        return;
      }
      const imgRef = storageRef(storage, `questions/${currentUser.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(imgRef, file);
      imageUrl = await getDownloadURL(imgRef);
    }

    const qRef = push(ref(db, "questions"));
    await set(qRef, {
      id: qRef.key,
      learnerId: currentUser.uid,
      learnerEmail: currentUser.email,
      subject,
      question: text,
      imageUrl,
      status: "open",
      createdAt: Date.now()
    });

    alert("Question submitted successfully");
    location.reload();
  } catch (error) {
    console.error(error);
    alert("Failed to submit question: " + error.message);
  }
};
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "enabled" || 
      (!localStorage.getItem("darkMode") && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add("dark-mode");
  }
});