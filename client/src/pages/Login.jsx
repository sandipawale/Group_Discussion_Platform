import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, MessageSquare, Sparkles, Users, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const features = [
    { icon: Brain, text: 'AI-generated unique topics for every session' },
    { icon: Users, text: 'Auto-matched groups for balanced discussions' },
    { icon: Sparkles, text: 'Real-time behavior analysis & performance scores' },
];

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!email) return setError('Email is required');
        if (!password) return setError('Password is required');
        setLoading(true);
        try {
            const res = await API.post('/auth/login', { email, password });
            login(res.data.token, res.data.user);
            navigate(res.data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex" style={{ background: 'var(--bg-page)' }}>
            {/* Left branding panel */}
            <div
                className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-12"
                style={{
                    background: 'linear-gradient(160deg, #0f1117 0%, #1e1b4b 60%, #312e81 100%)',
                }}
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                        <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white font-bold text-lg tracking-tight">GD Platform</span>
                </div>

                <div className="space-y-10">
                    <div>
                        <h2 className="text-4xl font-extrabold text-white leading-tight">
                            Smarter Group<br />Discussions
                        </h2>
                        <p className="mt-4 text-indigo-200 text-base leading-relaxed">
                            AI-powered platform for collaborative student discussions, real-time analysis, and performance insights.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {features.map(({ icon: Icon, text }, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + i * 0.1 }}
                                className="flex items-center gap-3"
                            >
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                    <Icon className="w-4 h-4 text-indigo-300" />
                                </div>
                                <span className="text-sm text-indigo-100 font-medium">{text}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <p className="text-xs text-indigo-400">© 2025 GD Platform. All rights reserved.</p>
            </div>

            {/* Right form panel */}
            <div className="flex-1 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-2 mb-8">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                            <MessageSquare className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-base" style={{ color: 'var(--text-main)' }}>GD Platform</span>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-main)' }}>
                            Welcome back
                        </h1>
                        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                            Sign in to your account to continue
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="label">Email address</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                <input
                                    type="email"
                                    placeholder="you@college.edu"
                                    className="input-icon"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="input-icon"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        {error && (
                            <div
                                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                                style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid #fecaca' }}
                            >
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3 text-base"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Sign In <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                        Don't have an account?{' '}
                        <Link to="/register" className="font-semibold hover:underline" style={{ color: 'var(--primary)' }}>
                            Create one free
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
