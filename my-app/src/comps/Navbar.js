// src/components/Navbar.js
import { useEffect, useState } from 'react';
import { auth, firestore } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ user }) => {
  const [role, setRole] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
        }
      }
    };

    fetchUserRole();

    const intervalId = setInterval(fetchUserRole, 1000);
    return () => clearInterval(intervalId);
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <nav className="bg-gray-800 p-4 shadow-lg">
      <ul className="flex justify-between items-center text-white">
        <li className="text-xl font-bold">recruitment Platform</li>
        <div className="flex space-x-4">
          {role === 'recruiter' && (
            <>
              <li><a href="/dashboard" className="hover:text-gray-300">Dashboard</a></li>
              <li><a href="/post-job" className="hover:text-gray-300">Post Job</a></li>
            </>
          )}
          {role === 'candidate' && (
            <>
              <li><a href="/profile" className="hover:text-gray-300">Profile</a></li>
              <li><a href="/jobs" className="hover:text-gray-300">Jobs</a></li>
            </>
          )}
          {auth.currentUser && (
            <li>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded transition"
              >
                Logout
              </button>
            </li>
          )}
        </div>
      </ul>
    </nav>
  );
};

export default Navbar;