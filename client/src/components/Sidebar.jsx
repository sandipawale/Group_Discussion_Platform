import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, History, BarChart3, LogOut, MessageSquare, CalendarDays, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
];

const adminLinks = [
    { to: '/admin/dashboard', icon: BarChart3, label: 'Analytics Hub', adminOnly: true },
];

export default function Sidebar() {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="w-72 h-screen sticky top-0 flex flex-col p-4 z-40 bg-[var(--bg-main)]">
            <div className="flex-1 flex flex-col bg-white rounded-2xl border border-[var(--border-light)] shadow-sm overflow-hidden">
                {/* Logo Area */}
                <div className="p-6 flex items-center gap-3 border-b border-[var(--border-light)]">
                    <div className="w-10 h-10 bg-[var(--primary)] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                        <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-[var(--text-main)] leading-none">
                            Group<span className="text-[var(--primary)]">Discussion</span>
                        </h2>
                        <p className="text-xs text-[var(--text-muted)] font-bold mt-1">Student Platform</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                    <p className="px-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Menu</p>
                    {user?.role !== 'admin' && links.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={label}
                            to={to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${isActive
                                    ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-main)] hover:text-[var(--text-main)]'
                                }`
                            }
                        >
                            <Icon className="w-5 h-5" />
                            {label}
                        </NavLink>
                    ))}

                    {user?.role === 'admin' && (
                        <div className="mt-8">
                            <p className="px-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Admin</p>
                            {adminLinks.map(({ to, icon: Icon, label }) => (
                                <NavLink
                                    key={label}
                                    to={to}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${isActive
                                            ? 'bg-amber-50 text-amber-600'
                                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-main)] hover:text-[var(--text-main)]'
                                        }`
                                    }
                                >
                                    <Icon className="w-5 h-5" />
                                    {label}
                                </NavLink>
                            ))}
                        </div>
                    )}
                </nav>

                {/* User & Logout */}
                <div className="p-4 border-t border-[var(--border-light)]">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-bold text-[var(--text-secondary)] hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </div>
        </aside>
    );
}
