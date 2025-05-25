
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", event => {

  // Your Firebase project configuration
  const firebaseConfig = { 
    apiKey : "AIzaSyBN66VjGHh_N1vI9_WhATf2gfDyyC1VsjE" , 
    authDomain : "skatepediav2-c98d9.firebaseapp.com" , 
    projectId : "skatepediav2-c98d9" , 
    storageBucket : "skatepediav2-c98d9.firebasestorage.app" , 
    messagingSenderId : "475395925210" , 
    appId : "1:475395925210:web:006f56aa63c6d5bf4371e3" , 
    measurementId : "G-6CNX39MTZP" 
};

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  // Login function
  
  const loginBox = document.getElementById("login-box");
  const logoutBox = document.getElementById("logout-box");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("loginButton");
  const logoutButton = document.getElementById("logoutButton");
  const message = document.getElementById("message");
  const forgotPasswordLink = document.getElementById("forgotPasswordLink");
  const username = document.getElementById("username");

  loginButton.addEventListener("click", () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        username.textContent = `${userCredential.user.email}`;
        username.style.color = "#e79e00"
        message.textContent = `Welcome, ${userCredential.user.email}`;
        message.style.color = "green";
      })
      .catch((error) => {
        message.textContent = "Login failed: " + error.message;
        message.style.color = "red";
      });
  });

  logoutButton.addEventListener("click", () => {
    signOut(auth)
      .then(() => {
        message.textContent = "You have been logged out.";
        message.style.color = "gray";
        setTimeout(function() {
          message.textContent = "";
        }, 5000)
        
      })
      .catch((error) => {
        message.textContent = "Logout failed: " + error.message;
        message.style.color = "red";
      });
  });

  // Handle login/logout UI state
  onAuthStateChanged(auth, (user) => {
    if (user) {
      loginBox.style.display = "none";
      logoutBox.style.display = "block";
    } else {
      loginBox.style.display = "block";
      logoutBox.style.display = "none";
    }
  });

  forgotPasswordLink.addEventListener("click", (e) => {
    e.preventDefault();
    const email = emailInput.value;

    if (!email) {
      message.textContent = "Please enter your email above before resetting password.";
      message.style.color = "orange";
      return;
    }

    sendPasswordResetEmail(auth, email)
      .then(() => {
        message.textContent = "Password reset email sent!";
        message.style.color = "green";
      })
      .catch((error) => {
        message.textContent = "Error: " + error.message;
        message.style.color = "red";
      });
  });

});

