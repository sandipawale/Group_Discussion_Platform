import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, GraduationCap, BookOpen, Calendar, Tags, ArrowRight, X, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const SUGGESTED_TOPICS = [
    'Gen AI', 'Machine Learning', 'Web Development', 'Data Science',
    'Blockchain', 'Cybersecurity', 'Cloud Computing', 'IoT',
    'AR/VR', 'Quantum Computing', 'Ethics in AI', 'Startups',
];

export default function ProfileSetup() {
    const [form, setForm] = useState({ name: '', collegeName: '', branch: '', year: '' });
    const [topics, setTopics] = useState([]);
    const [topicInput, setTopicInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { updateUser } = useAuth();

    const handleInputChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const addTopic = (topic) => {
        const t = topic.trim();
        if (t && !topics.includes(t) && topics.length < 10) {
            setTopics([...topics, t]);
        }
        setTopicInput('');
    };

    const removeTopic = (topic) => setTopics(topics.filter((t) => t !== topic));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.collegeName || !form.branch || !form.year) {
            return setError('Please fill in all required fields');
        }
        setLoading(true);
        setError('');

        try {
            const res = await API.post('/auth/setup-profile', { ...form, topicsOfInterest: topics });
            updateUser(res.data.user);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Setup failed');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "input-modern pl-12";

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-main)] relative overflow-hidden font-sans">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50/50 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-50/50 rounded-full blur-[100px]" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl relative z-10"
            >
                <div className="text-center mb-10">
                    <h2 className="text-xs font-bold text-[var(--primary)] uppercase tracking-[0.3em] mb-4">Step 02: Personalization</h2>
                    <h1 className="text-4xl font-bold text-[var(--text-main)] tracking-tight italic uppercase">
                        Complete your <span className="text-[var(--primary)]">Profile</span>
                    </h1>
                    <p className="text-[var(--text-secondary)] font-medium mt-3 text-sm tracking-wide">Help us tailor your discussion experience.</p>
                </div>

                <div className="card-modern p-10 lg:p-14 shadow-2xl shadow-slate-200/50 border border-white">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Name */}
                            <div className="space-y-3">
                                <label className="label-modern ml-1 uppercase tracking-widest text-[10px]">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                                    <input name="name" className={inputClass} placeholder="Enter your name" value={form.name} onChange={handleInputChange} />
                                </div>
                            </div>

                            {/* College */}
                            <div className="space-y-3">
                                <label className="label-modern ml-1 uppercase tracking-widest text-[10px]">College / Institution</label>
                                <div className="relative">
                                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                                    <input name="collegeName" className={inputClass} placeholder="University Name" value={form.collegeName} onChange={handleInputChange} />
                                </div>
                            </div>

                            {/* Branch */}
                            <div className="space-y-3">
                                <label className="label-modern ml-1 uppercase tracking-widest text-[10px]">Branch / Major</label>
                                <div className="relative">
                                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                                    <input name="branch" className={inputClass} placeholder="e.g. Computer Science" value={form.branch} onChange={handleInputChange} />
                                </div>
                            </div>

                            {/* Year */}
                            <div className="space-y-3">
                                <label className="label-modern ml-1 uppercase tracking-widest text-[10px]">Academic Year</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] pointer-events-none" />
                                    <select name="year" className={`${inputClass} appearance-none cursor-pointer`} value={form.year} onChange={handleInputChange}>
                                        <option value="">Select Year</option>
                                        <option value="1st Year">1st Year</option>
                                        <option value="2nd Year">2nd Year</option>
                                        <option value="3rd Year">3rd Year</option>
                                        <option value="4th Year">4th Year</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Topics of Interest */}
                        <div className="space-y-4">
                            <label className="label-modern ml-1 uppercase tracking-widest text-[10px] flex items-center gap-2">
                                <Tags className="w-4 h-4" />
                                Topics of Interest
                            </label>

                            <div className="flex flex-wrap gap-2 min-h-[44px]">
                                {topics.map((t) => (
                                    <span key={t} className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white text-[11px] font-bold rounded-xl shadow-lg shadow-indigo-100 uppercase tracking-wider">
                                        {t}
                                        <X className="w-3 h-3 cursor-pointer hover:scale-125 transition-transform" onClick={() => removeTopic(t)} />
                                    </span>
                                ))}
                            </div>

                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                                <input
                                    className={`${inputClass} placeholder:[var(--text-muted)]`}
                                    placeholder="Add specialty topics (max 10)..."
                                    value={topicInput}
                                    onChange={(e) => setTopicInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic(topicInput))}
                                />
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-bold text-[var(--text-muted)]">
                                Suggested:
                                {SUGGESTED_TOPICS.filter((t) => !topics.includes(t)).slice(0, 6).map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        className="text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-indigo-50 px-3 py-1 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                                        onClick={() => addTopic(t)}
                                    >
                                        + {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-bold rounded-2xl text-center">
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            className="w-full h-16 bg-[var(--text-main)] hover:bg-black text-white rounded-3xl font-bold uppercase tracking-widest text-xs transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-[0.98] group"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Complete Setup & Enter Platform
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
