import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, Users, X, CheckCircle2, Video, AlertCircle, Loader2 } from 'lucide-react';
import API from '../api/axios';

export default function RegistrationTabs({ registrations = [], onRefresh }) {
    const [tab, setTab] = useState('active');
    const [cancelling, setCancelling] = useState(null);
    const navigate = useNavigate();
    const now = new Date();

    const completed = registrations.filter(r => r.userStatus === 'COMPLETED');
    const confirmed = registrations.filter(r => r.status === 'confirmed' && r.userStatus !== 'COMPLETED');
    const pending = registrations.filter(r => r.status === 'pending' && r.userStatus !== 'COMPLETED');

    const isLive = (startTime) => now >= new Date(new Date(startTime).getTime() - 5 * 60 * 1000);

    const handleCancel = async (slotId) => {
        if (!confirm('Cancel this registration?')) return;
        setCancelling(slotId);
        try {
            await API.delete(`/slots/${slotId}/register`);
            onRefresh?.();
        } catch {
            alert('Cancel failed');
        } finally {
            setCancelling(null);
        }
    };

    const tabs = [
        { id: 'active', label: 'Active', count: confirmed.length },
        { id: 'pending', label: 'Waitlist', count: pending.length },
        { id: 'history', label: 'History', count: completed.length },
    ];

    return (
        <div className="space-y-5">
            {/* Tab bar */}
            <div
                className="inline-flex p-1 rounded-xl gap-1"
                style={{ background: 'white', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}
            >
                {tabs.map(({ id, label, count }) => (
                    <button
                        key={id}
                        onClick={() => setTab(id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150"
                        style={tab === id ? {
                            background: 'var(--primary)',
                            color: 'white',
                            boxShadow: 'var(--shadow-primary)',
                        } : {
                            color: 'var(--text-secondary)',
                        }}
                    >
                        {label}
                        {count > 0 && (
                            <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                                style={tab === id ? {
                                    background: 'rgba(255,255,255,0.25)',
                                    color: 'white',
                                } : {
                                    background: 'var(--border)',
                                    color: 'var(--text-muted)',
                                }}
                            >
                                {count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* ACTIVE ROOMS */}
                {tab === 'active' && (
                    <motion.div
                        key="active"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        {confirmed.length === 0 ? (
                            <EmptyState icon={Video} message="No active sessions" sub="Rooms appear here once you're matched and the session starts." />
                        ) : confirmed.map((item) => {
                            const live = isLive(item.slot.startTime);
                            const roomId = item.room?._id;
                            return (
                                <div key={roomId || item.slot._id} className="card p-5 space-y-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className="font-bold text-base leading-snug flex-1" style={{ color: 'var(--text-main)' }}>
                                            {item.room?.topic || item.slot.topic || 'Group Discussion'}
                                        </h4>
                                        <span
                                            className="text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                                            style={live ? {
                                                background: '#ecfdf5',
                                                color: '#047857',
                                                border: '1px solid #a7f3d0',
                                            } : {
                                                background: 'var(--primary-light)',
                                                color: 'var(--primary)',
                                                border: '1px solid #c7d2fe',
                                            }}
                                        >
                                            {live ? 'Join Now' : 'Confirmed'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(item.slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5" />
                                            Room assigned
                                        </span>
                                    </div>

                                    <button
                                        disabled={!live || !roomId}
                                        onClick={() => live && roomId && navigate(`/room/${roomId}`)}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150"
                                        style={live && roomId ? {
                                            background: 'var(--primary)',
                                            color: 'white',
                                            boxShadow: 'var(--shadow-primary)',
                                            cursor: 'pointer',
                                        } : {
                                            background: 'var(--bg-subtle)',
                                            color: 'var(--text-muted)',
                                            border: '1px solid var(--border)',
                                        }}
                                    >
                                        <Video className="w-4 h-4" />
                                        {live && roomId ? 'Join Video Room' : 'Opens Soon'}
                                    </button>
                                </div>
                            );
                        })}
                    </motion.div>
                )}

                {/* WAITLIST */}
                {tab === 'pending' && (
                    <motion.div
                        key="pending"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        {pending.length === 0 ? (
                            <EmptyState icon={Clock} message="No pending registrations" sub="Sessions waiting to be matched appear here." />
                        ) : pending.map((item) => {
                            const live = isLive(item.slot.startTime);
                            const fillPct = Math.min((item.slot.waitingQueue.length / item.slot.minParticipants) * 100, 100);
                            const isCancelling = cancelling === item.slot._id;
                            return (
                                <div key={item.slot._id} className="card p-5 space-y-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-base" style={{ color: 'var(--text-main)' }}>
                                                {item.slot.topic || 'AI Topic (generated at start)'}
                                            </h4>
                                            <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--text-muted)' }}>
                                                {new Date(item.slot.startTime).toLocaleDateString()} · {new Date(item.slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <span
                                            className="text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                                            style={live ? {
                                                background: 'var(--warning-light)',
                                                color: '#92400e',
                                                border: '1px solid #fde68a',
                                            } : {
                                                background: 'var(--bg-subtle)',
                                                color: 'var(--text-muted)',
                                                border: '1px solid var(--border)',
                                            }}
                                        >
                                            {live ? 'Matching…' : 'Waitlist'}
                                        </span>
                                    </div>

                                    {/* Progress */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                                            <span>{item.slot.waitingQueue.length} registered</span>
                                            <span>Min {item.slot.minParticipants} needed</span>
                                        </div>
                                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${fillPct}%` }}
                                                className="h-full rounded-full"
                                                style={{ background: fillPct >= 100 ? 'var(--success)' : 'var(--primary)' }}
                                            />
                                        </div>
                                        {item.needMore > 0 && (
                                            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                                {item.needMore} more student(s) needed
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handleCancel(item.slot._id)}
                                        disabled={isCancelling}
                                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all"
                                        style={{ color: 'var(--danger)', border: '1px solid #fecaca', background: 'transparent' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-light)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        {isCancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                                        Cancel Registration
                                    </button>
                                </div>
                            );
                        })}
                    </motion.div>
                )}

                {/* HISTORY */}
                {tab === 'history' && (
                    <motion.div
                        key="history"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        {completed.length === 0 ? (
                            <EmptyState icon={CheckCircle2} message="No completed sessions" sub="Your finished GD sessions will appear here." />
                        ) : completed.map((item) => (
                            <div
                                key={item.room?._id || item.slot._id}
                                className="card p-5 space-y-3 opacity-80"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <h4 className="font-bold text-base" style={{ color: 'var(--text-secondary)' }}>
                                        {item.room?.topic || item.slot.topic || 'Group Discussion'}
                                    </h4>
                                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                                        style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                                        Done
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date(item.slot.startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                        Feedback submitted
                                    </span>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function EmptyState({ icon: Icon, message, sub }) {
    return (
        <div className="col-span-2 py-14 text-center card">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: 'var(--bg-subtle)' }}>
                <Icon className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-main)' }}>{message}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>
        </div>
    );
}
