import { useState } from 'react';
import { AlertCircle, CheckCircle, Droplet, Lock, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAppSettings } from '../context/AppSettingsContext';
import { saveSetting, USER_PROFILE_STORAGE_KEY } from '../utils/appSettings';
import { translate } from '../utils/translations';

function Login() {
  const { settings } = useAppSettings();
  const t = (key: Parameters<typeof translate>[1]) => translate(settings.account.language, key);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await axiosInstance.post('/login', {
        email,
        password,
      });

      const token = res.data.access_token;
      const user = res.data.user;

      if (!token) {
        throw new Error('No token received');
      }

      localStorage.setItem('token', token);
      if (user) {
        saveSetting(USER_PROFILE_STORAGE_KEY, user);
      }

      window.location.href = '/';
    } catch (err) {
      console.error(err);
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);
      await axiosInstance.post('/forgot-password', {
        email,
        new_password: newPassword,
      });

      setSuccess(t('resetPasswordSuccess'));
      setPassword('');
      setNewPassword('');
      setResetMode(false);
    } catch (err) {
      console.error(err);
      setError('Could not reset password. Check your email or device ID.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xl dark:bg-gray-800">
            <Droplet className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">{t('loginTitle')}</h1>
          <p className="mt-2 text-blue-100 dark:text-blue-200">{t('loginSubtitle')}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-2xl transition-all duration-300 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
            {resetMode ? t('resetPassword') : t('welcomeBack')}
          </h2>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
              <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={resetMode ? handleForgotPassword : handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('deviceOrEmail')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('deviceOrEmailPlaceholder')}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-gray-900 placeholder-gray-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white dark:placeholder-gray-500 dark:focus:ring-blue-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {resetMode ? t('newPassword') : t('password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  id="password"
                  type="password"
                  value={resetMode ? newPassword : password}
                  onChange={(e) => (resetMode ? setNewPassword(e.target.value) : setPassword(e.target.value))}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-gray-900 placeholder-gray-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white dark:placeholder-gray-500 dark:focus:ring-blue-400"
                />
              </div>
            </div>

            {!resetMode && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700" />
                  <span className="text-gray-600 dark:text-gray-300">{t('rememberMe')}</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetMode(true);
                    setError('');
                    setSuccess('');
                  }}
                  className="text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {t('forgotPassword')}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-cyan-700 hover:shadow-2xl disabled:opacity-50 dark:from-blue-500 dark:to-cyan-500 dark:hover:from-blue-600 dark:hover:to-cyan-600"
            >
              {loading ? (resetMode ? t('saving') : t('loggingIn')) : resetMode ? t('resetPasswordButton') : t('login')}
            </button>

            {resetMode && (
              <button
                type="button"
                onClick={() => {
                  setResetMode(false);
                  setError('');
                  setNewPassword('');
                }}
                className="w-full rounded-lg border border-gray-300 bg-white py-3 font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                {t('backToLogin')}
              </button>
            )}
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('noAccount')}{' '}
            <Link to="/signup" className="font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              {t('signup')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
