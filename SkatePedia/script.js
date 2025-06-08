
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, updatePassword } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

document.addEventListener("DOMContentLoaded", event => {
  // Embeds the login popup into each page when loaded
  fetch("login.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("loginModal").innerHTML = html;

      // Sets up the login UI after the popup is embedded
      setupLoginUI();
    });
});

function setupLoginUI() {
  const firebaseConfig = {
    apiKey: "AIzaSyBN66VjGHh_N1vI9_WhATf2gfDyyC1VsjE",
    authDomain: "skatepediav2-c98d9.firebaseapp.com",
    projectId: "skatepediav2-c98d9",
    storageBucket: "skatepediav2-c98d9.firebasestorage.app",
    messagingSenderId: "475395925210",
    appId: "1:475395925210:web:006f56aa63c6d5bf4371e3",
    measurementId: "G-6CNX39MTZP"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  const loginPopup = document.getElementById("loginModal");
  const openButton = document.getElementById("openLoginModal");
  const closeButton = document.getElementById("closeButton");
  const loginButton = document.getElementById("loginButton");
  const logoutButton = document.getElementById("logoutButton");

  const message = document.getElementById("message");
  const forgotPasswordLink = document.getElementById("forgotPasswordLink");

  const openChangePasswordButton = document.getElementById("changePassword");
  const closeChangePasswordButton = document.getElementById("changePasswordClose");
  const changePasswordPopup = document.getElementById("updatePasswordModal");
  const changePasswordButton = document.getElementById("changePasswordButton");
  const changePasswordMessage = document.getElementById("changePasswordErrorMessage")

  // Updates HTML elements with the user's information if it exists in storage
  if (localStorage.getItem('username')) {
    setUserData();

    const userId = localStorage.getItem("userId");
    if (userId) {
      fetchUserTrickListInfo(db, userId);
    }
  }


  // Opens the login/logout popup button from button
  if (openButton && loginPopup) {
    openButton.onclick = function () {
      loginPopup.style.display = "flex";
    };
  }

  // Closes the login/logout popup from button
  if (closeButton && loginPopup) {
    closeButton.onclick = function () {
      loginPopup.style.display = "none";
    };
  }

  // Closes the login/logout popup by clicked outside of the popup
  // if (modal) {
  //   window.onclick = function (event) {
  //     if (event.target == modal) {
  //       modal.style.display = "none";
  //     }
  //   };
  // }

  if (loginButton) {
    loginButton.addEventListener("click", () => {
      const emailInput = document.getElementById("email");
      const passwordInput = document.getElementById("password");

      if (emailInput && passwordInput) {
        const inputtedEmail = emailInput.value;
        const inputtedPassword = passwordInput.value;

        login(auth, inputtedEmail, inputtedPassword, message, db, storage);
      }
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      logout(auth, message);
    });
  }

  if (openChangePasswordButton) {
    const newPassword = document.getElementById("newPassword");

    openChangePasswordButton.addEventListener("click", () => {
      changePasswordPopup.style.display = "flex";
      changePasswordMessage.textContent = "";
    });

    // if (changePasswordButton) {
    //   changePasswordButton.addEventListener("click", changePassword(auth, changePasswordMessage));
    // }

    if (changePasswordButton) {
      changePasswordButton.addEventListener("click", () => {
        changePassword(auth, changePasswordMessage, newPassword.value)
      });
    }

    closeChangePasswordButton.addEventListener("click", () => {
      changePasswordPopup.style.display = "none";
      changePasswordMessage.textContent = "";
      newPassword.value = "";
    })
  }

  onAuthStateChanged(auth, (user) => {
    // Updates the login/logout popup based on the login status of the user
    // Updates the 'my account' page based on the login status of the user
    updateLoginPopupDisplay(user);
  });

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", (e) => {
      e.preventDefault();

      const emailInput = document.getElementById("email");
      const email = emailInput ? emailInput.value : "";

      if (!email) {
        if (message) {
          message.textContent = "Please enter your email above before resetting password.";
          message.style.color = "orange";
        }

        return;
      }

      sendPasswordResetEmail(auth, email)
        .then(() => {
          if (message) {
            message.textContent = "Password reset email sent!";
            message.style.color = "green";
          }
        })
        .catch((error) => {
          if (message) {
            message.textContent = "Error: " + error.message;
            message.style.color = "red";
          }
        });
    });
  }
}

