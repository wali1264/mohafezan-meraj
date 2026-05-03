import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, UserPlus, Users, Fingerprint } from 'lucide-react';
import { useAppStore } from '../store';

export default function Home() {
  const users = useAppStore((state) => state.users);

  const handleCopyFp = (e: React.MouseEvent, fp: string) => {
    e.preventDefault();
    navigator.clipboard.writeText(fp);
    alert('Fingerprint ID copied to clipboard: ' + fp);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden mt-12">
        <div className="bg-blue-600 p-6 text-white text-center">
          <ShieldCheck className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Secure Access System</h1>
          <p className="text-blue-100 mt-2">Offline HMAC QR Verification</p>
        </div>

        <div className="p-6 space-y-4">
          <Link
            to="/admin"
            className="flex items-center p-4 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <div className="bg-indigo-100 p-3 rounded-full text-indigo-600 mr-4">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">Admin Panel</h2>
              <p className="text-sm text-slate-500">Register new personnel</p>
            </div>
          </Link>

          <Link
            to="/guard"
            className="flex items-center p-4 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <div className="bg-green-100 p-3 rounded-full text-green-600 mr-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">Guard Scanner</h2>
              <p className="text-sm text-slate-500">Scan & verify QR codes</p>
            </div>
          </Link>

          <div className="pt-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
              Registered Personnel ({users.length})
            </h3>
            {users.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No users registered yet.</p>
            ) : (
              <div className="space-y-3">
                {users.map((u) => (
                  <Link
                    key={u.id}
                    to={`/user/${u.id}`}
                    className="flex flex-col p-3 border rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center w-full">
                      <img src={u.photoBase64} alt={u.name} className="w-10 h-10 rounded-full object-cover mr-3 bg-slate-200" />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 text-sm">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.role}</p>
                      </div>
                      <Users className="w-4 h-4 text-slate-400" />
                    </div>
                    {u.fingerprintId && (
                      <div 
                        onClick={(e) => handleCopyFp(e, u.fingerprintId!)}
                        className="mt-3 flex items-center justify-between bg-green-50 p-2 rounded border border-green-100 cursor-pointer hover:bg-green-100"
                        title="Click to copy fingerprint ID"
                      >
                         <div className="flex items-center text-green-700 text-xs font-semibold">
                           <Fingerprint className="w-4 h-4 mr-2" />
                           اثر انگشت ثبت شده
                         </div>
                         <span className="text-xs font-mono text-green-600 bg-green-100 px-2 py-0.5 rounded">Copy ID</span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
