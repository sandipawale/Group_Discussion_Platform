import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, Clock, Loader2, Video } from 'lucide-react';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

export default function AdminSessionDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [slot, setSlot] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await API.get(`/admin/slots/${id}`);
                setSlot(res.data.slot);
            } catch (err) {
                console.error(err);
                alert("Failed to load session details");
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    if (loading) {
        return (
            <div className="flex h-screen bg-[var(--bg-main)]">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
                </div>
            </div>
        );
    }

    if (!slot) return null;

    return (
        <div className="flex h-screen bg-[var(--bg-main)] overflow-hidden font-sans">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Navbar />

                <main className="p-8 lg:p-10 overflow-y-auto space-y-8">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            className="p-2 rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold text-[var(--text-main)]">
                                {slot.topic}
                            </h2>
                            <p className="text-sm text-[var(--text-secondary)] font-medium">Session Details & Analytics</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="card-modern p-6 bg-white">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                    <Users className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-bold text-[var(--text-muted)] uppercase">Total Participants</span>
                            </div>
                            <p className="text-2xl font-bold text-[var(--text-main)]">{slot.waitingQueue.length}</p>
                        </div>
                        <div className="card-modern p-6 bg-white">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                    <Video className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-bold text-[var(--text-muted)] uppercase">Active Rooms</span>
                            </div>
                            <p className="text-2xl font-bold text-[var(--text-main)]">{slot.occurrences.filter(o => o.status === 'LIVE').length}</p>
                        </div>
                        <div className="card-modern p-6 bg-white">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-bold text-[var(--text-muted)] uppercase">Status</span>
                            </div>
                            <span className={`inline-block px-2.5 py-1 text-sm font-bold rounded-lg ${slot.status === 'LIVE' ? 'bg-emerald-100 text-emerald-700' :
                                    slot.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                                        'bg-slate-100 text-slate-700'
                                }`}>
                                {slot.status}
                            </span>
                        </div>
                    </div>

                    {/* Room Instances */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-[var(--text-main)]">Room Instances</h3>
                        {slot.occurrences.length === 0 ? (
                            <div className="p-8 text-center bg-white rounded-xl border border-dashed border-[var(--border-light)]">
                                <p className="text-[var(--text-secondary)]">No rooms created yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {slot.occurrences.map((room, idx) => (
                                    <div key={room._id} className="card-modern p-6 bg-white">
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="font-bold text-[var(--text-main)]">Room #{idx + 1}</h4>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${room.status === 'LIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {room.status}
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Participants ({room.participants.length})</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {room.participants.map(p => (
                                                        <div key={p._id} className="px-2 py-1 bg-slate-50 border border-slate-100 rounded text-xs text-slate-600">
                                                            {p.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {room.riskyWords && room.riskyWords.length > 0 && (
                                                <div className="pt-3 border-t border-[var(--border-light)]">
                                                    <p className="text-xs font-bold text-rose-500 uppercase mb-2">Risk Alerts</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {room.riskyWords.map((w, i) => (
                                                            <span key={i} className="px-2 py-0.5 bg-rose-50 text-rose-600 text-xs rounded border border-rose-100">
                                                                {w}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
