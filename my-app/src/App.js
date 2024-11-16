// src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth,firestore } from './firebaseConfig'; // Firebase configuration
import Navbar from './comps/Navbar'; // Import Navbar Component
import RegisterForm from './comps/RegisterForm';
import LoginForm from './comps/LoginForm';
import Dashboard from './comps/Dashboard';
import JobList from './comps/JobList';
import Profile from './comps/Profile';
import PostJob from './comps/PostJob';
import AppliedJobs from './comps/AppliedJobs';
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions



function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        setUser({ ...user, role: userDoc.data().role }); // Fetch user role from Firestore
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="text-center">Loading...</div>;

  const isRecruiter = user && user.role === 'recruiter';

  return (
    <Router>
      <Navbar user={user} />
      <div className="container mx-auto">
        <Routes>
          {!user ? (
            <>
              <Route path="/login" element={<LoginForm onUserChange={setUser} />} />
              <Route path="/register" element={<RegisterForm onUserChange={setUser} />} />
              <Route path="*" element={<Navigate to="/login" />} />
              
            </>
          ) : (
            <>
              {isRecruiter ? (
                <Route path="/dashboard" element={<Dashboard />} />
              ) : (
                <Route path="/profile" element={<Profile />} />
              )}
              <Route path="/post-job" element={<PostJob />} />
              <Route path="/jobs" element={<JobList />} />
              
              <Route path="*" element={<Navigate to={isRecruiter ? "/dashboard" : "/profile"} />} />
            </>
          )}
        </Routes>
      </div>
    </Router>
  );
}

export default App;