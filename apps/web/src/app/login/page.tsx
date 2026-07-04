'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Role } from '../../context/AppContext';

export default function LoginPage() {
  const { login, signup, employees, sessions, revokeSession, twoFactorEnabled, toggle2FA } = useApp();

  // Tab state
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'forgot' | '2fa' | 'reset'>('signin');
  
  // Sign in form state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Sign up form state
  const [empCode, setEmpCode] = useState('');
  const [role, setRole] = useState<Role>(Role.EMPLOYEE);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'email' | 'token' | 'reset'>('email');
  
  // 2FA state
  const [twoFACode, setTwoFACode] = useState<string[]>(Array(6).fill(''));
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Password strength validation
  const validatePasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength += 25;
    if (/[A-Z]/.test(pwd)) strength += 25;
    if (/[0-9]/.test(pwd)) strength += 25;
    if (/[!@#$%^&*]/.test(pwd)) strength += 25;
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (pwd: string) => {
    setPassword(pwd);
    validatePasswordStrength(pwd);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return 'bg-error';
    if (passwordStrength < 50) return 'bg-orange-500';
    if (passwordStrength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await login(signInEmail, signInPassword);
      if (result.success) {
        setSuccess('Sign in successful! Redirecting...');
        setTimeout(() => {
          // Redirect to dashboard
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        setError(result.error || 'Failed to sign in');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (passwordStrength < 50) {
      setError('Password must be stronger');
      setLoading(false);
      return;
    }

    try {
      const result = await signup(empCode, fullName, email, role);
      if (result.success) {
        setSuccess('Registration successful! Redirecting to sign in...');
        setTimeout(() => {
          setActiveTab('signin');
          setSignInEmail(email);
          setSignInPassword('');
        }, 1000);
      } else {
        setError(result.error || 'Failed to register');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (forgotStep === 'email') {
      // Simulate email verification
      const emp = employees.find(e => e.email === forgotEmail);
      if (emp) {
        setSuccess('Verification link sent to your email');
        setTimeout(() => {
          setForgotStep('token');
        }, 1000);
      } else {
        setError('Email not found in system');
      }
    } else if (forgotStep === 'token') {
      // Simulate token verification
      if (resetToken.length === 6) {
        setSuccess('Token verified. Enter new password');
        setForgotStep('reset');
      } else {
        setError('Invalid verification token');
      }
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (resetPassword !== resetConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (resetPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setSuccess('Password reset successful! Redirecting to sign in...');
    setTimeout(() => {
      setActiveTab('signin');
      setSignInEmail(forgotEmail);
      setForgotStep('email');
    }, 1000);
  };

  const handleTwoFAInput = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    
    const newCode = [...twoFACode];
    newCode[index] = value.slice(-1);
    setTwoFACode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`totp-${index + 1}`) as HTMLInputElement;
      nextInput?.focus();
    }
  };

  const handleDemoLogin = (demoRole: Role) => {
    const emp = employees.find(e => e.role === demoRole);
    if (emp) {
      setSignInEmail(emp.email);
      setSignInPassword('DemoPassword123!');
      setRememberMe(true);
    }
  };

  const handleRevokeSession = (sessionId: string) => {
    revokeSession(sessionId);
    setSuccess('Session revoked successfully');
    setTimeout(() => setSuccess(''), 2000);
  };

  return (
    <div className="min-h-screen bg-background dark:bg-inverse-surface transition-colors">
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
        {/* Left Branding Section - Hidden on Mobile */}
        <div className="hidden md:flex flex-col justify-between p-lg bg-gradient-to-br from-primary to-primary-container text-on-primary">
          <div>
            <div className="flex items-center gap-md mb-xl">
              <div className="w-12 h-12 rounded-lg bg-on-primary/20 flex items-center justify-center">
                <span className="font-display text-headline-lg font-bold">N</span>
              </div>
              <span className="font-display text-headline-lg font-bold">NovaHR</span>
            </div>
          </div>

          <div className="space-y-lg">
            <h1 className="font-display text-display font-bold leading-tight">
              Modern HR Management
            </h1>
            <p className="font-body-lg text-on-primary/90">
              Streamline employee onboarding, leave management, and performance tracking with our comprehensive HR platform.
            </p>
            
            <div className="space-y-md pt-lg">
              <div className="flex gap-md items-start">
                <div className="w-8 h-8 rounded-full bg-on-primary/30 flex items-center justify-center flex-shrink-0 mt-xs">
                  <span className="text-label-sm">✓</span>
                </div>
                <div>
                  <p className="font-label-md">Automated Attendance</p>
                  <p className="font-body-sm text-on-primary/80">Geofencing & real-time tracking</p>
                </div>
              </div>
              <div className="flex gap-md items-start">
                <div className="w-8 h-8 rounded-full bg-on-primary/30 flex items-center justify-center flex-shrink-0 mt-xs">
                  <span className="text-label-sm">✓</span>
                </div>
                <div>
                  <p className="font-label-md">Smart Leave Management</p>
                  <p className="font-body-sm text-on-primary/80">Approval workflows & balance tracking</p>
                </div>
              </div>
              <div className="flex gap-md items-start">
                <div className="w-8 h-8 rounded-full bg-on-primary/30 flex items-center justify-center flex-shrink-0 mt-xs">
                  <span className="text-label-sm">✓</span>
                </div>
                <div>
                  <p className="font-label-md">Employee Analytics</p>
                  <p className="font-body-sm text-on-primary/80">Insights & performance metrics</p>
                </div>
              </div>
            </div>
          </div>

          <p className="font-body-sm text-on-primary/70">© 2025 NovaHR. All rights reserved.</p>
        </div>

        {/* Right Authentication Panel */}
        <div className="flex flex-col justify-center p-margin-mobile md:p-lg overflow-y-auto">
          <div className="w-full max-w-md mx-auto">
            {/* Tabs */}
            <div className="flex gap-md border-b border-outline-variant mb-xl">
              <button
                onClick={() => {
                  setActiveTab('signin');
                  setError('');
                  setSuccess('');
                }}
                className={`px-md py-md font-label-md transition-colors ${
                  activeTab === 'signin'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setActiveTab('signup');
                  setError('');
                  setSuccess('');
                }}
                className={`px-md py-md font-label-md transition-colors ${
                  activeTab === 'signup'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Register Employee
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-md p-md bg-error-container border border-error rounded-md flex gap-md items-start">
                <span className="text-headline-md">!</span>
                <div>
                  <p className="font-label-md text-on-error-container">{error}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-md p-md bg-secondary-container border border-secondary rounded-md flex gap-md items-start">
                <span className="text-headline-md">✓</span>
                <p className="font-label-md text-on-secondary-container">{success}</p>
              </div>
            )}

            {/* Sign In Form */}
            {activeTab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-md">
                <div>
                  <label className="block font-label-md text-on-surface mb-xs">Email</label>
                  <input
                    type="email"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="your.email@company.com"
                    className="w-full px-md py-md border border-outline-variant rounded-md font-body-md focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block font-label-md text-on-surface mb-xs">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-md py-md border border-outline-variant rounded-md font-body-md focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                    >
                      {showPassword ? '👁' : '👁‍🗨'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-outline-variant accent-primary"
                    />
                    <span className="font-body-sm text-on-surface">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('forgot');
                      setError('');
                      setSuccess('');
                    }}
                    className="font-body-sm text-primary hover:text-primary-container transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-md bg-primary text-on-primary rounded-md font-label-md hover:bg-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>

                {/* Demo Quick Login Buttons */}
                <div className="grid grid-cols-2 gap-md pt-md border-t border-outline-variant">
                  <button
                    type="button"
                    onClick={() => handleDemoLogin(Role.ADMIN)}
                    className="py-sm px-sm bg-surface-container text-on-surface rounded-md font-body-sm hover:bg-surface-container-high transition-colors text-center"
                  >
                    Demo: Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoLogin(Role.MANAGER)}
                    className="py-sm px-sm bg-surface-container text-on-surface rounded-md font-body-sm hover:bg-surface-container-high transition-colors text-center"
                  >
                    Demo: Manager
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoLogin(Role.EMPLOYEE)}
                    className="py-sm px-sm bg-surface-container text-on-surface rounded-md font-body-sm hover:bg-surface-container-high transition-colors text-center"
                  >
                    Demo: Employee
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoLogin(Role.HR)}
                    className="py-sm px-sm bg-surface-container text-on-surface rounded-md font-body-sm hover:bg-surface-container-high transition-colors text-center"
                  >
                    Demo: Designer
                  </button>
                </div>
              </form>
            )}

            {/* Sign Up Form */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-md">
                <div>
                  <label className="block font-label-md text-on-surface mb-xs">Employee Code</label>
                  <input
                    type="text"
                    value={empCode}
                    onChange={(e) => setEmpCode(e.target.value)}
                    placeholder="EMP001"
                    className="w-full px-md py-md border border-outline-variant rounded-md font-body-md focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block font-label-md text-on-surface mb-xs">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full px-md py-md border border-outline-variant rounded-md font-body-md focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  >
                    <option value={Role.EMPLOYEE}>Employee</option>
                    <option value={Role.MANAGER}>Manager</option>
                    <option value={Role.ADMIN}>Admin</option>
                    <option value={Role.HR}>HR</option>
                  </select>
                </div>

                <div>
                  <label className="block font-label-md text-on-surface mb-xs">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-md py-md border border-outline-variant rounded-md font-body-md focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block font-label-md text-on-surface mb-xs">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@company.com"
                    className="w-full px-md py-md border border-outline-variant rounded-md font-body-md focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block font-label-md text-on-surface mb-xs">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-md py-md border border-outline-variant rounded-md font-body-md focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    required
                  />

                  {/* Password Strength Meter */}
                  {password && (
                    <div className="mt-xs">
                      <div className="flex items-center gap-xs mb-xs">
                        <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getPasswordStrengthColor()} transition-all`}
                            style={{ width: `${passwordStrength}%` }}
                          />
                        </div>
                        <span className="font-label-sm text-on-surface-variant">
                          {passwordStrength < 25 ? 'Weak' : passwordStrength < 50 ? 'Fair' : passwordStrength < 75 ? 'Good' : 'Strong'}
                        </span>
                      </div>

                      {/* Password Requirements */}
                      <div className="space-y-xs text-body-sm">
                        <div className={`flex gap-xs items-center ${password.length >= 8 ? 'text-secondary' : 'text-on-surface-variant'}`}>
                          <span>{password.length >= 8 ? '✓' : '○'}</span>
                          <span>At least 8 characters</span>
                        </div>
                        <div className={`flex gap-xs items-center ${/[A-Z]/.test(password) ? 'text-secondary' : 'text-on-surface-variant'}`}>
                          <span>{/[A-Z]/.test(password) ? '✓' : '○'}</span>
                          <span>One uppercase letter (A-Z)</span>
                        </div>
                        <div className={`flex gap-xs items-center ${/[0-9]/.test(password) ? 'text-secondary' : 'text-on-surface-variant'}`}>
                          <span>{/[0-9]/.test(password) ? '✓' : '○'}</span>
                          <span>One number (0-9)</span>
                        </div>
                        <div className={`flex gap-xs items-center ${/[!@#$%^&*]/.test(password) ? 'text-secondary' : 'text-on-surface-variant'}`}>
                          <span>{/[!@#$%^&*]/.test(password) ? '✓' : '○'}</span>
                          <span>One special character (!@#$%^&*)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || passwordStrength < 50}
                  className="w-full py-md bg-primary text-on-primary rounded-md font-label-md hover:bg-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Registering...' : 'Register'}
                </button>
              </form>
            )}

            {/* Forgot Password Form */}
            {activeTab === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-md">
                {forgotStep === 'email' && (
                  <div>
                    <label className="block font-label-md text-on-surface mb-xs">Enter your email</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="your.email@company.com"
                      className="w-full px-md py-md border border-outline-variant rounded-md font-body-md focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      required
                    />
                  </div>
                )}

                {forgotStep === 'token' && (
                  <div>
                    <label className="block font-label-md text-on-surface mb-xs">Verification Token</label>
                    <input
                      type="text"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full px-md py-md border border-outline-variant rounded-md font-body-md focus:outline-none focus:ring-2 focus:ring-primary transition-all text-center tracking-widest"
                      required
                    />
                    <p className="font-body-sm text-on-surface-variant mt-xs">Check your email for the 6-digit code</p>
                  </div>
                )}

                {forgotStep === 'reset' && (
                  <div className="space-y-md">
                    <div>
                      <label className="block font-label-md text-on-surface mb-xs">New Password</label>
                      <input
                        type="password"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-md py-md border border-outline-variant rounded-md font-body-md focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-label-md text-on-surface mb-xs">Confirm Password</label>
                      <input
                        type="password"
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-md py-md border border-outline-variant rounded-md font-body-md focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        required
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-md bg-primary text-on-primary rounded-md font-label-md hover:bg-primary-container transition-colors"
                >
                  {forgotStep === 'reset' ? 'Reset Password' : 'Next'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signin');
                    setForgotStep('email');
                    setError('');
                  }}
                  className="w-full py-md bg-surface-container text-on-surface rounded-md font-label-md hover:bg-surface-container-high transition-colors"
                >
                  Back to Sign In
                </button>
              </form>
            )}

            {/* Device Sessions */}
            {(activeTab === 'signin' || activeTab === 'signup') && sessions.length > 0 && (
              <div className="mt-xl pt-xl border-t border-outline-variant">
                <h3 className="font-headline-sm text-on-surface mb-md">Active Sessions</h3>
                <div className="space-y-md">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-md bg-surface-container rounded-md border border-outline-variant flex items-start justify-between"
                    >
                      <div className="flex-1">
                        <p className="font-label-md text-on-surface">{session.device}</p>
                        <p className="font-body-sm text-on-surface-variant">{session.location}</p>
                        <p className="font-body-sm text-secondary">{session.lastActive}</p>
                        {session.isCurrent && (
                          <span className="inline-block mt-xs px-xs py-xs bg-secondary-container text-on-secondary-container font-label-sm rounded">
                            Current
                          </span>
                        )}
                      </div>
                      {!session.isCurrent && (
                        <button
                          onClick={() => handleRevokeSession(session.id)}
                          className="text-error hover:text-error-container font-label-md transition-colors"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Two-Factor Authentication Toggle */}
            {(activeTab === 'signin' || activeTab === 'signup') && (
              <div className="mt-xl pt-xl border-t border-outline-variant flex items-center justify-between">
                <div>
                  <p className="font-label-md text-on-surface">Two-Factor Authentication</p>
                  <p className="font-body-sm text-on-surface-variant">
                    {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <button
                  onClick={() => toggle2FA()}
                  className={`px-md py-xs rounded-full font-label-sm transition-colors ${
                    twoFactorEnabled
                      ? 'bg-secondary text-on-secondary'
                      : 'bg-surface-container text-on-surface'
                  }`}
                >
                  {twoFactorEnabled ? 'On' : 'Off'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
