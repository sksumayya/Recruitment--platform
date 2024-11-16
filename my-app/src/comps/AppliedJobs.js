import { useEffect, useState } from 'react';
import { firestore, auth } from '../firebaseConfig';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom'; // Assuming you're using React Router for navigation

const AppliedJobs = () => {
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [loading, setLoading] = useState(true); // State for loading
  const userId = auth.currentUser?.uid; // Get the currently logged-in user's ID

  useEffect(() => {
    const fetchAppliedJobs = async () => {
      if (!userId) return; // Exit if no user is logged in

      // Query to get applications for the logged-in user
      const applicationsQuery = query(
        collection(firestore, 'applications'),
        where('candidateId', '==', userId) // Filter by candidate ID
      );

      const applicationDocs = await getDocs(applicationsQuery);
      const applications = await Promise.all(
        applicationDocs.docs.map(async (appDoc) => {
          const jobId = appDoc.data().jobId; // Get job ID from application
          const jobRef = doc(firestore, 'jobs', jobId); // Reference to the job document
          const jobDoc = await getDoc(jobRef); // Fetch job details

          return {
            id: appDoc.id,
            jobTitle: jobDoc.data().title,
            company: jobDoc.data().company,
            status: appDoc.data().status, // Assuming you store application status
            jobId: jobId, // Keep job ID for linking
          };
        })
      );

      setAppliedJobs(applications);
      setLoading(false); // Set loading to false after data is fetched
    };

    fetchAppliedJobs();
  }, [userId]);

  // Function to determine status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'text-yellow-600';
      case 'Approved':
        return 'text-green-600';
      case 'Rejected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">My Applied Jobs</h2>
      {loading ? (
        <p>Loading applied jobs...</p> // Loading message
      ) : appliedJobs.length === 0 ? (
        <p>No jobs applied yet.</p>
      ) : (
        <ul>
          {appliedJobs.map(job => (
            <li key={job.id} className="border p-4 mb-2 rounded-md hover:shadow-lg transition-shadow">
              <Link to={`/jobs/${job.jobId}`} className="block">
                <h3 className="font-semibold">{job.jobTitle}</h3>
                <p><strong>Company:</strong> {job.company}</p>
                <p className={`${getStatusColor(job.status)} font-semibold`}>
                  <strong>Status:</strong> {job.status}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AppliedJobs;