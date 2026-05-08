import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import API from '../api/axios';
import { Calendar, MessageSquare, Award, Clock } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

export default function SessionHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await API.get('/feedback/my-history');
                setHistory(res.data.history || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    return (
        <div className="page-shell">
            <Sidebar />
            <div className="page-content">
                <Navbar />
                <main className="page-main space-y-8">
                    <div>
                        <h2 className="text-xl font-extrabold" style={{ color: 'var(--text-main)' }}>
                            Session History
                        </h2>
                        <p className="text-sm mt-0.5 font-medium" style={{ color: 'var(--text-muted)' }}>
                            Review your past discussions and feedback.
                        </p>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="h-32 rounded-2xl animate-pulse"
                                    style={{ background: 'var(--bg-subtle)' }} />
                            ))}
                        </div>
                    ) : history.length === 0 ? (
                        <div className="py-16 text-center card border-dashed">
                            <Clock className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                            <h3 className="text-base font-semibold" style={{ color: 'var(--text-main)' }}>
                                No session history
                            </h3>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                                Complete your first session to see it here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((item) => {
                                const topic = item.sessionId?.slotId?.topic
                                    || item.sessionId?.topic
                                    || 'Group Discussion';
                                const date = item.sessionId?.slotId?.startTime
                                    || item.sessionId?.startTime;

                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={item._id}
                                        className="card p-6"
                                    >
                                        <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                                            <div>
                                                <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-main)' }}>
                                                    {topic}
                                                </h3>
                                                <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                    {date && (
                                                        <span className="flex items-center gap-1.5">
                                                            <Calendar className="w-4 h-4" />
                                                            {new Date(date).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold"
                                                        style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                                                        <Award className="w-3 h-3" />
                                                        Rating: {item.rating}/5
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {item.comments && (
                                            <div className="mt-4 p-4 rounded-xl border"
                                                style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)' }}>
                                                <div className="flex items-start gap-3">
                                                    <MessageSquare className="w-4 h-4 mt-1 flex-shrink-0"
                                                        style={{ color: 'var(--text-muted)' }} />
                                                    <p className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>
                                                        "{item.comments}"
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
