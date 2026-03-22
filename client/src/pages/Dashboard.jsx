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
    const [registrations, setRegistrations] = useState({}); // slotId -> registration object

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

    useEffect(() => {
        fetchDashboardData();
    }, []);

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

    const handleJoin = (roomId) => {
        navigate(`/room/${roomId}`);
    };

    return (
        <div className="flex min-h-screen bg-[var(--bg-main)]">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <Navbar />

                <main className="page-container w-full space-y-10">
                    {/* Available Slots Section */}
                    <section>
                        <div className="flex items-center justify-between section-header">
                            <div>
                                <h2 className="text-2xl font-bold text-[var(--text-main)]">Available Sessions</h2>
                                <p className="text-sm text-[var(--text-secondary)] mt-1 font-medium">Join a discussion to participate.</p>
                            </div>
                            <button
                                onClick={fetchDashboardData}
                                className="btn-modern btn-ghost"
                            >
                                <RefreshCw className={`w-4 h-4 text-[var(--primary)] ${loadingSlots ? 'animate-spin' : ''}`} />
                                <span className="text-[var(--primary)] font-bold">Refresh</span>
                            </button>
                        </div>

                        {loadingSlots ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-48 rounded-[var(--radius-xl)] bg-slate-100 animate-pulse" />
                                ))}
                            </div>
                        ) : slots.length === 0 ? (
                            <div className="py-16 text-center bg-white rounded-[var(--radius-xl)] border border-dashed border-[var(--border-light)]">
                                <CalendarDays className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
                                <h3 className="text-base font-bold text-[var(--text-secondary)]">No sessions available</h3>
                                <p className="text-sm text-[var(--text-muted)] mt-1">Please check back later.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {slots.map((slot) => (
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
                    <section className="pt-8 border-t border-[var(--border-light)]">
                        <div className="section-header">
                            <h2 className="text-2xl font-bold text-[var(--text-main)]">Your Activity</h2>
                            <p className="text-sm text-[var(--text-secondary)] mt-1 font-medium">Manage your upcoming and past sessions.</p>
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
