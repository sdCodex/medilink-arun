import React, { useRef, useEffect, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, RefreshCw, Copy, ExternalLink, ShieldAlert, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const QRScanner = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [scannedResult, setScannedResult] = useState(null);
    const [isScanning, setIsScanning] = useState(true);
    const [hasPermission, setHasPermission] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        let animationFrameId;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');

        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                if (video) {
                    video.srcObject = stream;
                    setHasPermission(true);
                }
            } catch (err) {
                console.error("Camera access denied:", err);
                setHasPermission(false);
                toast.error("Camera permission denied. Please enable it to scan QR.");
            }
        };

        const scan = () => {
            if (video && video.readyState === video.HAVE_ENOUGH_DATA && context && isScanning) {
                canvas.height = video.videoHeight;
                canvas.width = video.videoWidth;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });

                if (code) {
                    setScannedResult(code.data);
                    setIsScanning(false);
                    toast.success("QR Code Detected!");

                    // Logic for auto-redirecting to emergency page
                    if (code.data.includes('/emergency')) {
                        try {
                            const url = new URL(code.data);
                            navigate(`${url.pathname}${url.search}`);
                        } catch (e) {
                            // Fallback if URL constructor fails (e.g. relative path)
                            const match = code.data.match(/\/emergency\?.*$/);
                            if (match) navigate(match[0]);
                        }
                    } else if (code.data.startsWith('http')) {
                        // For other patient URLs or manual redirect
                        window.location.href = code.data;
                    }
                }
            }
            if (isScanning) {
                animationFrameId = requestAnimationFrame(scan);
            }
        };

        if (isScanning) {
            startCamera();
            animationFrameId = requestAnimationFrame(scan);
        }

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            if (video && video.srcObject) {
                const tracks = video.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, [isScanning, navigate]);

    const handleReset = () => {
        setScannedResult(null);
        setIsScanning(true);
    };

    const copyToClipboard = () => {
        if (scannedResult) {
            navigator.clipboard.writeText(scannedResult);
            toast.info("Copied to clipboard!");
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 flex flex-col items-center justify-center font-sans">
            <div className="max-w-md w-full space-y-8">
                <header className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                        <ShieldAlert size={14} /> Emergency Scanner
                    </div>
                    <h1 className="text-3xl font-black tracking-tight">Access Medical Records</h1>
                    <p className="text-slate-400 text-sm">Scan the patient's Health Card QR code to view critical life-saving information.</p>
                </header>

                <main className="relative aspect-square w-full max-w-[400px] mx-auto overflow-hidden rounded-[2.5rem] bg-black shadow-2xl border-4 border-slate-800">
                    {hasPermission === false && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-4">
                            <X className="text-red-500" size={48} />
                            <p className="text-slate-400">Camera access is required. Please check your browser permissions.</p>
                        </div>
                    )}

                    {isScanning ? (
                        <>
                            <video
                                ref={videoRef}
                                className="h-full w-full object-cover"
                                autoPlay
                                playsInline
                            />
                            {/* Scanning Overlays */}
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute inset-[15%] border-2 border-green-500/50 rounded-3xl">
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-xl transition-all" />
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-xl transition-all" />
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-xl transition-all" />
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-xl transition-all" />

                                    {/* Scan Line Animation */}
                                    <motion.div
                                        animate={{ top: ['0%', '100%', '0%'] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        className="absolute left-0 right-0 h-1 bg-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.5)] z-10"
                                    />
                                </div>
                                <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] mask-rect-center" />
                            </div>
                        </>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-6 bg-slate-800/50 backdrop-blur-xl">
                            <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-2">
                                <Camera size={40} />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold">QR Detected</h3>
                                <p className="text-slate-300 text-xs font-mono break-all bg-black/30 p-4 rounded-xl border border-white/5">{scannedResult}</p>
                            </div>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={copyToClipboard}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-white/10 transition-all"
                                >
                                    <Copy size={16} /> Copy
                                </button>
                                <button
                                    onClick={() => window.location.href = scannedResult}
                                    className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
                                >
                                    <ExternalLink size={16} /> Open
                                </button>
                            </div>
                        </div>
                    )}
                </main>

                <footer className="text-center space-y-6">
                    <button
                        onClick={handleReset}
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
                    >
                        <RefreshCw size={18} className={isScanning ? "animate-spin-slow" : ""} /> Rescan QR Code
                    </button>

                    <div className="pt-8 border-t border-white/5 opacity-50 flex flex-col items-center gap-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">MedLink Secure Node</p>
                    </div>
                </footer>
            </div>

            <canvas ref={canvasRef} hidden />
        </div>
    );
};

export default QRScanner;
