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

// ------------------- Navigation -------------------
document.getElementById("quickQuestionsBtn").onclick = () => {
  window.location.href = "question.html";
};

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

// ------------------- Load Tutors -------------------
const tutorsCards = document.getElementById("tutorsCards");

async function loadTutors() {
  try {
    tutorsCards.innerHTML = "Loading tutors...";
    const snap = await get(ref(db, "tutors"));

    tutorsCards.innerHTML = "";

    if (snap.exists()) {
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

        div.querySelector("img").onclick = () =>
          openImg(t.photo || "images/placeholder.png");

        tutorsCards.appendChild(div);
      });
    } else {
      tutorsCards.innerHTML = "No tutors found in database.";
    }
  } catch (err) {
    tutorsCards.innerHTML = "Error loading tutors.";
    console.error("Error loading tutors:", err);
  }
}

// ------------------- Load Events -------------------
const eventsGallery = document.getElementById("eventsGallery");

async function loadEvents() {
  try {
    eventsGallery.innerHTML = "Loading events...";
    const snap = await get(ref(db, "gallery"));

    eventsGallery.innerHTML = "";

    if (snap.exists()) {
      Object.values(snap.val()).forEach(e => {
        const img = document.createElement("img");
        img.src = e.url || "images/placeholder.png";
        img.className = "gallery-img";

        img.onclick = () =>
          openImg(e.url || "images/placeholder.png");

        eventsGallery.appendChild(img);
      });
    } else {
      eventsGallery.innerHTML = "No events found in database.";
    }
  } catch (err) {
    eventsGallery.innerHTML = "Error loading events.";
    console.error("Error loading events:", err);
  }
}

// ------------------- Scroll Buttons -------------------
document.getElementById("tutor-left").onclick = () =>
  tutorsCards.scrollBy({ left: -320, behavior: "smooth" });

document.getElementById("tutor-right").onclick = () =>
  tutorsCards.scrollBy({ left: 320, behavior: "smooth" });

document.getElementById("event-left").onclick = () =>
  eventsGallery.scrollBy({ left: -320, behavior: "smooth" });

document.getElementById("event-right").onclick = () =>
  eventsGallery.scrollBy({ left: 320, behavior: "smooth" });

// ------------------- Lightbox -------------------
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");

function openImg(src) {
  lightboxImg.src = src;
  lightbox.style.display = "flex";
}

// Optional: close when clicking outside
lightbox.onclick = () => {
  lightbox.style.display = "none";
};

// ------------------- Init -------------------
document.addEventListener("DOMContentLoaded", () => {
  loadTutors();
  loadEvents();
});