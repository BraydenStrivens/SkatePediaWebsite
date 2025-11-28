/** 
  @fileoverview: This file contains the functions used in the 'login' and 'my account' pages. These functions
                  include logging in, logging out, and fetching user data.
  @author: Brayden Strivens <bdstrivens@gmail.com>
  @version: 1.0.0
  @since: 11/03/2025
*/

/*
-------------------------------------------------------------------------------
Table of Contents:
-------------------------------------------------------------------------------
1.  Global Declarations
2.  Login Input Field Styling
3.  Event Listeners
4.  Updating the Page with Fetched Data
5.  Functions
6.  Error Type Handling
-------------------------------------------------------------------------------
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, updatePassword } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { firebaseConfig } from "./firebaseConfig.js"
// 1. Global Declarations -----------------------------------------------------------



const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginButton = document.getElementById('loginButton')
const logoutButton = document.getElementById('logoutButton')
const forgotPasswordLink = document.getElementById('forgotPasswordLink')
const openChangePasswordButton = document.getElementById("openChangePasswordButton");
const closeChangePasswordButton = document.getElementById("closeChangePasswordButton");
const changePasswordPopup = document.getElementById("changePasswordPopup");
const changePasswordButton = document.getElementById("changePasswordButton");

const loginStatusMessage = document.getElementById('loginStatusMessage')
const accountInfoStatusMessage = document.getElementById('accountInfoStatusMessage')
const trickProgressStatusMessage = document.getElementById('trickProgressStatusMessage')
const changePasswordStatusMessage = document.getElementById("changePasswordStatusMessage")

const emailInputField = document.getElementById('emailInput')
const passwordInputField = document.getElementById('passwordInput')

const overlay = document.getElementById('myAccountOverlay')

const statusMessageStyle = {
  error: 'red',
  success: '#eeb07b'
}

// 2. Login Input Field Styling ---------------------------------------------

// Updates the class list of the various input fields based on the content of
// the input fields. Prevents the placeholder from dropping back down to
// the center of the input field if the user has typed in characters
const inputFields = document.querySelectorAll(".input-field")

inputFields.forEach((inputField) => {
  inputField.addEventListener('blur', e => {
    if (e.target.value) {
      e.target.classList.add('valid-input')
    } else {
      e.target.classList.remove('valid-input')
    }
  })
})

// 3. Event Listeners ------------------------------------------------

if (loginButton) {
  loginButton.addEventListener('click', () => {
    if (emailInputField && passwordInputField) {
      login(emailInputField.value, passwordInputField.value)
    }
  })
}

if (logoutButton) {
  logoutButton.addEventListener('click', () => {
    logout()
  })
}

if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault()

    const email = emailInputField ? emailInputField.value : ""

    sendPasswordResetEmail(auth, email)
      .then(() => {
        if (loginStatusMessage) {
          loginStatusMessage.textContent = "Password reset email sent!"
          loginStatusMessage.style.color = statusMessageStyle.success
        }
      })
      .catch((error) => {
        if (loginStatusMessage) {
          loginStatusMessage.textContent = resetPasswordErrorMessage(error.code, email)
          loginStatusMessage.style.color = statusMessageStyle.error
        }
      })
  })
}

if (openChangePasswordButton) {
  openChangePasswordButton.addEventListener("click", () => {
    openChangePasswordPopup()
  });
} 

if (closeChangePasswordButton) {
  closeChangePasswordButton.addEventListener("click", () => {
    closeChangePasswordPopup()
  })
}

// Closes change password popup when clicking outside of the popup
if (overlay) {
  overlay.addEventListener('click', () => {
    closeChangePasswordPopup()
  })
}

if (changePasswordButton) {
  changePasswordButton.addEventListener("click", () => {
    const newPassword = document.getElementById("newPassword");

    console.log("hi")
    changePassword(newPassword.value)
  });
}

function openChangePasswordPopup() {
  changePasswordPopup.style.display = "flex";
  changePasswordPopup.removeAttribute("inert")
  overlay.style.display = "block"
}

function closeChangePasswordPopup() {
  changePasswordPopup.style.display = "none"
  changePasswordPopup.setAttribute("inert", "")
  overlay.style.display = "none"
  newPassword.value = "";
}




// Observes all the status messages and detects when they appear,
// and makes them disappear again after 5 seconds
const statusMessagePopupObserver = new MutationObserver(() => {
  document.querySelectorAll('.status-message').forEach(message => {
    if (message.textContent !== '' && !message.dataset.timerSet) {
      message.dataset.timerSet = 'true'

      setTimeout(() => {
        message.textContent = ''
        message.dataset.timerSet = ''
      }, 5000)
    }
  })
})
statusMessagePopupObserver.observe(document.body, { childList: true, subtree: true, attributes: true });


// 4. Updating Page with Fetched Data ---------------------------------------

// Updates the 'My Account' page based on the login status of the user
onAuthStateChanged(auth, (user) => {
  updateMyAccountPage(user)
})

// Updates HTML elements with the user's information if it exists in storage
if (localStorage.getItem('username')) {
  applyUserAccountDataToPage()
} else {
  accountInfoStatusMessage.textContent = "Error: Failed to fetch user info."
  accountInfoStatusMessage.style.color = statusMessageStyle.error
}
if (localStorage.getItem('trickData')) {
  applyUserTrickDataToPage()
} else {
  trickProgressStatusMessage.textContent =
    `Error: Failed to fetch trick progress data. \n
    Refreshing the page or re-logging in may fix the issue.`
  trickProgressStatusMessage.style.color = statusMessageStyle.error
}

// 5. Functions -------------------------------------------------------------

/**
  * Attemps to login a user with a given email and password. Fetches and applies user data upon
  * success or displays an error message if upon failure.
  * @param {string} email - The inputted email of a user.
  * @param {number} age - The inputted password of the user.
  * @returns {void} 
*/
function login(email, password) {
  signInWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      fetchUserAccountData(userCredential)
        .then(() => {
          applyUserAccountDataToPage()
        })
        .catch(() => {
          console.log('Error fetching account info: ', error)
        })

      fetchUserTrickListInfo(userCredential)
        .then(() => {
          applyUserTrickDataToPage()
        })
        .catch((error) => {
          console.log(error)
          console.log('Error fetching trick info: ', error)
        })

    })
    .catch((error) => {
      if (loginStatusMessage) {
        loginStatusMessage.textContent = loginErrorMessage(error.code, email)
        loginStatusMessage.style.color = statusMessageStyle.error
      }
    })
}

