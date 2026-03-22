import { motion } from 'framer-motion';
import { Clock, Users, Zap, CheckCircle2, Video, AlertCircle, CalendarDays } from 'lucide-react';

export default function SlotCard({ slot, onRegister, onJoin, registration, loading }) {
    const startTime = new Date(slot.startTime);
    const now = new Date();
    const timeStr = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = startTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

    const isRegistered = !!registration;
    const isLive = now >= startTime && !slot.isRolledOver;
    const isRescheduled = slot.isRescheduled;
    const hasRoom = registration?.status === 'confirmed' && registration?.room?._id;
    const isRolledOver = slot.isRolledOver;

    // Determine Button State
    let buttonConfig = {
        label: isRolledOver ? "Register for Next" : "Join Discussion",
        action: () => onRegister(slot._id),
        className: isRolledOver ? "bg-amber-600 text-white hover:bg-amber-700 shadow-amber-100 shadow-lg" : "btn-primary",
        icon: isRolledOver ? CalendarDays : Zap
    };

    if (loading) {
        buttonConfig = { label: "Processing...", action: null, className: "bg-slate-100 text-slate-400 cursor-wait", icon: null };
    } else if (isRegistered) {
        if (registration.userStatus === 'COMPLETED') {
            buttonConfig = {
                label: "GD Completed",
                action: null,
                className: "bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200",
                icon: CheckCircle2
            };
        } else if (isLive && hasRoom) {
            buttonConfig = {
                label: "Join Room Now",
                action: () => onJoin(registration.room._id),
                className: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200 shadow-lg animate-pulse",
                icon: Video
            };
        } else {
            buttonConfig = {
                label: "Registered",
                action: null,
                className: "bg-emerald-50 text-emerald-700 cursor-default border border-emerald-100",
                icon: CheckCircle2
            };
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-modern p-6 flex flex-col gap-4 bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-indigo-100"
        >
            <div className="flex justify-between items-start">
                <div className="flex flex-col gap-2">
                    <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider w-fit ${isLive ? 'bg-rose-50 text-rose-600 border border-rose-100 animate-pulse' : isRolledOver ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-indigo-50 text-[var(--primary)]'}`}>
                        {isLive ? '• Live Now' : isRolledOver ? 'Next Session' : 'Scheduled'}
                    </div>
                    {isRescheduled && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-100 shadow-sm animate-in fade-in slide-in-from-left-2">
                            <AlertCircle className="w-3.5 h-3.5" />
                            RESCHEDULED TO TOMORROW
                        </div>
                    )}
                </div>
                {isRegistered && (
                    <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" /> Registered
                    </div>
                )}
            </div>

            <div>
                <h3 className="text-xl font-bold text-[var(--text-main)] mb-2 group-hover:text-[var(--primary)] transition-colors min-h-[1.5rem] leading-tight">
                    {slot.topic && slot.topic.trim() !== '' ? slot.topic : 'Topic will be assigned when GD starts'}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] line-clamp-2 min-h-[40px]">
                    {slot.description || "Join this session to discuss and learn."}
                </p>
            </div>

            <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] mt-2 font-bold uppercase tracking-tight">
                <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{dateStr} @ {timeStr}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{slot.waitingQueue.length}/{slot.maxParticipants} Students</span>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--border-light)]">
                {registration?.userStatus === 'COMPLETED' && (
                    <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl mb-4 text-slate-600 animate-in fade-in slide-in-from-top-2">
                        <CheckCircle2 className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold">You have successfully completed this GD.</span>
                    </div>
                )}

                <button
                    className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${buttonConfig.className}`}
                    disabled={!buttonConfig.action || loading}
                    onClick={() => buttonConfig.action && buttonConfig.action()}
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            {buttonConfig.icon && <buttonConfig.icon className="w-4 h-4" />}
                            {buttonConfig.label}
                        </>
                    )}
                </button>

                {isRegistered && !hasRoom && isLive && (
                    <p className="text-[10px] text-amber-600 font-bold mt-2 text-center bg-amber-50 py-1 rounded">
                        Waiting for team matching...
                    </p>
                )}
            </div>
        </motion.div>
    );
}
