import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ChevronLeft, Save } from 'lucide-react';
import { useAppStore } from '../store';

export default function Admin() {
  const navigate = useNavigate();
  const addUser = useAppStore((state) => state.addUser);
  
  const [name, setName] = useState('');
  const [role, setRole] = useState('Teacher');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !photoBase64) {
      alert('Name and photo are required!');
      return;
    }

    const newUser = {
      id: `u_${Math.random().toString(36).substring(2, 9)}`,
      name,
      role,
      photoBase64,
      createdAt: Date.now()
    };

    addUser(newUser);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden mt-8">
        <div className="bg-indigo-600 p-4 text-white flex items-center">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-indigo-700 rounded-full mr-2">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Register Personnel</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex flex-col items-center">
            <div 
              className="w-32 h-32 rounded-full border-4 border-slate-100 bg-slate-200 overflow-hidden flex items-center justify-center relative cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {photoBase64 ? (
                <img src={photoBase64} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-slate-500 flex flex-col items-center">
                  <Camera className="w-8 h-8 mb-1" />
                  <span className="text-xs font-semibold uppercase">Add Photo</span>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                capture="user" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handlePhotoUpload}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">Tap to take a photo</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="e.g. Ahmad Reza"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            >
              <option value="Teacher">Teacher (استاد)</option>
              <option value="Student">Student (محصل)</option>
              <option value="Manager">Manager (مدیر)</option>
              <option value="Staff">Staff (کارمند)</option>
            </select>
          </div>

          <button 
            type="submit"
            className="w-full bg-indigo-600 text-white font-semibold flex items-center justify-center p-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Save className="w-5 h-5 mr-2" />
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
}
