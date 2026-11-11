import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { ROUTES } from '../../utils/constants.js';

/**
 * Public Member Registration Page.
 * Onboards new member and redirects directly to `/dashboard`.
 *
 * @returns {JSX.Element}
 */
export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const user = await register(form);
      setSuccessMsg(`Welcome to GymPilot, ${user.firstName}! Opening your dashboard...`);
      setTimeout(() => {
        navigate(ROUTES.DASHBOARD, { replace: true });
      }, 500);
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please check the entered details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="gym-card max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-dark text-emerald-accent shadow-md mb-1">
            <Dumbbell className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold font-display text-text-primary">Create an Account</h1>
          <p className="text-xs text-text-secondary">
            Join GymPilot today to manage passes and workouts.
          </p>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-status-danger/10 border border-status-danger/30 text-status-danger text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-status-success/10 border border-status-success/30 text-status-success text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">First Name</label>
              <input
                type="text"
                name="firstName"
                required
                value={form.firstName}
                onChange={handleChange}
                placeholder="Rahul"
                className="w-full rounded-lg border-workspace-border bg-workspace text-sm text-text-primary focus:border-emerald-accent focus:ring-emerald-accent/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                required
                value={form.lastName}
                onChange={handleChange}
                placeholder="Sharma"
                className="w-full rounded-lg border-workspace-border bg-workspace text-sm text-text-primary focus:border-emerald-accent focus:ring-emerald-accent/20"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="rahul@example.com"
              className="w-full rounded-lg border-workspace-border bg-workspace text-sm text-text-primary focus:border-emerald-accent focus:ring-emerald-accent/20"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              value={form.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
              className="w-full rounded-lg border-workspace-border bg-workspace text-sm text-text-primary focus:border-emerald-accent focus:ring-emerald-accent/20"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">
              Phone Number <span className="text-text-muted font-normal">(Optional)</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="9876543210"
              className="w-full rounded-lg border-workspace-border bg-workspace text-sm text-text-primary focus:border-emerald-accent focus:ring-emerald-accent/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !form.email || !form.password || !form.firstName}
            className="btn-primary w-full py-2.5 text-sm mt-2"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-xs text-text-secondary pt-2 border-t border-workspace-border">
          Already registered?{' '}
          <Link to={ROUTES.LOGIN} className="text-emerald-dark font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
