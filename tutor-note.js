import {initializeApp} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {getDatabase,ref,get,set,push,remove} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {getStorage,ref as sRef,uploadBytes,getDownloadURL} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

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
const storage=getStorage(app);

let tutorKey=null;
let editId=null;
let tutorGrades=[];
let tutorSubjects=[];

onAuthStateChanged(auth,async user=>{

if(!user) return;

const snap=await get(ref(db,"tutors"));
const tutors=snap.val();

for(const key in tutors){

if(tutors[key].email===user.email){

tutorKey=key;
tutorGrades=tutors[key].grades||[];
tutorSubjects=tutors[key].subjects||[];

loadDropdowns();
loadNotes();

break;

}

}

});

function loadDropdowns(){

const grade=document.getElementById("grade");
grade.innerHTML="";

tutorGrades.forEach(g=>{
grade.innerHTML+=`<option value="${g}">Grade ${g}</option>`;
});

const subject=document.getElementById("subject");
subject.innerHTML="";

tutorSubjects.forEach(s=>{
subject.innerHTML+=`<option value="${s}">${s}</option>`;
});

}

window.saveNote=async()=>{

const grade=document.getElementById("grade").value;
const subject=document.getElementById("subject").value;
const unit=document.getElementById("unit").value;
const topic=document.getElementById("topic").value;
const text=document.getElementById("text").value;
const file=document.getElementById("image").files[0];

let imageURL="";

if(file){

if(!file.type.startsWith("image/")){
alert("Only images allowed");
return;
}

if(file.size>5*1024*1024){
alert("Image must be ≤5MB");
return;
}

const storageRef=sRef(storage,"notes/"+Date.now()+file.name);

await uploadBytes(storageRef,file);

imageURL=await getDownloadURL(storageRef);

}

const id=editId || push(ref(db,"notes")).key;

await set(ref(db,"notes/"+id),{
tutorKey,
grade,
subject,
unit,
topic,
text,
imageURL,
createdAt:Date.now()
});

editId=null;

alert("Note saved");

loadNotes();

};

async function loadNotes(){

const list=document.getElementById("notesList");
list.innerHTML="Loading...";

const snap=await get(ref(db,"notes"));

list.innerHTML="";

if(!snap.exists()) return;

Object.entries(snap.val()).forEach(([id,n])=>{

if(n.tutorKey!==tutorKey) return;

const div=document.createElement("div");
div.className="note-card";

div.innerHTML=`
<b>${n.subject} | Grade ${n.grade}</b><br>
<b>Unit:</b> ${n.unit}<br>
<b>Topic:</b> ${n.topic}<br>
<p>${n.text}</p>
${n.imageURL?`<img src="${n.imageURL}">`:""}
<br><br>
<button class="action-btn" onclick="editNote('${id}')">Edit</button>
<button onclick="deleteNote('${id}')">Delete</button>
`;

list.appendChild(div);

});

}

window.editNote=async id=>{

const snap=await get(ref(db,"notes/"+id));
const n=snap.val();

document.getElementById("unit").value=n.unit;
document.getElementById("topic").value=n.topic;
document.getElementById("text").value=n.text;

editId=id;

};

window.deleteNote=async id=>{

if(!confirm("Delete note?")) return;

await remove(ref(db,"notes/"+id));

loadNotes();

};
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "enabled" || 
      (!localStorage.getItem("darkMode") && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add("dark-mode");
  }
});