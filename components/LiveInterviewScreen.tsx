import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { aiRecruiterService } from '../services/geminiService';
import { LIVE_INTERVIEWER_PERSONA } from '../constants';
import { TranscriptEntry, User } from '../types';
import { RobotIcon, VolumeUpIcon, XIcon, MicrophoneIcon, ScreenShareIcon, ExclamationTriangleIcon } from './icons';

interface MediaStreams {
    camera: MediaStream;
    screen: MediaStream;
}
interface LiveInterviewScreenProps {
    mediaStreams: MediaStreams | null;
    onEndInterview: (transcript: TranscriptEntry[], code: string, videoUrl: string) => void;
    jobDescription: string;
    resumeText: string;
    onRestart: () => void;
    currentUser: User | null;
}

type AiStatus = "Idle" | "Listening" | "Thinking" | "Speaking";

const AiStatusIndicator: React.FC<{ status: AiStatus }> = ({ status }) => {
    const statusConfig = {
        Idle: { icon: RobotIcon, text: "AI is Idle", color: "text-slate-400", iconClass: "" },
        Listening: { icon: MicrophoneIcon, text: "Listening...", color: "text-blue-400", iconClass: "animate-pulse" },
        Thinking: { icon: RobotIcon, text: "Thinking...", color: "text-purple-400", iconClass: "animate-spin" },
        Speaking: { icon: VolumeUpIcon, text: "Speaking...", color: "text-green-400", iconClass: "" },
    };

    const { icon: Icon, text, color, iconClass } = statusConfig[status];

    return (
        <div className={`flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700`}>
            <Icon className={`w-5 h-5 ${color} ${iconClass}`} />
            <span className={`text-sm font-medium ${color}`}>{text}</span>
        </div>
    );
};


const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

type LiveSession = Awaited<ReturnType<typeof ai.live.connect>>;

// Audio utility functions
const decode = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
};

const encode = (bytes: Uint8Array) => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
}

const CheatingWarningModal: React.FC = () => (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-500/20 border-2 border-yellow-400 text-yellow-200 px-8 py-4 rounded-lg shadow-2xl z-50 animate-fade-in">
        <p className="text-lg font-bold">Warning: Please do not use your mobile phone.</p>
    </div>
);

const TerminationModal: React.FC<{ onConfirmEnd: () => void }> = ({ onConfirmEnd }) => (
    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-4 z-50 animate-fade-in">
        <h2 className="text-3xl font-bold text-red-500 mb-4">Interview Terminated</h2>
        <p className="text-slate-300 mb-8">The interview has been terminated due to repeated policy violations.</p>
        <button onClick={onConfirmEnd} className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors">
            Return to Setup
        </button>
    </div>
);

const ProctoringWarning: React.FC<{ text: string }> = ({ text }) => (
    <div className="bg-yellow-900/50 border border-yellow-600 backdrop-blur-md text-yellow-200 px-3 py-2 rounded-lg text-sm flex items-center gap-2 animate-fade-in shadow-lg">
        <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
        <span>{text}</span>
    </div>
);


