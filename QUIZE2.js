import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, get, push, set } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

/* Firebase */
const firebaseConfig = {
  apiKey: "AIzaSyD9I6EBsk4k2hykZo0Yzp67CHrJQjIf2ts",
  authDomain: "online-tutoring-system-d2a40.firebaseapp.com",
  databaseURL: "https://online-tutoring-system-d2a40-default-rtdb.firebaseio.com",
  projectId: "online-tutoring-system-d2a40",
  storageBucket: "online-tutoring-system-d2a40.appspot.com",
  messagingSenderId: "476767991196",
  appId: "1:476767991196:web:98d6814aa85c3c9603c459"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

/* State */
let currentUserId="", learnerGrade="";
let quizzes={}, attemptsMap={};
let activeQuiz=null, timerInterval=null, autosaveInterval=null;

/* Prevent leaving */
window.addEventListener("beforeunload", e=>{
  if(activeQuiz){
    e.preventDefault();
    e.returnValue="Quiz active";
  }
});

/* Load attempts (optimized later if needed) */
async function loadAttempts(){
  const snap=await get(ref(db,"attempts"));
  attemptsMap={};
  if(!snap.exists()) return;

  Object.values(snap.val()).forEach(a=>{
    if(a.userId===currentUserId){
      if(!attemptsMap[a.quizId]) attemptsMap[a.quizId]=0;
      attemptsMap[a.quizId]++;
    }
  });
}

/* Load quizzes */
async function loadQuizzes(){
  const snap=await get(ref(db,"quizzes"));
  quizzes={};

  if(!snap.exists()) return;

  Object.entries(snap.val()).forEach(([id,q])=>{
    if(q.grade===learnerGrade && q.status==="active"){
      quizzes[id]=q;
    }
  });

  renderQuizzes();
}

/* Render */
function renderQuizzes(){
  const list=document.getElementById("quiz-list");
  list.innerHTML="";

  Object.entries(quizzes).forEach(([id,q])=>{
    const used=attemptsMap[id]||0;
    const max=q.attempts ?? 3;

    let btn = used>=max
      ? `<button onclick="reviewQuiz('${id}')">Review</button>`
      : `<button onclick="startQuiz('${id}')">Start (${used}/${max})</button>`;

    const box=document.createElement("div");
    box.className="quiz-box";
    box.innerHTML=`
      <h3>${q.title}</h3>
      <div>Subject: ${q.subjectName} | Questions: ${q.questions.length}</div>
      ${btn}
      <div id="quizArea-${id}" style="display:none"></div>
    `;
    list.appendChild(box);
  });
}

/* Start quiz */
window.startQuiz=(id)=>{
  if(activeQuiz){
    alert("Finish current quiz first");
    return;
  }

  activeQuiz=id;
  const quiz=quizzes[id];
  const area=document.getElementById(`quizArea-${id}`);
  area.style.display="block";

  let html=`<div class="timer" id="timer-${id}"></div><form id="quizForm-${id}">`;

  quiz.questions.forEach((q,i)=>{
    html+=`
    <div class="question">
      <strong>Q${i+1}: ${q.questionText}</strong>
      ${q.imageUrl ? `<img src="${q.imageUrl}" class="question-img">` : ""}
      <div class="options">
        <label><input type="radio" name="q${i}" value="A"> A. ${q.options.A}</label>
        <label><input type="radio" name="q${i}" value="B"> B. ${q.options.B}</label>
        <label><input type="radio" name="q${i}" value="C"> C. ${q.options.C}</label>
        <label><input type="radio" name="q${i}" value="D"> D. ${q.options.D}</label>
      </div>
    </div>`;
  });

  html+=`<button type="button" onclick="submitQuiz('${id}')">Submit</button></form>`;
  area.innerHTML=html;

  /* Timer */
  let seconds=(quiz.timeLimitMinutes||10)*60;
  const display=document.getElementById(`timer-${id}`);

  timerInterval=setInterval(()=>{
    let m=Math.floor(seconds/60);
    let s=seconds%60;
    display.textContent=`Time: ${m}:${s.toString().padStart(2,"0")}`;
    seconds--;
    if(seconds<0){
      clearInterval(timerInterval);
      submitQuiz(id);
    }
  },1000);

  /* Safe fullscreen */
  if(document.documentElement.requestFullscreen){
    document.documentElement.requestFullscreen().catch(()=>{});
  }
};

/* Submit */
window.submitQuiz=async(id)=>{
  clearInterval(timerInterval);

  const form=document.getElementById(`quizForm-${id}`);
  if(!form){
    alert("Error. Reload page.");
    return;
  }

  const quiz=quizzes[id];
  let score=0;

  quiz.questions.forEach((q,i)=>{
    const checked=form.querySelector(`input[name=q${i}]:checked`);
    if(checked && checked.value===q.correctOption) score++;
  });

  await set(push(ref(db,"attempts")),{
    userId:currentUserId,
    quizId:id,
    score,
    total:quiz.questions.length,
    createdAt:Date.now()
  });

  alert(`Score: ${score}/${quiz.questions.length}`);

  activeQuiz=null;

  if(document.fullscreenElement){
    document.exitFullscreen().catch(()=>{});
  }

  await loadAttempts();
  renderQuizzes();
};

/* Review */
window.reviewQuiz=(id)=>{
  const quiz=quizzes[id];
  const area=document.getElementById(`quizArea-${id}`);
  area.style.display="block";

  let html="<h3>Review</h3>";

  quiz.questions.forEach((q,i)=>{
    html+=`
    <div class="question">
      <strong>Q${i+1}: ${q.questionText}</strong>
      ${q.imageUrl ? `<img src="${q.imageUrl}" class="question-img">` : ""}
      <div>Correct: ${q.correctOption}</div>
    </div>`;
  });

  area.innerHTML=html;
};

/* Auth */
// Auth
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // Not logged in
    location.href = "User-login.html";
    return;
  }

  currentUserId = user.uid;

  try {
    const userSnap = await get(ref(db, `users/${user.uid}`));
    
    if (!userSnap.exists()) {
      alert("User data not found. Contact admin.");
      location.href = "login.html";
      return;
    }

    const userData = userSnap.val();

    // Only allow learners
    if (userData.role && userData.role !== "learner") {
      alert("Only learners can access this page.");
      location.href = "dashboard1.html";
      return;
    }

    learnerGrade = userData.grade || "";

    // Load attempts and quizzes for this learner
    await loadAttempts();
    await loadQuizzes();

  } catch (err) {
    console.error("Failed to fetch user data:", err);
    alert("Failed to fetch user data. Reload page.");
  }
});

/* Dark mode */
document.getElementById("darkModeBtn").onclick=()=>{
  document.body.classList.toggle("dark-mode");
};
