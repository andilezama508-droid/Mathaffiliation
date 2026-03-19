import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, get } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

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
const auth = getAuth(app);

const subjectContainer = document.getElementById("subject-container");
const gradeContainer = document.getElementById("grade-container");

/* Load subjects as checkboxes */
async function loadSubjects(){
  subjectContainer.innerHTML = "";
  const snapshot = await get(ref(db, "subjects"));

  if(!snapshot.exists()){
    subjectContainer.innerHTML = "No subjects found.";
    return;
  }

  snapshot.forEach(child => {
    const subjectData = child.val();
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" value="${subjectData.name}"> ${subjectData.name}`;
    subjectContainer.appendChild(label);
  });
}
loadSubjects();

/* Upload photo */
async function uploadFile(file){
  const fileRef = sRef(storage, `tutors/${Date.now()}_${file.name}`);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}

/* Add Tutor */
window.addTutor = async () => {

  const name = document.getElementById("tutor-name").value.trim();
  const email = document.getElementById("tutor-email").value.trim();
  const password = document.getElementById("tutor-password").value.trim();
  const fileInput = document.getElementById("tutor-photo-file");

  const selectedSubjects = Array.from(
    subjectContainer.querySelectorAll("input[type='checkbox']:checked")
  ).map(cb => cb.value);

  const selectedGrades = Array.from(
    gradeContainer.querySelectorAll("input[type='checkbox']:checked")
  ).map(cb => cb.value);

  if(!name || !email || !password){
    alert("All fields are required");
    return;
  }

  if(selectedSubjects.length === 0 || selectedSubjects.length > 3){
    alert("Please select 1–3 subjects only.");
    return;
  }

  if(selectedGrades.length === 0 || selectedGrades.length > 2){
    alert("Please select 1–2 grades only.");
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch(err){
    alert("Auth creation failed: " + err.message);
    return;
  }

  let photoURL = "";
  if(fileInput.files.length > 0){
    photoURL = await uploadFile(fileInput.files[0]);
  }

  await push(ref(db,"tutors"), { 
    name, 
    email, 
    subjects: selectedSubjects,
    grades: selectedGrades,
    photo: photoURL 
  });

  alert("Tutor saved successfully");

  // Clear form
  document.getElementById("tutor-name").value="";
  document.getElementById("tutor-email").value="";
  document.getElementById("tutor-password").value="";
  fileInput.value="";
  subjectContainer.querySelectorAll("input").forEach(cb=>cb.checked=false);
  gradeContainer.querySelectorAll("input").forEach(cb=>cb.checked=false);
};

/* Load Tutors */
const tutorListDiv = document.getElementById("tutor-list");

onValue(ref(db,"tutors"), snapshot => {

  tutorListDiv.innerHTML = "<h2>All Tutors</h2>";

  if(!snapshot.exists()){
    tutorListDiv.innerHTML += "<p>No tutors found.</p>";
    return;
  }

  snapshot.forEach(childSnap => {

    const t = childSnap.val();
    const key = childSnap.key;

    const div = document.createElement("div");
    div.className = "tutor-card";
    div.innerHTML = `
      <img src="${t.photo || 'https://via.placeholder.com/60'}">
      <div class="tutor-info">
        <strong>${t.name}</strong><br>
        Subjects: ${(t.subjects || []).join(", ")}<br>
        Grades: ${(t.grades || []).join(", ")}<br>
        ${t.email}
      </div>
      <button class="delete-btn">Delete</button>
    `;

    div.querySelector(".delete-btn").onclick = async () => {
      if(confirm("Delete tutor " + t.name + "?")){
        await remove(ref(db, "tutors/" + key));
        if(t.photo){
          try{
            const photoRef = sRef(storage, t.photo);
            await deleteObject(photoRef);
          }catch(e){}
        }
      }
    };

    tutorListDiv.appendChild(div);
  });
});
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "enabled" || 
      (!localStorage.getItem("darkMode") && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add("dark-mode");
  }
});
