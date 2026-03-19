// Navigation
    document.getElementById('user-login').onclick = () => location.href = "user-login.html";
    document.getElementById('tutor-login').onclick = () => location.href = "tutor-login.html";
    document.getElementById('admin-login').onclick = () => location.href = "admin-login.html";
    document.getElementById('explore').onclick = () => location.href = "index.html";
    document.getElementById('signup-top').onclick = () => location.href = "signup.html";
 document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "enabled" || 
      (!localStorage.getItem("darkMode") && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add("dark-mode");
  }
});