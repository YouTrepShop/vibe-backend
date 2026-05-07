import { useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video as VideoIcon, VideoOff, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallStore } from '@/stores/callStore';
import { Avatar } from '@/components/ui/Avatar';
import { getSocket } from '@/services/socket';
import { api } from '@/services/api';

export function CallOverlay() {
  const status = useCallStore((s) => s.status);
  const callId = useCallStore((s) => s.callId);
  const type = useCallStore((s) => s.type);
  const remote = useCallStore((s) => s.remoteUser);
  const localStream = useCallStore((s) => s.localStream);
  const remoteStream = useCallStore((s) => s.remoteStream);
  const micOn = useCallStore((s) => s.micEnabled);
  const camOn = useCallStore((s) => s.cameraEnabled);
  const setStatus = useCallStore((s) => s.setStatus);
  const setCall = useCallStore((s) => s.setCall);
  const reset = useCallStore((s) => s.reset);

  const localRef = useRef<HTMLVideoElement | null>(null);
  const remoteRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    if (localRef.current && localStream) localRef.current.srcObject = localStream;
  }, [localStream]);
  useEffect(() => {
    if (remoteRef.current && remoteStream) remoteRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    if (status === 'idle' || status === 'ended') return;
    const sock = getSocket();
    if (!sock) return;
    const socket = sock;

    let pc: RTCPeerConnection;
    let mounted = true;

    async function setup() {
      const ice = await api.get('/calls/ice').then((r) => r.data.data);
      pc = new RTCPeerConnection({ iceServers: ice.iceServers });
      pcRef.current = pc;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'VIDEO',
        audio: true,
      });
      if (!mounted) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      setCall({ localStream: stream });

      const remoteStream = new MediaStream();
      pc.ontrack = (e) => {
        e.streams[0]?.getTracks().forEach((t) => remoteStream.addTrack(t));
        setCall({ remoteStream });
      };
      pc.onicecandidate = (e) => {
        if (e.candidate && remote) socket.emit('webrtc:ice', { toUserId: remote.id, candidate: e.candidate });
      };

      if (status === 'outgoing' && remote) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc:offer', { toUserId: remote.id, offer });
      }
    }
    setup().catch(() => {});

    socket.on('webrtc:offer', async ({ from, offer }: { from: { id: string }; offer: RTCSessionDescriptionInit }) => {
      if (!pcRef.current) return;
      await pcRef.current.setRemoteDescription(offer);
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socket.emit('webrtc:answer', { toUserId: from.id, answer });
      setStatus('ongoing');
    });
    socket.on('webrtc:answer', async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      if (!pcRef.current) return;
      await pcRef.current.setRemoteDescription(answer);
      setStatus('ongoing');
    });
    socket.on('webrtc:ice', async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      try { await pcRef.current?.addIceCandidate(candidate); } catch { /* ignore */ }
    });
    socket.on('call:hangup', () => hangup(false));

    return () => {
      mounted = false;
      socket.off('webrtc:offer');
      socket.off('webrtc:answer');
      socket.off('webrtc:ice');
      socket.off('call:hangup');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function hangup(emit = true) {
    if (emit && remote) getSocket()?.emit('call:hangup', { toUserId: remote.id });
    pcRef.current?.close();
    pcRef.current = null;
    localStream?.getTracks().forEach((t) => t.stop());
    if (callId && callId !== 'pending') api.post(`/calls/${callId}/end`).catch(() => {});
    reset();
  }

  function accept() {
    if (!remote) return;
    getSocket()?.emit('call:accept', { toUserId: remote.id });
    setStatus('ongoing');
  }

  function toggleMic() {
    localStream?.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setCall({ micEnabled: !micOn });
  }
  function toggleCam() {
    localStream?.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setCall({ cameraEnabled: !camOn });
  }
  async function shareScreen() {
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) await sender.replaceTrack(screen.getVideoTracks()[0]!);
    } catch { /* ignore */ }
  }

  return (
    <AnimatePresence>
      {status !== 'idle' && status !== 'ended' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/95 grid place-items-center"
        >
          <div className="relative w-full h-full">
            {type === 'VIDEO' && (
              <>
                <video ref={remoteRef} autoPlay playsInline className="w-full h-full object-cover" />
                <video ref={localRef} autoPlay playsInline muted className="absolute right-4 top-4 w-32 h-44 sm:w-40 sm:h-56 rounded-2xl object-cover bg-black border border-white/10" />
              </>
            )}
            {(type === 'AUDIO' || !remoteStream) && (
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <Avatar src={remote?.avatarUrl} name={remote?.fullName || remote?.username} size={120} ring />
                  <div className="text-white text-2xl font-bold mt-4">{remote?.fullName || remote?.username}</div>
                  <div className="text-white/70 mt-1">
                    {status === 'incoming' && 'Входящий звонок…'}
                    {status === 'outgoing' && 'Звоним…'}
                    {status === 'ongoing' && 'В разговоре'}
                  </div>
                </div>
              </div>
            )}

            <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4">
              <button onClick={toggleMic} className={`w-14 h-14 rounded-full grid place-items-center text-white ${micOn ? 'bg-white/15' : 'bg-red-500'}`}>
                {micOn ? <Mic size={22} /> : <MicOff size={22} />}
              </button>
              {type === 'VIDEO' && (
                <button onClick={toggleCam} className={`w-14 h-14 rounded-full grid place-items-center text-white ${camOn ? 'bg-white/15' : 'bg-red-500'}`}>
                  {camOn ? <VideoIcon size={22} /> : <VideoOff size={22} />}
                </button>
              )}
              {type === 'VIDEO' && (
                <button onClick={shareScreen} className="w-14 h-14 rounded-full grid place-items-center text-white bg-white/15">
                  <Monitor size={20} />
                </button>
              )}
              {status === 'incoming' && (
                <button onClick={accept} className="w-16 h-16 rounded-full grid place-items-center bg-emerald-500 text-white">
                  <Phone size={24} />
                </button>
              )}
              <button onClick={() => hangup()} className="w-16 h-16 rounded-full grid place-items-center bg-red-500 text-white">
                <PhoneOff size={24} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
