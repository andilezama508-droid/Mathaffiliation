import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, get, push, set } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

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
const storage = getStorage(app);

/* ---------------- SUBJECTS ---------------- */

const subjectSelect = document.getElementById("quiz-subject");
const subjectsMap = {};

async function loadSubjects() {
  subjectSelect.innerHTML = `<option value="">Select Subject</option>`;

  try {
    const snap = await get(ref(db, "subjects"));

    if (!snap.exists()) {
      subjectSelect.innerHTML = `<option value="">No subjects found</option>`;
      return;
    }

    Object.entries(snap.val()).forEach(([id, data]) => {
      subjectsMap[id] = data.name;

      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = data.name;

      subjectSelect.appendChild(opt);
    });

  } catch (err) {
    console.error(err);
    subjectSelect.innerHTML = `<option value="">Failed to load subjects</option>`;
  }
}

loadSubjects();

/* ---------------- QUESTIONS ---------------- */

let qCount = 0;

window.addQuestion = () => {
  if (qCount >= 50) {
    alert("Maximum 50 questions allowed.");
    return;
  }

  qCount++;

  const box = document.createElement("div");
  box.className = "question-box";

  box.innerHTML = `
    <h4>Question ${qCount}</h4>
    <input class="qText" placeholder="Question text">
    <input type="file" class="qImage" accept="image/*">
    <input class="optA" placeholder="Option A">
    <input class="optB" placeholder="Option B">
    <input class="optC" placeholder="Option C">
    <input class="optD" placeholder="Option D">
    <select class="correct">
      <option value="">Correct Option</option>
      <option>A</option>
      <option>B</option>
      <option>C</option>
      <option>D</option>
    </select>
  `;

  document.getElementById("questions").appendChild(box);
};

/* ---------------- SAVE QUIZ ---------------- */

window.saveQuiz = async () => {

  const loader = document.getElementById("loader");
  loader.style.display = "block";

  try {

    const title = document.getElementById("quiz-title").value.trim();
    const grade = document.getElementById("quiz-grade").value;
    const subjectId = subjectSelect.value;

    if (!title || !grade || !subjectId) {
      throw new Error("Title, grade and subject are required");
    }

    const boxes = document.querySelectorAll(".question-box");

    if (boxes.length === 0) {
      throw new Error("Add at least one question");
    }

    const uploadPromises = [];

    const questions = [];

    for (const box of boxes) {

      const qText = box.querySelector(".qText").value.trim();
      const correct = box.querySelector(".correct").value;

      const optA = box.querySelector(".optA").value.trim();
      const optB = box.querySelector(".optB").value.trim();
      const optC = box.querySelector(".optC").value.trim();
      const optD = box.querySelector(".optD").value.trim();

      if (!qText || !correct || !optA || !optB || !optC || !optD) {
        throw new Error("All fields must be filled for every question");
      }

      const file = box.querySelector(".qImage").files[0];

      let imagePromise = Promise.resolve("");

      if (file) {
        const unique = Date.now() + "_" + Math.random().toString(36).slice(2);
        const imgRef = sRef(storage, `quizImages/${unique}_${file.name}`);

        imagePromise = uploadBytes(imgRef, file)
          .then(() => getDownloadURL(imgRef));
      }

      uploadPromises.push(
        imagePromise.then(url => ({
          questionText: qText,
          imageUrl: url,
          options: { A: optA, B: optB, C: optC, D: optD },
          correctOption: correct
        }))
      );
    }

    // ✅ Parallel upload (FASTER)
    const finalQuestions = await Promise.all(uploadPromises);

    const quizRef = push(ref(db, "quizzes"));

    await set(quizRef, {
      title,
      grade,
      subjectId,
      subjectName: subjectsMap[subjectId] || "Unknown",
      questions: finalQuestions,
      timeLimitMinutes: parseInt(document.getElementById("quiz-time").value) || 0,
      status: "active",
      createdAt: Date.now()
    });

    alert("✅ Quiz saved successfully");
    location.reload();

  } catch (err) {
    console.error(err);
    alert("❌ " + err.message);
  }

  loader.style.display = "none";
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