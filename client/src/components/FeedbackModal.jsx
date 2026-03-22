import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, MessageSquare, Send } from 'lucide-react';
import API from '../api/axios';

export default function FeedbackModal({ isOpen, onClose, sessionId }) {
    const [rating, setRating] = useState(0);
    const [comments, setComments] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) return;

        setLoading(true);
        try {
            await API.post('/feedback', {
                sessionId,
                rating,
                comments
            });
            setSubmitted(true);
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            console.error('Feedback failed:', err);
            // Optionally show error, but we usually just close
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                    >
                        {submitted ? (
                            <div className="p-10 text-center">
                                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Send className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
                                <p className="text-gray-500">Your feedback helps us improve.</p>
                            </div>
                        ) : (
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-gray-900">Session Feedback</h3>
                                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-400">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="text-center">
                                        <label className="block text-sm font-medium text-gray-500 mb-3">
                                            How would you rate this session?
                                        </label>
                                        <div className="flex items-center justify-center gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setRating(star)}
                                                    className={`p-1 transition-all ${rating >= star ? 'text-amber-400 scale-110' : 'text-gray-300 hover:text-amber-200'}`}
                                                >
                                                    <Star className="w-8 h-8 fill-current" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Additional Comments (Optional)
                                        </label>
                                        <div className="relative">
                                            <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                            <textarea
                                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[100px] resize-none"
                                                placeholder="Share your thoughts..."
                                                value={comments}
                                                onChange={(e) => setComments(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || rating === 0}
                                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${loading || rating === 0
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                                            }`}
                                    >
                                        {loading ? 'Submitting...' : 'Submit Feedback'}
                                    </button>
                                </form>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
