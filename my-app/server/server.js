const express = require('express');
const pdfParse = require('pdf-parse');
const stringSimilarity = require('string-similarity');
const axios = require('axios');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');
const { getStorage, ref, getDownloadURL } = require('firebase/storage');

// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCeqkT00392PZtHAfz49iqEETV_-NW1fUU",
    authDomain: "smart-3f5b7.firebaseapp.com",
    projectId: "smart-3f5b7",
    storageBucket: "smart-3f5b7.appspot.com",
    messagingSenderId: "54434566073",
    appId: "1:54434566073:web:601618e0fb267eb14f3068",
    measurementId: "G-04FLQ5EJFN"
  };
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const storage = getStorage(app);

const server = express();
server.use(express.json());

// Fetch and extract text from a PDF resume
async function fetchResumeText(resumeUrl) {
  const response = await axios.get(resumeUrl, { responseType: 'arraybuffer' });
  const pdfText = await pdfParse(response.data);
  return pdfText.text;
}

// Calculate similarity score between resume text and job information
function calculateScore(resumeText, jobDescription, jobTitle) {
  const combinedJobText = `${jobTitle} ${jobDescription}`;
  return stringSimilarity.compareTwoStrings(resumeText, combinedJobText) * 100; // as percentage
}

// Endpoint to score resume
server.post('/api/check-resume-score', async (req, res) => {
  const { jobId, candidateId } = req.body;

  try {
    // Fetch job details
    const jobDoc = await getDoc(doc(firestore, 'jobs', jobId));
    const { title: jobTitle, description: jobDescription } = jobDoc.data();

    // Fetch candidate's resume URL
    const userDoc = await getDoc(doc(firestore, 'users', candidateId));
    const resumeUrl = userDoc.data()?.resume;

    if (!resumeUrl) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Fetch and parse resume text
    const resumeText = await fetchResumeText(resumeUrl);
    const score = calculateScore(resumeText, jobDescription, jobTitle);

    res.json({ score });
  } catch (error) {
    console.error("Error scoring resume:", error);
    res.status(500).json({ error: 'Failed to score resume' });
  }
});

server.listen(5000, () => console.log("Server running on port 5000"));
