import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

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

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ------------------- Load Info -------------------
async function loadInfo() {
  try {
    const aboutSnap = await get(ref(db, "info/aboutUs"));
    const contactSnap = await get(ref(db, "info/contact"));

    const aboutText = document.getElementById("aboutText");

    if (aboutSnap.exists()) {
      const paragraphs = aboutSnap.val()
        .split("\n")
        .filter(p => p.trim() !== "");

      aboutText.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join("");
    } else {
      aboutText.innerHTML = "<p>No information available.</p>";
    }

    const contactEmail = document.getElementById("contactEmail");
    const contactPhone = document.getElementById("contactPhone");
    const contactFacebook = document.getElementById("contactFacebook");
    const contactYouTube = document.getElementById("contactYouTube");

    if (contactSnap.exists()) {
      const c = contactSnap.val();
      contactEmail.textContent = "Email: " + (c.email || "-");
      contactPhone.textContent = "Phone: " + (c.phone || "-");
      contactFacebook.textContent = "Facebook: " + (c.facebook || "-");
      contactYouTube.textContent = "YouTube: " + (c.youtube || "-");
    }

  } catch (err) {
    console.error("Error loading info:", err);
  }
}

// ------------------- Load Tutors -------------------
const tutorsCards = document.getElementById("tutorsCards");

async function loadTutors() {
  try {
    tutorsCards.innerHTML = "Loading tutors...";

    const snap = await get(ref(db, "tutors"));
    tutorsCards.innerHTML = "";

    if (!snap.exists()) {
      tutorsCards.innerHTML = "No tutors found.";
      return;
    }

    Object.values(snap.val()).forEach(t => {
      const div = document.createElement("div");
      div.className = "tutor-card";

      const subjects = Array.isArray(t.subjects)
        ? t.subjects.join(", ")
        : t.subject || "N/A";

      div.innerHTML = `
        <img src="${t.photo || 'images/placeholder.png'}" alt="${t.name || 'Tutor'}">
        <h4>${t.name || 'Unknown'}</h4>
        <p>${subjects}</p>
      `;

      tutorsCards.appendChild(div);
    });

  } catch (err) {
    console.error("Error loading tutors:", err);
    tutorsCards.innerHTML = "Error loading tutors.";
  }
}

// ------------------- Scroll Controls -------------------
document.getElementById("tutor-left").onclick = () =>
  tutorsCards.scrollBy({ left: -320, behavior: "smooth" });

document.getElementById("tutor-right").onclick = () =>
  tutorsCards.scrollBy({ left: 320, behavior: "smooth" });

// ------------------- Dark Mode -------------------
const darkModeBtn = document.getElementById("darkModeBtn");

if (localStorage.getItem("darkMode") === "enabled") {
  document.body.classList.add("dark-mode");
  darkModeBtn.textContent = "☀️";
} else {
  darkModeBtn.textContent = "🌙";
}

darkModeBtn.onclick = () => {
  document.body.classList.toggle("dark-mode");

  if (document.body.classList.contains("dark-mode")) {
    localStorage.setItem("darkMode", "enabled");
    darkModeBtn.textContent = "☀️";
  } else {
    localStorage.setItem("darkMode", "disabled");
    darkModeBtn.textContent = "🌙";
  }
};

// ------------------- Init -------------------
document.addEventListener("DOMContentLoaded", () => {
  loadInfo();
  loadTutors();
});