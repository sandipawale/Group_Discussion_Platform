import { motion } from 'framer-motion';
import { Clock, Users, Zap, CheckCircle2, Video, AlertCircle, CalendarDays, Loader2 } from 'lucide-react';

function StatusPill({ isLive, isRolledOver, isRescheduled }) {
    if (isLive) return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Live Now
        </span>
    );
    if (isRolledOver) return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'var(--warning-light)', color: '#b45309', border: '1px solid #fde68a' }}>
            Next Session
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid #c7d2fe' }}>
            Scheduled
        </span>
    );
}

export default function SlotCard({ slot, onRegister, onJoin, registration, loading }) {
    const startTime = new Date(slot.startTime);
    const now = new Date();
    const isLive = now >= startTime && !slot.isRolledOver;
    const isRolledOver = slot.isRolledOver;
    const isRescheduled = slot.isRescheduled;
    const hasRoom = registration?.status === 'confirmed' && registration?.room?._id;

    const timeStr = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = startTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

    // Fill progress
    const fillPct = Math.min((slot.waitingQueue.length / slot.maxParticipants) * 100, 100);

    // Button state
    let btn = {
        label: isRolledOver ? 'Register for Next' : 'Register Now',
        onClick: () => onRegister(slot._id),
        style: 'primary',
        icon: isRolledOver ? CalendarDays : Zap,
    };

    if (loading) {
        btn = { label: 'Processing...', onClick: null, style: 'disabled', icon: Loader2 };
    } else if (registration) {
        if (registration.userStatus === 'COMPLETED') {
            btn = { label: 'Completed', onClick: null, style: 'muted', icon: CheckCircle2 };
        } else if (isLive && hasRoom) {
            btn = { label: 'Join Room Now', onClick: () => onJoin(registration.room._id), style: 'success', icon: Video };
        } else {
            btn = { label: 'Registered', onClick: null, style: 'registered', icon: CheckCircle2 };
        }
    }

    const btnStyles = {
        primary: {
            background: 'var(--primary)',
            color: 'white',
            boxShadow: 'var(--shadow-primary)',
            cursor: 'pointer',
        },
        success: {
            background: 'var(--success)',
            color: 'white',
            animation: 'pulse 2s infinite',
            cursor: 'pointer',
        },
        registered: {
            background: 'var(--success-light)',
            color: '#047857',
            border: '1px solid #a7f3d0',
            cursor: 'default',
        },
        muted: {
            background: 'var(--bg-subtle)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
            cursor: 'not-allowed',
        },
        disabled: {
            background: 'var(--bg-subtle)',
            color: 'var(--text-muted)',
            cursor: 'wait',
        },
    };

    return (
        <motion.article
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-hover flex flex-col"
        >
            {/* Top accent bar */}
            <div
                className="h-1 rounded-t-2xl"
                style={{
                    background: isLive
                        ? 'linear-gradient(90deg, #ef4444, #f97316)'
                        : isRolledOver
                            ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                            : 'linear-gradient(90deg, var(--primary), var(--accent))',
                }}
            />

            <div className="p-5 flex flex-col gap-4 flex-1">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                    <StatusPill isLive={isLive} isRolledOver={isRolledOver} isRescheduled={isRescheduled} />
                    {registration && registration.userStatus !== 'COMPLETED' && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: 'var(--success)' }}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Registered
                        </span>
                    )}
                </div>

                {/* Reschedule notice */}
                {isRescheduled && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold"
                        style={{ background: 'var(--warning-light)', color: '#92400e', border: '1px solid #fde68a' }}>
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        Rescheduled to tomorrow due to low attendance
                    </div>
                )}

                {/* Topic */}
                <div className="flex-1">
                    <h3 className="font-bold text-base leading-snug mb-1.5" style={{ color: 'var(--text-main)' }}>
                        {slot.topic?.trim() ? slot.topic : (
                            <span className="italic font-medium" style={{ color: 'var(--text-muted)' }}>
                                AI topic assigned at start
                            </span>
                        )}
                    </h3>
                    {slot.description && (
                        <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {slot.description}
                        </p>
                    )}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
                        {dateStr} · {timeStr}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
                        {slot.waitingQueue.length}/{slot.maxParticipants}
                    </span>
                </div>

                {/* Fill bar */}
                <div className="space-y-1.5">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${fillPct}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{
                                background: fillPct >= 80
                                    ? 'var(--danger)'
                                    : fillPct >= 50
                                        ? 'var(--warning)'
                                        : 'var(--primary)',
                            }}
                        />
                    </div>
                </div>

                {/* CTA */}
                <button
                    onClick={btn.onClick ?? undefined}
                    disabled={!btn.onClick || loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150"
                    style={btnStyles[btn.style]}
                    onMouseEnter={e => {
                        if (btn.style === 'primary') e.currentTarget.style.background = 'var(--primary-hover)';
                        if (btn.style === 'success') e.currentTarget.style.opacity = '0.9';
                    }}
                    onMouseLeave={e => {
                        if (btn.style === 'primary') e.currentTarget.style.background = 'var(--primary)';
                        if (btn.style === 'success') e.currentTarget.style.opacity = '1';
                    }}
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <btn.icon className="w-4 h-4" />
                            {btn.label}
                        </>
                    )}
                </button>

                {registration && !hasRoom && isLive && registration.userStatus !== 'COMPLETED' && (
                    <p className="text-center text-xs font-medium" style={{ color: 'var(--warning)' }}>
                        Matching in progress — please wait…
                    </p>
                )}
            </div>
        </motion.article>
    );
}
