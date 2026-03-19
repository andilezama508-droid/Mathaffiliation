import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getDatabase, ref, get, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

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

const welcomeText = document.getElementById("welcomeText");
const lastLoginText = document.getElementById("lastLogin");
const tutorPhoto = document.getElementById("tutorPhoto");
const tutorSubjectsText = document.getElementById("tutorSubjects");
const logoutBtn = document.getElementById("logout-btn");

function redirectToLogin() {
  window.location.href = "tutor-login.html";
}

async function getTutorByEmail(email){
  try{
    const snap = await get(ref(db, "tutors"));
    if(!snap.exists()) return null;
    const tutors = snap.val();
    for(const [key, tutor] of Object.entries(tutors)){
      if(tutor.email && tutor.email.toLowerCase() === email.toLowerCase()){
        return {...tutor, uid:key};
      }
    }
    return null;
  }catch(err){console.error("getTutorByEmail error:",err); return null;}
}

async function getLastLogin(uid){
  try{
    const loginRef = query(ref(db, "LoginLogs/"+uid), orderByChild("loginTime"), limitToLast(1));
    const snap = await get(loginRef);
    if(snap.exists()){
      const logs = Object.values(snap.val());
      return logs[0].loginTimeString || null;
    }
    return null;
  }catch(err){console.error("getLastLogin error:",err); return null;}
}

onAuthStateChanged(auth, async(user)=>{
  try{
    if(!user) return redirectToLogin();
    const tutor = await getTutorByEmail(user.email);
    if(!tutor){
      alert("Tutor profile not found. Logging out...");
      await signOut(auth);
      return redirectToLogin();
    }

    // Display tutor info
    welcomeText.textContent = `Welcome, ${tutor.name}!`;
    tutorPhoto.src = tutor.photo || "";
    tutorSubjectsText.textContent = tutor.subjects && tutor.subjects.length>0 ? "Subjects: "+tutor.subjects.join(", ") : "";

    const lastLogin = await getLastLogin(tutor.uid);
    lastLoginText.textContent = lastLogin ? `Last login: ${lastLogin}` : "";

  }catch(err){
    console.error("Dashboard init error:",err);
    alert("Error loading dashboard. Logging out...");
    await signOut(auth);
    redirectToLogin();
  }
});

logoutBtn.addEventListener("click", async()=>{
  await signOut(auth);
  redirectToLogin();
});
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "enabled" || 
      (!localStorage.getItem("darkMode") && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add("dark-mode");
  }
});