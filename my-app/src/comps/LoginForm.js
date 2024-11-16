// src/comps/LoginForm.js
import { useState } from 'react';
import { auth } from '../firebaseConfig'; // Import your Firebase auth
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const LoginForm = ({ onUserChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      onUserChange(user); // Update the user state in App.js
      navigate(user.role === 'recruiter' ? '/dashboard' : '/profile'); // Redirect based on role
    } catch (error) {
      console.error('Error logging in:', error);
      alert('Login failed: ' + error.message);
    }
  };

  return (

    <form onSubmit={handleLogin} className="flex flex-col">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="mb-2 p-2 border rounded"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="mb-2 p-2 border rounded"
      />
      <button type="submit" className="bg-blue-500 text-white py-2 rounded">
        Login
      </button>
      <p className="mt-4">
        Don't have an account?{' '}
        <span
          onClick={() => navigate('/register')}
          className="text-blue-500 cursor-pointer"
        >
          Register here
        </span>
      </p>
    </form>
  );
};

export default LoginForm;