import { initializeApp } from 
"https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";

import { getAuth, onAuthStateChanged } from 
"https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import { getDatabase, ref, get } from 
"https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

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

let allLogs=[];

onAuthStateChanged(auth,async user=>{

if(!user){
location.href="admin-login.html";
return;
}

const adminSnap=await get(ref(db,"users/"+user.uid));

if(!adminSnap.exists() || adminSnap.val().role!=="admin"){
alert("Access denied");
location.href="index.html";
return;
}

loadLogs();

});

/* LOAD LOGIN LOGS */

async function loadLogs(){

const snap=await get(ref(db,"LoginLogs"));

if(!snap.exists()) return;

allLogs=[];

for(const userNode of Object.entries(snap.val())){

const uid=userNode[0];
const logs=userNode[1];

let role=null;
let email=null;

/* Get role from users if needed */

const userSnap=await get(ref(db,"users/"+uid));

if(userSnap.exists()){
role=(userSnap.val().role || "").toLowerCase();
email=userSnap.val().email;
}

/* Loop logs */

Object.values(logs).forEach(log=>{

const logRole=(log.role || role || "").toLowerCase();

if(logRole==="admin") return;

if(logRole!=="learner" && logRole!=="tutor") return;

allLogs.push({

email:log.email || email || "unknown",
role:logRole,
loginTime:log.loginTime

});

});

}

buildMonthFilter();

}

/* MONTH FILTER */

function buildMonthFilter(){

const months=new Set();

allLogs.forEach(log=>{

const d=new Date(log.loginTime);

const key=d.getFullYear()+"-"+(d.getMonth()+1);

months.add(key);

});

const select=document.getElementById("monthFilter");

select.innerHTML="";

[...months].sort().reverse().forEach(m=>{

const opt=document.createElement("option");

opt.value=m;
opt.textContent=m;

select.appendChild(opt);

});

select.addEventListener("change",loadActivity);

loadActivity();

}

/* BUILD ANALYTICS */

function loadActivity(){

const month=document.getElementById("monthFilter").value;

const tbody=document.getElementById("logsTable");

tbody.innerHTML="";

const userMap={};

let total=0;
let learnerTotal=0;
let tutorTotal=0;

allLogs.forEach(log=>{

const d=new Date(log.loginTime);

const key=d.getFullYear()+"-"+(d.getMonth()+1);

if(key!==month) return;

total++;

if(log.role==="learner") learnerTotal++;
if(log.role==="tutor") tutorTotal++;

if(!userMap[log.email]){

userMap[log.email]={

email:log.email,
role:log.role,
lastLogin:log.loginTime,
count:1

};

}else{

userMap[log.email].count++;

if(new Date(log.loginTime) > new Date(userMap[log.email].lastLogin)){
userMap[log.email].lastLogin=log.loginTime;
}

}

});

document.getElementById("totalLogins").innerText=total;
document.getElementById("learnerLogins").innerText=learnerTotal;
document.getElementById("tutorLogins").innerText=tutorTotal;

const users=Object.values(userMap).sort((a,b)=>b.count-a.count);

if(users.length===0){

tbody.innerHTML=`<tr><td colspan="4" class="no-data">No login records for this month</td></tr>`;
return;

}

users.forEach(user=>{

const tr=document.createElement("tr");

tr.innerHTML=`
<td>${user.email}</td>
<td>${user.role}</td>
<td>${new Date(user.lastLogin).toLocaleString()}</td>
<td>${user.count}</td>
`;

tbody.appendChild(tr);

});

}
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "enabled" || 
      (!localStorage.getItem("darkMode") && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add("dark-mode");
  }
});