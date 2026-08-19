import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const token = params.get('token') || '';
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setMessage('');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    try { const response = await axiosInstance.post('/reset-password', { token, new_password: password }); setMessage(response.data.message); }
    catch (err: any) { setError(err.response?.data?.error || 'Unable to reset password.'); }
  };
  return <main className="flex min-h-screen items-center justify-center bg-sky-700 p-4"><form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"><h1 className="text-2xl font-bold">Set a new password</h1>{!token && <p className="mt-3 text-red-600">This reset link is invalid.</p>}<input disabled={!token} value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="New password (8+ characters)" className="mt-5 w-full rounded border p-3" />{error && <p className="mt-3 text-red-600">{error}</p>}{message && <p className="mt-3 text-green-700">{message}</p>}<button disabled={!token} className="mt-5 w-full rounded bg-sky-700 p-3 font-semibold text-white disabled:opacity-50">Reset password</button><Link className="mt-4 block text-center text-sky-700" to="/login">Back to login</Link></form></main>;
}
