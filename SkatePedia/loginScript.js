
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", event => {
  const firebaseConfig = { 
    apiKey : "AIzaSyBN66VjGHh_N1vI9_WhATf2gfDyyC1VsjE" , 
    authDomain : "skatepediav2-c98d9.firebaseapp.com" , 
    projectId : "skatepediav2-c98d9" , 
    storageBucket : "skatepediav2-c98d9.firebasestorage.app" , 
    messagingSenderId : "475395925210" , 
    appId : "1:475395925210:web:006f56aa63c6d5bf4371e3" , 
    measurementId : "G-6CNX39MTZP" 
};

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  // var currentUser = null;

  // Login/Logout Box functionality -------------------------------------------------------------------------
  const loginBox = document.getElementById("login-box");
  const logoutBox = document.getElementById("logout-box");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("loginButton");
  const logoutButton = document.getElementById("logoutButton");
  const message = document.getElementById("message");
  const forgotPasswordLink = document.getElementById("forgotPasswordLink");
  const usernameBox = document.getElementById("username");
  const modal = document.getElementById("loginModal");
  const openBtn = document.getElementById("openLoginModal");
  const closeBtn = document.getElementById("closeButton");

  // 'My Account' page elements ----------------------------------------------------------------------------
  const loggedOutPage = document.getElementById("loginMessage");
  const loggedInPage = document.getElementById("userInfoSection");
  const openChangePasswordButton = document.getElementById("changePassword");
  const changePasswordPopup = document.getElementById("updatePasswordModal");
  const profilePhotoUrl = document.getElementById("profilePhoto");
  const usernameTextBox = document.getElementById("userUsername");
  const emailTextBox = document.getElementById("userEmail");
  const stanceTextBox = document.getElementById("userStance");
  const bioTextBox = document.getElementById("userBio");
  const dateCreatedTextBox = document.getElementById("userDateCreated");
  const profilePhoto = document.getElementById("profilePhoto");
  
  const username = localStorage.getItem("username");
  const email = localStorage.getItem("email");
  const stance = localStorage.getItem("stance");
  const bio = localStorage.getItem("bio");
  const dateCreated = localStorage.getItem("dateCreated");
  const photoUrl = localStorage.getItem("photoUrl");

  if (photoUrl) {
    profilePhoto.src = photoUrl;
  }
  if (username != null) {
    usernameTextBox.innerHTML = username;
    usernameBox.textContent = username;
  } 
  if (email) {
    emailTextBox.innerHTML = email;
  } 
  if (stance) {
    stanceTextBox.innerHTML = stance;
  } 
  if (bio) {
    bioTextBox.innerHTML = bio;
  } 
  if (dateCreated) {
    dateCreatedTextBox.innerHTML = dateCreated;
  } 

  // Displays login pop up
  openBtn.onclick = function() {
    modal.style.display = "flex";
  }

  // Hides login pop up
  closeBtn.onclick = function() {
    modal.style.display = "none";
  }

  // Hides login pop up when clicking outside of the box
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }

  // Log In button 
  loginButton.addEventListener("click", () => {
    const inputtedEmail = emailInput.value;
    const inputtedPassword = passwordInput.value;

    signInWithEmailAndPassword(auth, inputtedEmail, inputtedPassword)
      .then(async (userCredential) => {
        // User document
        const userRef = doc(db, "users",  `${userCredential.user.uid}`);
        // Fetches user info
        const docSnapshot = await getDoc(userRef);
        
        // Stores fetched user info
        if (docSnapshot.exists()) {
          const currentUser = docSnapshot.data() 
          // Converts firebase timestamp to a date string
          const date = new Date(currentUser.date_created.seconds * 1000);
          const readableDate = date.toLocaleDateString();

          console.log(currentUser.profile_pic_url);
          console.log(currentUser.username);
          console.log(currentUser.email);
          console.log(currentUser.bio);
          console.log(currentUser.stance);
          console.log(readableDate);

          // Stores user data in local storage
          localStorage.setItem('username', currentUser.username);
          localStorage.setItem('userId', currentUser.user_id);
          localStorage.setItem('email', currentUser.email);
          localStorage.setItem('bio', currentUser.bio);
          localStorage.setItem('stance', currentUser.stance);
          localStorage.setItem('dateCreated', readableDate);
          localStorage.setItem('photoUrl', currentUser.profile_pic_url);

          // Downloads the profile image url and stores in local storage.
          const imageRef = ref(storage, currentUser.profile_pic_url);
          getDownloadURL(imageRef)
          .then((url) => {
            console.log("URL: ", url);
            localStorage.setItem('photoUrl', url)
            profilePhoto.src = url;
          })
          .catch((error) => {
            console.log("Error Fetching Profile Photo...");
            console.log(error);
          })

          usernameBox.textContent = `${currentUser.username}`;
          usernameBox.style.color = "#e79e00"

        } else {
          console.log("No such user document!");
        }
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

        // Hides message after 5 seconds
        setTimeout(function() {
          message.textContent = "";
        }, 5000)
      })
      .catch((error) => {
        message.textContent = "Logout failed: " + error.message;
        message.style.color = "red";
      });
  });

  if (openChangePasswordButton) {
    openChangePasswordButton.addEventListener("click", () => {
      console.log("CLICKED")
      changePasswordPopup.style.display = "flex";
    });
  }
  

  // Updates the pop up whether the user is logged in or logged out
  onAuthStateChanged(auth, (user) => {
    if (user) {
      loginBox.style.display = "none";
      logoutBox.style.display = "block";
      loggedOutPage.style.display = "none";
      loggedInPage.style.display = "flex";

    } else {
      loginBox.style.display = "block";
      logoutBox.style.display = "none";
      loggedOutPage.style.display = "flex";
      loggedInPage.style.display = "none";
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