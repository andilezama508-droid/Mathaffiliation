import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
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
const db = getDatabase(app);
const storage = getStorage(app);

let allMaterials = [];
let currentType = "past";
let editId = null;

window.openModal = ()=> document.getElementById("modal").style.display="block";
window.closeModal = ()=> document.getElementById("modal").style.display="none";

onValue(ref(db,"subjects"), snapshot=>{
  const select = document.getElementById("subjectSelect");
  select.innerHTML="<option value=''>Select Subject</option>";
  if(snapshot.exists()){
    snapshot.forEach(child=>{
      const data = child.val();
      select.innerHTML+=`<option value="${data.name}">${data.name}</option>`;
    });
  }
});

window.switchType = function(type, btn){
  currentType = type;
  document.querySelectorAll(".filter button").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");

  const titles={
    past:"Past Papers",
    remedial:"Remedials",
    quick:"Quick Question Memo",
    quiz:"Quiz Memo",
    notes:"Notes"
  };

  document.getElementById("pageTitle").textContent=titles[type];
  renderTable();
};

function normalizeGrade(grade){ return grade?.toString().replace("Grade","").trim()||""; }

window.saveMaterial = async function(){
  const gradeRaw = document.getElementById("grade").value;
  const grade = normalizeGrade(gradeRaw);
  const subject = document.getElementById("subjectSelect").value;
  const description = document.getElementById("description").value.trim();
  const fileInput = document.getElementById("file");
  const file = fileInput.files[0];

  if(!subject) return alert("Select subject");
  if(!description) return alert("Enter description");
  if(!file) return alert("Upload PDF");
  if(file.type !== "application/pdf") return alert("Only PDF allowed");

  const storageReference = sRef(storage,"materials/"+Date.now()+"_"+file.name);
  await uploadBytes(storageReference,file);
  const fileURL = await getDownloadURL(storageReference);

  const data = { grade, subject, description, fileURL, type:currentType, uploadedAt:Date.now() };

  if(editId){
    await update(ref(db,"materials/"+editId),data);
  } else {
    await push(ref(db,"materials"),data);
  }

  editId=null;
  document.getElementById("description").value="";
  closeModal();
};

onValue(ref(db,"materials"), snapshot=>{
  allMaterials=[];
  if(snapshot.exists()){
    snapshot.forEach(child=>{
      const data = child.val();
      data.grade = normalizeGrade(data.grade);
      allMaterials.push({ id:child.key, ...data });
    });
  }
  renderTable();
});

function renderTable(){
  const table=document.getElementById("materialsTable");
  table.innerHTML="";
  const filtered = allMaterials.filter(m=>m.type===currentType);
  if(filtered.length===0){ table.innerHTML="<tr><td colspan='5'>No materials found</td></tr>"; return; }
  filtered.forEach(m=>{
    table.innerHTML+=`
      <tr>
        <td>Grade ${m.grade}</td>
        <td>${m.subject}</td>
        <td>${m.description||""}</td>
        <td><a href="${m.fileURL}" target="_blank">Open</a></td>
        <td>
          <button onclick="editMaterial('${m.id}')">Edit</button>
          <button onclick="deleteMaterial('${m.id}')">Delete</button>
        </td>
      </tr>`;
  });
}

window.deleteMaterial = async function(id){
  if(!confirm("Delete material?")) return;
  await remove(ref(db,"materials/"+id));
};

window.editMaterial = function(id){
  const material = allMaterials.find(m=>m.id===id);
  if(!material) return;
  editId=id;
  document.getElementById("grade").value=material.grade;
  document.getElementById("subjectSelect").value=material.subject;
  document.getElementById("description").value=material.description||"";
  openModal();
};

document.getElementById("searchInput").addEventListener("input", e=>{
  const term = e.target.value.toLowerCase();
  const table = document.getElementById("materialsTable");
  table.innerHTML="";
  const filtered = allMaterials.filter(m=>m.type===currentType && m.subject?.toLowerCase().includes(term));
  if(filtered.length===0){ table.innerHTML="<tr><td colspan='5'>No materials found</td></tr>"; return; }
  filtered.forEach(m=>{
    table.innerHTML+=`
      <tr>
        <td>Grade ${m.grade}</td>
        <td>${m.subject}</td>
        <td>${m.description||""}</td>
        <td><a href="${m.fileURL}" target="_blank">Open</a></td>
        <td>
          <button onclick="editMaterial('${m.id}')">Edit</button>
          <button onclick="deleteMaterial('${m.id}')">Delete</button>
        </td>
      </tr>`;
  });
});
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "enabled" || 
      (!localStorage.getItem("darkMode") && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add("dark-mode");
  }
});