/**
  * Attemps to logout a user. If successful the users data is removed from local storage and a 
  * success message is displayed, or upon failure an error message is displayed. 
  * @returns {void} 
*/
function logout() {
  signOut(auth)
    .then(() => {
      localStorage.clear()

      if (loginStatusMessage) {
        loginStatusMessage.textContent = "You have been logged out."
        loginStatusMessage.style.color = statusMessageStyle.success
      }
    })
    .catch((error) => {
      if (myAccountStatus) {
        accountInfoStatusMessage.textContent = "Logout failed: " + error.message
        accountInfoStatusMessage.style.color = statusMessageStyle.error
      }
    })
}

/**
  * Updates the display of the 'login' and 'my account' page based on the login status
  * of the user. 
  * @param {object} user - An object containing data pertaining to a user in firebase's database.
  * @returns {void} 
*/
function updateMyAccountPage(user) {
  const myAccountPage = document.getElementById('myAccountPage')
  const loggedOutPage = document.getElementById('loginPage')
  const loadingAnimation = document.getElementById('loadingAnimation')

  if (user) {
    if (myAccountPage) myAccountPage.style.display = "flex"
    if (loggedOutPage) loggedOutPage.style.display = "none"

  } else {
    if (myAccountPage) myAccountPage.style.display = "none"
    if (loggedOutPage) loggedOutPage.style.display = "flex"
  }

  if (loadingAnimation) loadingAnimation.style.display = "none"
}

/**
  * Attemps to fetch a user's account information from firebase and store it in local storage. 
  * @param {object} userCredential - An object containing data pertaining to a user's credentials in firebase's database.
  * @returns {void} 
*/
async function fetchUserAccountData(userCredential) {
  // Fetches user document from firebase database
  const userRef = doc(db, "users", `${userCredential.user.uid}`)
  const docSnapshot = await getDoc(userRef)

  if (docSnapshot.exists()) {
    const currentUser = docSnapshot.data()

    // Converts firebase timestamp to MM/DD/YYYY
    const date = new Date(currentUser.date_created.seconds * 1000)
    const readableDate = date.toLocaleDateString()

    // Stores user data in local storage
    localStorage.setItem('username', currentUser.username)
    localStorage.setItem('userId', currentUser.user_id)
    localStorage.setItem('email', currentUser.email)
    localStorage.setItem('bio', currentUser.bio)
    localStorage.setItem('stance', currentUser.stance)
    localStorage.setItem('dateCreated', readableDate)

    if (currentUser.profile_pic_url === "") {
      localStorage.setItem('photoUrl', 'assets/default_profile_image.jpg')
    } else {
      localStorage.setItem('photoUrl', currentUser.profile_pic_url)
    }
  } else {
    accountInfoStatusMessage.textContent =
      `Error: Failed to fetch user info. \n 
    Refreshing the page or re-logging in may fix this issue.`
    accountInfoStatusMessage.style.color = statusMessageStyle.error
  }
}

