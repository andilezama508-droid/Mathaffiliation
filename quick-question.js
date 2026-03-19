import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
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

// ✅ REQUIRED INITIALIZATION
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);

/* ---------------- FORM SUBMIT ---------------- */

const form = document.getElementById("questionForm");
const successMsg = document.getElementById("success");

form.addEventListener("submit", async function(e) {
  e.preventDefault();

  try {
    successMsg.textContent = "Uploading...";
    form.querySelector("button").disabled = true;

    const grade = document.getElementById("grade").value;
    const subject = document.getElementById("subject").value.trim();
    const topic = document.getElementById("topic").value.trim();
    const questionText = document.getElementById("questionText").value.trim();
    const solution = document.getElementById("solution").value.trim();

    const imgFile = document.getElementById("questionImage").files[0];
    const docFile = document.getElementById("questionDoc").files[0];

    // ✅ Basic validation
    if (!grade || !subject || !topic || !questionText) {
      alert("Please fill all required fields.");
      successMsg.textContent = "";
      form.querySelector("button").disabled = false;
      return;
    }

    let imageURL = "";
    let docURL = "";

    const unique = Date.now() + "_" + Math.random().toString(36).slice(2);

    // ---------------- Upload Image ----------------
    if (imgFile) {
      const imgRef = sRef(storage, `quickQuestions/images/${unique}_${imgFile.name}`);
      await uploadBytes(imgRef, imgFile);
      imageURL = await getDownloadURL(imgRef);
    }

    // ---------------- Upload Document ----------------
    if (docFile) {
      const docRef = sRef(storage, `quickQuestions/docs/${unique}_${docFile.name}`);
      await uploadBytes(docRef, docFile);
      docURL = await getDownloadURL(docRef);
    }

    // ---------------- Save to DB ----------------
    await push(ref(db, "quickQuestions"), {
      grade,
      subject,
      topic,
      questionText,
      imageURL,
      docURL,
      solution,
      createdAt: new Date().toISOString()
    });

    successMsg.textContent = "✅ Question uploaded successfully!";
    form.reset();

  } catch (err) {
    console.error("Upload error:", err);
    successMsg.textContent = "❌ Upload failed. Try again.";
  } finally {
    form.querySelector("button").disabled = false;
  }
});

/* ---------------- DARK MODE ---------------- */

document.addEventListener("DOMContentLoaded", () => {
  if (
    localStorage.getItem("darkMode") === "enabled" ||
    (!localStorage.getItem("darkMode") &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    document.body.classList.add("dark-mode");
  }
});