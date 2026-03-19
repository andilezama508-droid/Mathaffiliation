import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, get, push, set, remove } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

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
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

let tutorKey = null;
let editingQuizId = null;
let tutorGrades = [];
let tutorSubjects = [];

onAuthStateChanged(auth, async (user)=>{
  if(!user){ alert("Please login first"); return; }
  const email = user.email;
  const snap = await get(ref(db,"tutors"));
  if(!snap.exists()){ alert("No tutors found"); return; }
  const tutors = snap.val();
  for(const key in tutors){
    if(tutors[key].email===email){
      tutorKey = key;
      loadTutorData(tutors[key]);
      break;
    }
  }
  if(!tutorKey){ alert("Tutor profile not found."); return; }
  loadQuizzes();
});

function loadTutorData(data){
  const gradeSelect = document.getElementById("quizGrade");
  gradeSelect.innerHTML="";
  tutorGrades = data.grades || [];
  tutorGrades.forEach(g=>{
    const opt=document.createElement("option"); opt.value=g; opt.textContent="Grade "+g;
    gradeSelect.appendChild(opt);
  });

  const subjectSelect=document.getElementById("quizSubject");
  subjectSelect.innerHTML="";
  tutorSubjects = data.subjects || [];
  tutorSubjects.forEach(s=>{
    const opt=document.createElement("option"); opt.value=s; opt.textContent=s;
    subjectSelect.appendChild(opt);
  });
}

window.addQuestion=()=>{
  const div=document.createElement("div"); div.className="question-box";
  div.innerHTML=`
<label>Question Text</label><input class="qText">
<label>Question Image (optional ≤5MB)</label><input type="file" class="qImage" accept="image/*">
<img class="preview" style="display:none">
<label>Option A</label><input class="optA">
<label>Option B</label><input class="optB">
<label>Option C</label><input class="optC">
<label>Option D</label><input class="optD">
<label>Correct Answer</label><select class="correct">
<option>A</option><option>B</option><option>C</option><option>D</option></select>`;
  const fileInput=div.querySelector(".qImage");
  const preview=div.querySelector(".preview");
  fileInput.addEventListener("change",()=>{
    const file=fileInput.files[0];
    if(file && file.size>5*1024*1024){ alert("Image must be <5MB"); fileInput.value=""; return; }
    const reader=new FileReader();
    reader.onload=e=>{ preview.src=e.target.result; preview.style.display="block"; };
    reader.readAsDataURL(file);
  });
  document.getElementById("questions").appendChild(div);
};

window.extractWorksheet=async()=>{
  const file=document.getElementById("worksheetUpload").files[0];
  if(!file){ alert("Upload worksheet first"); return; }
  if(file.size>5*1024*1024){ alert("Image must be <5MB"); return; }
  alert("Reading worksheet...");
  const {data:{text}}=await Tesseract.recognize(file,"eng");
  processExtractedText(text);
};

function processExtractedText(text){
  const lines=text.split("\n").map(l=>l.trim()).filter(l=>l);
  let current=null;
  lines.forEach(line=>{
    if(/^\d+[\.\)]/.test(line)){
      if(current) createAutoQuestion(current);
      current={question:line.replace(/^\d+[\.\)]/,"").trim(), options:[]};
    } else if(/^[A-D][\.\)]/.test(line)){ if(current) current.options.push(line.replace(/^[A-D][\.\)]/,"").trim()); }
  });
  if(current) createAutoQuestion(current);
}
function createAutoQuestion(data){ addQuestion(); const last=document.querySelector(".question-box:last-child");
last.querySelector(".qText").value=data.question||"";
if(data.options[0]) last.querySelector(".optA").value=data.options[0];
if(data.options[1]) last.querySelector(".optB").value=data.options[1];
if(data.options[2]) last.querySelector(".optC").value=data.options[2];
if(data.options[3]) last.querySelector(".optD").value=data.options[3];
}

window.saveQuiz=async()=>{
  const title=document.getElementById("quizTitle").value;
  const grade=document.getElementById("quizGrade").value;
  const subjectName=document.getElementById("quizSubject").selectedOptions[0].textContent;
  const time=document.getElementById("quizTime").value;
  const attempts=parseInt(document.getElementById("quizAttempts").value)||1;
  const questions=[];
  for(const q of document.querySelectorAll(".question-box")){
    const img=q.querySelector(".preview").src||"";
    questions.push({questionText:q.querySelector(".qText").value,image:img,
      options:{A:q.querySelector(".optA").value,B:q.querySelector(".optB").value,
        C:q.querySelector(".optC").value,D:q.querySelector(".optD").value},
      correctOption:q.querySelector(".correct").value});
  }
  const quizId=editingQuizId||push(ref(db,"quizzes")).key;
  await set(ref(db,"quizzes/"+quizId),{tutorKey,title,grade,subjectName,timeLimitMinutes:time,attempts,status:"active",questions});
  alert("Quiz saved");
  editingQuizId=null;
  loadQuizzes();
};

