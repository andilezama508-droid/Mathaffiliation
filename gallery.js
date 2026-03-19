import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getDatabase, ref, get, push, remove } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

/* Firebase config */
const firebaseConfig = {
  apiKey: "AIzaSyD9I6EBsk4k2hykZo0Yzp67CHrJQjIf2ts",
  authDomain: "online-tutoring-system-d2a40.firebaseapp.com",
  databaseURL: "https://online-tutoring-system-d2a40-default-rtdb.firebaseio.com",
  projectId: "online-tutoring-system-d2a40",
  storageBucket: "online-tutoring-system-d2a40.firebasestorage.app",
  messagingSenderId: "476767991196",
  appId: "1:476767991196:web:98d6814aa85c3c9603c459",
  measurementId: "G-M4N6FFX2F6"
};pId: "1:863022227296:web:5497ab4f3db25ab2344805"

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);

const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const gallery = document.getElementById("gallery");

let adminUid = null;

/* AUTH GUARD */
onAuthStateChanged(auth, async user => {
  if(!user){
    alert("You must be logged in as admin.");
    location.href="admin-login.html";
    return;
  }
  adminUid = user.uid;
  loadGallery();
});

/* LOAD GALLERY */
async function loadGallery(){
  gallery.innerHTML = "";
  try {
    const snap = await get(ref(db,"gallery"));
    if(!snap.exists()) return;
    snap.forEach(child => {
      const img = child.val();
      const div = document.createElement("div");
      div.innerHTML = `
        <img src="${img.url}">
        <button class="delete-btn" onclick="deleteImage('${child.key}','${img.path}')">×</button>
      `;
      gallery.appendChild(div);
    });
  } catch(err){
    console.error("Error loading gallery:", err);
  }
}

/* DELETE IMAGE */
window.deleteImage = async (id, path) => {
  try {
    await deleteObject(sRef(storage, path));
    await remove(ref(db,"gallery/"+id));
    loadGallery();
  } catch(err){
    console.error("Delete failed:", err);
    alert("Failed to delete image: " + err.message);
  }
};

/* UPLOAD IMAGE */
uploadBtn.onclick = async () => {
  const file = fileInput.files[0];
  if(!file){
    alert("Select an image first.");
    return;
  }

  // Check current count
  const snap = await get(ref(db,"gallery"));
  const currentCount = snap.exists() ? Object.keys(snap.val()).length : 0;
  if(currentCount >= 5){
    alert("Maximum 5 images allowed.");
    return;
  }

  try {
    const path = `gallery/${Date.now()}_${file.name}`;
    const fileRef = sRef(storage, path);

    // Upload
    await uploadBytes(fileRef, file);

    // Get URL
    const url = await getDownloadURL(fileRef);

    // Push to DB
    await push(ref(db,"gallery"), { url: url, path: path, created: Date.now() });

    alert("Image uploaded successfully!");
    fileInput.value = "";
    loadGallery();
  } catch(err){
    console.error("Upload failed:", err);
    alert("Upload failed: " + err.message);
  }
};
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "enabled" || 
      (!localStorage.getItem("darkMode") && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add("dark-mode");
  }
});