import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, writeBatch, query, limit } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBJbY_9tCLCGjL1aKCeCanbAYT-uEf-U-0",
  authDomain: "diretoriacomercial-59e5d.firebaseapp.com",
  projectId: "diretoriacomercial-59e5d",
  storageBucket: "diretoriacomercial-59e5d.firebasestorage.app",
  messagingSenderId: "284772936647",
  appId: "1:284772936647:web:f7703d3a04050ead88c7e2",
  measurementId: "G-0ZCFCF1GVN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteCollection(collectionPath, batchSize = 500) {
  console.log(`Limpando coleção: ${collectionPath}...`);
  const collectionRef = collection(db, collectionPath);
  const q = query(collectionRef, limit(batchSize));

  let totalDeleted = 0;
  
  while (true) {
    const snapshot = await getDocs(q);
    if (snapshot.size === 0) break;

    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    totalDeleted += snapshot.size;
    console.log(`Apagados ${totalDeleted} documentos de ${collectionPath}...`);
  }
  
  console.log(`✅ Coleção ${collectionPath} limpa com sucesso!`);
}

async function nuclearClean() {
  console.log("🚀 Iniciando limpeza nuclear do Firebase...");
  try {
    await deleteCollection("arrecadacao");
    await deleteCollection("localidades");
    await deleteCollection("metasRegional");
    await deleteCollection("metasLocalidade");
    console.log("\n✨ BANCO DE DADOS TOTALMENTE ZERADO! ✨");
    process.exit(0);
  } catch (err) {
    console.error("❌ ERRO DURANTE A LIMPEZA:", err);
    process.exit(1);
  }
}

nuclearClean();
