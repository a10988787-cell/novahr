'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp, Role } from '@/context/AppContext';

export default function SignupPage() {
  const router = useRouter();
  const { currentUser, signup } = useApp();
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: Role.EMPLOYEE,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    hasLength: false,
    hasUpper: false,
    hasNumber: false,
    hasSpecial: false,
  });

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  // Calculate password strength
  useEffect(() => {
    const password = formData.password;
    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    let score = 0;
    if (hasLength) score += 25;
    if (hasUpper) score += 25;
    if (hasNumber) score += 25;
    if (hasSpecial) score += 25;

    setPasswordStrength({
      score,
      hasLength,
      hasUpper,
      hasNumber,
      hasSpecial,
    });
  }, [formData.password]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.employeeId.trim()) newErrors.employeeId = 'Employee ID is required';
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.password) newErrors.password = 'Password is required';
    if (passwordStrength.score < 100) {
      newErrors.password = 'Password does not meet security requirements';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await signup(
        formData.employeeId,
        formData.name,
        formData.email,
        formData.role
      );

      if (res.success) {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setErrors({ submit: res.error || 'Registration failed' });
      }
    } catch (err) {
      setErrors({ submit: 'An error occurred during registration' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background dark:bg-[#111520]">
      {/* Left Branding Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary-container flex-col justify-between p-xl text-on-primary">
        <div>
          <div className="flex items-center gap-md">
            <div className="w-12 h-12 rounded-lg bg-on-primary/10 flex items-center justify-center border border-on-primary/20">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="font-headline-md text-headline-md font-bold">NovaHR</h1>
          </div>
        </div>
        <div>
          <h2 className="font-display text-display mb-md leading-tight">Join Enterprise HR Excellence</h2>
          <p className="font-body-md text-body-md text-on-primary/80 mb-lg">
            Register your employee profile and unlock access to intelligent HR management tools designed for modern workplaces.
          </p>
          <ul className="space-y-md font-body-sm text-body-sm text-on-primary/70">
            <li className="flex items-center gap-xs">
              <span className="w-5 h-5 rounded-full bg-on-primary/20 flex items-center justify-center text-xs">✓</span>
              <span>Instant profile verification</span>
            </li>
            <li className="flex items-center gap-xs">
              <span className="w-5 h-5 rounded-full bg-on-primary/20 flex items-center justify-center text-xs">✓</span>
              <span>Secure document storage</span>
            </li>
            <li className="flex items-center gap-xs">
              <span className="w-5 h-5 rounded-full bg-on-primary/20 flex items-center justify-center text-xs">✓</span>
              <span>Smart leave management</span>
            </li>
            <li className="flex items-center gap-xs">
              <span className="w-5 h-5 rounded-full bg-on-primary/20 flex items-center justify-center text-xs">✓</span>
              <span>Advanced analytics dashboard</span>
            </li>
          </ul>
        </div>
        <div className="text-label-sm text-on-primary/60">© 2026 NovaHR. All rights reserved.</div>
      </div>

      {/* Right Registration Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-md lg:p-xl bg-surface-container-low dark:bg-[#1E2433]">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden mb-2xl">
            <div className="flex items-center gap-md mb-2xl">
              <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center">
                <svg className="w-6 h-6 text-on-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="font-headline-md text-headline-md font-bold text-primary">NovaHR</h1>
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-2xl">
            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-md">Create Your Account</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Join your organization on NovaHR and start managing your work profile
            </p>
          </div>

          {/* Error Messages */}
          {Object.values(errors).length > 0 && (
            <div className="mb-lg p-md bg-error-container border border-error rounded-lg space-y-xs">
              {Object.entries(errors).map(([key, message]) => (
                <p key={key} className="font-label-md text-label-md text-on-error-container">
                  {message}
                </p>
              ))}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-lg p-md bg-secondary-container border border-secondary rounded-lg">
              <p className="font-label-md text-label-md text-on-secondary-container">{success}</p>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-lg">
            {/* Employee ID and Role Row */}
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label htmlFor="employeeId" className="block font-label-md text-label-md text-on-surface mb-xs uppercase">
                  Employee Code
                </label>
                <input
                  id="employeeId"
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder="EMP001"
                  className="w-full px-md py-md border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-surface-container-lowest dark:bg-[#111520] dark:border-[#2D3748] dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="role" className="block font-label-md text-label-md text-on-surface mb-xs uppercase">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-md py-md border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-surface-container-lowest dark:bg-[#111520] dark:border-[#2D3748] dark:text-white"
                >
                  <option value={Role.EMPLOYEE}>Employee</option>
                  <option value={Role.MANAGER}>Manager</option>
                  <option value={Role.HR}>HR Officer</option>
                </select>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block font-label-md text-label-md text-on-surface mb-xs uppercase">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Jane Doe"
                className="w-full px-md py-md border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-surface-container-lowest dark:bg-[#111520] dark:border-[#2D3748] dark:text-white"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block font-label-md text-label-md text-on-surface mb-xs uppercase">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="jane@company.com"
                className="w-full px-md py-md border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-surface-container-lowest dark:bg-[#111520] dark:border-[#2D3748] dark:text-white"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block font-label-md text-label-md text-on-surface mb-xs uppercase">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-md py-md border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-surface-container-lowest dark:bg-[#111520] dark:border-[#2D3748] dark:text-white"
              />

              {/* Password Strength Meter */}
              <div className="mt-md space-y-xs">
                <div className="flex justify-between items-center text-label-sm">
                  <span className="text-on-surface-variant">Strength:</span>
                  <span className={`font-label-md ${
                    passwordStrength.score === 100 ? 'text-secondary' :
                    passwordStrength.score >= 75 ? 'text-[#B45309]' : 'text-error'
                  }`}>
                    {passwordStrength.score}%
                  </span>
                </div>
                <div className="h-xs w-full bg-surface-container rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      passwordStrength.score === 100 ? 'bg-secondary' :
                      passwordStrength.score >= 75 ? 'bg-[#B45309]' : 'bg-error'
                    }`}
                    style={{ width: `${passwordStrength.score}%` }}
                  ></div>
                </div>

                {/* Requirements */}
                <div className="grid grid-cols-2 gap-xs pt-xs">
                  <div className="flex items-center gap-xs text-label-sm">
                    <span className={passwordStrength.hasLength ? 'text-secondary' : 'text-error'}>
                      {passwordStrength.hasLength ? '✓' : '✗'}
                    </span>
                    <span className="text-on-surface-variant">8+ chars</span>
                  </div>
                  <div className="flex items-center gap-xs text-label-sm">
                    <span className={passwordStrength.hasUpper ? 'text-secondary' : 'text-error'}>
                      {passwordStrength.hasUpper ? '✓' : '✗'}
                    </span>
                    <span className="text-on-surface-variant">Uppercase</span>
                  </div>
                  <div className="flex items-center gap-xs text-label-sm">
                    <span className={passwordStrength.hasNumber ? 'text-secondary' : 'text-error'}>
                      {passwordStrength.hasNumber ? '✓' : '✗'}
                    </span>
                    <span className="text-on-surface-variant">Number</span>
                  </div>
                  <div className="flex items-center gap-xs text-label-sm">
                    <span className={passwordStrength.hasSpecial ? 'text-secondary' : 'text-error'}>
                      {passwordStrength.hasSpecial ? '✓' : '✗'}
                    </span>
                    <span className="text-on-surface-variant">Special</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block font-label-md text-label-md text-on-surface mb-xs uppercase">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-md py-md border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-surface-container-lowest dark:bg-[#111520] dark:border-[#2D3748] dark:text-white"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || passwordStrength.score < 100}
              className="w-full py-md px-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-lg"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-lg pt-lg border-t border-outline-variant">
            <p className="font-body-sm text-body-sm text-on-surface-variant text-center">
              Already have an account?{' '}
              <Link href="/login" className="font-label-md text-label-md text-primary hover:text-primary-container transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
