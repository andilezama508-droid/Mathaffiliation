import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, get, push, set, remove } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

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

let editingQuizId = null;

// ------------------- Load Subjects -------------------
async function loadSubjects() {
  const select = document.getElementById("quizSubject");
  select.innerHTML = "";
  try {
    const snap = await get(ref(db, "subjects"));
    if (!snap.exists()) return;
    Object.entries(snap.val()).forEach(([id, s]) => {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = s.name;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("Failed to load subjects:", err);
  }
}

loadSubjects();

// ------------------- Add Question -------------------
window.addQuestion = () => {
  const div = document.createElement("div");
  div.className = "question-box";

  div.innerHTML = `
<label>Question Text</label>
<input class="qText">

<label>Question Image (optional ≤5MB)</label>
<input type="file" class="qImage" accept="image/*">
<img class="preview" style="display:none">

<label>Option A</label><input class="optA">
<label>Option B</label><input class="optB">
<label>Option C</label><input class="optC">
<label>Option D</label><input class="optD">

<label>Correct Answer</label>
<select class="correct">
<option>A</option>
<option>B</option>
<option>C</option>
<option>D</option>
</select>
`;

  const fileInput = div.querySelector(".qImage");
  const preview = div.querySelector(".preview");

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      fileInput.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      preview.src = e.target.result;
      preview.style.display = "block";
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("questions").appendChild(div);
};

// ------------------- Extract Worksheet -------------------
window.extractWorksheet = async () => {
  const file = document.getElementById("worksheetUpload").files[0];
  if (!file) { alert("Upload worksheet first"); return; }
  if (file.size > 5 * 1024 * 1024) { alert("Image must be under 5MB"); return; }

  alert("Reading worksheet...");

  try {
    const { data: { text } } = await Tesseract.recognize(file, "eng");
    processExtractedText(text);
  } catch (err) {
    console.error("Failed to extract text:", err);
    alert("Failed to read worksheet");
  }
};

function processExtractedText(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  let current = null;

  lines.forEach(line => {
    if (/^\d+[\.\)]/.test(line)) {
      if (current) createAutoQuestion(current);
      current = { question: line.replace(/^\d+[\.\)]/, "").trim(), options: [] };
    } else if (/^[A-D][\.\)]/.test(line)) {
      if (current) current.options.push(line.replace(/^[A-D][\.\)]/, "").trim());
    }
  });

  if (current) createAutoQuestion(current);
}

function createAutoQuestion(data) {
  window.addQuestion();
  const last = document.querySelector(".question-box:last-child");
  last.querySelector(".qText").value = data.question || "";
  ["A", "B", "C", "D"].forEach((opt, i) => {
    if (data.options[i]) last.querySelector(`.opt${opt}`).value = data.options[i];
  });
}

// ------------------- Save Quiz -------------------
window.saveQuiz = async () => {
  const title = document.getElementById("quizTitle").value;
  const grade = document.getElementById("quizGrade").value;
  const subjectSelect = document.getElementById("quizSubject");
  const subjectId = subjectSelect.value;
  const subjectName = subjectSelect.selectedOptions[0].textContent;
  const time = document.getElementById("quizTime").value;
  const attempts = parseInt(document.getElementById("quizAttempts").value || "1");

  const questions = [];
  for (const q of document.querySelectorAll(".question-box")) {
    questions.push({
      questionText: q.querySelector(".qText").value,
      image: q.querySelector(".preview").src || "",
      options: {
        A: q.querySelector(".optA").value,
        B: q.querySelector(".optB").value,
        C: q.querySelector(".optC").value,
        D: q.querySelector(".optD").value
      },
      correctOption: q.querySelector(".correct").value
    });
  }

  const quizId = editingQuizId || push(ref(db, "quizzes")).key;

  try {
    await set(ref(db, `quizzes/${quizId}`), {
      title, grade, subjectId, subjectName,
      timeLimitMinutes: time,
      attempts, status: "active", questions
    });
    alert("Quiz saved");
    editingQuizId = null;
    loadQuizzes();
  } catch (err) {
    console.error("Failed to save quiz:", err);
    alert("Failed to save quiz");
  }
};

// ------------------- Load Quizzes -------------------
async function loadQuizzes() {
  const list = document.getElementById("quizList");
  list.innerHTML = "Loading...";
  try {
    const snap = await get(ref(db, "quizzes"));
    list.innerHTML = "";
    if (!snap.exists()) { list.innerHTML = "No quizzes"; return; }

    Object.entries(snap.val()).forEach(([id, q]) => {
      let questionsHTML = "";
      q.questions.forEach((qu, i) => {
        questionsHTML += `
<div class="question-item">
<b>Q${i + 1}:</b> ${qu.questionText}<br>
${qu.image ? `<img src="${qu.image}" class="question-img"><br>` : ""}
A) ${qu.options.A}<br>
B) ${qu.options.B}<br>
C) ${qu.options.C}<br>
D) ${qu.options.D}<br>
<b>Answer:</b> ${qu.correctOption}
</div>`;
      });

      const statusClass = q.status === "active" ? "active" : "hidden";

      const card = document.createElement("div");
      card.className = "quiz-card";
      card.innerHTML = `
<div class="quiz-header">
<div><b>${q.title}</b><br>Grade ${q.grade} • ${q.subjectName}</div>
<span class="status ${statusClass}">${q.status}</span>
</div>

<div class="quiz-actions">
<button class="small-btn view" onclick="toggleQuestions('${id}')">View Questions</button>
<button class="small-btn edit" onclick="editQuiz('${id}')">Edit</button>
<button class="small-btn hide" onclick="hideQuiz('${id}')">Hide</button>
<button class="small-btn show" onclick="showQuiz('${id}')">Show</button>
<button class="small-btn delete" onclick="deleteQuiz('${id}')">Delete</button>
</div>

<div class="questions-view" id="questions-${id}" style="display:none">
${questionsHTML}
</div>`;
      list.appendChild(card);
    });
  } catch (err) {
    console.error("Failed to load quizzes:", err);
    list.innerHTML = "Error loading quizzes";
  }
}

loadQuizzes();

// ------------------- Quiz Actions -------------------
window.toggleQuestions = id => {
  const box = document.getElementById(`questions-${id}`);
  box.style.display = box.style.display === "block" ? "none" : "block";
};

window.hideQuiz = async id => {
  await set(ref(db, `quizzes/${id}/status`), "hidden");
  loadQuizzes();
};

window.showQuiz = async id => {
  await set(ref(db, `quizzes/${id}/status`), "active");
  loadQuizzes();
};

window.deleteQuiz = async id => {
  if (!confirm("Delete permanently?")) return;
  await remove(ref(db, `quizzes/${id}`));
  loadQuizzes();
};

// ------------------- Search -------------------
document.getElementById("searchBox").addEventListener("input", e => {
  const value = e.target.value.toLowerCase();
  document.querySelectorAll(".quiz-card").forEach(card => {
    card.style.display = card.textContent.toLowerCase().includes(value) ? "block" : "none";
  });
});

// ------------------- Dark Mode -------------------
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "enabled" ||
      (!localStorage.getItem("darkMode") && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.body.classList.add("dark-mode");
  }
});