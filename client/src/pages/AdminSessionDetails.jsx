import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Users, Clock, Loader2, Video,
    ShieldAlert, AlertTriangle, MessageSquare, Brain,
    RefreshCw, Star, CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

/* ── helpers ── */
function ScoreRing({ score }) {
    const color = score >= 8 ? '#10b981' : score >= 6 ? '#6366f1' : score >= 4 ? '#f59e0b' : '#ef4444';
    return (
        <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-lg border-2"
                style={{ borderColor: color, color }}>
                {score}
            </div>
            <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>/ 10</span>
        </div>
    );
}

function BehaviorTag({ label, type }) {
    const map = {
        danger: { bg: 'var(--danger-light)', color: 'var(--danger)', border: '#fecaca' },
        warning: { bg: 'var(--warning-light)', color: '#b45309', border: '#fde68a' },
        ok: { bg: 'var(--success-light)', color: '#047857', border: '#a7f3d0' },
    };
    const s = map[type];
    return (
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md"
            style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
            {label}
        </span>
    );
}

/* ── Room card ── */
function RoomCard({ room, idx }) {
    const [details, setDetails] = useState(null);
    const [fetchLoading, setFetchLoading] = useState(false);
    const [triggerLoading, setTriggerLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');

    const roomId = String(room._id ?? '');

    const fetchDetails = async () => {
        if (details && !triggerLoading) { setExpanded(v => !v); return; }
        setFetchLoading(true);
        setError('');
        try {
            const res = await API.get(`/admin/sessions/${roomId}`);
            setDetails(res.data);
            setExpanded(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load analysis. Please retry.');
        } finally {
            setFetchLoading(false);
        }
    };

    const triggerAnalysis = async () => {
        setTriggerLoading(true);
        setMsg('');
        try {
            // Force-complete if still LIVE before analyzing
            if (room.status === 'LIVE') {
                await API.post(`/admin/sessions/${roomId}/force-complete`);
                setMsg('Session completed — running analysis, refreshing in 8s…');
            } else {
                await API.post(`/admin/sessions/${roomId}/analyze`);
                setMsg('Analysis started — refreshing in 8s…');
            }
            setDetails(null);
            setTimeout(async () => {
                try {
                    const res = await API.get(`/admin/sessions/${roomId}`);
                    setDetails(res.data);
                    setExpanded(true);
                } catch (_) {}
                setTriggerLoading(false);
                setMsg('');
            }, 8000);
        } catch (err) {
            setMsg(err.response?.data?.message || 'Failed to start analysis.');
            setTriggerLoading(false);
        }
    };

    const session = details?.session;
    const status = session?.analysisStatus;
    const hasAnalysis = status === 'completed' && session?.participantAnalysis?.length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            className="card overflow-hidden"
        >
            {/* Top bar */}
            <div className="h-1"
                style={{
                    background: room.status === 'LIVE'
                        ? 'linear-gradient(90deg,#10b981,#34d399)'
                        : 'linear-gradient(90deg,var(--primary),var(--accent))'
                }}
            />

            <div className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                            style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                            #{idx + 1}
                        </div>
                        <div>
                            <p className="font-bold text-sm leading-snug" style={{ color: 'var(--text-main)' }}>
                                {room.topic || `Room ${idx + 1}`}
                            </p>
                            <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                {room.participants?.length ?? 0} participant(s)
                            </p>
                        </div>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                        style={room.status === 'LIVE' ? {
                            background: 'var(--success-light)', color: '#047857', border: '1px solid #a7f3d0'
                        } : {
                            background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border)'
                        }}>
                        {room.status}
                    </span>
                </div>

                {/* Participants */}
                <div className="space-y-2">
                    {room.participants?.map(p => {
                        const pa = room.participantAnalysis?.find(a =>
                            String(a.userId?._id ?? a.userId) === String(p._id)
                        );
                        return (
                            <div key={p._id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                                style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                    style={{ background: 'linear-gradient(135deg,var(--primary),var(--accent))' }}>
                                    {p.name?.charAt(0)?.toUpperCase() ?? 'S'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-main)' }}>{p.name}</p>
                                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{p.email}</p>
                                </div>
                                {pa ? (
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {pa.isMisbehaving && <BehaviorTag label="Misbehaving" type="danger" />}
                                        {pa.isOffTopic && !pa.isMisbehaving && <BehaviorTag label="Off-Topic" type="warning" />}
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
                                            style={{
                                                background: pa.performanceScore >= 7 ? 'var(--success-light)' : pa.performanceScore >= 4 ? 'var(--warning-light)' : 'var(--danger-light)',
                                                color: pa.performanceScore >= 7 ? '#047857' : pa.performanceScore >= 4 ? '#92400e' : 'var(--danger)',
                                            }}>
                                            {pa.performanceScore}/10
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-[10px] font-medium italic" style={{ color: 'var(--text-muted)' }}>
                                        {room.status === 'LIVE' ? 'In session' :
                                         room.analysisStatus === 'completed' ? 'No speech' :
                                         room.analysisStatus === 'failed' ? 'Failed' : 'Awaiting'}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Risky words */}
                {room.riskyWords?.length > 0 && (
                    <div className="px-4 py-3 rounded-xl"
                        style={{ background: 'var(--danger-light)', border: '1px solid #fecaca' }}>
                        <p className="text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"
                            style={{ color: 'var(--danger)' }}>
                            <ShieldAlert className="w-3.5 h-3.5" /> Risk Words
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {room.riskyWords.map((w, i) => (
                                <span key={i} className="text-xs font-bold px-2 py-0.5 rounded-md bg-white"
                                    style={{ color: 'var(--danger)', border: '1px solid #fecaca' }}>
                                    {w}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Errors / messages */}
                {error && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                        style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid #fecaca' }}>
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
                    </div>
                )}
                {msg && (
                    <div className="px-4 py-3 rounded-xl text-sm font-medium"
                        style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                        {msg}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                    <button
                        onClick={fetchDetails}
                        disabled={fetchLoading || triggerLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                        style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'white' }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = 'var(--primary)';
                            e.currentTarget.style.color = 'var(--primary)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'var(--border)';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                    >
                        {fetchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                        {expanded ? 'Hide Analysis' : 'View AI Analysis'}
                    </button>
                    <button
                        onClick={triggerAnalysis}
                        disabled={triggerLoading || fetchLoading}
                        title={room.status === 'LIVE' ? 'Force complete & analyze' : 'Re-run analysis'}
                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                        style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'white' }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = '#fde68a';
                            e.currentTarget.style.color = '#92400e';
                            e.currentTarget.style.background = 'var(--warning-light)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'var(--border)';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                            e.currentTarget.style.background = 'white';
                        }}
                    >
                        {triggerLoading
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <RefreshCw className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Analysis panel */}
            {expanded && details && (
                <div className="border-t px-6 py-5 space-y-5"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}>

                    {status === 'pending' && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                            style={{ background: 'var(--warning-light)', color: '#92400e', border: '1px solid #fde68a' }}>
                            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                            Analysis in progress. Click refresh to check again.
                        </div>
                    )}
                    {status === 'failed' && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                            style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid #fecaca' }}>
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            Analysis failed. Use the refresh button to retry.
                        </div>
                    )}

                    {/* Summary */}
                    {session?.overallSummary && (
                        <div className="p-4 rounded-xl"
                            style={{ background: 'white', border: '1px solid var(--border)' }}>
                            <p className="text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"
                                style={{ color: 'var(--text-muted)' }}>
                                <MessageSquare className="w-3.5 h-3.5" /> Session Summary
                            </p>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                {session.overallSummary}
                            </p>
                        </div>
                    )}

                    {/* Per-participant scores */}
                    {hasAnalysis && (
                        <div className="space-y-3">
                            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                Performance Report
                            </p>
                            {session.participantAnalysis.map((pa, i) => {
                                const scoreColor = pa.performanceScore >= 8 ? '#10b981' : pa.performanceScore >= 6 ? '#6366f1' : pa.performanceScore >= 4 ? '#f59e0b' : '#ef4444';
                                const pct = (pa.performanceScore / 10) * 100;
                                return (
                                    <div key={i} className="p-4 rounded-xl"
                                        style={{ background: 'white', border: '1px solid var(--border)' }}>
                                        <div className="flex items-start gap-4">
                                            <ScoreRing score={pa.performanceScore ?? 0} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <p className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>{pa.name}</p>
                                                    {pa.isMisbehaving && <BehaviorTag label="Misbehaving" type="danger" />}
                                                    {pa.isOffTopic && <BehaviorTag label="Off-Topic" type="warning" />}
                                                    {!pa.isMisbehaving && !pa.isOffTopic && <BehaviorTag label="Good Conduct" type="ok" />}
                                                </div>
                                                <p className="text-xs leading-relaxed mb-2" style={{ color: 'var(--text-secondary)' }}>
                                                    {pa.summary}
                                                </p>
                                                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                                                    <div className="h-full rounded-full transition-all"
                                                        style={{ width: `${pct}%`, background: scoreColor }} />
                                                </div>
                                                {pa.flags?.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                        {pa.flags.map((f, fi) => (
                                                            <span key={fi} className="text-[10px] font-semibold px-2 py-0.5 rounded"
                                                                style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                                                                {f}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Transcript */}
                    {details.transcripts?.length > 0 && (
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                                Transcript ({details.transcripts.length} entries)
                            </p>
                            <div className="rounded-xl p-4 max-h-48 overflow-y-auto space-y-1.5"
                                style={{ background: 'white', border: '1px solid var(--border)' }}>
                                {details.transcripts.map((t, ti) => (
                                    <div key={ti} className="flex gap-2 text-xs">
                                        <span className="font-bold flex-shrink-0" style={{ color: 'var(--primary)' }}>
                                            {t.userId?.name ?? 'Unknown'}:
                                        </span>
                                        <span style={{ color: 'var(--text-secondary)' }}>{t.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!hasAnalysis && status === 'completed' && (
                        <p className="text-sm text-center py-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                            No speech was captured for this session.
                        </p>
                    )}
                </div>
            )}
        </motion.div>
    );
}

/* ── Page ── */
export default function AdminSessionDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [slot, setSlot] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get(`/admin/slots/${id}`)
            .then(res => setSlot(res.data.slot))
            .catch(() => alert('Failed to load session details'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="page-shell">
            <Sidebar />
            <div className="page-content items-center justify-center flex">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--primary)' }} />
            </div>
        </div>
    );

    if (!slot) return null;

    return (
        <div className="page-shell">
            <Sidebar />
            <div className="page-content">
                <Navbar />
                <main className="page-main space-y-8">

                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                            style={{ border: '1px solid var(--border)', background: 'white' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'white'}
                        >
                            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                        </button>
                        <div>
                            <h2 className="text-xl font-extrabold" style={{ color: 'var(--text-main)' }}>
                                {slot.topic || 'AI-Generated Topics'}
                            </h2>
                            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                                Session Details & Performance Analysis
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        {[
                            { label: 'Registered Students', value: slot.waitingQueue?.length ?? 0, icon: Users, bg: 'var(--primary-light)', color: 'var(--primary)' },
                            { label: 'Rooms Created', value: slot.occurrences?.length ?? 0, icon: Video, bg: 'var(--accent-light)', color: 'var(--accent)' },
                            { label: 'Status', value: slot.status, icon: Clock, bg: 'var(--bg-subtle)', color: 'var(--text-secondary)', isStatus: true },
                        ].map(({ label, value, icon: Icon, bg, color, isStatus }) => (
                            <div key={label} className="card p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                                        <Icon className="w-4 h-4" style={{ color }} />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                        {label}
                                    </span>
                                </div>
                                {isStatus ? (
                                    <span className="text-sm font-bold px-3 py-1 rounded-full"
                                        style={value === 'LIVE'
                                            ? { background: 'var(--success-light)', color: '#047857' }
                                            : value === 'COMPLETED'
                                                ? { background: '#eff6ff', color: '#1d4ed8' }
                                                : { background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                                        {value}
                                    </span>
                                ) : (
                                    <p className="text-2xl font-extrabold" style={{ color: 'var(--text-main)' }}>{value}</p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Room instances */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Brain className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                            <div>
                                <h3 className="font-bold" style={{ color: 'var(--text-main)' }}>
                                    Room Instances & AI Performance Analysis
                                </h3>
                                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                                    Each room has a unique AI-generated topic. Expand to view per-participant scores.
                                </p>
                            </div>
                        </div>

                        {!slot.occurrences?.length ? (
                            <div className="card py-16 text-center">
                                <Video className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                                <p className="font-semibold text-sm" style={{ color: 'var(--text-secondary)' }}>No rooms created yet</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {slot.occurrences.map((room, idx) => (
                                    <RoomCard key={room._id} room={room} idx={idx} />
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
