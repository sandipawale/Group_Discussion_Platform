import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, RefreshCw } from 'lucide-react';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import SlotCard from '../components/SlotCard';
import RegistrationTabs from '../components/RegistrationTabs';

export default function Dashboard() {
    const navigate = useNavigate();
    const [slots, setSlots] = useState([]);
    const [registeredIds, setRegisteredIds] = useState(new Set());
    const [loadingSlots, setLoadingSlots] = useState(true);
    const [registeringId, setRegisteringId] = useState(null);
    const [registrations, setRegistrations] = useState({});

    const fetchDashboardData = async () => {
        setLoadingSlots(true);
        try {
            const [slotsRes, userRes] = await Promise.all([
                API.get('/slots'),
                API.get('/auth/me')
            ]);
            setSlots(slotsRes.data.slots || []);

            const regs = {};
            const regIds = new Set();
            userRes.data.user.registrations.forEach(r => {
                regs[r.slot._id] = r;
                regIds.add(r.slot._id);
            });
            setRegistrations(regs);
            setRegisteredIds(regIds);
        } catch (err) {
            console.error('Data sync failed:', err);
        } finally {
            setLoadingSlots(false);
        }
    };

    useEffect(() => { fetchDashboardData(); }, []);

    const handleRegister = async (slotId) => {
        setRegisteringId(slotId);
        try {
            await API.post(`/slots/${slotId}/register`);
            setRegisteredIds(prev => new Set([...prev, slotId]));
            fetchDashboardData();
        } catch (err) {
            alert(err.response?.data?.message || 'Registration failed');
        } finally {
            setRegisteringId(null);
        }
    };

    const handleJoin = (roomId) => navigate(`/room/${roomId}`);

    return (
        <div className="page-shell">
            <Sidebar />
            <div className="page-content">
                <Navbar />
                <main className="page-main space-y-10">

                    {/* Available Sessions */}
                    <section>
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-xl font-extrabold" style={{ color: 'var(--text-main)' }}>
                                    Available Sessions
                                </h2>
                                <p className="text-sm mt-0.5 font-medium" style={{ color: 'var(--text-muted)' }}>
                                    Register and join a live group discussion.
                                </p>
                            </div>
                            <button
                                onClick={fetchDashboardData}
                                className="btn btn-ghost flex items-center gap-2"
                            >
                                <RefreshCw className={`w-4 h-4 ${loadingSlots ? 'animate-spin' : ''}`}
                                    style={{ color: 'var(--primary)' }} />
                                <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>Refresh</span>
                            </button>
                        </div>

                        {loadingSlots ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-52 rounded-2xl animate-pulse"
                                        style={{ background: 'var(--bg-subtle)' }} />
                                ))}
                            </div>
                        ) : slots.filter(s => registrations[s._id]?.userStatus !== 'COMPLETED').length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="py-16 text-center rounded-2xl border border-dashed"
                                style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
                            >
                                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                                    style={{ background: 'var(--bg-subtle)' }}>
                                    <CalendarDays className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                                </div>
                                <h3 className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                                    No sessions available
                                </h3>
                                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                                    Check back later for upcoming sessions.
                                </p>
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {slots
                                    .filter(s => registrations[s._id]?.userStatus !== 'COMPLETED')
                                    .map((slot) => (
                                        <SlotCard
                                            key={slot._id}
                                            slot={slot}
                                            onRegister={handleRegister}
                                            onJoin={handleJoin}
                                            registration={registrations[slot._id]}
                                            loading={registeringId === slot._id}
                                        />
                                    ))}
                            </div>
                        )}
                    </section>

                    {/* Activity Section */}
                    <section className="pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
                        <div className="mb-5">
                            <h2 className="text-xl font-extrabold" style={{ color: 'var(--text-main)' }}>
                                Your Activity
                            </h2>
                            <p className="text-sm mt-0.5 font-medium" style={{ color: 'var(--text-muted)' }}>
                                Manage your upcoming and past sessions.
                            </p>
                        </div>
                        <RegistrationTabs
                            registrations={Object.values(registrations)}
                            onRefresh={fetchDashboardData}
                        />
                    </section>

                </main>
            </div>
        </div>
    );
}
