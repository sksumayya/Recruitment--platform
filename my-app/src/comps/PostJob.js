import { useState } from 'react';
import { firestore, auth } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const PostJob = () => {
  const [jobData, setJobData] = useState({
    title: '',
    description: '',
    company: '',
    deadline: '', // Keep this state for posting the job
  });
  const navigate = useNavigate();

  const handlePostJob = async (e) => {
    e.preventDefault();

    const user = auth.currentUser; // Get the currently logged-in user
    if (!user) return; // Optionally handle if user is not logged in

    const userId = user.uid; // Use the actual user ID

    try {
      // Use addDoc to create a new job document with a random ID
      await addDoc(collection(firestore, 'jobs'), {
        ...jobData,
        recruiterId: userId, // Store the actual recruiter ID
      });
      navigate('/dashboard'); // Redirect to dashboard after posting
    } catch (error) {
      console.error('Error posting job:', error);
    }
  };

  return (
    <form onSubmit={handlePostJob} className="flex flex-col">
      <input
        type="text"
        placeholder="Job Title"
        value={jobData.title}
        onChange={(e) => setJobData({ ...jobData, title: e.target.value })}
        required
        className="mb-2 p-2 border rounded"
      />
      <textarea
        placeholder="Job Description"
        value={jobData.description}
        onChange={(e) => setJobData({ ...jobData, description: e.target.value })}
        required
        className="mb-2 p-2 border rounded"
      />
      <input
        type="text"
        placeholder="Company Name"
        value={jobData.company}
        onChange={(e) => setJobData({ ...jobData, company: e.target.value })}
        required
        className="mb-2 p-2 border rounded"
      />
      <input
        type="date" // Use date input for the deadline
        placeholder="Deadline"
        value={jobData.deadline}
        onChange={(e) => setJobData({ ...jobData, deadline: e.target.value })}
        required
        className="mb-2 p-2 border rounded"
      />
      <button type="submit" className="bg-blue-500 text-white py-2 rounded">
        Post Job
      </button>
    </form>
  );
};

export default PostJob;