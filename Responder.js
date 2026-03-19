import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

/* Firebase */
const firebaseConfig = {
  apiKey: "AIzaSyD9I6EBsk4k2hykZo0Yzp67CHrJQjIf2ts",
  authDomain: "online-tutoring-system-d2a40.firebaseapp.com",
  databaseURL: "https://online-tutoring-system-d2a40-default-rtdb.firebaseio.com",
  projectId: "online-tutoring-system-d2a40",
  storageBucket: "online-tutoring-system-d2a40.firebasestorage.app",
  messagingSenderId: "476767991196",
  appId: "1:476767991196:web:98d6814aa85c3c9603c459",
  measurementId: "G-M4N6FFX2F6"
};;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);

const list = document.getElementById("list");

let currentUser;
let currentRole;

/* AUTH + ROLE CHECK */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "admin-login.html";
    return;
  }

  currentUser = user;

  const snap = await get(ref(db, "users/" + user.uid));
  if (!snap.exists()) {
    alert("Access denied");
    return;
  }

  currentRole = snap.val().role;
  if (currentRole !== "admin" && currentRole !== "tutor") {
    alert("Unauthorized");
    return;
  }

  loadQuestions();
});

/* LOAD OPEN QUESTIONS */
async function loadQuestions() {
  const snap = await get(ref(db, "questions"));
  list.innerHTML = "";

  snap.forEach(child => {
    const q = child.val();
    if (q.status === "open") {
      list.innerHTML += `
        <div class="card">
          <strong>${q.subject}</strong>
          <p>${q.question}</p>
          ${q.imageUrl ? `<img src="${q.imageUrl}">` : ""}

          <textarea id="msg-${child.key}" placeholder="Write feedback..."></textarea>
          <input type="file" id="img-${child.key}" accept="image/*">

          <button onclick="sendFeedback('${child.key}')">Send Feedback</button>
        </div>
      `;
    }
  });
}

/* SEND FEEDBACK */
window.sendFeedback = async (qid) => {
  const message = document.getElementById("msg-" + qid).value.trim();
  const file = document.getElementById("img-" + qid).files[0];

  if (!message && !file) {
    alert("Feedback required");
    return;
  }

  let imageUrl = "";

  if (file) {
    const path = `feedback/${qid}/${Date.now()}_${file.name}`;
    const refImg = sRef(storage, path);
    await uploadBytes(refImg, file);
    imageUrl = await getDownloadURL(refImg);
  }

  await update(ref(db, "questions/" + qid), {
    status: "resolved",
    "feedback/message": message,
    "feedback/imageUrl": imageUrl,
    "feedback/responderEmail": currentUser.email,
    "feedback/responderRole": currentRole,
    "feedback/respondedAt": Date.now()
  });

  alert("Feedback sent");
  location.reload();
};
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "enabled" || 
      (!localStorage.getItem("darkMode") && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add("dark-mode");
  }
});