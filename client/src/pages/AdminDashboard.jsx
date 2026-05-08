import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Users, Video, ShieldAlert, Activity, TrendingUp, BarChart3, AlertTriangle, Bell } from 'lucide-react';
import { io } from 'socket.io-client';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import SlotManager from '../components/admin/SlotManager';

function StatCard({ label, value, icon: Icon, color, bg, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.3 }}
            className="card p-6"
        >
            <div className="flex items-start justify-between mb-4">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: bg }}
                >
                    <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <TrendingUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-2xl font-extrabold mb-0.5" style={{ color: 'var(--text-main)' }}>{value}</p>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</p>
        </motion.div>
    );
}

export default function AdminDashboard() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [liveAlerts, setLiveAlerts] = useState([]);
    const fetchRef = useRef(null);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await API.get('/admin/analytics');
            setAnalytics(res.data);
        } catch (err) {
            console.error('Fetch Analytics Error:', err);
        } finally {
            setLoading(false);
        }
    };
    fetchRef.current = fetchAnalytics;

    useEffect(() => { fetchAnalytics(); }, []);

    // Real-time socket for security events
    useEffect(() => {
        const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
        const socket = io(serverUrl, { withCredentials: true, transports: ['websocket', 'polling'] });
        socket.emit('join-admin');

        socket.on('threat-alert', (data) => {
            setLiveAlerts(prev => [{ ...data, type: 'threat', id: Date.now() }, ...prev.slice(0, 4)]);
            // Refresh analytics so flagged users table updates
            setTimeout(() => fetchRef.current?.(), 1500);
        });

        socket.on('risk-words-update', (data) => {
            // Refresh analytics so risk words chart updates
            setTimeout(() => fetchRef.current?.(), 1500);
        });

        return () => socket.disconnect();
    }, []);

    const stats = [
        { label: 'Active Students', value: analytics?.stats?.totalActiveUsers ?? 0, icon: Users, color: '#6366f1', bg: '#eef2ff', delay: 0 },
        { label: 'Live Sessions', value: analytics?.stats?.activeRooms ?? 0, icon: Activity, color: '#10b981', bg: '#ecfdf5', delay: 0.05 },
        { label: "Today's Rooms", value: analytics?.stats?.totalRoomsToday ?? 0, icon: Video, color: '#8b5cf6', bg: '#f5f3ff', delay: 0.1 },
        { label: 'Flagged Users', value: analytics?.flaggedUsers?.length ?? 0, icon: ShieldAlert, color: '#ef4444', bg: '#fef2f2', delay: 0.15 },
    ];

    const maxCount = Math.max(...(analytics?.flaggedWords?.map(w => w.count) ?? [1]), 1);

    return (
        <div className="page-shell">
            <Sidebar />
            <div className="page-content">
                <Navbar />
                <main className="page-main space-y-8">

                    {/* Live threat alerts (real-time toast strip) */}
                    {liveAlerts.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-2"
                        >
                            {liveAlerts.map(alert => (
                                <div key={alert.id} className="flex items-start gap-3 px-4 py-3 rounded-xl"
                                    style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                                    <Bell className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#dc2626' }} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold" style={{ color: '#991b1b' }}>
                                            Threat Alert — {alert.topic || 'Session'}
                                        </p>
                                        <p className="text-xs mt-0.5" style={{ color: '#b91c1c' }}>{alert.reason}</p>
                                    </div>
                                    <button onClick={() => setLiveAlerts(p => p.filter(a => a.id !== alert.id))}
                                        className="text-xs font-bold px-2 py-1 rounded"
                                        style={{ color: '#dc2626', background: '#fee2e2' }}>✕</button>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {loading && !analytics ? (
                        <div className="flex items-center justify-center py-32">
                            <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                {stats.map((s) => <StatCard key={s.label} {...s} />)}
                            </div>

                            {/* Slot Manager */}
                            <SlotManager />

                            {/* Lower section */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                {/* Security Alerts */}
                                <div className="lg:col-span-2 card overflow-hidden">
                                    <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                            style={{ background: 'var(--danger-light)' }}>
                                            <ShieldAlert className="w-4 h-4" style={{ color: 'var(--danger)' }} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>Security Alerts</h3>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Flagged students requiring review</p>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                                                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Student</th>
                                                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Reason</th>
                                                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Score</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {!analytics?.flaggedUsers?.length ? (
                                                    <tr>
                                                        <td colSpan="3" className="px-6 py-10 text-center text-sm font-medium"
                                                            style={{ color: 'var(--text-muted)' }}>
                                                            No active security threats detected.
                                                        </td>
                                                    </tr>
                                                ) : analytics.flaggedUsers.map((user, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}
                                                        className="transition-colors"
                                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                                                        <td className="px-6 py-4">
                                                            <p className="font-semibold text-sm" style={{ color: 'var(--text-main)' }}>{user.name || 'Unknown'}</p>
                                                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                                                                style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid #fecaca' }}>
                                                                {user.flagReason || 'Policy Violation'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                                                                    <div className="h-full rounded-full"
                                                                        style={{ width: `${user.reputationScore}%`, background: 'var(--danger)' }} />
                                                                </div>
                                                                <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                                                                    {user.reputationScore}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Risk Words */}
                                <div className="card p-6 space-y-5">
                                    <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                            style={{ background: 'var(--primary-light)' }}>
                                            <BarChart3 className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>Risk Words</h3>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Top flagged terms</p>
                                        </div>
                                    </div>

                                    {analytics?.flaggedWords?.length ? (
                                        <div className="space-y-3">
                                            {analytics.flaggedWords.map((item, i) => (
                                                <div key={i} className="space-y-1.5">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-semibold italic"
                                                            style={{ color: 'var(--text-main)' }}>"{item.word}"</span>
                                                        <span className="text-[11px] font-bold px-2 py-0.5 rounded"
                                                            style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                                                            ×{item.count}
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 rounded-full overflow-hidden"
                                                        style={{ background: 'var(--border)' }}>
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${(item.count / maxCount) * 100}%` }}
                                                            transition={{ delay: i * 0.05 }}
                                                            className="h-full rounded-full"
                                                            style={{ background: 'var(--primary)' }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center">
                                            <AlertTriangle className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                                            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No risk data yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
