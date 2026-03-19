import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

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
const auth = getAuth(app);

/* ---------------- STATE ---------------- */

let quizzes = {}, attempts = {}, users = {};
let analyticsData = [];

let tutorSubjects = [];
let tutorGrades = [];

let chart;

/* ---------------- ELEMENTS ---------------- */

const gradeFilter = document.getElementById("gradeFilter");
const subjectFilter = document.getElementById("subjectFilter");
const quizFilter = document.getElementById("quizFilter");

/* ---------------- AUTH ---------------- */

onAuthStateChanged(auth, async user => {
  if (!user) {
    location.href = "tutor-login.html";
    return;
  }

  await loadTutor(user.email);
  await loadData();
});

/* ---------------- LOAD TUTOR ---------------- */

async function loadTutor(email) {
  const snap = await get(ref(db, "tutors"));

  if (!snap.exists()) return;

  snap.forEach(child => {
    const t = child.val();

    if (t.email === email) {
      tutorSubjects = t.subjects || [];
      tutorGrades = t.grades || [];
    }
  });
}

/* ---------------- LOAD DATA ---------------- */

async function loadData() {
  try {
    const [quizSnap, attemptSnap, userSnap] = await Promise.all([
      get(ref(db, "quizzes")),
      get(ref(db, "attempts")),
      get(ref(db, "users"))
    ]);

    quizzes = quizSnap.val() || {};
    attempts = attemptSnap.val() || {};
    users = userSnap.val() || {};

    buildAnalytics();
    buildFilters();

  } catch (err) {
    console.error("Error loading data:", err);
  }
}

/* ---------------- ANALYTICS ---------------- */

function buildAnalytics() {

  analyticsData = [];
  const learnerQuizStats = {};

  Object.values(attempts).forEach(a => {

    if (!a.total || a.total === 0) return;

    const learner = users[a.userId];
    const quiz = quizzes[a.quizId];

    if (!learner || !quiz) return;
    if (learner.role !== "learner") return;

    const subjectName = quiz.subjectName || "";

    if (!tutorSubjects.includes(subjectName)) return;
    if (!tutorGrades.includes(learner.grade)) return;

    const key = a.userId + "_" + a.quizId;
    const percent = Math.round((a.score / a.total) * 100);

    if (!learnerQuizStats[key]) {
      learnerQuizStats[key] = {
        learnerName: learner.name || "Unknown",
        grade: learner.grade,
        subject: subjectName,
        quizTitle: quiz.title,
        totalScore: 0,
        attempts: 0
      };
    }

    learnerQuizStats[key].totalScore += percent;
    learnerQuizStats[key].attempts++;
  });

  Object.values(learnerQuizStats).forEach(d => {
    const avg = Math.round(d.totalScore / d.attempts);

    analyticsData.push({
      learnerName: d.learnerName,
      grade: d.grade,
      subject: d.subject,
      quizTitle: d.quizTitle,
      attempts: d.attempts,
      score: avg
    });
  });

  renderTable(analyticsData);
  drawChart(analyticsData);
}

/* ---------------- TABLE ---------------- */

function renderTable(data) {

  const tbody = document.getElementById("analyticsTable");
  tbody.innerHTML = "";

  data.forEach(d => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${d.learnerName}</td>
      <td>${d.grade}</td>
      <td>${d.subject}</td>
      <td>${d.quizTitle}</td>
      <td>${d.attempts}</td>
      <td class="${getScoreClass(d.score)}">${d.score}%</td>
    `;

    tbody.appendChild(row);
  });
}

/* ---------------- SCORE COLORS ---------------- */

function getScoreClass(score) {
  if (score < 40) return "low";
  if (score < 70) return "mid";
  return "high";
}

/* ---------------- FILTERS ---------------- */

function buildFilters() {

  gradeFilter.innerHTML = `<option value="">All</option>`;
  subjectFilter.innerHTML = `<option value="">All</option>`;
  quizFilter.innerHTML = `<option value="">All</option>`;

  const gradeSet = new Set();
  const subjectSet = new Set();
  const quizSet = new Set();

  analyticsData.forEach(d => {
    gradeSet.add(d.grade);
    subjectSet.add(d.subject);
    quizSet.add(d.quizTitle);
  });

  gradeSet.forEach(g => gradeFilter.innerHTML += `<option value="${g}">${g}</option>`);
  subjectSet.forEach(s => subjectFilter.innerHTML += `<option value="${s}">${s}</option>`);
  quizSet.forEach(q => quizFilter.innerHTML += `<option value="${q}">${q}</option>`);
}

/* ---------------- APPLY FILTERS ---------------- */

window.applyFilters = () => {

  const grade = gradeFilter.value;
  const subject = subjectFilter.value;
  const quiz = quizFilter.value;

  const filtered = analyticsData.filter(d =>
    (!grade || d.grade == grade) &&
    (!subject || d.subject == subject) &&
    (!quiz || d.quizTitle == quiz)
  );

  renderTable(filtered);
  drawChart(filtered);
};

/* ---------------- CHART ---------------- */

function drawChart(data) {

  if (typeof Chart === "undefined") {
    console.error("Chart.js not loaded");
    return;
  }

  const labels = data.map(d => d.quizTitle);
  const values = data.map(d => d.score);

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("performanceChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Average %",
        data: values
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  });
}

/* ---------------- EXPORT ---------------- */

window.exportExcel = () => {

  let rows = [["Learner","Grade","Subject","Quiz","Attempts","Average %"]];

  document.querySelectorAll("#analyticsTable tr").forEach(tr => {
    let cols = [...tr.children].map(td => td.innerText);
    rows.push(cols);
  });

  let csv = rows.map(r => r.join(",")).join("\n");

  let blob = new Blob([csv], { type: "text/csv" });
  let a = document.createElement("a");

  a.href = URL.createObjectURL(blob);
  a.download = "tutor-analytics.csv";
  a.click();
};

/* ---------------- DARK MODE ---------------- */

document.addEventListener("DOMContentLoaded", () => {
  if (
    localStorage.getItem("darkMode") === "enabled" ||
    (!localStorage.getItem("darkMode") &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    document.body.classList.add("dark-mode");
  }
});