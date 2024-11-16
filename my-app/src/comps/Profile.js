import { useState, useEffect } from 'react';
import { auth, firestore, storage } from '../firebaseConfig'; // Ensure you import storage
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import AppliedJobs from './AppliedJobs'; // Importing AppliedJobs component

const Profile = () => {
  const [applications, setApplications] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [editableProfile, setEditableProfile] = useState({ name: '', email: '', about: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [showAppliedJobs, setShowAppliedJobs] = useState(false);
  const [profileImage, setProfileImage] = useState(null); // State for image file

  useEffect(() => {
    const fetchProfileAndApplications = async () => {
      const user = auth.currentUser;

      // Fetch user profile
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      const userData = userDoc.data();
      setUserProfile(userData);
      setEditableProfile({ name: userData.name, email: userData.email, about: userData.about || '' });
    };

    fetchProfileAndApplications();
  }, []);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditableProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setProfileImage(e.target.files[0]);
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;

    try {
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, editableProfile);

      // Upload the image to Firebase Storage if one is selected
      if (profileImage) {
        const imageRef = ref(storage, `profilePictures/${user.uid}`);
        await uploadBytes(imageRef, profileImage);
        const imageURL = await getDownloadURL(imageRef);

        // Update user profile with the new image URL
        await updateDoc(userRef, { profilePicture: imageURL });
        setUserProfile((prev) => ({ ...prev, profilePicture: imageURL }));
      }

      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      {userProfile && (
        <div className="flex bg-white shadow-md rounded-lg overflow-hidden">
          <div className="w-1/3 p-4 border-r">
            <div className="flex flex-col items-center">
              <img 
                src={userProfile.profilePicture || 'default-profile.png'} 
                alt="Profile" 
                className="w-32 h-32 rounded-full mb-4" 
              />
              {isEditing ? (
                <input type="file" accept="image/*" onChange={handleImageChange} className="mb-2" />
              ) : (
                <button onClick={() => setIsEditing(true)} className="bg-yellow-500 text-white py-2 rounded">
                  Change Picture
                </button>
              )}
            </div>
          </div>

          <div className="w-2/3 p-4">
            {isEditing ? (
              <form onSubmit={handleSaveChanges} className="flex flex-col">
                <div className="mb-2">
                  <label className="block">Name:</label>
                  <input
                    type="text"
                    name="name"
                    value={editableProfile.name}
                    onChange={handleEditChange}
                    required
                    className="p-2 border rounded w-full"
                  />
                </div>
                <div className="mb-2">
                  <label className="block">Email:</label>
                  <input
                    type="email"
                    name="email"
                    value={editableProfile.email}
                    onChange={handleEditChange}
                    required
                    className="p-2 border rounded w-full"
                  />
                </div>
                <div className="mb-2">
                  <label className="block">About:</label>
                  <textarea
                    name="about"
                    value={editableProfile.about}
                    onChange={handleEditChange}
                    className="p-2 border rounded w-full"
                  />
                </div>
                <div className="flex">
                  <button type="submit" className="bg-blue-500 text-white py-2 rounded">
                    Save Changes
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)} className="ml-2 bg-gray-500 text-white py-2 rounded">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <h2 className="text-xl font-semibold">{userProfile.name}</h2>
                <p>Email: {userProfile.email}</p>
                <p>About: {userProfile.about}</p>
                <div className="mt-4">
                  <button onClick={() => setIsEditing(true)} className="bg-yellow-500 text-white py-2 rounded">
                    Edit
                  </button>
                  <button onClick={() => setShowAppliedJobs(!showAppliedJobs)} className="ml-2 bg-green-500 text-white py-2 rounded">
                    {showAppliedJobs ? 'Hide Applied Jobs' : 'Show Applied Jobs'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {showAppliedJobs && <AppliedJobs />} {/* Show Applied Jobs section */}
    </div>
  );
};

export default Profile;