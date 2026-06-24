import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/auth';
import { toast } from 'react-hot-toast';
import { KeyRound, Mail, User, Lock } from 'lucide-react';

import bhelLogo from '../assets/BHEL_logo.svg';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Login stages: 'REQUEST' (Email/Password & ID) or 'VERIFY' (OTP Code)
  const [stage, setStage] = useState('REQUEST');
  const [loginMethod, setLoginMethod] = useState('OTP'); // 'OTP' or 'PASSWORD'
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Submit request for OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!employeeId || !email) {
      toast.error('Please fill in all fields');
      return;
    }
    
    // Trim whitespace from inputs (users may copy-paste with extra spaces)
    const trimmedId = employeeId.trim();
    const trimmedEmail = email.trim();
    setEmployeeId(trimmedId);
    setEmail(trimmedEmail);

    setLoading(true);
    try {
      await authApi.requestOtp(trimmedId, trimmedEmail);
      toast.success('OTP sent successfully to your email');
      setStage('VERIFY');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send OTP. Make sure ID and Email match.');
    } finally {
      setLoading(false);
    }
  };

  // Submit request for password login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!employeeId || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    const trimmedId = employeeId.trim();
    setEmployeeId(trimmedId);

    setLoading(true);
    try {
      const tokens = await authApi.loginWithPassword(trimmedId, password);
      login(tokens);
      toast.success('Logged in successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid Employee ID or password');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and complete login
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode) {
      toast.error('Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      const tokens = await authApi.verifyOtp(employeeId, otpCode);
      login(tokens);
      toast.success('Logged in successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <div className="flex flex-col items-center">
          <img src={bhelLogo} alt="BHEL Logo" className="h-16 w-auto mb-4" />
          <h2 className="text-center text-3xl font-extrabold text-[#003366]">
            BHEL Connect
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 animate-fade-in">
            {stage === 'REQUEST'
              ? loginMethod === 'OTP'
                ? 'Sign in using your Employee ID and Official Email'
                : 'Sign in using your Employee ID and Password'
              : 'Enter the 6-digit OTP sent to your email'}
          </p>
        </div>

        {stage === 'REQUEST' && (
          <div className="flex border-b border-gray-200 mb-6">
            <button
              type="button"
              onClick={() => {
                setLoginMethod('OTP');
                setPassword('');
              }}
              className={`flex-1 text-center py-2.5 text-sm font-semibold border-b-2 cursor-pointer transition-all duration-200 ${
                loginMethod === 'OTP'
                  ? 'border-[#003366] text-[#003366]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              OTP Login
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMethod('PASSWORD');
                setEmail('');
              }}
              className={`flex-1 text-center py-2.5 text-sm font-semibold border-b-2 cursor-pointer transition-all duration-200 ${
                loginMethod === 'PASSWORD'
                  ? 'border-[#003366] text-[#003366]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Password Login
            </button>
          </div>
        )}

        {stage === 'REQUEST' ? (
          <form className="mt-8 space-y-6" onSubmit={loginMethod === 'OTP' ? handleRequestOtp : handlePasswordLogin}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="employee-id" className="sr-only">
                  Employee ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="employee-id"
                    name="employeeId"
                    type="text"
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="appearance-none rounded-md relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Employee ID (e.g. 1234567)"
                  />
                </div>
              </div>

              {loginMethod === 'OTP' ? (
                <div>
                  <label htmlFor="email-address" className="sr-only">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email-address"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none rounded-md relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                      placeholder="Email Address"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none rounded-md relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                      placeholder="Password"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#003366] hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 transition-colors cursor-pointer"
              >
                {loading 
                  ? loginMethod === 'OTP' 
                    ? 'Requesting OTP...' 
                    : 'Signing In...' 
                  : loginMethod === 'OTP' 
                    ? 'Send OTP' 
                    : 'Sign In'}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyOtp}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="otp-code" className="sr-only">
                  OTP Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="otp-code"
                    name="otpCode"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="appearance-none rounded-md relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm text-center tracking-widest font-mono text-lg"
                    placeholder="000000"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => setStage('REQUEST')}
                className="font-medium text-[#003366] hover:text-blue-800 cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#003366] hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 transition-colors cursor-pointer"
              >
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
