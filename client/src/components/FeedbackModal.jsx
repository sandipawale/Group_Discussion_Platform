import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, MessageSquare, CheckCircle2 } from 'lucide-react';
import API from '../api/axios';

export default function FeedbackModal({ isOpen, onClose, sessionId }) {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comments, setComments] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) return;
        setLoading(true);
        try {
            await API.post('/feedback', { sessionId, rating, comments });
            setSubmitted(true);
            timerRef.current = setTimeout(() => onClose(), 1800);
        } catch (err) {
            console.error('Feedback failed:', err);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="w-full max-w-md rounded-2xl overflow-hidden"
                        style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-lg)' }}
                    >
                        {submitted ? (
                            <div className="p-12 text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                                    style={{ background: 'var(--success-light)' }}
                                >
                                    <CheckCircle2 className="w-8 h-8" style={{ color: 'var(--success)' }} />
                                </motion.div>
                                <h3 className="text-xl font-extrabold mb-2" style={{ color: 'var(--text-main)' }}>
                                    Thank You!
                                </h3>
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                    Your feedback helps us improve.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b"
                                    style={{ borderColor: 'var(--border)' }}>
                                    <div>
                                        <h3 className="font-bold text-base" style={{ color: 'var(--text-main)' }}>
                                            Session Feedback
                                        </h3>
                                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                            Rate your experience in this GD session
                                        </p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                                        style={{ color: 'var(--text-muted)' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                    {/* Star Rating */}
                                    <div className="text-center">
                                        <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
                                            How would you rate this session?
                                        </p>
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setRating(star)}
                                                    onMouseEnter={() => setHover(star)}
                                                    onMouseLeave={() => setHover(0)}
                                                    className="transition-transform duration-100"
                                                    style={{
                                                        transform: (hover || rating) >= star ? 'scale(1.15)' : 'scale(1)',
                                                        color: (hover || rating) >= star ? '#f59e0b' : 'var(--border)',
                                                    }}
                                                >
                                                    <Star className="w-9 h-9 fill-current" />
                                                </button>
                                            ))}
                                        </div>
                                        {(hover || rating) > 0 && (
                                            <motion.p
                                                key={hover || rating}
                                                initial={{ opacity: 0, y: -4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-xs font-bold"
                                                style={{ color: '#f59e0b' }}
                                            >
                                                {ratingLabels[hover || rating]}
                                            </motion.p>
                                        )}
                                    </div>

                                    {/* Comments */}
                                    <div>
                                        <label className="label">Additional Comments <span style={{ color: 'var(--text-muted)' }}>(Optional)</span></label>
                                        <div className="relative">
                                            <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 pointer-events-none"
                                                style={{ color: 'var(--text-muted)' }} />
                                            <textarea
                                                className="input"
                                                style={{ paddingLeft: '2.5rem', minHeight: '100px', resize: 'none' }}
                                                placeholder="Share your thoughts about the session…"
                                                value={comments}
                                                onChange={(e) => setComments(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || rating === 0}
                                        className="btn-primary w-full py-3 text-sm"
                                        style={loading || rating === 0 ? {
                                            background: 'var(--bg-subtle)',
                                            color: 'var(--text-muted)',
                                            boxShadow: 'none',
                                            cursor: rating === 0 ? 'default' : 'wait',
                                        } : {}}
                                    >
                                        {loading ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : 'Submit Feedback'}
                                    </button>
                                </form>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
