import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
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

let tutorGrades = [];
let allLogs = [];
let selectedGrade = "all";

const now = new Date();
const currentMonth = now.getMonth();
const currentYear = now.getFullYear();

onAuthStateChanged(auth, async (user) => {
    if(!user){ alert("Please login first"); return; }

    const tutorsSnap = await get(ref(db,"tutors"));
    const tutors = tutorsSnap.val() || {};

    for(const key in tutors){
        if(tutors[key].email === user.email){
            tutorGrades = tutors[key].grades || [];
            break;
        }
    }

    if(tutorGrades.length === 0){
        alert("No grades assigned for this tutor.");
        return;
    }

    populateGradeFilter();
    await loadAllLogs();
    renderWeeklyTables();
    renderMonthlySummary();
});

function populateGradeFilter(){
    const select = document.getElementById("gradeFilter");
    select.innerHTML = `<option value="all">All Grades</option>`;
    tutorGrades.forEach(grade => {
        const opt = document.createElement("option");
        opt.value = grade.toString();
        opt.textContent = grade.toString();
        select.appendChild(opt);
    });
    selectedGrade = "all";
}

async function loadAllLogs(){
    const logsSnap = await get(ref(db,"LoginLogs"));
    allLogs = [];
    if(!logsSnap.exists()) return;
    const logs = logsSnap.val();

    Object.keys(logs).forEach(uid => {
        const userLogs = logs[uid];
        if(!userLogs) return;
        Object.values(userLogs).forEach(log => {
            if(!log || !log.loginTime) return;
            allLogs.push({ ...log, uid });
        });
    });
}

function getWeeksOfMonth(year, month){
    const weeks = [];
    let firstDay = new Date(year, month, 1);
    let lastDay = new Date(year, month+1, 0);

    let startDate = new Date(firstDay);
    while(startDate <= lastDay){
        let endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
        if(endDate > lastDay) endDate = new Date(lastDay);
        weeks.push({ monday: new Date(startDate), sunday: new Date(endDate) });
        startDate.setDate(endDate.getDate() + 1);
    }
    return weeks;
}

function renderWeeklyTables(){
    const container = document.getElementById("weeksTables");
    container.innerHTML = "";
    const weeks = getWeeksOfMonth(currentYear, currentMonth);

    weeks.forEach((week,index)=>{
        const weekDiv = document.createElement("div");
        weekDiv.classList.add("week-container");

        const weekTitle = document.createElement("h3");
        weekTitle.textContent = `Week ${index+1}: ${week.monday.toLocaleDateString()} - ${week.sunday.toLocaleDateString()}`;
        weekDiv.appendChild(weekTitle);

        const table = document.createElement("table");
        const thead = document.createElement("thead");
        thead.innerHTML = `<tr>
            <th>Learner Name</th>
            <th>Email</th>
            <th>Grade</th>
            <th>Login Count</th>
            <th>Last Login</th>
        </tr>`;
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        const weekLogsMap = {};

        allLogs.forEach(log=>{
            const logDate = new Date(log.loginTime);
            if(logDate < week.monday || logDate > week.sunday) return;

            const logGrade = log.grade?.toString() || "";
            const isTutorGrade = tutorGrades.map(g => g.toString()).includes(logGrade);
            if(!isTutorGrade) return;
            if(selectedGrade !== "all" && logGrade !== selectedGrade) return;

            if(!weekLogsMap[log.uid]){
                weekLogsMap[log.uid] = { name: log.name, email: log.email, grade: logGrade, count:0, lastLogin:0 };
            }
            weekLogsMap[log.uid].count +=1;
            if(log.loginTime > weekLogsMap[log.uid].lastLogin) weekLogsMap[log.uid].lastLogin = log.loginTime;
        });

        if(Object.keys(weekLogsMap).length ===0){
            tbody.innerHTML = `<tr><td colspan="5">No logs for this week</td></tr>`;
        } else {
            Object.values(weekLogsMap).forEach(learner=>{
                const row = document.createElement("tr");
                row.classList.add("highlight");
                row.innerHTML = `<td>${learner.name}</td>
                <td>${learner.email}</td>
                <td>${learner.grade}</td>
                <td>${learner.count}</td>
                <td>${new Date(learner.lastLogin).toLocaleString()}</td>`;
                tbody.appendChild(row);
            });
        }

        table.appendChild(tbody);
        weekDiv.appendChild(table);
        container.appendChild(weekDiv);
    });
}

function renderMonthlySummary(){
    const tbody = document.querySelector("#monthlySummaryTable tbody");
    tbody.innerHTML = "";

    const monthLogs = {};

    allLogs.forEach(log=>{
        const logDate = new Date(log.loginTime);
        if(logDate.getMonth() !== currentMonth || logDate.getFullYear() !== currentYear) return;

        const logGrade = log.grade?.toString() || "";
        const isTutorGrade = tutorGrades.map(g => g.toString()).includes(logGrade);
        if(!isTutorGrade) return;
        if(selectedGrade !== "all" && logGrade !== selectedGrade) return;

        if(!monthLogs[log.uid]){
            monthLogs[log.uid] = { name: log.name, email: log.email, grade: logGrade, count:0, lastLogin:0 };
        }
        monthLogs[log.uid].count +=1;
        if(log.loginTime > monthLogs[log.uid].lastLogin) monthLogs[log.uid].lastLogin = log.loginTime;
    });

    if(Object.keys(monthLogs).length===0){
        tbody.innerHTML = `<tr><td colspan="5">No logs for this month</td></tr>`;
    } else {
        Object.values(monthLogs).forEach(learner=>{
            const row = document.createElement("tr");
            row.classList.add("highlight");
            row.innerHTML = `<td>${learner.name}</td>
            <td>${learner.email}</td>
            <td>${learner.grade}</td>
            <td>${learner.count}</td>
            <td>${new Date(learner.lastLogin).toLocaleString()}</td>`;
            tbody.appendChild(row);
        });
    }
}

function applyGradeFilter(){
    selectedGrade = document.getElementById("gradeFilter").value;
    renderWeeklyTables();
    renderMonthlySummary();
}

function exportAllTables(){
    let allRows = "";
    const tables = document.querySelectorAll("table");
    tables.forEach(table=>{
        const title = table.previousElementSibling?.tagName === "H3" ? table.previousElementSibling.textContent : "Monthly Summary";
        allRows += title + "\n";
        Array.from(table.querySelectorAll("tr")).forEach(tr=>{
            const row = Array.from(tr.cells).map(td=>td.textContent).join("\t");
            allRows += row + "\n";
        });
        allRows += "\n";
    });

    const blob = new Blob([allRows], {type:"text/tab-separated-values"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "learner_logs_monthly.tsv";
    a.click();
    URL.revokeObjectURL(url);
}
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "enabled" || 
      (!localStorage.getItem("darkMode") && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add("dark-mode");
  }
});