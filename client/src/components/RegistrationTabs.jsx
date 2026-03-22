import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, Users, X, CheckCircle2, Video, AlertCircle } from 'lucide-react';
import API from '../api/axios';

export default function RegistrationTabs({ registrations = [], onRefresh }) {
    const [tab, setTab] = useState('confirmed');
    const navigate = useNavigate();
    const now = new Date();

    const completed = registrations.filter(r => r.userStatus === 'COMPLETED');
    const confirmed = registrations.filter(r => r.status === 'confirmed' && r.userStatus !== 'COMPLETED');
    const pending = registrations.filter(r => r.status === 'pending' && r.userStatus !== 'COMPLETED');

    const handleCancel = async (slotId) => {
        if (!confirm('Are you sure you want to cancel this registration?')) return;
        try {
            await API.delete(`/slots/${slotId}/register`);
            onRefresh && onRefresh();
        } catch (err) {
            alert('Cancel failed');
        }
    };

    const isLive = (startTime) => now >= new Date(new Date(startTime).getTime() - 5 * 60 * 1000); // 5 min window

    const tabs = [
        { id: 'confirmed', label: 'Active', count: confirmed.length, icon: Video },
        { id: 'pending', label: 'Waitlist', count: pending.length, icon: Clock },
        { id: 'completed', label: 'History', count: completed.length, icon: CheckCircle2 },
    ];

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex gap-2 p-1 bg-white border border-[var(--border-light)] rounded-xl w-fit">
                {tabs.map(({ id, label, count, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setTab(id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === id
                            ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-main)]'
                            }`}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                        {count > 0 && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${tab === id ? 'bg-white text-[var(--primary)]' : 'bg-[var(--bg-main)] text-[var(--text-secondary)]'
                                }`}>
                                {count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {tab === 'confirmed' && (
                    <motion.div
                        key="confirmed"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        {confirmed.length === 0 ? (
                            <div className="col-span-2 py-12 text-center bg-white rounded-2xl border border-dashed border-[var(--border-light)]">
                                <div className="w-12 h-12 bg-[var(--bg-main)] rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Video className="w-6 h-6 text-[var(--text-muted)]" />
                                </div>
                                <h3 className="text-base font-semibold text-[var(--text-main)]">No active sessions</h3>
                                <p className="text-sm text-[var(--text-secondary)] mt-1">Sessions appear here when they match and start.</p>
                            </div>
                        ) : (
                            confirmed.map((item) => (
                                <motion.div
                                    key={item.room?._id || item.slot._id}
                                    className="bg-white border border-[var(--border-light)] p-6 rounded-2xl shadow-sm hover:shadow-md transition-all"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="text-lg font-bold text-[var(--text-main)]">
                                            {item.room?.topic || item.slot.topic}
                                        </h4>
                                        <div className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${isLive(item.slot.startTime) ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                                            {isLive(item.slot.startTime) ? 'Join Now' : 'Confirmed'}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mb-6 pb-4 border-b border-[var(--border-light)]">
                                        <span className="flex items-center gap-1.5 font-medium">
                                            <Clock className="w-4 h-4 text-[var(--primary)]" />
                                            {new Date(item.slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className="flex items-center gap-1.5 font-medium">
                                            <Users className="w-4 h-4 text-indigo-500" />
                                            Active Room
                                        </span>
                                    </div>

                                    <button
                                        className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${isLive(item.slot.startTime)
                                            ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-sm'
                                            : 'bg-[var(--bg-main)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border-light)]'
                                            }`}
                                        disabled={!isLive(item.slot.startTime)}
                                        onClick={() => isLive(item.slot.startTime) && navigate(`/room/${item.room?._id}`)}
                                    >
                                        <Video className="w-4 h-4" />
                                        {isLive(item.slot.startTime) ? 'Join Video Room' : 'Opens Soon'}
                                    </button>
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                )}

                {tab === 'completed' && (
                    <motion.div
                        key="completed"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        {completed.length === 0 ? (
                            <div className="col-span-2 py-12 text-center bg-white rounded-2xl border border-dashed border-[var(--border-light)]">
                                <CheckCircle2 className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
                                <h3 className="text-base font-semibold text-[var(--text-main)]">No past sessions</h3>
                                <p className="text-sm text-[var(--text-secondary)] mt-1">Completed GDs will appear here.</p>
                            </div>
                        ) : (
                            completed.map((item) => (
                                <div
                                    key={item.room?._id || item.slot._id}
                                    className="bg-slate-50 border border-[var(--border-light)] p-6 rounded-2xl opacity-90 hover:opacity-100 transition-opacity"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="text-lg font-bold text-slate-600">
                                            {item.room?.topic || item.slot.topic}
                                        </h4>
                                        <div className="px-2.5 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg border border-slate-200">
                                            Completed
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-6 font-medium">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(item.slot.startTime).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Feedback Submitted
                                        </span>
                                    </div>
                                    <button
                                        disabled
                                        className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Session Finished
                                    </button>
                                </div>
                            ))
                        )}
                    </motion.div>
                )}

                {tab === 'pending' && (
                    <motion.div
                        key="pending"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        {pending.length === 0 ? (
                            <div className="col-span-2 py-12 text-center bg-white rounded-2xl border border-dashed border-[var(--border-light)]">
                                <Clock className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
                                <h3 className="text-base font-semibold text-[var(--text-main)]">No pending sessions</h3>
                                <p className="text-sm text-[var(--text-secondary)] mt-1">Register for slots to see them here.</p>
                            </div>
                        ) : (
                            pending.map((item) => (
                                <motion.div
                                    key={item.slot._id}
                                    className="bg-white border border-[var(--border-light)] p-6 rounded-2xl shadow-sm"
                                >
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <h4 className="text-lg font-bold text-[var(--text-main)] mb-1">{item.slot.topic}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-[var(--text-muted)] font-medium">
                                                    {new Date(item.slot.startTime).toLocaleDateString()} at {new Date(item.slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {item.slot.isRescheduled && (
                                                    <span className="flex items-center gap-1 text-amber-600 text-[9px] font-bold uppercase tracking-tight">
                                                        <AlertCircle className="w-3 h-3" /> Rescheduled
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${isLive(item.slot.startTime) ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                                            {isLive(item.slot.startTime) ? 'Matching...' : 'Waitlist'}
                                        </span>
                                    </div>

                                    <div className="bg-[var(--bg-main)] rounded-xl p-4 mb-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Participants</span>
                                            <span className="text-xs font-bold text-[var(--primary)]">
                                                {item.slot.waitingQueue.length} Registered
                                            </span>
                                        </div>
                                        <div className="h-2 bg-[var(--border-light)] rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min((item.slot.waitingQueue.length / item.slot.minParticipants) * 100, 100)}%` }}
                                                className={`h-full rounded-full ${isLive(item.slot.startTime) ? 'bg-amber-500' : 'bg-indigo-500'}`}
                                            />
                                        </div>
                                        <p className="text-[10px] text-[var(--text-muted)] mt-2 font-medium">
                                            {item.needMore > 0 ? `Need ${item.needMore} more to start current batch.` : 'Minimum participants met. Waiting for start time.'}
                                        </p>
                                    </div>

                                    <button
                                        className="w-full py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center gap-2 border border-transparent hover:border-rose-100"
                                        onClick={() => handleCancel(item.slot._id)}
                                    >
                                        <X className="w-4 h-4" /> Cancel Registration
                                    </button>
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
