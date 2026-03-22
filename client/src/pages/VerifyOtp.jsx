import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function VerifyOtp() {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const inputRefs = useRef([]);
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const email = location.state?.email;

    useEffect(() => {
        if (!email) navigate('/login', { replace: true });
    }, [email, navigate]);

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setOtp(pasted.split(''));
            inputRefs.current[5]?.focus();
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length !== 6) return setError('Enter the complete 6-digit code');

        setLoading(true);
        setError('');

        try {
            const res = await API.post('/auth/verify-otp', { email, otp: code });
            const { token, isNewUser, user } = res.data;
            login(token, user);

            if (isNewUser) {
                navigate('/profile-setup', { replace: true });
            } else {
                navigate('/dashboard', { replace: true });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed');
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-main)] relative overflow-hidden font-sans">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50/50 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-50/50 rounded-full blur-[100px]" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[480px] relative z-10"
            >
                {/* Header */}
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="w-20 h-20 bg-[var(--primary)] rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-100 mx-auto mb-8"
                    >
                        <ShieldCheck className="w-10 h-10 text-white" />
                    </motion.div>
                    <h1 className="text-4xl font-bold text-[var(--text-main)] tracking-tight uppercase italic">
                        Secure<span className="text-[var(--primary)]">Access</span>
                    </h1>
                    <div className="mt-6 inline-flex items-center gap-2 text-[var(--text-secondary)] font-bold bg-white px-5 py-2.5 rounded-2xl border border-[var(--border-light)] shadow-sm text-xs">
                        <Mail className="w-4 h-4 text-[var(--primary)]" />
                        {email}
                    </div>
                </div>

                <div className="card-modern p-10 lg:p-12 rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-white">
                    <p className="text-center text-[var(--text-secondary)] font-bold text-sm mb-10 tracking-wide uppercase">
                        Enter the 6-digit code sent to your mail
                    </p>

                    <form onSubmit={handleVerify}>
                        <div className="flex gap-3 sm:gap-4 justify-center mb-10">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength="1"
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={handlePaste}
                                    className="w-11 h-14 sm:w-14 sm:h-20 bg-[var(--bg-main)] border border-[var(--border-light)] rounded-2xl text-center text-2xl font-black text-[var(--text-main)] outline-none focus:bg-white focus:border-[var(--primary)] focus:ring-4 focus:ring-indigo-50 transition-all font-mono shadow-sm"
                                    autoFocus={index === 0}
                                />
                            ))}
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-bold text-center mb-8 leading-relaxed"
                            >
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || otp.some(d => !d)}
                            className="w-full h-16 bg-[var(--text-main)] hover:bg-black text-white rounded-[1.5rem] font-bold uppercase tracking-widest text-xs transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50 group active:scale-[0.98]"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Verify & Continue
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-10 border-t border-[var(--border-light)] flex flex-col items-center gap-6">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                        >
                            Wait, different email?
                        </button>

                        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-main)] rounded-xl">
                            <div className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-pulse" />
                            <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Awaiting system check</span>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-[var(--text-muted)] text-[9px] font-bold uppercase tracking-[0.3em]">
                        Endpoint Security &copy; 2026 Ref GCD-293
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
