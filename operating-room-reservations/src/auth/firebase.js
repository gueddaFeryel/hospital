// firebase.js
import { initializeApp } from "firebase/app";
import {
    getAuth,
    sendPasswordResetEmail,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    deleteUser,
    signOut // Ajout de signOut
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyB6s8S1WCtEeG_dDGR4vTpNG_uBuhtUSzQ",
    authDomain: "login-signup-1bae5.firebaseapp.com",
    projectId: "login-signup-1bae5",
    storageBucket: "login-signup-1bae5.appspot.com",
    messagingSenderId: "TON_ID_MESSAGE",
    appId: "759431833363:android:c255c0909e523d6566dce6"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

export {
    auth,
    db,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    deleteUser,
    signOut // Export de signOut
};
export default firebaseApp;
