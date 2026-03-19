const darkModeBtn = document.getElementById("darkModeBtn");

/* remember preference */

if(localStorage.getItem("darkMode")==="on"){
document.body.classList.add("dark-mode");
darkModeBtn.textContent="☀️";
}

darkModeBtn.onclick=()=>{

document.body.classList.toggle("dark-mode");

if(document.body.classList.contains("dark-mode")){
localStorage.setItem("darkMode","on");
darkModeBtn.textContent="☀️";
}else{
localStorage.setItem("darkMode","off");
darkModeBtn.textContent="🌙";
}

};
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "enabled" || 
      (!localStorage.getItem("darkMode") && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add("dark-mode");
  }
});