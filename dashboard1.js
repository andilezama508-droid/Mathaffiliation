import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth,onAuthStateChanged,signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getDatabase,ref,onValue,get,set } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

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

const welcomeText=document.getElementById("welcomeText");
const motivation=document.getElementById("motivation");
const feedbackCountEl=document.getElementById("feedbackCount");
const feedbackTooltip=document.getElementById("feedbackTooltip");
const feedbackBtn=document.getElementById("feedbackBtn");
const progressCtx=document.getElementById('progressChart').getContext('2d');
const loginCtx=document.getElementById('loginChart').getContext('2d');

let feedbackMessages=[];

onAuthStateChanged(auth, async(user)=>{
  if(!user){
    window.location.replace("User-login.html");
    return;
  }

  const profileSnap = await get(ref(db,"users/"+user.uid));
  if(!profileSnap.exists() || profileSnap.val().role!=="learner"){
    await signOut(auth);
    window.location.replace("User-login.html");
    return;
  }

  const profile = profileSnap.val();
  welcomeText.innerText = "Welcome "+profile.name;

  document.body.style.display="block"; // show after validation

  // Load charts
  const attemptsSnap = await get(ref(db,"attempts"));
  let subjects=[], scores=[];
  if(attemptsSnap.exists()){
    const allAttempts = Object.values(attemptsSnap.val()).filter(a=>a.userId===user.uid);
    const subjectMap={};
    allAttempts.forEach(a=>{
      const subj=a.subjectName||"Unknown";
      if(!subjectMap[subj]) subjectMap[subj]={totalScore:0,totalQuestions:0};
      subjectMap[subj].totalScore += Number(a.score);
      subjectMap[subj].totalQuestions += Number(a.total);
    });
    subjects = Object.keys(subjectMap);
    scores = subjects.map(s=>((subjectMap[s].totalScore/subjectMap[s].totalQuestions)*100).toFixed(1));
  }

  new Chart(progressCtx,{
    type:'bar',
    data:{labels:subjects,datasets:[{label:'Average Score (%)',data:scores,backgroundColor:'#bc76e4'}]},
    options:{responsive:true,plugins:{legend:{display:false},title:{display:true,text:'Your Performance by Quiz Subject',color:'#560a72',font:{size:18}}},scales:{y:{beginAtZero:true,max:100}}}
  });

  // Login chart
  const days=Array.from({length:30},(_,i)=>i+1);
  let loginCounts=new Array(30).fill(0);
  const loginSnap=await get(ref(db,"LoginLogs/"+user.uid));
  if(loginSnap.exists()){
    Object.values(loginSnap.val()).forEach(l=>{
      if(!l.loginTime) return;
      const day = new Date(l.loginTime).getDate();
      if(day>=1 && day<=30) loginCounts[day-1]++;
    });
  }
  motivation.innerText = "You logged in "+(loginCounts[new Date().getDate()-1]||0)+" time(s) today. Keep learning! 🚀";

  const yMax=Math.max(10,Math.max(...loginCounts)+2);
  new Chart(loginCtx,{
    type:'line',
    data:{labels:days,datasets:[{label:'Logins',data:loginCounts,borderColor:'#4caf50',backgroundColor:'rgba(76,175,80,0.2)',fill:true,tension:0.3,pointRadius:5}]},
    options:{responsive:true,plugins:{title:{display:true,text:'Monthly Learning Activity',color:'#560a72',font:{size:18}}},scales:{y:{min:0,max:yMax}}}
  });

  // Feedback
  onValue(ref(db,"questions"),snap=>{
    feedbackMessages=[];
    if(!snap.exists()){feedbackCountEl.innerText="0"; feedbackTooltip.innerHTML=""; return;}
    let count=0;
    snap.forEach(q=>{
      const msg=q.val();
      if(msg.learnerEmail===user.email && msg.feedback){
        const arr=Array.isArray(msg.feedback)?msg.feedback:[msg.feedback];
        arr.forEach(f=>{
          if(!f.seen){count++;feedbackMessages.push({key:q.key,feedback:f});}
        });
      }
    });
    feedbackCountEl.innerText=count;
    feedbackTooltip.innerHTML = feedbackMessages.map(f=>`<p>${f.feedback.message.substring(0,50)}</p>`).join("");
  });

  feedbackBtn.onclick = async()=>{
    for(const f of feedbackMessages){
      f.feedback.seen=true;
      await set(ref(db,"questions/"+f.key+"/feedback"),Array.isArray(f.feedback)?f.feedback:[f.feedback]);
    }
    window.location.href='feedback.html';
  };

});

document.getElementById("logoutBtn").onclick = async()=>{
  await signOut(auth);
  window.location.replace("User-login.html");
};
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "enabled" || 
      (!localStorage.getItem("darkMode") && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add("dark-mode");
  }
});