async function loadQuizzes(){
  const list=document.getElementById("quizList"); list.innerHTML="Loading...";
  const snap = await get(ref(db,"quizzes")); list.innerHTML="";
  if(!snap.exists()){ list.innerHTML="No quizzes"; return; }

  Object.entries(snap.val()).forEach(([id,q])=>{
    if(!tutorGrades.includes(q.grade)) return;
    if(!tutorSubjects.includes(q.subjectName)) return;

    let questionsHTML="";
    q.questions.forEach((qu,i)=>{
      questionsHTML+=`<div class="question-item"><b>Q${i+1}:</b> ${qu.questionText||""}${qu.image?`<br><img src="${qu.image}" class="question-img">`:""}
<br>A) ${qu.options.A}<br>B) ${qu.options.B}<br>C) ${qu.options.C}<br>D) ${qu.options.D}<br><b>Answer:</b> ${qu.correctOption}</div>`;
    });

    const statusClass = q.status==="active"?"active":"hidden";
    const card = document.createElement("div"); card.className="quiz-card";
    card.innerHTML=`
<div class="quiz-header"><div><b>${q.title}</b><br>Grade ${q.grade} • ${q.subjectName}</div>
<span class="status ${statusClass}">${q.status}</span></div>
<div class="quiz-actions">
<button class="small-btn view" onclick="toggleQuestions('${id}')">View Questions</button>
<button class="small-btn edit" onclick="editQuiz('${id}')">Edit</button>
<button class="small-btn hide" onclick="hideQuiz('${id}')">Hide</button>
<button class="small-btn show" onclick="showQuiz('${id}')">Show</button>
<button class="small-btn delete" onclick="deleteQuiz('${id}')">Delete</button>
<button class="small-btn view" onclick="exportQuizPDF('${id}')">Export PDF</button>
</div>
<div class="questions-view" id="questions-${id}">${questionsHTML}</div>`;
    list.appendChild(card);
  });
}

window.toggleQuestions=id=>{const box=document.getElementById("questions-"+id); box.style.display=box.style.display==="block"?"none":"block";};
window.hideQuiz=async id=>{await set(ref(db,"quizzes/"+id+"/status"),"hidden"); loadQuizzes();};
window.showQuiz=async id=>{await set(ref(db,"quizzes/"+id+"/status"),"active"); loadQuizzes();};
window.deleteQuiz=async id=>{if(!confirm("Delete permanently?")) return; await remove(ref(db,"quizzes/"+id)); loadQuizzes();};

document.getElementById("searchBox").addEventListener("input",e=>{
  const value=e.target.value.toLowerCase();
  document.querySelectorAll(".quiz-card").forEach(card=>{
    card.style.display = card.textContent.toLowerCase().includes(value) ? "block":"none";
  });
});

// Export PDF function
window.exportQuizPDF = async (quizId) => {
  const snap = await get(ref(db,"quizzes/"+quizId));
  if(!snap.exists()){ alert("Quiz not found"); return; }
  const quiz = snap.val();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16); doc.text(`${quiz.title}`,10,20);
  doc.setFontSize(12); doc.text(`Grade ${quiz.grade} • ${quiz.subjectName}`,10,30);
  let y=40;
  quiz.questions.forEach((q,i)=>{
    doc.text(`Q${i+1}: ${q.questionText}`,10,y); y+=6;
    if(q.image){
      try{ doc.addImage(q.image,'JPEG',10,y,100,60); y+=65; } catch(e){ console.log("Image too large"); }
    }
    doc.text(`A) ${q.options.A}`,10,y); y+=6;
    doc.text(`B) ${q.options.B}`,10,y); y+=6;
    doc.text(`C) ${q.options.C}`,10,y); y+=6;
    doc.text(`D) ${q.options.D}`,10,y); y+=6;
    doc.text(`Answer: ${q.correctOption}`,10,y); y+=10;
    if(y>250){ doc.addPage(); y=20; }
  });
  doc.save(`${quiz.title}.pdf`);
};
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "enabled" || 
      (!localStorage.getItem("darkMode") && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add("dark-mode");
  }
});