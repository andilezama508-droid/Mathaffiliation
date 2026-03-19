import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

// 🔥 FIX: Initialize Firebase app first
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

const app = initializeApp(firebaseConfig);  // ✅ Initialize app
const db = getDatabase(app);               // ✅ Now this works

let quizzes = {}, attempts = {}, users = {}, subjects = {};
let analyticsData = [];

async function loadData() {
  const [quizSnap, attemptSnap, userSnap, subjectSnap] = await Promise.all([
    get(ref(db, "quizzes")),
    get(ref(db, "attempts")),
    get(ref(db, "users")),
    get(ref(db, "subjects"))
  ]);

  quizzes = quizSnap.val() || {};
  attempts = attemptSnap.val() || {};
  users = userSnap.val() || {};
  subjects = subjectSnap.val() || {};

  buildFilters();
  buildAnalytics();
}

// … rest of your code remains unchanged …

function buildFilters(){

const grades=new Set();
const subjectNames=new Set();
const quizNames=new Set();

Object.values(users).forEach(u=>{
if(u.role==="learner") grades.add(u.grade);
});

Object.values(subjects).forEach(s=>subjectNames.add(s.name));
Object.values(quizzes).forEach(q=>quizNames.add(q.title));

grades.forEach(g=>gradeFilter.innerHTML+=`<option>${g}</option>`);
subjectNames.forEach(s=>subjectFilter.innerHTML+=`<option>${s}</option>`);
quizNames.forEach(q=>quizFilter.innerHTML+=`<option>${q}</option>`);

}

function buildAnalytics(){

analyticsData=[];

let total=0;
let totalPercent=0;
let passCount=0;

let subjectStats={};
let learnerStats={};

Object.values(attempts).forEach(a=>{

const learner=users[a.userId];
const quiz=quizzes[a.quizId];

if(!learner||!quiz) return;

const subjectName=subjects[quiz.subjectId]?.name||quiz.subjectId;

const percent=((a.score/a.total)*100);

analyticsData.push({
name:learner.fullName||learner.name,
grade:learner.grade,
subject:subjectName,
quiz:quiz.title,
score:a.score,
total:a.total,
percent:percent.toFixed(1)
});

total++;
totalPercent+=percent;

if(percent>=50) passCount++;

if(!subjectStats[subjectName]) subjectStats[subjectName]=[];
subjectStats[subjectName].push(percent);

if(!learnerStats[learner.fullName]) learnerStats[learner.fullName]=[];
learnerStats[learner.fullName].push(percent);

});

renderTable(analyticsData);

document.getElementById("totalAttempts").innerText=total;
document.getElementById("avgScore").innerText=(totalPercent/total).toFixed(1)+"%";
document.getElementById("passRate").innerText=((passCount/total)*100).toFixed(1)+"%";

renderAverages(subjectStats,"subjectAverages");
renderAverages(learnerStats,"learnerAverages");

}

function renderTable(data){

const tbody=document.getElementById("analyticsTable");
tbody.innerHTML="";

data.forEach(d=>{

const cls=d.percent<50?"low":"high";

tbody.innerHTML+=`
<tr>
<td>${d.name}</td>
<td>${d.grade}</td>
<td>${d.subject}</td>
<td>${d.quiz}</td>
<td>${d.score}</td>
<td>${d.total}</td>
<td class="${cls}">${d.percent}%</td>
</tr>
`;

});

}

function renderAverages(stats,id){

const div=document.getElementById(id);
div.innerHTML="";

Object.entries(stats).forEach(([k,v])=>{

const avg=v.reduce((a,b)=>a+b,0)/v.length;

div.innerHTML+=`<p>${k}: <b>${avg.toFixed(1)}%</b></p>`;

});

}

window.applyFilters=()=>{

const grade=gradeFilter.value;
const subject=subjectFilter.value;
const quiz=quizFilter.value;
const search=searchLearner.value.toLowerCase();

const filtered=analyticsData.filter(d=>
(!grade||d.grade==grade)&&
(!subject||d.subject==subject)&&
(!quiz||d.quiz==quiz)&&
(!search||d.name.toLowerCase().includes(search))
);

renderTable(filtered);

}

window.exportExcel=()=>{

let rows=[["Learner","Grade","Subject","Quiz","Score","Max","Percent"]];

document.querySelectorAll("#analyticsTable tr").forEach(tr=>{
let cols=[...tr.children].map(td=>td.innerText);
rows.push(cols);
});

let csv=rows.map(r=>r.join(",")).join("\n");

       let blob=new Blob([csv],{type:"text/csv"});
       let a=document.createElement("a");
a.href=URL.createObjectURL(blob);
a.download="performance.csv";
a.click();

}

loadData();
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "enabled" || 
      (!localStorage.getItem("darkMode") && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add("dark-mode");
  }
});