function login(auth, email, password, message, db, storage) {
  signInWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      // Fetches user document from firebase database
      const userRef = doc(db, "users", `${userCredential.user.uid}`);
      const docSnapshot = await getDoc(userRef);

      if (docSnapshot.exists()) {
        const currentUser = docSnapshot.data();

        // Converts firebase timestamp to MM/DD/YYYY
        const date = new Date(currentUser.date_created.seconds * 1000);
        const readableDate = date.toLocaleDateString();

        // Stores user data in the browsers local storage
        localStorage.setItem('username', currentUser.username);
        localStorage.setItem('userId', currentUser.user_id);
        localStorage.setItem('email', currentUser.email);
        localStorage.setItem('bio', currentUser.bio);
        localStorage.setItem('stance', currentUser.stance);
        localStorage.setItem('dateCreated', readableDate);

        if (currentUser.profile_pic_url === "") {
          localStorage.setItem('photoUrl', "images/default_profile_image.jpg");
        } else {
          localStorage.setItem('photoUrl', currentUser.profile_pic_url);
        }

        // Sets the user data after login
        setUserData();

      } else {
        message.textContent = "Failed to fetch user info."
      }
    })
    .catch((error) => {
      if (message) {
        message.textContent = loginErrorMessage(error.code, email);
      }
    });
}

function logout(auth, message) {
  signOut(auth)
    .then(() => {
      // Removes the user's information from local storage on logout
      localStorage.clear();

      if (message) {
        message.textContent = "You have been logged out.";
        message.style.color = "gray";

        // Hides message after 5 seconds
        setTimeout(() => { message.textContent = ""; }, 5000);
      }
    })
    .catch((error) => {
      if (message) {
        message.textContent = "Logout failed: " + error.message;
        message.style.color = "red";
      }
    });
};

function setUserData() {
  const usernameBox1 = document.getElementById("myAccountUsername");
  const usernameBox2 = document.getElementById("popupUsername");
  const emailTextBox = document.getElementById("userEmail");
  const stanceTextBox = document.getElementById("userStance");
  const bioTextBox = document.getElementById("userBio");
  const dateCreatedTextBox = document.getElementById("userDateCreated");
  const profilePhotos = document.querySelectorAll(".profile-photo");

  const username = localStorage.getItem("username");
  const email = localStorage.getItem("email");
  const stance = localStorage.getItem("stance");
  const bio = localStorage.getItem("bio");
  const dateCreated = localStorage.getItem("dateCreated");
  const photoUrl = localStorage.getItem("photoUrl");

  // Updates HTML elements with the user data from local storage if it exists
  if (photoUrl) {
    profilePhotos.forEach((element) => {
      if (element) element.src = photoUrl;
    });
  }
  if (usernameBox1 && username) {
    // Username displayed in the 'my account' page
    usernameBox1.innerHTML = "<b>Username: </b>" + username;
  }
  if (usernameBox2 && username) {
    // Username displayed in the logout popup 
    usernameBox2.textContent = username;
    usernameBox2.style.color = "#e79e00";
  }
  if (emailTextBox && email) {
    emailTextBox.innerHTML = "<b>Email: </b>" + email;
  }
  if (stanceTextBox && stance) {
    stanceTextBox.innerHTML = "<b>Stance: </b>" + stance;
  }
  if (bioTextBox) {
    if (bio) {
      bioTextBox.innerHTML = "<b>Bio: </b>" + bio;
    } else {
      bioTextBox.innerHTML = "<b>Bio: </b>";
    }
  }
  if (dateCreatedTextBox && dateCreated) {
    dateCreatedTextBox.innerHTML = "<b>DateCreated: </b>" + dateCreated;
  }
};

function updateLoginPopupDisplay(user) {
  const loginBox = document.getElementById("loginBox");
  const logoutBox = document.getElementById("logoutBox");
  const loggedOutPage = document.getElementById("loginMessage");
  const loggedInPage = document.getElementById("accountInfoContainer");

  if (user) {
    // Hides the login box and shows the logout box
    if (loginBox) loginBox.style.display = "none";
    if (logoutBox) logoutBox.style.display = "block";
    // Hides the user information section of the 'my account' page
    if (loggedOutPage) loggedOutPage.style.display = "none";
    if (loggedInPage) loggedInPage.style.display = "flex";


  } else {
    // Shows the login box and hides the logout box
    if (loginBox) loginBox.style.display = "block";
    if (logoutBox) logoutBox.style.display = "none";
    // Shows the user information section of the 'my account' page
    if (loggedOutPage) loggedOutPage.style.display = "flex";
    if (loggedInPage) loggedInPage.style.display = "none";
  }
};

