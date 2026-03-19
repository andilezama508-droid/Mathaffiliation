import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// ---------------- Firebase Config ----------------
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

// ✅ MUST initialize
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// ---------------- Elements ----------------
const subjectListDiv = document.getElementById("subject-list");
const modal = document.getElementById("review-modal");
const modalBody = document.getElementById("modal-body");

// ---------------- Auth + Load Data ----------------
onAuthStateChanged(auth, async user => {
  if (!user) {
    alert("Please log in first.");
    window.location.href = "login.html";
    return;
  }

  try {
    subjectListDiv.innerHTML = "Loading attempts...";

    const snap = await get(ref(db, "attempts"));

    if (!snap.exists()) {
      subjectListDiv.innerHTML = "<p>No quiz attempts found yet.</p>";
      return;
    }

    const allAttempts = Object.entries(snap.val())
      .filter(([_, a]) => a.userId === user.uid)
      .map(([key, a]) => ({ ...a, id: key }));

    if (allAttempts.length === 0) {
      subjectListDiv.innerHTML = "<p>No quiz attempts found yet.</p>";
      return;
    }

    // ---------------- Group by Subject ----------------
    const subjectMap = {};

    allAttempts.forEach(a => {
      const subj = a.subjectName || "Unknown";

      if (!subjectMap[subj]) {
        subjectMap[subj] = { quizzes: [] };
      }

      subjectMap[subj].quizzes.push(a);
    });

    subjectListDiv.innerHTML = "";

    // ---------------- Render ----------------
    for (const [subj, stats] of Object.entries(subjectMap)) {

      const totalScore = stats.quizzes.reduce((sum, q) => sum + Number(q.score || 0), 0);
      const totalQuestions = stats.quizzes.reduce((sum, q) => sum + Number(q.total || 0), 0);

      const avg = totalQuestions > 0
        ? ((totalScore / totalQuestions) * 100).toFixed(1)
        : "0";

      const button = document.createElement("button");
      button.className = "subject-button";
      button.textContent = `${subj} | Avg: ${avg}% | Attempts: ${stats.quizzes.length}`;

      const detailsDiv = document.createElement("div");
      detailsDiv.className = "subject-details";
      detailsDiv.style.display = "none";

      stats.quizzes.forEach(q => {

        const percent = q.total > 0
          ? ((q.score / q.total) * 100).toFixed(1)
          : 0;

        const passFail = (q.score / q.total >= 0.5) ? "success" : "failed";

        const qDiv = document.createElement("div");
        qDiv.className = `quiz-entry ${passFail}`;

        qDiv.innerHTML = `
          <strong>${q.quizTitle || "Unknown Quiz"}</strong>
          | Score: ${q.score}/${q.total}
          (${percent}%)
          | ${new Date(q.createdAt).toLocaleString()}
        `;

        // Review Button
        if (q.completedAllAttempts && q.answers) {
          const revBtn = document.createElement("button");
          revBtn.className = "review-btn";
          revBtn.textContent = "Review";
          revBtn.onclick = () => openReviewModal(q);
          qDiv.appendChild(revBtn);
        } else {
          const span = document.createElement("div");
          span.style.fontStyle = "italic";
          span.textContent = "Review available after completing all attempts";
          qDiv.appendChild(span);
        }

        detailsDiv.appendChild(qDiv);
      });

      button.onclick = () => {
        detailsDiv.style.display =
          detailsDiv.style.display === "block" ? "none" : "block";
      };

      subjectListDiv.appendChild(button);
      subjectListDiv.appendChild(detailsDiv);
    }

  } catch (err) {
    console.error("Error loading attempts:", err);
    subjectListDiv.innerHTML = "<p>Error loading data.</p>";
  }
});

// ---------------- Review Modal ----------------
function openReviewModal(quiz) {
  modalBody.innerHTML = `<h3>${quiz.quizTitle} – Review</h3>`;

  quiz.answers.forEach((a, i) => {
    const div = document.createElement("div");
    div.style.marginBottom = "10px";

    div.innerHTML = `
      <div><strong>Q${i + 1}:</strong> ${a.questionText}</div>
      <div>
        Selected:
        <span class="${a.correct ? 'correct' : 'wrong'}">
          ${a.selectedOption || 'No Answer'}
        </span>
      </div>
      <div>
        Correct Answer:
        <span class="correct">${a.correctOption}</span>
      </div>
    `;

    modalBody.appendChild(div);
  });

  modal.style.display = "flex";
}

// Close modal globally
window.closeModal = () => {
  modal.style.display = "none";
};

// ---------------- Dark Mode ----------------
document.addEventListener("DOMContentLoaded", () => {
  if (
    localStorage.getItem("darkMode") === "enabled" ||
    (!localStorage.getItem("darkMode") &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    document.body.classList.add("dark-mode");
  }
});