import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
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

let learnerGrade = null;
let allMaterials = [];
let currentType = "past";

function normalizeGrade(grade){
  if(!grade) return "";
  return grade.toString().replace("Grade","").trim();
}

/* AUTH */
onAuthStateChanged(auth, user=>{
  if(!user){
    alert("Please login");
    return;
  }

  onValue(ref(db,"users/"+user.uid), snapshot=>{
    if(snapshot.exists()){
      const data = snapshot.val();
      learnerGrade = normalizeGrade(data.grade);
      document.getElementById("gradeDisplay").textContent = "Grade " + learnerGrade;
      loadMaterials();
    }
  });
});

/* LOAD MATERIALS */
function loadMaterials(){
  onValue(ref(db,"materials"), snapshot=>{
    allMaterials=[];
    if(snapshot.exists()){
      snapshot.forEach(child=>{
        const data = child.val();
        data.grade = normalizeGrade(data.grade);
        allMaterials.push({
          id:child.key,
          ...data
        });
      });
    }
    renderTable();
  });
}

/* SWITCH TYPE */
window.switchType = function(type, btn){
  currentType = type;
  document.querySelectorAll(".filter button").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");

  const titles={ past:"Past Papers", remedial:"Remedials", notes:"Notes" };
  document.getElementById("pageTitle").textContent=titles[type];
  renderTable();
};

/* RENDER */
function renderTable(){
  const table=document.getElementById("materialsTable");
  table.innerHTML="";

  const filtered = allMaterials.filter(m=> m.type===currentType && m.grade===learnerGrade );

  if(filtered.length===0){
    table.innerHTML="<tr><td colspan='4'>No materials available</td></tr>";
    return;
  }

  filtered.forEach(m=>{
    table.innerHTML+=`
      <tr>
        <td>Grade ${m.grade}</td>
        <td>${m.subject}</td>
        <td>${m.description || ""}</td>
        <td>
          <a href="${m.fileURL}" target="_blank">
            <button class="download-btn">Open</button>
          </a>
        </td>
      </tr>`;
  });
}

/* SEARCH */
document.getElementById("searchInput").addEventListener("input", e=>{
  const term=e.target.value.toLowerCase();
  const table=document.getElementById("materialsTable");
  table.innerHTML="";

  const filtered=allMaterials.filter(m=>
    m.type===currentType &&
    m.grade===learnerGrade &&
    m.subject &&
    m.subject.toLowerCase().includes(term)
  );

  if(filtered.length===0){
    table.innerHTML="<tr><td colspan='4'>No materials available</td></tr>";
    return;
  }

  filtered.forEach(m=>{
    table.innerHTML+=`
      <tr>
        <td>Grade ${m.grade}</td>
        <td>${m.subject}</td>
        <td>${m.description || ""}</td>
        <td>
          <a href="${m.fileURL}" target="_blank">
            <button class="download-btn">Open</button>
          </a>
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