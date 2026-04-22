import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCWF6XHwaSHh0Qf4vS8Kn-T45MWnryrtOg",
  authDomain: "dashboard-dc-v2.firebaseapp.com",
  projectId: "dashboard-dc-v2",
  storageBucket: "dashboard-dc-v2.firebasestorage.app",
  messagingSenderId: "146705288474",
  appId: "1:146705288474:web:32fd69602f626b4c13b0a3",
  measurementId: "G-5K95GV7W1Q"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let analytics = null;

// Only initialize analytics in supported environments
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { db, analytics };
export default db;
