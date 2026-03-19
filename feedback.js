import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getDatabase, ref, onValue, push, set, get } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

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
const auth=getAuth(app);
const db=getDatabase(app);
const storage=getStorage(app);

const subjectSelect=document.getElementById("subjectSelect");
const submitQuestion=document.getElementById("submitQuestion");
const subjectList=document.getElementById("subjectList");
const chat=document.getElementById("chat");
let currentUser=null;
let allMessages=[];

// Image viewer
window.showImage=(src)=>{
  const viewer=document.getElementById("viewer");
  document.getElementById("viewImg").src=src;
  viewer.style.display="flex";
};

// Load subjects
async function loadSubjects(){
  const snap=await get(ref(db,"subjects"));
  subjectSelect.innerHTML=`<option value="">Select Subject</option>`;
  if(!snap.exists()) return;
  snap.forEach(c=>{
    const opt=document.createElement("option");
    opt.value=opt.textContent=c.val().name;
    subjectSelect.appendChild(opt);
  });
}

// Auth + listener
onAuthStateChanged(auth,user=>{
  if(!user){location.href="index.html";return;}
  currentUser=user;
  loadSubjects();
  submitQuestion.disabled=false;
  listenMessages(user.email);
});

// Submit question
submitQuestion.onclick=async()=>{
  const subject=subjectSelect.value;
  const text=document.getElementById("questionText").value.trim();
  const file=document.getElementById("questionImage").files[0];
  if(!subject||!text){alert("Subject and question required");return;}
  let imageUrl="";
  if(file){
    const imgRef=sRef(storage,`questions/${currentUser.uid}/${Date.now()}_${file.name}`);
    await uploadBytes(imgRef,file);
    imageUrl=await getDownloadURL(imgRef);
  }
  const qRef=push(ref(db,"questions"));
  await set(qRef,{
    id:qRef.key,
    learnerId:currentUser.uid,
    learnerEmail:currentUser.email,
    subject,
    question:text,
    imageUrl,
    status:"open",
    createdAt:Date.now()
  });
  alert("Question submitted successfully");
  location.reload();
};

// Listen messages for learner
function listenMessages(email){
  onValue(ref(db,"questions"),snap=>{
    allMessages=[];
    if(!snap.exists()) return;
    snap.forEach(c=>{
      const q=c.val(); q.id=c.key;
      if(q.learnerEmail===email) allMessages.push(q);
    });
    buildSubjectList();
  });
}

// Build subject sidebar
function buildSubjectList(){
  const subjects={};
  allMessages.forEach(m=>{
    if(!subjects[m.subject]) subjects[m.subject]={lastMessage:"",lastTime:0,unread:false};
    subjects[m.subject].lastMessage=m.question;
    subjects[m.subject].lastTime=m.createdAt;
    if(m.feedback){
      const arr=Object.values(m.feedback);
      subjects[m.subject].unread=arr.some(f=>!f.seen);
    }
  });
  const sorted=Object.entries(subjects).sort((a,b)=>b[1].lastTime-a[1].lastTime);
  subjectList.innerHTML="";
  sorted.forEach(([sub,data])=>{
    const btn=document.createElement("button");
    btn.className="subject-btn";
    btn.innerHTML=`${sub} ${data.unread?'<span class="unread">!</span>':""}<div class="preview">${data.lastMessage.substring(0,40)}</div>`;
    btn.onclick=()=>{loadConversation(sub);};
    subjectList.appendChild(btn);
  });
}

// Load conversation
async function loadConversation(subject){
  chat.innerHTML="";
  const filtered=allMessages.filter(m=>m.subject===subject);
  for(const q of filtered){
    // Learner bubble with "Me"
    chat.innerHTML+=`
      <div class="msg learner">
        <div class="bubble">
          <strong>Me</strong>
          <p>${q.question}</p>
          ${q.imageUrl?`<img src="${q.imageUrl}" onclick="showImage(this.src)">`:""}
          <div class="meta">${new Date(q.createdAt).toLocaleString()}</div>
        </div>
      </div>
    `;

    if(q.feedback){
      const feedbackArr=Object.entries(q.feedback).map(([key,val])=>({key,...val}));
      for(const f of feedbackArr){
        chat.innerHTML+=`
          <div class="msg admin">
            <div class="bubble">
              <strong>${f.responderRole || "Tutor"}</strong>
              <p>${f.message || ""}</p>
              ${f.imageUrl?`<img src="${f.imageUrl}" onclick="showImage(this.src)">`:""}
              <div class="meta">${new Date(f.respondedAt).toLocaleString()}</div>
            </div>
          </div>
        `;
        if(!f.seen){
          await set(ref(db,`questions/${q.id}/feedback/${f.key}/seen`),true);
        }
      }
    }
  }
  chat.scrollTop = chat.scrollHeight;
}
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "enabled" || 
      (!localStorage.getItem("darkMode") && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add("dark-mode");
  }
});