import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BarChart3, LogOut, MessageSquare, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const studentLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
];

const adminLinks = [
    { to: '/admin/dashboard', icon: BarChart3, label: 'Analytics Hub' },
];

export default function Sidebar() {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const links = user?.role === 'admin' ? adminLinks : studentLinks;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'U';

    return (
        <aside
            className="w-64 h-screen flex-shrink-0 flex flex-col"
            style={{ background: 'var(--sidebar-bg)' }}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 h-16 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--primary)' }}
                >
                    <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div className="leading-tight">
                    <p className="text-white font-bold text-sm tracking-tight">GD Platform</p>
                    <p className="text-xs font-medium" style={{ color: 'var(--sidebar-text)' }}>
                        {user?.role === 'admin' ? 'Admin Console' : 'Student Portal'}
                    </p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-4 px-3 overflow-y-auto">
                <p
                    className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: 'var(--sidebar-text)', opacity: 0.5 }}
                >
                    Navigation
                </p>
                <div className="space-y-0.5">
                    {links.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                                    isActive
                                        ? 'text-white'
                                        : ''
                                }`
                            }
                            style={({ isActive }) => ({
                                background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                                color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                            })}
                            onMouseEnter={e => {
                                if (!e.currentTarget.getAttribute('aria-current')) {
                                    e.currentTarget.style.background = 'var(--sidebar-hover-bg)';
                                }
                            }}
                            onMouseLeave={e => {
                                if (!e.currentTarget.getAttribute('aria-current')) {
                                    e.currentTarget.style.background = '';
                                }
                            }}
                        >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="flex-1">{label}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>

            {/* User footer */}
            <div className="p-3 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
                <div
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1"
                    style={{ background: 'var(--sidebar-hover-bg)' }}
                >
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
                    >
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold leading-tight truncate">
                            {user?.name || 'Student'}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--sidebar-text)' }}>
                            {user?.email}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                    style={{ color: 'var(--sidebar-text)' }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                        e.currentTarget.style.color = '#f87171';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--sidebar-text)';
                    }}
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
