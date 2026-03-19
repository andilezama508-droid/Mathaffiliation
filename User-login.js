import { initializeApp } 
from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";

import { 
    getAuth, 
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} 
from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

import { 
    getDatabase, ref, push, set, get 
} 
from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
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


/* ---------- INITIALIZE ---------- */

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getDatabase(app);



/* ---------- SAST TIME ---------- */

function getSASTTime(){

    return new Date().toLocaleString(
        "en-ZA",
        { timeZone:"Africa/Johannesburg" }
    );

}



/* ---------- LOGIN ---------- */

document
.getElementById("loginBtn")
.addEventListener("click", async () => {

    const email =
        document.getElementById("email")
        .value.trim()
        .toLowerCase();

    const password =
        document.getElementById("password")
        .value.trim();

    if(!email || !password){
        alert("Please enter email and password.");
        return;
    }


    try{

        /* LOGIN */

        const cred =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user = cred.user;


        /* GET USER PROFILE */

        const userSnap =
            await get(ref(db,"users/"+user.uid));

        if(!userSnap.exists()){
            alert("User profile missing.");
            return;
        }

        const userData = userSnap.val();


        /* ONLY ALLOW LEARNERS */

        if(userData.role !== "learner"){

            alert("Only learners can login here.");

            auth.signOut();

            return;
        }


        const name  = userData.name  || "";
        const grade = userData.grade || "";


        /* SAVE LOGIN LOG */

        const logRef =
            ref(db,"LoginLogs/"+user.uid);

        const newLog = push(logRef);

        await set(newLog,{

            name: name,
            email: email,

            role: "learner",
            grade: grade,

            loginTime: Date.now(),
            loginTimeString: getSASTTime()

        });


        /* REDIRECT */

        window.location.href = "dashboard1.html";


    }
    catch(err){

        alert("Login failed: "+err.message);

    }

});



/* ---------- FORGOT PASSWORD ---------- */

document
.getElementById('forgot-password')
.addEventListener('click', async (e) => {

    e.preventDefault();

    const email = prompt('Enter your email');

    if (!email) {
        alert('Email is required');
        return;
    }

    try {

        await sendPasswordResetEmail(auth, email);

        alert('Password reset email sent! Check your inbox.');

    } catch (error) {

        console.error(error);

        alert(error.code + " : " + error.message);

    }

});