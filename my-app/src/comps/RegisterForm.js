// src/comps/RegisterForm.js
import { useState } from 'react';
import { auth, firestore, storage } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const RegisterForm = ({ onUserChange }) => {
  const [role, setRole] = useState('candidate'); // candidate or recruiter
  const [formData, setFormData] = useState({ email: '', password: '', name: '', company: '', resume: null });
  const navigate = useNavigate();

  const handleRegistration = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const userId = userCredential.user.uid;

      let resumeUrl = '';
      if (role === 'candidate' && formData.resume) {
        const resumeRef = ref(storage, `resumes/${userId}`);
        await uploadBytes(resumeRef, formData.resume);
        resumeUrl = await getDownloadURL(resumeRef);
      }

      const userDoc = {
        name: formData.name,
        email: formData.email,
        role,
        ...(role === 'candidate' ? { resume: resumeUrl } : { company: formData.company })
      };
      await setDoc(doc(firestore, 'users', userId), userDoc);
      onUserChange({ ...userCredential.user, role }); // Update user state with role
      navigate(role === 'recruiter' ? '/dashboard' : '/jobs'); // Redirect based on role
    } catch (error) {
      console.error('Error registering user:', error);
    }
  };

  return (
    <form onSubmit={handleRegistration} className="flex flex-col">
      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
        className="mb-2 p-2 border rounded"
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
        className="mb-2 p-2 border rounded"
      />
      <input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        required
        className="mb-2 p-2 border rounded"
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="mb-2 p-2 border rounded"
      >
        <option value="candidate">Candidate</option>
        <option value="recruiter">Recruiter</option>
      </select>

      {role === 'candidate' && (
        <input
          type="file"
          onChange={(e) => setFormData({ ...formData, resume: e.target.files[0] })}
          required
          className="mb-2"
        />
      )}
      {role === 'recruiter' && (
        <input
          type="text"
          placeholder="Company"
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          required
          className="mb-2 p-2 border rounded"
        />
      )}

      <button type="submit" className="bg-blue-500 text-white py-2 rounded">
        Register
      </button>
    </form>
  );
};

export default RegisterForm;