async function fetchUserTrickListInfo(db, userId) {
  // Fetches user document from firebase database
  const userRef = doc(db, "trick_list_info", `${userId}`);
  const docSnapshot = await getDoc(userRef);

  if (docSnapshot.exists()) {
    const trickListInfo = docSnapshot.data();

    const regularTricks = trickListInfo.regular_tricks;
    const fakieTricks = trickListInfo.fakie_tricks;
    const switchTricks = trickListInfo.switch_tricks;
    const nollieTricks = trickListInfo.nollie_tricks;
    const totalTricks = trickListInfo.total_tricks;

    const learnedRegularTricks = trickListInfo.learned_regular_tricks;
    const learnedFakieTricks = trickListInfo.learned_fakie_tricks;
    const learnedSwitchTricks = trickListInfo.learned_switch_tricks;
    const learnedNollieTricks = trickListInfo.learned_nollie_tricks;
    const learnedTotalTricks = trickListInfo.learned_tricks;

    const regularTricksCounter = document.getElementById("regularTricksCounter");
    const fakieTricksCounter = document.getElementById("fakieTricksCounter");
    const switchTricksCounter = document.getElementById("switchTricksCounter");
    const nollieTricksCounter = document.getElementById("nollieTricksCounter");
    const totalTricksCounter = document.getElementById("totalTricksCounter");

    const regularProgressBar = document.getElementById("regularProgress");
    const fakieProgressBar = document.getElementById("fakieProgress");
    const switchProgressBar = document.getElementById("switchProgress");
    const nollieProgressBar = document.getElementById("nollieProgress");
    const totalProgressBar = document.getElementById("totalProgress");

    regularTricksCounter.innerHTML = `${learnedRegularTricks} / ${regularTricks}`;
    regularProgressBar.max = regularTricks;
    regularProgressBar.value = learnedRegularTricks;

    fakieTricksCounter.innerHTML = `${learnedFakieTricks} / ${fakieTricks}`;
    fakieProgressBar.max = fakieTricks;
    fakieProgressBar.value = learnedFakieTricks;

    switchTricksCounter.innerHTML = `${learnedSwitchTricks} / ${switchTricks}`;
    switchProgressBar.max = switchTricks;
    switchProgressBar.value = learnedSwitchTricks;

    nollieTricksCounter.innerHTML = `${learnedNollieTricks} / ${nollieTricks}`;
    nollieProgressBar.max = nollieTricks;
    nollieProgressBar.value = learnedNollieTricks;

    totalTricksCounter.innerHTML = `${learnedTotalTricks} / ${totalTricks}`;
    totalProgressBar.max = totalTricks;
    totalProgressBar.value = learnedTotalTricks;

  } else {
    console.log("No such trick list info document!");
  }
}

function changePassword(auth, message, newPassword) {
  const user = auth.currentUser;

  if (newPassword !== "") {
    updatePassword(user, newPassword)
    .then(() => {
      message.textContent = "Password Successfully Updated"
    })
    .catch((error) => {
      message.textContent = changePasswordErrorMessage(error.code);
    })

  } else {
    message.textContent = "Please enter a new password."
  }
}

function loginErrorMessage(errorType, email) {
  switch (errorType) {
    case "auth/user-not-found":
      return `There are no registered users with the email: ${email}.`
      
    case "auth/wrong-password":
      return `Incorrect password for the account registered with the email: ${email}.`

    case "auth/invalid-credential":
      return "Invalid email or password."

    default:
      return "Error."
  }
}

function changePasswordErrorMessage(errorType) {
  switch (errorType) {
    case "auth/weak-password": 
      return "Password must be at least 6 characters long.";

    case "auth/requires-recent-login":
      return "Sensitive operations require the user to have recently logged in. Please log out and log back in to change your password."

    default:
      return "Error."
  } 
}
