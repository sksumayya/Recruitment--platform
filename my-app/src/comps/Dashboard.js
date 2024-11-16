import { useEffect, useState } from 'react';
import { firestore, auth } from '../firebaseConfig';
import { collection, getDocs, query, where, doc, updateDoc, getDoc } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';

const Dashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState({});
  const [filter, setFilter] = useState('applied');
  const [editingJobId, setEditingJobId] = useState(null);
  const [editedJob, setEditedJob] = useState({ title: '', description: '', deadline: '' });
  const [activeJobId, setActiveJobId] = useState(null);
  const [suggestions, setSuggestions] = useState({});
  const [selectedApplicantId, setSelectedApplicantId] = useState(null);

  const userId = auth.currentUser?.uid;

  const fetchJobs = async () => {
    if (!userId) return;

    const jobsQuery = query(collection(firestore, 'jobs'), where('recruiterId', '==', userId));
    const jobDocs = await getDocs(jobsQuery);
    setJobs(jobDocs.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchJobs();
  }, [userId]);

  const fetchApplicantsForJob = async (jobId) => {
    const applicantsQuery = query(collection(firestore, 'applications'), where('jobId', '==', jobId));
    const applicantDocs = await getDocs(applicantsQuery);
    const applicantData = applicantDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const jobDoc = await getDoc(doc(firestore, 'jobs', jobId));
    const jobTitle = jobDoc.data()?.title;

    const applicantsWithDetails = await Promise.all(applicantData.map(async (applicant) => {
      const userDoc = await getDoc(doc(firestore, 'users', applicant.candidateId));
      return {
        ...applicant,
        name: userDoc.data()?.name,
        email: userDoc.data()?.email,
        resume: userDoc.data()?.resume,
        jobTitle: jobTitle,
      };
    }));

    setApplicants((prev) => ({ ...prev, [jobId]: applicantsWithDetails }));
  };

  const handleViewApplicants = (jobId) => {
    if (activeJobId === jobId) {
      setActiveJobId(null);
      setSelectedApplicantId(null);
    } else {
      setActiveJobId(jobId);
      fetchApplicantsForJob(jobId);
    }
  };

  const checkResume = async (applicant) => {
    const response = await fetch('https://abhishek123543.pythonanywhere.com/check_resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_url: applicant.resume, job_title: applicant.jobTitle }),
    });

    if (response.ok) {
      const data = await response.json();
      try {
        const suggestionsString = data.suggestions;
        setSuggestions((prev) => ({ ...prev, [applicant.id]: suggestionsString }));
        setSelectedApplicantId(applicant.id);
      } catch (error) {
        console.error("Error parsing suggestions:", error);
      }
    } else {
      console.error("Failed to fetch suggestions:", response.statusText);
    }
  };

  const handleApproveApplicant = async (applicantId) => {
    const applicantRef = doc(firestore, 'applications', applicantId);
    await updateDoc(applicantRef, { status: 'approved' });
    fetchApplicantsForJob(applicantRef.id);
  };

  const handleRejectApplicant = async (applicantId) => {
    const applicantRef = doc(firestore, 'applications', applicantId);
    await updateDoc(applicantRef, { status: 'rejected' });
    setApplicants((prev) => {
      const newState = { ...prev };
      for (const jobId in newState) {
        newState[jobId] = newState[jobId].filter(app => app.id !== applicantId);
      }
      return newState;
    });
  };

  const handleEditJob = async (jobId) => {
    const jobToEdit = jobs.find(job => job.id === jobId);
    setEditedJob({ title: jobToEdit.title, description: jobToEdit.description, deadline: jobToEdit.deadline });
    setEditingJobId(jobId);
  };

  const handleUpdateJob = async (e) => {
    e.preventDefault();
    const jobRef = doc(firestore, 'jobs', editingJobId);
    await updateDoc(jobRef, editedJob);
    setEditingJobId(null);
    setEditedJob({ title: '', description: '', deadline: '' });
    fetchJobs();
  };

  const filteredApplicants = (jobId) => {
    const allApplicants = applicants[jobId] || [];
    if (filter === 'approved') {
      return allApplicants.filter(applicant => applicant.status === 'approved');
    } else if (filter === 'rejected') {
      return allApplicants.filter(applicant => applicant.status === 'rejected');
    }
    return allApplicants.filter(applicant => applicant.status !== 'rejected');
  };

  const renderStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <span role="img" aria-label="approved" className="text-green-500">✅</span>;
      case 'rejected':
        return <span role="img" aria-label="rejected" className="text-red-500">❌</span>;
      default:
        return <span role="img" aria-label="applied" className="text-yellow-500">❓</span>;
    }
  };

  const viewResume = (resumeUrl) => {
    window.open(resumeUrl, '_blank'); // Open resume in a new tab
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-4xl font-bold mb-6 text-center">My Posted Jobs</h2>

      <div className="mb-4 flex justify-center">
        <label className="mr-2">Filter Applicants:</label>
        <button onClick={() => setFilter('applied')} className={`py-2 px-4 rounded ${filter === 'applied' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Applied</button>
        <button onClick={() => setFilter('approved')} className={`py-2 px-4 rounded ${filter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>Approved</button>
        <button onClick={() => setFilter('rejected')} className={`py-2 px-4 rounded ${filter === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}>Rejected</button>
      </div>

      <div className="space-y-4">
        {jobs.map(job => (
          <div key={job.id} className="bg-white border rounded-lg shadow-lg p-6 transition transform hover:scale-105">
            <h3 className="text-2xl font-semibold">{job.title}</h3>
            <p className="mt-2 text-gray-700">{job.description}</p>
            <p className="mt-2 text-gray-600"><strong>Company:</strong> {job.company}</p>
            <p className="mt-2 text-gray-600"><strong>Total Applicants:</strong> {applicants[job.id] ? applicants[job.id].length : 0}</p>
            <div className="mt-4 flex justify-between">
              <button 
                onClick={() => handleViewApplicants(job.id)} 
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
              >
                {activeJobId === job.id ? 'Hide Candidates' : 'View Candidates'}
              </button>
              <button 
                onClick={() => handleEditJob(job.id)} 
                className="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 transition"
              >
                Edit
              </button>
            </div>

            {editingJobId === job.id && (
              <form onSubmit={handleUpdateJob} className="mt-4 flex flex-col">
                <input
                  type="text"
                  value={editedJob.title}
                  onChange={(e) => setEditedJob({ ...editedJob, title: e.target.value })}
                  placeholder="Job Title"
                  required
                  className="border p-2 mb-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  value={editedJob.description}
                  onChange={(e) => setEditedJob({ ...editedJob, description: e.target.value })}
                  placeholder="Job Description"
                  required
                  className="border p-2 mb-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={editedJob.deadline}
                  onChange={(e) => setEditedJob({ ...editedJob, deadline: e.target.value })}
                  required
                  className="border p-2 mb-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition">
                  Update Job
                </button>
              </form>
            )}

            {activeJobId === job.id && applicants[job.id] && (
              <div className="mt-4 border-t pt-4">
                {filteredApplicants(job.id).map(applicant => (
                  <div key={applicant.id} className="flex justify-between items-center border-b py-2">
                    <div className="flex flex-col">
                      <span className="font-bold">{applicant.name} {renderStatusIcon(applicant.status)}</span>
                      <span className="text-sm">{applicant.email}</span>
                      <button 
                        onClick={() => viewResume(applicant.resume)} 
                        className="text-blue-600 hover:underline"
                      >
                        View Resume
                      </button>
                    </div>
                    <div className="flex space-x-4">
                      <button 
                        onClick={() => handleApproveApplicant(applicant.id)} 
                        className="bg-green-500 text-white py-1 px-2 rounded hover:bg-green-600 transition"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleRejectApplicant(applicant.id)} 
                        className="bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600 transition"
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => checkResume(applicant)} 
                        className="bg-gray-500 text-white py-1 px-2 rounded hover:bg-gray-600 transition"
                      >
                        Check Resume
                      </button>
                    </div>
                  </div>
                ))}
                {selectedApplicantId && suggestions[selectedApplicantId] && (
                  <div className="mt-4">
                    <h4 className="text-xl font-semibold">Suggestions:</h4>
                    <ReactMarkdown>{suggestions[selectedApplicantId]}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
