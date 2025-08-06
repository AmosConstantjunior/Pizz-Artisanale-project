// init.js
 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"; // ← Nécessaire



// Configuration Firebase (remplace avec la tienne)
const firebaseConfig = {
    apiKey: "AIzaSyBwDLPrk1IUbEuRcW2NLssbOz7IWJAH5ys",
    authDomain: "chatapptest-e8d18.firebaseapp.com",
    projectId: "chatapptest-e8d18",
    storageBucket: "chatapptest-e8d18.appspot.com",
    messagingSenderId: "450169787993",
    appId: "1:450169787993:web:98808b4b6f0f6d09210348"
  };

// Initialise Firebase
const app = initializeApp(firebaseConfig);

// Initialise Firestore
const db = getFirestore(app);

// Exporter l'objet db pour pouvoir l'utiliser ailleurs
export { db };
