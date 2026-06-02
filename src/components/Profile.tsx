import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { User } from '../types';
import { UserCircle, MapPin, Building, Shield, EyeOff, Save, Camera, Upload, X, Loader2 } from 'lucide-react';

export default function Profile() {
  const { user, token, updateUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    history: '',
    location: '',
    bio: '',
    hide_location: false,
    hide_history: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (token) {
      fetch('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setFormData({
          history: data.history || '',
          location: data.location || '',
          bio: data.bio || '',
          hide_location: !!data.hide_location,
          hide_history: !!data.hide_history
        });
      });
    }
  }, [token]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        uploadAvatar(file);
      } else {
        alert("Please upload an image file.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAvatar(file);
    }
  };

  const uploadAvatar = async (file: File) => {
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;

        // 1. Save in Document Vault
        const docRes = await fetch('/api/documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            title: 'Avatar Profile Picture',
            category: 'Personal',
            file_name: file.name,
            file_type: file.type,
            file_data: base64String
          })
        });

        if (!docRes.ok) throw new Error("Document Vault upload failed");
        const docData = await docRes.json();
        const avatarUrl = `/api/avatar/${docData.id}`;

        // 2. Clear out existing and update profile with new avatar_url
        const profileRes = await fetch('/api/users/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            history: formData.history,
            location: formData.location,
            bio: formData.bio,
            hide_location: formData.hide_location,
            hide_history: formData.hide_history,
            avatar_url: avatarUrl
          })
        });

        if (profileRes.ok) {
          setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
          updateUser({ avatar_url: avatarUrl });
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploading(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          history: formData.history,
          location: formData.location,
          bio: formData.bio,
          hide_location: formData.hide_location,
          hide_history: formData.hide_history,
          avatar_url: null
        })
      });
      if (res.ok) {
        setProfile(prev => prev ? { ...prev, avatar_url: undefined } : null);
        updateUser({ avatar_url: null });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsEditing(false);
        // Update local profile state
        setProfile(prev => prev ? { ...prev, ...formData, hide_location: formData.hide_location ? 1 : 0, hide_history: formData.hide_history ? 1 : 0 } : null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) return <div className="p-8 text-center opacity-60">Loading profile...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="space-y-4">
        <h2 className="text-6xl font-serif italic tracking-tighter">My Profile</h2>
        <p className="text-xl opacity-60">
          Manage your identity, background, and privacy settings.
        </p>
      </header>

      <div className="bg-white border border-[#141414] p-8">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div 
              id="avatar-upload-container"
              className={`relative group w-20 h-20 rounded-full border border-[#141414]/20 overflow-hidden flex items-center justify-center transition-all ${
                isDragging ? "ring-2 ring-offset-2 ring-[#141414]" : ""
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              title="Click or drag an image here to upload your profile picture"
            >
              {isUploading ? (
                <div className="absolute inset-0 bg-[#141414]/50 flex items-center justify-center text-white z-10">
                  <Loader2 className="animate-spin" size={24} />
                </div>
              ) : null}

              {profile?.avatar_url ? (
                <img 
                  id="profile-avatar-image"
                  src={profile.avatar_url} 
                  alt={profile.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div 
                  id="profile-avatar-initials"
                  className="w-full h-full bg-[#141414] text-[#E4E3E0] flex items-center justify-center text-3xl font-serif italic selection:bg-transparent"
                >
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Upload Overlay */}
              <label 
                id="avatar-file-label"
                htmlFor="avatar-file-input" 
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col justify-center items-center text-[#E4E3E0] cursor-pointer transition-opacity text-[10px] uppercase font-bold tracking-wider text-center"
              >
                <Camera size={18} className="mb-1" />
                <span>Upload</span>
                <input 
                  type="file" 
                  id="avatar-file-input" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </label>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-3xl font-bold">{profile.name}</h3>
                {profile.avatar_url && (
                  <button
                    id="profile-avatar-remove-btn"
                    onClick={handleRemoveAvatar}
                    className="text-[10px] text-red-600 font-bold uppercase tracking-widest hover:underline mt-1"
                    title="Remove Profile Picture"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
              {profile.is_mentor === 1 && (
                <span className="inline-flex items-center gap-1 text-xs uppercase tracking-widest bg-[#141414] text-[#E4E3E0] px-2 py-1 mt-2">
                  <Shield size={12} /> Verified Mentor
                </span>
              )}
              <div className="text-[11px] opacity-60 uppercase tracking-wider mt-1.5 font-medium">
                Drag and drop image here to change photo
              </div>
            </div>
          </div>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 border border-[#141414] text-xs uppercase tracking-widest font-bold hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors"
            >
              Edit Profile
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold mb-2">Bio</label>
              <textarea 
                value={formData.bio}
                onChange={e => setFormData({...formData, bio: e.target.value})}
                className="w-full border border-[#141414] p-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-[#141414]/10"
                placeholder="Tell the community about yourself..."
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold mb-2">Location</label>
                <input 
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  className="w-full border border-[#141414] p-3 focus:outline-none focus:ring-2 focus:ring-[#141414]/10"
                  placeholder="City, State"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold mb-2">Facility History</label>
                <input 
                  type="text"
                  value={formData.history}
                  onChange={e => setFormData({...formData, history: e.target.value})}
                  className="w-full border border-[#141414] p-3 focus:outline-none focus:ring-2 focus:ring-[#141414]/10"
                  placeholder="e.g. San Quentin (2015-2020)"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-[#141414]/10 space-y-4">
              <h4 className="text-sm uppercase tracking-widest font-bold flex items-center gap-2">
                <EyeOff size={16} /> Privacy Controls
              </h4>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.hide_location}
                  onChange={e => setFormData({...formData, hide_location: e.target.checked})}
                  className="w-5 h-5 accent-[#141414]"
                />
                <span className="text-sm">Hide my location from the public directory</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.hide_history}
                  onChange={e => setFormData({...formData, hide_history: e.target.checked})}
                  className="w-5 h-5 accent-[#141414]"
                />
                <span className="text-sm">Hide my facility history from the public directory</span>
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-[#141414] text-[#E4E3E0] p-3 text-xs uppercase tracking-widest font-bold hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
              >
                <Save size={16} /> {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className="flex-1 border border-[#141414] p-3 text-xs uppercase tracking-widest font-bold hover:bg-[#141414]/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {profile.bio && (
              <div>
                <h4 className="text-xs uppercase tracking-widest font-bold mb-2 opacity-60">About</h4>
                <p className="leading-relaxed">{profile.bio}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#141414]/10">
              <div>
                <h4 className="text-xs uppercase tracking-widest font-bold mb-2 opacity-60 flex items-center gap-2">
                  <MapPin size={14} /> Location
                </h4>
                <p className="flex items-center gap-2">
                  {profile.location || 'Not specified'}
                  {profile.hide_location === 1 && <span title="Hidden from public"><EyeOff size={14} className="opacity-50" /></span>}
                </p>
              </div>
              <div>
                <h4 className="text-xs uppercase tracking-widest font-bold mb-2 opacity-60 flex items-center gap-2">
                  <Building size={14} /> Facility History
                </h4>
                <p className="flex items-center gap-2">
                  {profile.history || 'Not specified'}
                  {profile.hide_history === 1 && <span title="Hidden from public"><EyeOff size={14} className="opacity-50" /></span>}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
