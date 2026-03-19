 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
    import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
    import { getDatabase, ref, push, set, get } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

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

    function getSASTTime() {
      return new Date().toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" });
    }

    document.getElementById("login-btn").addEventListener("click", async () => {
      const email = document.getElementById("username").value.trim().toLowerCase();
      const password = document.getElementById("password").value.trim();

      if (!email || !password) {
        alert("Email and password required");
        return;
      }

      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const user = cred.user;

        const userRef = ref(db, "users/" + user.uid);
        const snapshot = await get(userRef);

        if (!snapshot.exists()) {
          await set(userRef, {
            email: user.email,
            role: "admin",
            createdAt: new Date().toISOString()
          });
        }

        const userData = snapshot.exists() ? snapshot.val() : { role: "admin" };
        if (userData.role !== "admin") {
          alert("Access denied. Admins only.");
          return;
        }

        // Log login in SAME format as tutor/learner
        const logRef = ref(db, "LoginLogs/" + user.uid);
        const newLog = push(logRef);
        await set(newLog, {
          role: "admin",
          loginTime: Date.now(),
          loginTimeString: getSASTTime()
        });

        // Redirect to dashboard
        window.location.href = "dashboard.html";

      } catch (error) {
        console.error(error);
        alert("Login failed: " + error.message);
      }
    });