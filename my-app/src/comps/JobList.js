import { useEffect, useState } from 'react';
import { firestore, auth } from '../firebaseConfig';
import { collection, getDocs, addDoc } from 'firebase/firestore';

const JobList = () => {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const fetchJobs = async () => {
      const jobsCollection = collection(firestore, 'jobs');
      const jobDocs = await getDocs(jobsCollection);
      setJobs(jobDocs.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchJobs();
  }, []);

  const handleApply = async (jobId) => {
    const userId = auth.currentUser?.uid; // Get current user ID

    if (!userId) {
      alert("You need to log in to apply for a job.");
      return;
    }

    try {
      const applicationData = {
        jobId,
        candidateId: userId,
        status: 'Applied',
      };
      await addDoc(collection(firestore, 'applications'), applicationData);
      alert("Successfully applied for the job!");
    } catch (error) {
      console.error('Error applying for job:', error);
      alert("Error applying for job. Please try again.");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold">Available Jobs</h2>
      <ul>
        {jobs.map(job => {
          const deadlineDate = new Date(job.deadline); // Convert deadline to a Date object
          const isDeadlinePassed = deadlineDate < new Date(); // Check if the deadline has passed

          return (
            <li key={job.id} className="border p-4 mb-2">
              <h3 className="font-semibold">{job.title}</h3>
              <p>{job.description}</p>
              <p><strong>Company:</strong> {job.company}</p>
              <p><strong>Deadline:</strong> {job.deadline}</p> {/* Show deadline */}
              <button 
                onClick={() => handleApply(job.id)} 
                className={`bg-green-500 text-white py-1 px-2 rounded ${isDeadlinePassed ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isDeadlinePassed} // Disable button if deadline is passed
              >
                {isDeadlinePassed ? 'Deadline Completed' : 'Apply'}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default JobList;