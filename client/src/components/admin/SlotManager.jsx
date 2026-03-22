import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Calendar, Clock, Users, X, Edit2, Eye, Layers, UserPlus, Activity } from 'lucide-react';
import API from '../../api/axios';

export default function SlotManager() {
    const navigate = useNavigate();
    const [slots, setSlots] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingSlot, setEditingSlot] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        topic: '',
        description: '',
        startTime: '',
        endTime: '',
        maxParticipants: 40,
        batchSize: 4,
        minParticipants: 2
    });

    useEffect(() => {
        fetchSlots();
    }, []);

    // Prevent scroll when modal is open
    useEffect(() => {
        if (showModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [showModal]);

    const fetchSlots = async () => {
        try {
            const res = await API.get('/slots/all'); // Use the admin endpoint
            if (res.data.success) {
                setSlots(res.data.slots);
            }
        } catch (err) {
            console.error("Failed to fetch slots", err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this session?")) return;
        try {
            await API.delete(`/slots/${id}`);
            setSlots(slots.filter(s => s._id !== id));
        } catch (err) {
            alert("Failed to delete slot");
        }
    };

    const openCreateModal = () => {
        const now = new Date();
        const start = new Date(now.getTime() + 60 * 60 * 1000); // Default to 1 hour from now
        const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration

        const format = (d) => new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

        setEditingSlot(null);
        setFormData({
            topic: '',
            description: '',
            startTime: format(start),
            endTime: format(end),
            maxParticipants: 40,
            batchSize: 4,
            minParticipants: 2
        });
        setShowModal(true);
    };

    const openEditModal = (slot) => {
        setEditingSlot(slot);
        const format = (d) => {
            const date = new Date(d);
            return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        };

        setFormData({
            topic: slot.topic,
            description: slot.description || '',
            startTime: format(slot.startTime),
            endTime: format(slot.endTime),
            maxParticipants: slot.maxParticipants,
            batchSize: slot.batchSize || 4,
            minParticipants: slot.minParticipants || 2
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const now = new Date();
        const start = new Date(formData.startTime);
        const end = new Date(formData.endTime);

        if (start < now) {
            return alert("Cannot schedule a session in the past. Please pick a future time.");
        }
        if (end <= start) {
            return alert("End time must be after the start time.");
        }

        setLoading(true);
        try {
            if (editingSlot) {
                await API.put(`/slots/${editingSlot._id}`, formData);
            } else {
                await API.post('/slots', formData);
            }
            setShowModal(false);
            fetchSlots();
        } catch (err) {
            alert(err.response?.data?.message || `Failed to ${editingSlot ? 'update' : 'create'} slot`);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-4 py-2 bg-white border border-[var(--border-medium)] rounded-xl outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-indigo-50 transition-all text-sm font-medium text-[var(--text-main)] placeholder-[var(--text-muted)]";

    return (
        <div className="card-modern overflow-hidden bg-white">
            <div className="p-6 border-b border-[var(--border-light)] flex justify-between items-center bg-[var(--bg-main)]/30">
                <div>
                    <h2 className="text-lg font-bold text-[var(--text-main)]">Discussion Slots</h2>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5 font-medium">Manage and schedule GD sessions.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
                >
                    <Plus className="w-4 h-4" /> Create Session
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[var(--bg-main)] text-[var(--text-secondary)] border-b border-[var(--border-light)]">
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Topic</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Schedule</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Config</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-light)]">
                        {slots.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-8 text-center text-[var(--text-muted)] text-sm font-medium">
                                    No active slots found.
                                </td>
                            </tr>
                        ) : (
                            slots.map(slot => (
                                <tr key={slot._id} className="hover:bg-[var(--bg-main)]/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-[var(--text-main)]">
                                            {slot.topic || <span className="text-[var(--text-muted)] italic">AI Generated Topic</span>}
                                        </div>
                                        <div className="text-xs text-[var(--text-muted)] truncate max-w-[200px] font-medium">{slot.description}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] font-medium">
                                            <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                                            <span>{new Date(slot.startTime).toLocaleDateString()}</span>
                                        </div>
                                        <div className="text-xs text-[var(--text-muted)] mt-1 font-medium">
                                            {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-2">
                                            <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                                                <Layers className="w-3 h-3" /> Batch: {slot.batchSize || 4}
                                            </span>
                                            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100 flex items-center gap-1">
                                                <Users className="w-3 h-3" /> Max: {slot.maxParticipants}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => navigate(`/admin/session/${slot._id}`)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => openEditModal(slot)}
                                                className="p-2 text-[var(--primary)] hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Edit Session"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(slot._id)}
                                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Delete Session"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && createPortal(
                <AnimatePresence mode="wait">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 40 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 40 }}
                            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden border border-[var(--border-light)] flex flex-col my-auto"
                        >
                            <div className="px-8 py-6 border-b border-[var(--border-light)] flex justify-between items-center bg-white sticky top-0 z-10">
                                <div>
                                    <h3 className="text-xl font-bold text-[var(--text-main)]">
                                        {editingSlot ? 'Edit Session' : 'Create New Session'}
                                    </h3>
                                    <p className="text-sm text-[var(--text-secondary)] font-medium mt-0.5">Fill in the details to schedule a new GD.</p>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-[var(--bg-main)] rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-8">
                                <form id="session-form" onSubmit={handleSubmit} className="space-y-8">
                                    {/* Topic & Description Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-light)]">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                                <Edit2 className="w-4 h-4" />
                                            </div>
                                            <h4 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">General Information</h4>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest ml-1">Session Topic</label>
                                                <input
                                                    type="text"
                                                    className={`${inputClass} !py-3 !text-base shadow-sm`}
                                                    placeholder="e.g. AI Ethics in Data Science"
                                                    value={formData.topic}
                                                    onChange={e => setFormData({ ...formData, topic: e.target.value })}
                                                />
                                                <p className="text-[10px] text-[var(--text-muted)] font-medium ml-1 italic">Leave blank to automatically generate a unique topic for each room at start time.</p>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest ml-1">Short Description</label>
                                                <textarea
                                                    className={`${inputClass} min-h-[100px] !py-3 shadow-sm`}
                                                    placeholder="What will students discuss in this session?"
                                                    value={formData.description}
                                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Schedule Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-light)]">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                <Calendar className="w-4 h-4" />
                                            </div>
                                            <h4 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">Timing & Schedule</h4>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest ml-1">Start Date & Time</label>
                                                <div className="relative">
                                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                                                    <input
                                                        type="datetime-local"
                                                        required
                                                        className={`${inputClass} !pl-12 !py-3 shadow-sm`}
                                                        value={formData.startTime}
                                                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest ml-1">End Date & Time</label>
                                                <div className="relative">
                                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                                                    <input
                                                        type="datetime-local"
                                                        required
                                                        className={`${inputClass} !pl-12 !py-3 shadow-sm`}
                                                        value={formData.endTime}
                                                        onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Advanced Configuration Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-light)]">
                                            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                                <Layers className="w-4 h-4" />
                                            </div>
                                            <h4 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">Advanced Configuration</h4>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest ml-1">Max Participants</label>
                                                <div className="relative">
                                                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                                                    <input
                                                        type="number"
                                                        required
                                                        className={`${inputClass} !pl-12 !py-3 shadow-sm`}
                                                        value={formData.maxParticipants}
                                                        onChange={e => setFormData({ ...formData, maxParticipants: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest ml-1">Batch Size</label>
                                                <div className="relative">
                                                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                                                    <input
                                                        type="number"
                                                        required
                                                        className={`${inputClass} !pl-12 !py-3 shadow-sm`}
                                                        value={formData.batchSize}
                                                        onChange={e => setFormData({ ...formData, batchSize: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest ml-1">Min Check-in</label>
                                                <div className="relative">
                                                    <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                                                    <input
                                                        type="number"
                                                        required
                                                        className={`${inputClass} !pl-12 !py-3 shadow-sm`}
                                                        value={formData.minParticipants}
                                                        onChange={e => setFormData({ ...formData, minParticipants: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex gap-4 items-start">
                                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
                                                <Activity className="w-5 h-5" />
                                            </div>
                                            <div className="space-y-1">
                                                <h5 className="text-sm font-bold text-indigo-900">Live Optimization Details</h5>
                                                <p className="text-xs text-indigo-700 font-medium leading-relaxed opacity-80">
                                                    Registered students will be automatically split into individual rooms of <b>{formData.batchSize}</b>.
                                                    The system will auto-reschedule this slot if fewer than <b>{formData.minParticipants}</b> students check in by the start time.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>

                            <div className="px-8 py-6 border-t border-[var(--border-light)] flex gap-4 bg-[var(--bg-main)]/30 sticky bottom-0 z-10">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-4 px-6 border border-[var(--border-medium)] text-[var(--text-secondary)] rounded-2xl font-bold text-sm hover:bg-white hover:border-[var(--text-muted)] transition-all shadow-sm"
                                >
                                    Discard Changes
                                </button>
                                <button
                                    form="session-form"
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] py-4 px-6 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-2xl font-bold text-base shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Scheduling...
                                        </>
                                    ) : (
                                        <>
                                            {editingSlot ? 'Update Discussion' : 'Schedule GD Session'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
