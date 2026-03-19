import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);

const chat = document.getElementById("chat");
const subjectsDiv = document.getElementById("subjects");

let tutorSubjects = [];
let currentSubject = "";
let currentUser = null;

window.showImage = (src)=>{ document.getElementById("viewImg").src = src; document.getElementById("viewer").style.display="flex"; };

onAuthStateChanged(auth, async user => {
  if(!user){ location.href="tutor-login.html"; return; }
  currentUser = user;

  const snap = await get(ref(db,"tutors"));
  if(!snap.exists()){ chat.innerHTML="<p>Tutor profile not found.</p>"; return; }

  const tutors = snap.val();
  const tutor = Object.values(tutors).find(t=>t.email===user.email);
  if(!tutor){ chat.innerHTML="<p>Tutor profile not found.</p>"; return; }

  tutorSubjects = Array.isArray(tutor.subjects)? tutor.subjects : [tutor.subject || "Unknown"];
  currentSubject = tutorSubjects[0];
  renderSubjectButtons();
  loadConversations(currentSubject);
});

function renderSubjectButtons(){
  subjectsDiv.innerHTML="";
  tutorSubjects.forEach(sub=>{
    const btn=document.createElement("button");
    btn.textContent=sub;
    btn.onclick=()=>{ 
      currentSubject=sub; 
      Array.from(subjectsDiv.children).forEach(b=>b.classList.remove("active")); 
      btn.classList.add("active"); 
      loadConversations(sub); 
    };
    if(sub===currentSubject) btn.classList.add("active");
    subjectsDiv.appendChild(btn);
  });
}

async function loadConversations(subject){
  chat.innerHTML="<p>Loading messages...</p>";
  const snap = await get(ref(db,"questions"));
  chat.innerHTML="";
  if(!snap.exists()){ chat.innerHTML="<p>No messages.</p>"; return; }

  const all = Object.entries(snap.val()).filter(([key,q]) => q.subject===subject);
  if(all.length===0){ chat.innerHTML="<p>No messages for this subject.</p>"; return; }

  all.forEach(([key,q])=>{
    const convDiv=document.createElement("div");
    convDiv.className="conversation";
    convDiv.innerHTML=`<h4>${q.fullName||q.learnerEmail}</h4>`;

    // Determine reply status
    const feedbackArr = q.feedback ? (Array.isArray(q.feedback)?q.feedback:[q.feedback]) : [];
    const answeredByThisTutor = feedbackArr.find(f=>f.responderEmail===currentUser.email);
    const answeredByOther = feedbackArr.some(f=>f.responderEmail!==currentUser.email);

    if(answeredByOther && !answeredByThisTutor){
      // Orange bubble shows answered by someone else
      const bubble=document.createElement("div");
      bubble.className="msg answered";
      bubble.innerHTML=`<div class="bubble">
        <strong>${q.fullName||q.learnerEmail}</strong>
        <p>Question has been answered</p>
        <div class="meta">Click to see who replied</div>
      </div>`;
      bubble.querySelector(".bubble").onclick=()=>{
        const meta = bubble.querySelector(".meta");
        meta.style.display = meta.style.display==="none"?"block":"none";
        meta.textContent = feedbackArr.map(f=>`${f.responderRole} replied on ${new Date(f.respondedAt).toLocaleString()}`).join("; ");
      };
      convDiv.appendChild(bubble);
    } else {
      // Show question normally (unanswered or answered by this tutor)
      const bubble=document.createElement("div");
      bubble.className="msg tutor";
      bubble.innerHTML=`<div class="bubble">
        <strong>${q.fullName||q.learnerEmail}</strong>
        <p>${q.question}</p>
        ${q.imageUrl?`<img src="${q.imageUrl}" onclick="showImage(this.src)">`:''}
        <div class="meta">${new Date(q.createdAt).toLocaleString()}</div>
      </div>`;
      convDiv.appendChild(bubble);

      // Reply box
      const textarea=document.createElement("textarea");
      textarea.id="msg-"+key;
      textarea.placeholder="Write your reply...";
      textarea.value = answeredByThisTutor ? answeredByThisTutor.message : '';
      const fileInput=document.createElement("input");
      fileInput.type="file";
      fileInput.id="img-"+key;
      fileInput.accept="image/*";
      const sendBtn=document.createElement("button");
      sendBtn.className="sendBtn";
      sendBtn.textContent = answeredByThisTutor ? "Update Reply" : "Send Reply";
      sendBtn.onclick = ()=>sendReply(key);
      convDiv.appendChild(textarea);
      convDiv.appendChild(fileInput);
      convDiv.appendChild(sendBtn);
    }

    chat.appendChild(convDiv);
  });
  chat.scrollTop=chat.scrollHeight;
}

window.sendReply=async (qid)=>{
  const msgEl=document.getElementById("msg-"+qid);
  const fileEl=document.getElementById("img-"+qid);
  const message=msgEl.value.trim();
  const file=fileEl.files[0];
  if(!message && !file){ alert("Reply required"); return; }

  let imageUrl="";
  if(file){
    if(!file.type.startsWith("image/")){ alert("Only images allowed"); return; }
    const path=`feedback/${qid}/${Date.now()}_${file.name}`;
    const storageRef=sRef(storage,path);
    await uploadBytes(storageRef,file);
    imageUrl=await getDownloadURL(storageRef);
  }

  const feedbackData={
    message,
    imageUrl,
    responderId: currentUser.uid,
    responderEmail: currentUser.email,
    responderRole:"tutor",
    respondedAt: Date.now()
  };

  const qRef=ref(db,"questions/"+qid+"/feedback");
  const snap=await get(qRef);
  if(!snap.exists()){
    await update(ref(db,"questions/"+qid),{ feedback: feedbackData });
  } else {
    let arr=snap.val();
    if(!Array.isArray(arr)) arr=[arr];
    const existingIndex = arr.findIndex(f=>f.responderEmail===currentUser.email);
    if(existingIndex>=0){
      arr[existingIndex]=feedbackData;
    } else {
      arr.push(feedbackData);
    }
    await update(ref(db,"questions/"+qid),{ feedback: arr });
  }

  alert("Reply sent!");
  loadConversations(currentSubject);
};
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "enabled" || 
      (!localStorage.getItem("darkMode") && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add("dark-mode");
  }
});