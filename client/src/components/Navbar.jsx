import { Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user } = useAuth();

    return (
        <header className="h-20 px-8 flex items-center justify-between bg-[var(--bg-main)]/80 backdrop-blur-md sticky top-0 z-30 border-b border-[var(--border-light)]">
            <div>
                <h1 className="text-2xl font-bold text-[var(--text-main)]">
                    Hello, <span className="text-[var(--primary)]">{user?.name?.split(' ')[0] || 'Student'}</span>
                </h1>
                <p className="text-sm text-[var(--text-muted)] font-medium">Ready to learn today?</p>
            </div>

            {/* Reputation Badge */}
            <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-[var(--border-light)] shadow-sm">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Reputation</span>
                    <span className="text-sm font-bold text-[var(--text-main)] leading-none">{user?.reputationScore || 50} pts</span>
                </div>
            </div>
        </header>
    );
}
