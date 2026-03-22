import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Users } from 'lucide-react';
import {
    LiveKitRoom,
    VideoConference,
    RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';
import API from '../api/axios';
import FeedbackModal from '../components/FeedbackModal'; // Import Modal

export default function VideoRoom() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [roomData, setRoomData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showFeedback, setShowFeedback] = useState(false); // State for feedback modal

    useEffect(() => {
        fetchRoomToken();
    }, [roomId]);

    const fetchRoomToken = async () => {
        try {
            const res = await API.get(`/rooms/${roomId}/token`);
            setRoomData(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load room');
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = () => {
        setShowFeedback(true);
    };

    const handleFeedbackClose = () => {
        setShowFeedback(false);
        navigate('/dashboard');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-[var(--primary)] animate-spin mx-auto mb-4" />
                    <p className="text-[var(--text-secondary)] font-medium">Connecting to room...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
                <div className="text-center">
                    <p className="text-rose-500 font-bold mb-4">{error}</p>
                    <button onClick={() => navigate('/dashboard')} className="btn-primary flex items-center gap-2 mx-auto">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col font-sans relative">
            {/* Header Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="font-bold text-white text-lg leading-tight">
                            {roomData?.topic || 'Group Discussion'}
                        </h1>
                        <p className="text-xs text-slate-400 font-medium">Room: {roomData?.roomName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700">
                    <span className="flex items-center gap-2 text-xs font-bold text-slate-300">
                        <Users className="w-3.5 h-3.5" />
                        {roomData?.participants?.length || 0}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                </div>
            </div>

            {/* LiveKit Video Conference */}
            <div className="flex-1 overflow-hidden relative">
                {roomData?.token && roomData?.serverUrl ? (
                    <LiveKitRoom
                        serverUrl={roomData.serverUrl}
                        token={roomData.token}
                        connect={true}
                        video={true}
                        audio={true}
                        onDisconnected={handleDisconnect}
                        data-lk-theme="default"
                        style={{ height: '100%' }}
                    >
                        <VideoConference />
                        <RoomAudioRenderer />
                    </LiveKitRoom>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center max-w-md p-6 bg-slate-900 rounded-2xl border border-slate-800">
                            <p className="text-slate-400 font-medium">LiveKit credentials not configured.</p>
                            <p className="text-sm text-slate-500 mt-2">Please add your LiveKit API keys to .env</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Feedback Modal */}
            <FeedbackModal
                isOpen={showFeedback}
                onClose={handleFeedbackClose}
                sessionId={roomData?.roomId} // Pass the actual SessionInstance ID
            />
        </div>
    );
}
