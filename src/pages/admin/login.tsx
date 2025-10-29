import { useState } from 'react';
import { firebaseAuth } from '../../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/router';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const userCred = await signInWithEmailAndPassword(firebaseAuth, email, password);
      console.log('signed in firebase user:', userCred.user.uid);
      const idToken = await userCred.user.getIdToken();
      console.log('got idToken length=', idToken?.length);

      // send idToken to server to create httpOnly session cookie
      const resp = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!resp.ok) {
        // try to read json or text for more info
        let bodyText = '';
        try {
          const json = await resp.json();
          bodyText = JSON.stringify(json);
        } catch (e) {
          bodyText = await resp.text();
        }
        console.error('session creation failed', resp.status, bodyText);
        throw new Error(`Session creation failed: ${resp.status} ${bodyText}`);
      }

      // success
      console.log('session cookie created, redirecting to dashboard');
      router.push('/admin/dashboard');
    } catch (err: any) {
      console.error('login error', err);
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-md bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col items-center mb-4">
          <img src="/sab-logo.png" alt="SAB Store Logo" className="w-24 h-24 mb-2 rounded-lg shadow" />
          <h2 className="text-2xl">Admin Login</h2>
        </div>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <label className="block mb-2">
          <div className="text-sm mb-1">Email</div>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded px-3 py-2" />
        </label>
        <label className="block mb-4">
          <div className="text-sm mb-1">Password</div>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded px-3 py-2" />
        </label>
        <button disabled={loading} type="submit" className="w-full bg-purple-600 text-white py-2 rounded">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