const LiveInterviewScreen: React.FC<LiveInterviewScreenProps> = ({ mediaStreams, onEndInterview, jobDescription, resumeText, onRestart, currentUser }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const webcamCanvasRef = useRef<HTMLCanvasElement>(null);
    
    const sessionRef = useRef<LiveSession | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const proctoringIntervalRef = useRef<number | null>(null);
    const proctoringAudioIntervalRef = useRef<number | null>(null);
    const speechDetectionTimeoutRef = useRef<number | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<globalThis.Blob[]>([]);


    const [questionCount, setQuestionCount] = useState(1);
    const [aiStatus, setAiStatus] = useState<AiStatus>("Thinking");
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [volume, setVolume] = useState(1);
    const [code, setCode] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    
    const [warningCount, setWarningCount] = useState(0);
    const [showCheatingWarning, setShowCheatingWarning] = useState(false);
    const [isTerminated, setIsTerminated] = useState(false);
    const [isAbsenceWarningActive, setIsAbsenceWarningActive] = useState(false);
    
    const [proctoringIssues, setProctoringIssues] = useState({
        gaze: false,
        quality: '',
        noise: false,
    });

    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef(new Set<AudioBufferSourceNode>());

    useEffect(() => {
        if (mediaStreams?.camera) {
            mediaStreams.camera.getAudioTracks().forEach(track => {
                track.enabled = !isMuted;
            });
        }
    }, [isMuted, mediaStreams]);

    const handleToggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);

    const cleanup = useCallback(() => {
        if (proctoringIntervalRef.current) clearInterval(proctoringIntervalRef.current);
        if (proctoringAudioIntervalRef.current) clearInterval(proctoringAudioIntervalRef.current);
        if (speechDetectionTimeoutRef.current) clearTimeout(speechDetectionTimeoutRef.current);
        if (scriptProcessorRef.current) scriptProcessorRef.current.disconnect();
        if (mediaStreamSourceRef.current) mediaStreamSourceRef.current.disconnect();
        if (inputAudioContextRef.current?.state !== 'closed') inputAudioContextRef.current?.close();
        if (outputAudioContextRef.current?.state !== 'closed') outputAudioContextRef.current?.close();
        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        if (sessionRef.current) sessionRef.current.close();
        
        scriptProcessorRef.current = null;
        mediaStreamSourceRef.current = null;
        sessionRef.current = null;

    }, []);
    
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    const speakWarning = useCallback((text: string, onEndCallback: () => void) => {
        if ('speechSynthesis' in window && text) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            utterance.pitch = 1.1;
            utterance.volume = 1; // Louder
            utterance.onend = onEndCallback;
            utterance.onerror = (event) => {
                console.error('SpeechSynthesis Error', event);
                onEndCallback();
            };
            window.speechSynthesis.speak(utterance);
        } else {
            console.warn('Speech synthesis not supported.');
            onEndCallback();
        }
    }, []);

    const handleCheatingDetected = useCallback(() => {
        setWarningCount(prev => {
            const newCount = prev + 1;
            if (newCount === 1) {
                setShowCheatingWarning(true);
                setTimeout(() => setShowCheatingWarning(false), 5000);
            } else if (newCount >= 2) {
                setIsTerminated(true);
            }
            return newCount;
        });
    }, []);

    const runProctoringCheck = useCallback(async () => {
        if (isTerminated || document.hidden || !videoRef.current || !webcamCanvasRef.current) return;
        
        const canvas = webcamCanvasRef.current;
        const video = videoRef.current;
        if (video.readyState < 2) return; // Wait for video to be ready
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
        
        if (!base64Image) return;

        const result = await aiRecruiterService.analyzeFrame(base64Image, 'webcam');
        
        if (result.cheating_detected) {
            handleCheatingDetected();
        }

        if (result.candidate_absent) {
            if (!isAbsenceWarningActive) {
                setIsAbsenceWarningActive(true);
                if (isMuted) handleToggleMute(); 
                speakWarning("Please sit before the camera and continue the interview.", () => {
                    setIsAbsenceWarningActive(false);
                });
            }
        }

        setProctoringIssues(prev => ({
            ...prev,
            gaze: result.eye_contact_deviation,
            quality: result.video_quality_issue ? result.video_quality_reason : '',
        }));

    }, [isTerminated, handleCheatingDetected, speakWarning, isAbsenceWarningActive, isMuted, handleToggleMute]);

    useEffect(() => {
        if (videoRef.current && mediaStreams?.camera) videoRef.current.srcObject = mediaStreams.camera;
        
        if (mediaStreams?.camera) {
            // Start video recording
            try {
                recordedChunksRef.current = [];
                const recorder = new MediaRecorder(mediaStreams.camera, { mimeType: 'video/webm' });
                mediaRecorderRef.current = recorder;
                
                recorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        recordedChunksRef.current.push(event.data);
                    }
                };
                
                recorder.start();
                console.log("Recording started.");
            } catch (e) {
                console.error("Error starting MediaRecorder:", e);
            }

            proctoringIntervalRef.current = window.setInterval(runProctoringCheck, 15000);
            
            const systemInstruction = `${LIVE_INTERVIEWER_PERSONA}\n\n---JOB DESCRIPTION---\n${jobDescription}\n\n---RESUME---\n${resumeText}`;
            
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: { 
                    systemInstruction, 
                    responseModalities: [Modality.AUDIO], 
                    inputAudioTranscription: {}, 
                    outputAudioTranscription: {} 
                },
                callbacks: {
                    onopen: () => {
                        console.log('Session opened.');
                        if (!inputAudioContextRef.current) inputAudioContextRef.current = new (window.AudioContext)({ sampleRate: 16000 });
                        const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreams.camera);
                        mediaStreamSourceRef.current = source;
                        const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            // FIX: Removed explicit Blob type annotation to avoid conflict with native Blob type.
                            const pcmBlob = {
                                data: encode(new Uint8Array(new Int16Array(inputData.map(f => f * 32768)).buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContextRef.current.destination);

                        // Client-side audio proctoring
                        const audioContext = inputAudioContextRef.current;
                        const analyser = audioContext.createAnalyser();
                        analyser.fftSize = 256;
                        const bufferLength = analyser.frequencyBinCount;
                        const dataArray = new Uint8Array(bufferLength);
                        source.connect(analyser);
                        
                        proctoringAudioIntervalRef.current = window.setInterval(() => {
                            analyser.getByteFrequencyData(dataArray);
                            const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
                            if (average > 35) { // Threshold for background noise
                                setProctoringIssues(prev => ({...prev, noise: true}));
                            } else {
                                setProctoringIssues(prev => ({...prev, noise: false}));
                            }
                        }, 2000);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (isTerminated) return;
                        
                        if (message.serverContent?.inputTranscription) {
                            if (speechDetectionTimeoutRef.current) clearTimeout(speechDetectionTimeoutRef.current);
                            setAiStatus("Listening");
                            speechDetectionTimeoutRef.current = window.setTimeout(() => {
                                setAiStatus("Thinking");
                            }, 1500);

                            const text = message.serverContent.inputTranscription.text;
                            setTranscript(prev => {
                                const last = prev[prev.length - 1];
                                if (last?.speaker === 'user') return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                                return [...prev, { speaker: 'user', text, timestamp: videoRef.current?.currentTime }];
                            });
                        }
                        if (message.serverContent?.outputTranscription) {
                             if (speechDetectionTimeoutRef.current) clearTimeout(speechDetectionTimeoutRef.current);
                            setAiStatus("Speaking");
                            const text = message.serverContent.outputTranscription.text;
                             setTranscript(prev => {
                                const last = prev[prev.length - 1];
                                if (last?.speaker === 'ai') return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                                return [...prev, { speaker: 'ai', text, timestamp: videoRef.current?.currentTime }];
                            });
                        }
                        if (message.serverContent?.turnComplete) {
                            setAiStatus("Idle");
                            setQuestionCount(prev => prev + 1);
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio) {
                            if (!outputAudioContextRef.current) outputAudioContextRef.current = new (window.AudioContext)({ sampleRate: 24000 });
                            const ctx = outputAudioContextRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), ctx);
                            const source = ctx.createBufferSource();
                            source.buffer = audioBuffer;
                            const gainNode = ctx.createGain();
                            gainNode.gain.value = volume;
                            source.connect(gainNode);
                            gainNode.connect(ctx.destination);
                            
                            source.addEventListener('ended', () => audioSourcesRef.current.delete(source));
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            audioSourcesRef.current.add(source);
                        }
                    },
                    onerror: (e) => console.error("Session error:", e),
                    onclose: () => console.log('Session closed.'),
                }
            });
            sessionPromise.then(session => sessionRef.current = session);
        }
        return () => cleanup();
    }, [mediaStreams, jobDescription, resumeText, volume, cleanup, runProctoringCheck, isTerminated]);

    const handleEnd = async () => {
        // Converts a Blob to a base64 data URL for persistent storage
        // FIX: Changed blob parameter type to globalThis.Blob to match the native Blob type expected by FileReader.
        const blobToDataUrl = (blob: globalThis.Blob) => new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    
        const videoPromise = new Promise<string>((resolve) => {
            if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
                resolve(''); // Not recording, so no URL to return
                return;
            }
    
            mediaRecorderRef.current.onstop = async () => {
                const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                if (videoBlob.size === 0) {
                    resolve(''); // No data was recorded
                    return;
                }
                try {
                    const dataUrl = await blobToDataUrl(videoBlob);
                    console.log("Recording stopped. Data URL generated for persistent storage.");
                    resolve(dataUrl);
                } catch (error) {
                    console.error("Error converting recorded video to data URL:", error);
                    resolve(''); // Resolve with empty string on error
                }
            };
    
            mediaRecorderRef.current.stop();
        });
    
        const videoUrl = await videoPromise;
        cleanup();
        onEndInterview(transcript, code, videoUrl);
    };

    if (isTerminated) {
        return <TerminationModal onConfirmEnd={onRestart} />;
    }

    return (
        <div className="h-screen w-full flex flex-col text-white p-4 gap-4 animate-fade-in relative bg-[#0f172a]">
            <canvas ref={webcamCanvasRef} style={{ display: 'none' }}></canvas>
            {showCheatingWarning && <CheatingWarningModal />}

            {/* Header */}
             <header className="relative flex-shrink-0 flex items-center h-8">
                <div className="flex-1">
                    <h2 className="text-lg font-bold text-slate-200">Live Interview for {currentUser?.name || 'Candidate'} - Question {questionCount} of ~5</h2>
                </div>
                <div className="absolute left-1/2 -translate-x-1/2">
                    <button onClick={onRestart} className="text-slate-500 hover:text-white transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-1 flex justify-end">
                    <button onClick={onRestart} className="px-3 py-1 text-sm font-medium text-slate-300 bg-slate-950 border border-slate-700 rounded-md hover:bg-slate-800 transition-colors">
                        Leave full screen
                    </button>
                </div>
            </header>
            
            {/* Main Content */}
            <div className="flex-1 flex gap-4 min-h-0">
                {/* Left Pane */}
                <div className="flex-[2] flex flex-col gap-4">
                     {/* Video Container */}
                    <div className="flex-1 bg-black rounded-lg shadow-2xl border border-slate-700 relative min-h-0">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-lg" />
                        <div className="absolute top-4 left-4 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <div className="flex items-center gap-2 bg-black/50 text-white px-3 py-1 rounded-md text-sm font-semibold animate-pulse-live backdrop-blur-sm border border-white/20">
                                <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
                                LIVE
                            </div>
                             <div className="flex items-center gap-2 bg-black/50 text-white px-3 py-1 rounded-md text-sm font-semibold backdrop-blur-sm border border-white/20">
                                <span className="relative flex h-3 w-3"><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
                                RECORDING
                            </div>
                            {mediaStreams?.screen && (
                                <div className="flex items-center gap-2 bg-black/50 text-sky-300 px-3 py-1 rounded-md text-sm font-semibold backdrop-blur-sm border border-white/20">
                                    <ScreenShareIcon className="w-4 h-4" />
                                    <span>Screen Sharing Active</span>
                                </div>
                            )}
                        </div>
                         {/* Proctoring Warnings Display */}
                        <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-10 max-w-sm">
                            {proctoringIssues.quality && <ProctoringWarning text={`Video Quality: ${proctoringIssues.quality}`} />}
                            {proctoringIssues.gaze && <ProctoringWarning text="Please maintain focus on the screen." />}
                            {proctoringIssues.noise && <ProctoringWarning text="Excessive background noise detected." />}
                        </div>
                    </div>
                     {/* Code Editor */}
                    <div className="h-48 flex flex-col">
                        <div className="bg-slate-800 text-slate-400 px-3 py-1 rounded-t-md text-xs font-mono">Python Code Editor (for coding challenges)</div>
                        <textarea 
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="The AI will instruct you when to use this editor." 
                            className="w-full flex-1 bg-slate-900 border border-t-0 border-slate-700 rounded-b-md p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-200 placeholder-slate-500 font-mono text-sm resize-none" />
                    </div>
                </div>

                {/* Right Pane */}
                <div className="flex-[1] flex flex-col">
                     {/* Transcript */}
                    <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg flex flex-col min-h-0">
                        <h3 className="text-lg font-semibold p-4 border-b border-slate-700">Transcript</h3>
                        <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
                           {transcript.map((entry, index) => (
                               <div key={index} className={`flex w-full ${entry.speaker === 'user' ? 'justify-start' : 'justify-end'}`}>
                                   <div className={`px-4 py-2 rounded-xl max-w-[90%] ${entry.speaker === 'user' ? 'bg-slate-700 text-slate-300 rounded-bl-none' : 'bg-blue-600 text-white rounded-br-none'}`}>
                                      <p className="text-sm whitespace-pre-wrap">{entry.text}</p>
                                   </div>
                               </div>
                           ))}
                           <div ref={transcriptEndRef} />
                        </div>
                    </div>
                     {/* Controls */}
                    <div className="flex-shrink-0 flex items-center justify-between gap-3 p-2">
                        <AiStatusIndicator status={aiStatus} />
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <VolumeUpIcon className="w-5 h-5 text-slate-400"/>
                                <input type="range" min="0" max="2" step="0.1" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} className="w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"/>
                            </div>
                            <button
                                onClick={handleToggleMute}
                                aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                                title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                                className={`p-2.5 rounded-full border transition-colors ${
                                    isMuted 
                                    ? 'bg-red-600 border-red-500 hover:bg-red-700' 
                                    : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                                }`}
                            >
                                <MicrophoneIcon className="w-5 h-5 text-slate-300" isMuted={isMuted} />
                            </button>
                             <button onClick={handleEnd} className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-lg text-sm hover:bg-red-700 transition-colors">
                                End
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveInterviewScreen;