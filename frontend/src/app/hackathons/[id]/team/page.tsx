"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { NavBar } from "@/components/landing/NavBar";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
    Loader2, Trophy, Clock, Github, Video, FileText, Upload,
    CheckCircle2, AlertCircle, History, ChevronRight, ArrowLeft,
    ExternalLink, Timer, Zap, ShieldCheck
} from "lucide-react";
import { toast } from 'react-hot-toast';
import { Countdown } from "@/components/hackathons/Countdown";

interface Team {
    id: string;
    name: string;
    status: string;
    leadId: string;
}

interface Round {
    id: string;
    roundNumber: number;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    status: 'upcoming' | 'active' | 'judging' | 'closed';
    allowZip: boolean;
    allowGithub: boolean;
    allowVideo: boolean;
    allowDescription: boolean;
    maxFileSizeMb: number;
}

interface Submission {
    id: string;
    versionNumber: number;
    submittedAt: string;
    zipUrl?: string;
    githubLink?: string;
    videoUrl?: string;
    description?: string;
    isFinal: boolean;
}

export default function TeamDashboard() {
    const { id } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [data, setData] = useState<{
        team: Team;
        currentRound: Round | null;
        submissions: Submission[];
        isEliminated: boolean;
    } | null>(null);

    // Form states
    const [githubLink, setGithubLink] = useState("");
    const [videoUrl, setVideoUrl] = useState("");
    const [description, setDescription] = useState("");
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        fetchStatus();
    }, [id]);

    const fetchStatus = async () => {
        try {
            const { data } = await api.get(`/hackathons/${id}/team`);
            const teamId = data.team.id;

            const statusRes = await api.get(`/hackathons/${id}/teams/${teamId}/round-status`);
            setData(statusRes.data);

            // Prefill lead fields if a final submission exists
            const finalSub = statusRes.data.submissions.find((s: Submission) => s.isFinal);
            if (finalSub) {
                setGithubLink(finalSub.githubLink || "");
                setVideoUrl(finalSub.videoUrl || "");
                setDescription(finalSub.description || "");
            }
        } catch (error) {
            toast.error("Failed to sync with Command Central");
            router.push(`/hackathons/${id}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!data?.currentRound) return;

        setSubmitting(true);
        const formData = new FormData();
        formData.append("githubLink", githubLink);
        formData.append("videoUrl", videoUrl);
        formData.append("description", description);
        if (file) formData.append("file", file);

        try {
            await api.post(`/hackathons/teams/${data.team.id}/rounds/${data.currentRound.id}/submit`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Signal transmitted successfully. Gear updated.");
            fetchStatus();
            setFile(null);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Transmission failed");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-fuchsia-500" />
        </div>
    );

    if (!data) return null;

    const { team, currentRound, submissions, isEliminated } = data;

    return (
        <ProtectedRoute allowedRoles={['STUDENT']}>
            <div className="min-h-screen bg-black text-white pb-24">
                <NavBar />

                <main className="container mx-auto px-6 py-32">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
                        <div className="flex items-center gap-6">
                            <button onClick={() => router.back()} className="p-4 bg-zinc-900 hover:bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all">
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <div>
                                <h1 className="text-5xl font-black italic uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-violet-500 leading-none">
                                    Operational Command
                                </h1>
                                <p className="text-zinc-500 mt-2 uppercase text-[10px] font-black tracking-[0.4em]">Squad: {team.name}</p>
                            </div>
                        </div>

                        {currentRound && currentRound.status === 'active' && (
                            <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] flex items-center gap-12 shadow-2xl">
                                <div className="border-r border-zinc-800 pr-12">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-3">Round {currentRound.roundNumber} Deadline</p>
                                    <Countdown targetDate={currentRound.endDate} />
                                </div>
                                <div className="hidden lg:flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                                        <Zap className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Status</p>
                                        <p className="text-xl font-black italic text-emerald-400 uppercase">Live Fire</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid lg:grid-cols-3 gap-12">
                        {/* Left Col: Submission Form */}
                        <div className="lg:col-span-2 space-y-8">
                            {isEliminated ? (
                                <div className="p-12 bg-red-950/20 border border-red-500/20 rounded-[3rem] text-center">
                                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-red-500 mb-2">Eliminated</h2>
                                    <p className="text-zinc-400 max-w-sm mx-auto">Your squad has been withdrawn from active duty. Operational capability: Zero.</p>
                                </div>
                            ) : currentRound?.status === 'active' ? (
                                <section className="p-10 bg-zinc-900 border border-zinc-800 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                                        <Upload className="w-48 h-48" />
                                    </div>

                                    <h2 className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-4 mb-10">
                                        <CheckCircle2 className="w-6 h-6 text-fuchsia-500" />
                                        Inbound Intel Submission
                                    </h2>

                                    <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                                        <div className="grid md:grid-cols-2 gap-8">
                                            {currentRound.allowGithub && (
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                                        <Github className="w-3 h-3" /> Repository Link
                                                    </label>
                                                    <input
                                                        type="url"
                                                        value={githubLink}
                                                        onChange={(e) => setGithubLink(e.target.value)}
                                                        placeholder="https://github.com/..."
                                                        className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-700 focus:border-fuchsia-500/50 outline-none transition-all"
                                                        required
                                                    />
                                                </div>
                                            )}
                                            {currentRound.allowVideo && (
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                                        <Video className="w-3 h-3" /> Demo Link (Loom/Drive)
                                                    </label>
                                                    <input
                                                        type="url"
                                                        value={videoUrl}
                                                        onChange={(e) => setVideoUrl(e.target.value)}
                                                        placeholder="https://..."
                                                        className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-700 focus:border-fuchsia-500/50 outline-none transition-all"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {currentRound.allowDescription && (
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                                    <FileText className="w-3 h-3" /> Mission Report (Description)
                                                </label>
                                                <textarea
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    rows={4}
                                                    placeholder="Detail your progress and implementation strategy..."
                                                    className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-700 focus:border-fuchsia-500/50 outline-none transition-all resize-none"
                                                    required
                                                />
                                            </div>
                                        )}

                                        {currentRound.allowZip && (
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                                    <Upload className="w-3 h-3" /> Codebase Payload (ZIP)
                                                </label>
                                                <div className="relative group/file">
                                                    <input
                                                        type="file"
                                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                                        accept=".zip,.rar,.7z"
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                                    />
                                                    <div className="w-full bg-black border-2 border-dashed border-zinc-800 group-hover/file:border-fuchsia-500/30 rounded-2xl p-8 flex flex-col items-center justify-center transition-all bg-zinc-900/50">
                                                        <Upload className="w-8 h-8 text-zinc-600 mb-2 group-hover/file:scale-110 transition-transform" />
                                                        <p className="text-sm font-bold text-zinc-400">{file ? file.name : "Click or drag archive to transmit"}</p>
                                                        <p className="text-[10px] text-zinc-600 mt-2 uppercase tracking-widest">Max Size: {currentRound.maxFileSizeMb}MB</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full py-6 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-zinc-800 text-white rounded-3xl font-black italic uppercase tracking-widest transition-all shadow-xl shadow-fuchsia-600/20 flex items-center justify-center gap-4 active:scale-95"
                                        >
                                            {submitting ? (
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                            ) : (
                                                <>
                                                    <Zap className="w-5 h-5" />
                                                    Transmit Submission
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </section>
                            ) : (
                                <div className="p-20 bg-zinc-900/50 border border-zinc-800 border-dashed rounded-[3rem] text-center">
                                    <Clock className="w-16 h-16 text-zinc-800 mx-auto mb-6" />
                                    <h3 className="text-2xl font-black italic uppercase text-zinc-500">Signal Blocked</h3>
                                    <p className="text-zinc-600 max-w-sm mx-auto mt-2">
                                        {currentRound ? `Round Status: ${currentRound.status.toUpperCase()}. Submissions only accepted during active engagement.` : "No active missions detected on your radar."}
                                    </p>
                                </div>
                            )}

                            {/* Requirements Grid */}
                            {currentRound && (
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl">
                                        <div className={`p-3 rounded-xl w-fit mb-4 ${currentRound.allowGithub ? 'bg-fuchsia-500/10 text-fuchsia-400' : 'bg-zinc-800 text-zinc-600'}`}>
                                            <Github className="w-5 h-5" />
                                        </div>
                                        <h4 className="text-sm font-black italic uppercase">Repository</h4>
                                        <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">{currentRound.allowGithub ? "Required Signal" : "Optional"}</p>
                                    </div>
                                    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl">
                                        <div className={`p-3 rounded-xl w-fit mb-4 ${currentRound.allowZip ? 'bg-violet-500/10 text-violet-400' : 'bg-zinc-800 text-zinc-600'}`}>
                                            <Upload className="w-5 h-5" />
                                        </div>
                                        <h4 className="text-sm font-black italic uppercase">Code Payload</h4>
                                        <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">{currentRound.allowZip ? "Direct Upload" : "No archives"}</p>
                                    </div>
                                    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl">
                                        <div className={`p-3 rounded-xl w-fit mb-4 ${currentRound.allowVideo ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-600'}`}>
                                            <Video className="w-5 h-5" />
                                        </div>
                                        <h4 className="text-sm font-black italic uppercase">Demo Reel</h4>
                                        <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">{currentRound.allowVideo ? "Supported" : "Not Required"}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Col: Timeline & History */}
                        <div className="space-y-8">
                            {/* Mission Brief */}
                            <div className="p-8 bg-black border border-zinc-800 rounded-[2.5rem]">
                                <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-6">Mission Parameters</h3>
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="w-1.5 h-auto bg-fuchsia-500 rounded-full" />
                                        <div>
                                            <h4 className="font-black italic uppercase">Round {currentRound?.roundNumber || 'X'}</h4>
                                            <p className="text-xs text-zinc-500 leading-relaxed mt-1 font-medium">{currentRound?.title || 'Unknown Ops'}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-zinc-900/50 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-zinc-900 transition-all border border-transparent hover:border-zinc-800" onClick={() => router.push(`/hackathons/${id}`)}>
                                        <div className="flex items-center gap-3">
                                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                            <span className="text-xs font-bold text-zinc-300">Full Mission intel</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>

                            {/* Submission History */}
                            <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem]">
                                <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-6 flex items-center justify-between">
                                    Signal Log
                                    <span className="bg-zinc-800 px-2 py-0.5 rounded text-[8px] font-black">{submissions.length} Hits</span>
                                </h3>

                                <div className="space-y-4">
                                    {submissions.map((sub, idx) => (
                                        <div key={sub.id} className={`p-5 rounded-2xl border transition-all ${sub.isFinal ? 'bg-fuchsia-500/10 border-fuchsia-500/30' : 'bg-black/40 border-zinc-800'}`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h5 className="text-xs font-black italic uppercase">VERSION {sub.versionNumber}</h5>
                                                        {sub.isFinal && <span className="text-[8px] px-1.5 py-0.5 bg-emerald-500 text-black font-black uppercase rounded">Final Signal</span>}
                                                    </div>
                                                    <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-widest">
                                                        {new Date(sub.submittedAt).toLocaleTimeString()} · {new Date(sub.submittedAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <History className={`w-4 h-4 ${sub.isFinal ? 'text-fuchsia-500' : 'text-zinc-800'}`} />
                                            </div>

                                            <div className="flex gap-2">
                                                {sub.githubLink && (
                                                    <a href={sub.githubLink} target="_blank" className="p-2 bg-black border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors" title="Code">
                                                        <Github className="w-3.5 h-3.5" />
                                                    </a>
                                                )}
                                                {sub.zipUrl && (
                                                    <a href={sub.zipUrl} target="_blank" className="p-2 bg-black border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors" title="Download">
                                                        <Upload className="w-3.5 h-3.5" />
                                                    </a>
                                                )}
                                                {sub.videoUrl && (
                                                    <a href={sub.videoUrl} target="_blank" className="p-2 bg-black border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors" title="Demo">
                                                        <Video className="w-3.5 h-3.5" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {submissions.length === 0 && (
                                        <div className="text-center py-8">
                                            <History className="w-10 h-10 text-zinc-800 mx-auto mb-3 opacity-20" />
                                            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">No signals recorded</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
