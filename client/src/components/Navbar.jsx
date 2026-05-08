import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const pageTitles = {
    '/dashboard': { title: 'Dashboard', sub: 'Browse and join GD sessions' },
    '/admin/dashboard': { title: 'Admin Dashboard', sub: 'Platform analytics and management' },
    '/history': { title: 'Session History', sub: 'Your past discussions' },
};

export default function Navbar() {
    const { user } = useAuth();
    const location = useLocation();

    const page = Object.entries(pageTitles).find(([path]) =>
        location.pathname.startsWith(path)
    );
    const { title, sub } = page?.[1] || { title: 'GD Platform', sub: '' };

    return (
        <header
            className="h-16 px-8 flex items-center justify-between flex-shrink-0 border-b"
            style={{
                background: 'white',
                borderColor: 'var(--border)',
                boxShadow: 'var(--shadow-xs)',
            }}
        >
            {/* Page Title */}
            <div>
                <h1 className="text-lg font-bold leading-tight" style={{ color: 'var(--text-main)' }}>
                    {title}
                </h1>
                {sub && (
                    <p className="text-xs font-medium leading-tight mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {sub}
                    </p>
                )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
                {/* Avatar */}
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
                >
                    {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                </div>
            </div>
        </header>
    );
}
