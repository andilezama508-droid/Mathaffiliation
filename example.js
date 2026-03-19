import {initializeApp} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {getDatabase,ref,get} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

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
const db = getDatabase(app);
const auth = getAuth(app);

let currentUserId = "";
let learnerGrade = "";
let quizzes = {};
let attemptsMap = {};

// Auth check
onAuthStateChanged(auth, async user => {
  if(user){
    currentUserId = user.uid;
    const snap = await get(ref(db,`users/${user.uid}`));
    learnerGrade = snap.val().grade;
    await loadAttempts();
    await loadQuizzes();
  } else {
    window.location.href = "index.html";
  }
});

// Load attempts
async function loadAttempts(){
  const snap = await get(ref(db,`attempts/${currentUserId}`));
  attemptsMap = snap.exists() ? snap.val() : {};
}

// Load quizzes (efficient query)
async function loadQuizzes(){
  quizzes = {};
  const subjectsSnap = await get(ref(db,`users/${currentUserId}/subjects`));
  if(!subjectsSnap.exists()) return;

  for(const subject in subjectsSnap.val()){
    const quizSnap = await get(ref(db,`quizzes/${subject}/${learnerGrade}`));
    if(quizSnap.exists()){
      Object.entries(quizSnap.val()).forEach(([id,q])=>{
        if(q.status === "active") quizzes[id] = q;
      });
    }
  }
  renderQuizzes();
}

// Render list
function renderQuizzes(){
  const list = document.getElementById("quiz-list");
  list.innerHTML = "";
  Object.entries(quizzes).forEach(([id,q])=>{
    const used = attemptsMap[id]?.score || 0;
    let btn = `<button onclick="startQuiz('${id}')">${used ? 'Review':'Start Quiz'}</button>`;
    list.innerHTML += `<div class="quiz-box">
      <h3>${q.title}</h3>
      <div>Subject: ${q.subjectName} | Questions: ${q.questions.length} | Attempts: ${used}</div>
      ${btn}
    </div>`;
  });
}