import { useState } from 'react';
import { Sparkles, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../App';

interface LoginProps {
  onBack: () => void;
  onForgotPassword?: () => void;
}

export default function Login({ onBack, onForgotPassword }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (!success) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Sparkles className="w-8 h-8 text-pink-600" />
            <span className="text-2xl text-gray-900">BeautyClinic</span>
          </div>

          <h2 className="text-2xl text-center mb-8 text-gray-900">
            Login to Your Account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block mb-2 text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                placeholder="your@email.com"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block mb-2 text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-60"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            {onForgotPassword && (
              <p className="text-center text-sm text-gray-600">
                <button type="button" onClick={onForgotPassword} className="text-pink-600 hover:text-pink-700 font-medium">
                  Forgot password?
                </button>
              </p>
            )}
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-4">Demo Credentials:</p>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">Admin:</p>
                <p>Email: admin@clinic.com</p>
                <p>Password: admin123</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">Doctor:</p>
                <p>Email: sarah@clinic.com</p>
                <p>Password: doctor123</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">Assistant:</p>
                <p>Email: assistant@clinic.com</p>
                <p>Password: assistant123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
