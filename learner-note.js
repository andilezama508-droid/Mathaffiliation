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

const app=initializeApp(firebaseConfig);
const db=getDatabase(app);
const auth=getAuth(app);

/* Subject colors */

const subjectColors=[
"#ffd6d6",
"#d6ffd9",
"#d6e8ff",
"#ffe7c7",
"#efd6ff",
"#d6fff5",
"#fff5d6",
"#f0f0f0"
];

let notesData={};
let slides=[];
let slideIndex=0;

/* Load learner grade */

onAuthStateChanged(auth,async user=>{

if(!user) return;

const usersSnap=await get(ref(db,"users"));
const users=usersSnap.val();

let learnerGrade=null;

for(const key in users){
if(users[key].email===user.email){
learnerGrade=users[key].grade;
break;
}
}

loadNotes(learnerGrade);

});

/* Load notes */

async function loadNotes(grade){

const snap=await get(ref(db,"notes"));
if(!snap.exists()) return;

const notes=snap.val();

notesData={};

Object.values(notes).forEach(n=>{

if(n.grade!=grade) return;

if(!notesData[n.subject]) notesData[n.subject]={};

if(!notesData[n.subject][n.unit]) notesData[n.subject][n.unit]={};

if(!notesData[n.subject][n.unit][n.topic]) notesData[n.subject][n.unit][n.topic]=[];

notesData[n.subject][n.unit][n.topic].push(n);

});

renderSubjects();

}

/* Render subjects */

function renderSubjects(){

const grid=document.getElementById("subjectsGrid");
grid.innerHTML="";

let colorIndex=0;

Object.keys(notesData).forEach(subject=>{

const card=document.createElement("div");
card.className="card";

card.style.background=subjectColors[colorIndex % subjectColors.length];

card.textContent=subject;

card.onclick=()=>renderUnits(subject);

grid.appendChild(card);

colorIndex++;

});

}

/* Render units */

function renderUnits(subject){

const section=document.getElementById("unitsSection");

section.innerHTML=`<h2>${subject} Units</h2><div class="grid" id="unitsGrid"></div>`;

const grid=document.getElementById("unitsGrid");

Object.keys(notesData[subject]).forEach(unit=>{

const card=document.createElement("div");
card.className="card";
card.textContent=unit;

card.onclick=()=>renderTopics(subject,unit);

grid.appendChild(card);

});

}

/* Render topics */

function renderTopics(subject,unit){

const section=document.getElementById("topicsSection");
section.innerHTML=`<h2>${unit} Topics</h2>`;

Object.keys(notesData[subject][unit]).forEach(topic=>{

const div=document.createElement("div");
div.className="topic-card";
div.textContent=topic;

div.onclick=()=>openSlides(subject,unit,topic);

section.appendChild(div);

});

}

/* Open slides */

function openSlides(subject,unit,topic){

const noteList=notesData[subject][unit][topic];

slides=[];

noteList.forEach(note=>{

if(note.images && note.images.length){

note.images.forEach(img=>{
slides.push({
topic:note.topic,
text:note.text,
image:img
});
});

}else if(note.imageURL){

slides.push({
topic:note.topic,
text:note.text,
image:note.imageURL
});

}

});

slideIndex=0;

document.body.style.overflow="hidden";

document.getElementById("slideViewer").style.display="flex";

showSlide();

}

/* Show slide */

function showSlide(){

const slide=slides[slideIndex];

document.getElementById("slideContent").innerHTML=`

<h3>${slide.topic}</h3>

<p>${slide.text}</p>

${slide.image?`<img src="${slide.image}">`:""}

<p style="font-size:12px;color:#666;margin-top:10px;">
Slide ${slideIndex+1} of ${slides.length}
</p>

`;

}

/* Navigation */

window.nextSlide=()=>{

if(slideIndex<slides.length-1){
slideIndex++;
showSlide();
}

}

window.prevSlide=()=>{

if(slideIndex>0){
slideIndex--;
showSlide();
}

}

/* Close slides */

window.closeSlides=()=>{

document.getElementById("slideViewer").style.display="none";

document.body.style.overflow="auto";

}
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "enabled" || 
      (!localStorage.getItem("darkMode") && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add("dark-mode");
  }
});