import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Video, ShieldAlert, BarChart3, Activity, Search } from 'lucide-react';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import SlotManager from '../components/admin/SlotManager';

export default function AdminDashboard() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await API.get('/admin/analytics');
            setAnalytics(res.data);
        } catch (err) {
            console.error('Fetch Analytics Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const statsCards = [
        { label: 'Active Students', value: analytics?.stats?.totalActiveUsers || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Live Sessions', value: analytics?.stats?.activeRooms || 0, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: "Today's Rooms", value: analytics?.stats?.totalRoomsToday || 0, icon: Video, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Flagged Users', value: analytics?.flaggedUsers?.length || 0, icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50' },
    ];

    return (
        <div className="flex h-screen bg-[var(--bg-main)] overflow-hidden font-sans">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Navbar />

                <main className="p-8 lg:p-10 overflow-y-auto">
                    {loading && !analytics ? (
                        <div className="flex-1 flex items-center justify-center p-20">
                            <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Header */}
                            <div className="flex items-end justify-between section-header">
                                <div>
                                    <h2 className="text-2xl font-bold text-[var(--text-main)]">
                                        Admin Dashboard
                                    </h2>
                                    <p className="text-sm text-[var(--text-secondary)] mt-1 font-medium">Platform overview and management.</p>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {statsCards.map((card, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="card-modern p-6 bg-white"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                                                <card.icon className="w-5 h-5" />
                                            </div>
                                        </div>
                                        <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{card.label}</h3>
                                        <p className="text-2xl font-bold text-[var(--text-main)] mt-1">{card.value}</p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Slot Management Section */}
                            <section>
                                <SlotManager />
                            </section>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Flagged Students */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="flex items-center gap-2">
                                        <ShieldAlert className="w-5 h-5 text-rose-500" />
                                        <h3 className="text-lg font-bold text-[var(--text-main)]">Security Alerts</h3>
                                    </div>

                                    <div className="card-modern overflow-hidden bg-white">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-[var(--bg-main)] border-b border-[var(--border-light)]">
                                                    <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Student</th>
                                                    <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Reason</th>
                                                    <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Reputation</th>
                                                    <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--border-light)]">
                                                {analytics?.flaggedUsers?.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="4" className="px-6 py-8 text-center text-[var(--text-muted)] text-sm font-medium">No active security threats detected.</td>
                                                    </tr>
                                                ) : (
                                                    analytics?.flaggedUsers?.map((user, idx) => (
                                                        <tr key={idx} className="hover:bg-[var(--bg-main)]/50 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="font-bold text-[var(--text-main)]">{user.name || 'Anonymous'}</div>
                                                                <div className="text-xs text-[var(--text-muted)] font-medium">{user.email}</div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">
                                                                    {user.flagReason || 'Policy Violation'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-16 h-1.5 bg-[var(--bg-main)] rounded-full overflow-hidden">
                                                                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${user.reputationScore}%` }} />
                                                                    </div>
                                                                    <span className="text-xs font-bold text-[var(--text-main)]">{user.reputationScore}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <button className="text-xs font-bold text-[var(--primary)] hover:underline">Review</button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Top Flagged Words */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5 text-[var(--primary)]" />
                                        <h3 className="text-lg font-bold text-[var(--text-main)]">Risk Words</h3>
                                    </div>

                                    <div className="card-modern p-6 bg-white space-y-4">
                                        {analytics?.flaggedWords?.map((item, idx) => (
                                            <div key={idx} className="space-y-1">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-sm font-bold text-[var(--text-main)] italic">"{item.word}"</span>
                                                    <span className="text-xs font-bold text-[var(--primary)] bg-indigo-50 px-1.5 py-0.5 rounded">{item.count}</span>
                                                </div>
                                                <div className="h-1.5 bg-[var(--bg-main)] rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(item.count / 15) * 100}%` }}
                                                        className="h-full bg-[var(--primary)] text-opacity-80"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        {!analytics?.flaggedWords?.length && (
                                            <p className="text-sm text-[var(--text-muted)] text-center py-4 font-medium">No data available</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
