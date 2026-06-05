"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Loader2, Award, ArrowRight, CheckCircle, Download } from "lucide-react";
import { toast } from "react-hot-toast";

export default function CourseCompletionPage() {
    const params = useParams();
    const router = useRouter();
    const [generating, setGenerating] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [certificateId, setCertificateId] = useState<string | null>(null);

    const handleGenerate = async () => {
        setGenerating(true);
        const loadingToast = toast.loading("Generating your completion certificate...");
        try {
            const { data } = await api.post(`/certificates/course/${params.courseId}`);
            setCertificateId(data.certificateId);
            setGenerated(true);
            toast.success("Certificate successfully generated and sent to your email!", { id: loadingToast });
        } catch (error: any) {
            console.error("Failed to generate certificate", error);
            toast.error(error.response?.data?.message || "Failed to generate certificate", { id: loadingToast });
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
            <div className="max-w-2xl w-full text-center space-y-12">
                
                <div className="space-y-6">
                    <div className="w-32 h-32 mx-auto rounded-full bg-violet-600/20 border-2 border-violet-500/50 flex items-center justify-center animate-pulse">
                        <Award className="w-16 h-16 text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">Course Completed</h1>
                        <p className="text-zinc-400 text-lg">You've successfully completed all the mandatory modules for this course.</p>
                    </div>
                </div>

                {!generated ? (
                    <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl animate-in slide-in-from-bottom-8">
                        <h2 className="text-2xl font-bold mb-4">Claim Your Reward</h2>
                        <p className="text-zinc-400 mb-8 max-w-md mx-auto">Generate your official completion certificate. It will be emailed to you and permanently stored in your profile dashboard.</p>
                        
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="px-10 py-5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-black italic uppercase tracking-widest rounded-2xl w-full sm:w-auto shadow-2xl flex items-center justify-center gap-4 mx-auto transition-all transform hover:-translate-y-1"
                        >
                            {generating ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" /> Minting Certificate...
                                </>
                            ) : (
                                <>
                                    Generate Certificate <ArrowRight className="w-6 h-6" />
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl animate-in slide-in-from-bottom-4 zoom-in-95">
                        <div className="mb-6">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Certificate Generated</h2>
                        <p className="text-zinc-500 font-mono text-sm tracking-widest mb-8">VERIFICATION ID: {certificateId}</p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => router.push('/student/dashboard')}
                                className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all w-full sm:w-auto"
                            >
                                View Dashboard
                            </button>
                            <a
                                href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '')}/api/v1/certificates/${certificateId}/download`}
                                download
                                className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3 w-full sm:w-auto"
                            >
                                <Download className="w-5 h-5" /> Download
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