/**
  * Applies a user's account data from local storage to html elements on the page.
  * @returns {void} 
*/
function applyUserAccountDataToPage() {
  // User's data elements in the page
  const usernameTextBox = document.getElementById('username')
  const emailTextBox = document.getElementById('email')
  const stanceTextBox = document.getElementById('stance')
  const bioTextBox = document.getElementById('bio')
  const dateCreatedTextBox = document.getElementById('dateCreated')
  const profilePhotoImg = document.getElementById('profilePhoto')

  // Fetches user data from local storage
  const username = localStorage.getItem('username')
  const email = localStorage.getItem('email')
  const stance = localStorage.getItem('stance')
  const bio = localStorage.getItem('bio')
  const dateCreated = localStorage.getItem('dateCreated')
  const photoUrl = localStorage.getItem('photoUrl')

  // Updates HTML elements with user data from local storage if it exists
  if (usernameTextBox && username) {
    usernameTextBox.innerHTML = username
  }
  if (emailTextBox && email) {
    emailTextBox.innerHTML = email
  }
  if (stanceTextBox && stance) {
    stanceTextBox.innerHTML = stance
  }
  if (bioTextBox && bio) {
    bioTextBox.innerHTML = "" + bio
  }
  if (dateCreatedTextBox && dateCreated) {
    dateCreatedTextBox.innerHTML = dateCreated
  }
  if (photoUrl && photoUrl) {
    profilePhotoImg.src = photoUrl
  }
}

/**
  * Attemps to fetch a user's trick progress information from firebase and store it in local storage. 
  * @param {object} userCredential - An object containing data pertaining to a user's credentials in firebase's database.
  * @returns {void} 
*/
async function fetchUserTrickListInfo(userCredential) {
  // Fetches user document from firebase database
  const userRef = doc(db, 'trick_list_info', `${userCredential.user.uid}`)
  const docSnapshot = await getDoc(userRef)

  if (docSnapshot.exists()) {
    const trickListInfo = docSnapshot.data()
    const encodedTrickList = JSON.stringify(trickListInfo)
    localStorage.setItem('trickData', encodedTrickList)
  } else {
    trickProgressStatusMessage.textContent =
      `Error: Failed to fetch trick progress data. \n
      Refreshing the page or re-logging in may fix the issue.`
    trickProgressStatusMessage.style.color = statusMessageStyle.error
  }
}

/**
  * Applies a user's trick progress data from local storage to html elements on the page.
  * @returns {void} 
*/
function applyUserTrickDataToPage() {
  const encodedTrickList = localStorage.getItem('trickData')
  const trickListInfo = JSON.parse(encodedTrickList)

  if (trickListInfo) {

    // Fetched trick info
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

    // Trick info elements displayed on the page
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

    // Sets the trick info elements data based on the fetched data
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
  }
}

/**
  * Attempts to change the password of the current users account.
  * @param {string} newPassword - The password to set as the users new password.
  * @returns {void} 
*/
function changePassword(newPassword) {
  const user = auth.currentUser;

  if (newPassword !== "") {
    updatePassword(user, newPassword)
      .then(() => {
        changePasswordStatusMessage.textContent = "Password Successfully Updated"
        changePasswordStatusMessage.style.color = statusMessageStyle.success

        setTimeout(() => {
          closeChangePasswordPopup()
        }, 3000)
      })
      .catch((error) => {
        changePasswordStatusMessage.textContent = changePasswordErrorMessage(error.code);
        changePasswordStatusMessage.style.color = statusMessageStyle.error
      })

  } else {
    changePasswordStatusMessage.textContent = "Please enter a new password."
    changePasswordStatusMessage.style.color = statusMessageStyle.success
  }
}

// 6. Error Type Handling ----------------------------------------------------------------

/**
  * Checks for the login error type to display an error message accordingly.
  * @param {string} errorType - The code of the caught error
  * @param {string} email - The inputted email at the time the login button was pressed.
  * @returns {string} - An error message that specifies the error type.
*/
function loginErrorMessage(errorType, email) {
  switch (errorType) {
    case "auth/invalid-email":
      return `There are no registered users with the email: '${email}.'`

    case "auth/missing-password":
      return "Please enter password."

    case "auth/invalid-credential":
      return "Invalid email or password."

    default:
      return "Error."
  }
}

/**
  * Checks for the reset password error type to display an error message accordingly.
  * @param {string} errorType - The code of the caught error
  * @param {string} email - The inputted email at the time the reset password button was pressed.
  * @returns {string} - An error message that specifies the error type.
*/
function resetPasswordErrorMessage(errorType, email) {
  switch (errorType) {
    case "auth/missing-email":
      return "Error: Please enter email before resetting password."
    case "auth/invalid-email":
      return `Error: Failed to find account registered with the email: '${email}'`
  }
}

/**
  * Checks for the change password error type to display an error message accordingly.
  * @param {string} errorType - The code of the caught error
  * @returns {string} - An error message that specifies the error type.
*/
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