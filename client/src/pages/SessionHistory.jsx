import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import API from '../api/axios';
import { Calendar, Star, MessageSquare, Award, Clock } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

export default function SessionHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await API.get('/feedback/my-history');
                setHistory(res.data.history);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    return (
        <div className="flex min-h-screen bg-[var(--bg-main)]">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Navbar />
                <main className="page-container w-full space-y-8">
                    <div className="section-header">
                        <h2 className="text-2xl font-bold text-[var(--text-main)]">Session History</h2>
                        <p className="text-sm text-[var(--text-secondary)] mt-1 font-medium">
                            Review your past discussions and feedback.
                        </p>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2].map(i => <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />)}
                        </div>
                    ) : history.length === 0 ? (
                        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-[var(--border-light)]">
                            <Clock className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
                            <h3 className="text-base font-semibold text-[var(--text-main)]">No session history</h3>
                            <p className="text-sm text-[var(--text-secondary)] mt-1">Complete your first session to see it here.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {history.map((item) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={item._id}
                                    className="bg-white border border-[var(--border-light)] p-6 rounded-2xl shadow-sm"
                                >
                                    <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold text-[var(--text-main)] mb-1">
                                                {item.sessionId.slotId.topic}
                                            </h3>
                                            <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(item.sessionId.slotId.startTime).toLocaleDateString()}
                                                </span>
                                                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">
                                                    <Award className="w-3 h-3" />
                                                    Your Rating: {item.rating}/5
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {item.comments && (
                                        <div className="mt-4 p-4 bg-[var(--bg-main)] rounded-xl border border-[var(--border-light)]">
                                            <div className="flex items-start gap-3">
                                                <MessageSquare className="w-4 h-4 text-[var(--text-muted)] mt-1" />
                                                <p className="text-sm text-[var(--text-secondary)] italic">
                                                    "{item.comments}"
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
