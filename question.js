import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

/* ---------------- FIREBASE ---------------- */

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

// ✅ REQUIRED
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* ---------------- ELEMENTS ---------------- */

const gradeCards = document.getElementById("gradeCards");
const subjectsArea = document.getElementById("subjectsArea");

let allQuestions = [];
let activeGrade = null;

/* ---------------- LOAD QUESTIONS ---------------- */

async function loadQuestions() {
  try {
    gradeCards.innerHTML = "Loading...";

    const snap = await get(ref(db, "quickQuestions"));

    if (!snap.exists()) {
      gradeCards.innerHTML = "No questions found.";
      return;
    }

    allQuestions = Object.values(snap.val());
    createGradeCards();

  } catch (err) {
    console.error("Error loading questions:", err);
    gradeCards.innerHTML = "Error loading data.";
  }
}

/* ---------------- CREATE GRADES ---------------- */

function createGradeCards() {
  gradeCards.innerHTML = "";

  const grades = [8, 9, 10, 11, 12];

  grades.forEach(g => {
    const card = document.createElement("div");
    card.className = "gradeCard grade" + g;
    card.textContent = "Grade " + g;
    card.onclick = () => selectGrade(g);

    gradeCards.appendChild(card);
  });
}

/* ---------------- SELECT GRADE ---------------- */

function selectGrade(grade) {

  if (activeGrade === grade) {
    activeGrade = null;

    Array.from(gradeCards.children).forEach(c => {
      c.style.display = "flex";
    });

    subjectsArea.innerHTML = "";
    document.getElementById("questionBox").style.display = "none";
    return;
  }

  activeGrade = grade;

  Array.from(gradeCards.children).forEach(c => {
    if (c.textContent !== "Grade " + grade) {
      c.style.display = "none";
    }
  });

  showGradeQuestions(grade);
}

/* ---------------- SHOW SUBJECTS ---------------- */

function showGradeQuestions(grade) {

  subjectsArea.innerHTML = "";

  const gradeQuestions = allQuestions.filter(
    q => Number(q.grade) === Number(grade)
  );

  if (gradeQuestions.length === 0) {
    subjectsArea.innerHTML = "<p>No questions for this grade.</p>";
    return;
  }

  const grouped = {};

  gradeQuestions.forEach(q => {
    const subject = q.subject || "Unknown";
    const topic = q.topic || "General";

    if (!grouped[subject]) grouped[subject] = {};
    if (!grouped[subject][topic]) grouped[subject][topic] = [];

    grouped[subject][topic].push(q);
  });

  Object.keys(grouped).forEach(subject => {

    const subjectBtn = document.createElement("button");
    subjectBtn.className = "folder";
    subjectBtn.textContent = "📁 " + subject;

    const subjectBox = document.createElement("div");
    subjectBox.className = "subjectBox";
    subjectBox.style.display = "none";

    subjectBtn.onclick = () => {
      subjectBox.style.display =
        subjectBox.style.display === "none" ? "block" : "none";
    };

    subjectsArea.appendChild(subjectBtn);
    subjectsArea.appendChild(subjectBox);

    Object.keys(grouped[subject]).forEach(topic => {

      const topicBtn = document.createElement("button");
      topicBtn.className = "folder";
      topicBtn.textContent = "📁 " + topic;

      const topicBox = document.createElement("div");
      topicBox.className = "topicBox";
      topicBox.style.display = "none";

      topicBtn.onclick = () => {
        topicBox.style.display =
          topicBox.style.display === "none" ? "block" : "none";
      };

      subjectBox.appendChild(topicBtn);
      subjectBox.appendChild(topicBox);

      grouped[subject][topic].forEach((q, i) => {

        const card = document.createElement("div");
        card.className = "card";
        card.textContent = "Question " + (i + 1);

        card.onclick = () => openQuestion(q);

        topicBox.appendChild(card);
      });
    });
  });
}

/* ---------------- OPEN QUESTION ---------------- */

function openQuestion(q) {

  const box = document.getElementById("questionBox");

  box.style.display = "block";

  document.getElementById("subject").textContent = q.subject || "-";
  document.getElementById("grade").textContent = "Grade " + (q.grade || "-");
  document.getElementById("textQuestion").textContent = q.questionText || "";

  const img = document.getElementById("imageQuestion");
  img.src = q.imageURL || "";
  img.style.display = q.imageURL ? "block" : "none";

  document.getElementById("solution").textContent = q.solution || "";
  document.getElementById("solutionBox").style.display = "none";

  box.scrollIntoView({ behavior: "smooth" });
}

/* ---------------- SOLUTION ---------------- */

window.showSolution = function () {
  document.getElementById("solutionBox").style.display = "block";
};

/* ---------------- DARK MODE ---------------- */

window.toggleDarkMode = function () {
  document.body.classList.toggle("dark");

  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("darkMode", isDark ? "enabled" : "disabled");
};

if (localStorage.getItem("darkMode") === "enabled") {
  document.body.classList.add("dark");
}

/* ---------------- INIT ---------------- */

document.addEventListener("DOMContentLoaded", () => {
  loadQuestions();
});