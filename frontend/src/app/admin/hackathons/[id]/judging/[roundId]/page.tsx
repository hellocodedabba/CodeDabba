"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { NavBar } from "@/components/landing/NavBar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Loader2, ArrowLeft, Shield, BarChart3, Users, CheckCircle2, AlertTriangle, ExternalLink, Activity, Trophy } from "lucide-react";
import { toast } from 'react-hot-toast';

interface TeamJudgingStatus {
    teamId: string;
    teamName: string;
    hasSubmission: boolean;
    submissionId?: string;
    scoreCount: number;
    isScored: boolean;
    finalScore: number | null;
}

export default function AdminJudgingDashboard() {
    const { id, roundId } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [finalizing, setFinalizing] = useState(false);
    const [hackathon, setHackathon] = useState<any>(null);
    const [round, setRound] = useState<any>(null);
    const [statusList, setStatusList] = useState<TeamJudgingStatus[]>([]);

    useEffect(() => {
        fetchData();
    }, [id, roundId]);

    const fetchData = async () => {
        try {
            const [hRes, listRes] = await Promise.all([
                api.get(`/hackathons/${id}`),
                api.get(`/hackathons/${id}/rounds/${roundId}/judging-status`)
            ]);
            setHackathon(hRes.data);
            const currentRound = hRes.data.rounds.find((r: any) => r.id === roundId);
            setRound(currentRound);
            setStatusList(listRes.data);
        } catch (error) {
            console.error("Failed to fetch data", error);
            toast.error("Failed to load judging data");
        } finally {
            setLoading(false);
        }
    };

    const handleFinalizeRound = async () => {
        const unscored = statusList.filter(s => !s.isScored).length;
        const msg = unscored > 0
            ? `There are ${unscored} squads without final scores. Finalizing will assign them a default score and execute elimination protocols. Proceed?`
            : "All squads have been scored. Proceed with finalization and elimination?";

        if (!confirm(msg)) return;

        setFinalizing(true);
        try {
            await api.post(`/hackathons/rounds/${roundId}/finalize-scoring`);
            toast.success("Round finalized! Survivors have been updated.");
            router.push(`/admin/hackathons`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Finalization failed");
        } finally {
            setFinalizing(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-fuchsia-500" />
        </div>
    );

    const scoredCount = statusList.filter(s => s.isScored).length;
    const progress = statusList.length > 0 ? (scoredCount / statusList.length) * 100 : 0;

    return (
        <ProtectedRoute allowedRoles={['ADMIN']}>
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
                                <h1 className="text-5xl font-black italic uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">
                                    Judging Control
                                </h1>
                                <p className="text-zinc-500 mt-1 uppercase text-[10px] font-black tracking-[0.3em]">{hackathon?.title} / {round?.title}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleFinalizeRound}
                            disabled={finalizing || round?.status !== 'judging' || round?.isScoringFinalized}
                            className="group px-8 py-6 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-black rounded-3xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-red-500/20 active:scale-95 flex items-center gap-4"
                        >
                            <Shield className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            {round?.isScoringFinalized ? 'Scoring Finalized' : round?.status === 'judging' ? 'Finalize & Eliminate' : 'Round Locked'}
                        </button>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        <div className="p-8 bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all">
                                <Activity className="w-24 h-24 text-emerald-500" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Judging Progress</p>
                                <div className="flex items-end gap-3 mb-4">
                                    <span className="text-5xl font-black italic text-emerald-500">{Math.round(progress)}%</span>
                                    <span className="text-zinc-600 text-sm font-bold mb-2 lowercase tracking-tighter">({scoredCount}/{statusList.length})</span>
                                </div>
                                <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                                    <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem]">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Elimination Protocol</p>
                            {round?.isElimination ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="w-6 h-6 text-red-500" />
                                        <span className="text-xl font-black italic text-red-500 uppercase">Active</span>
                                    </div>
                                    <p className="text-xs text-zinc-400 font-medium">Threshold: <strong className="text-white text-sm">{round?.eliminationThreshold || 0}</strong> points. Squads below this mark will be relieved from duty.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                        <span className="text-xl font-black italic text-emerald-500 uppercase">Non-Elimination</span>
                                    </div>
                                    <p className="text-xs text-zinc-400 font-medium">All survivors move to next round protocols.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem]">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Round Status</p>
                            <div className="flex items-center gap-4">
                                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${round?.status === 'judging' ? 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30 animate-pulse' :
                                    'bg-zinc-800 text-zinc-500 border-zinc-700'
                                    }`}>
                                    {round?.status}
                                </div>
                                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                                    Ends: {new Date(round?.endDate).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Team List */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-4 text-zinc-400">
                            <Users className="w-6 h-6" />
                            Squad Operational Status
                        </h2>

                        <div className="grid gap-4">
                            {statusList.map((s) => (
                                <div key={s.teamId} className="group p-6 bg-zinc-900/40 border border-zinc-800 rounded-3xl hover:border-zinc-700 transition-all flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-6 flex-1">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black italic ${s.hasSubmission ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {s.teamName[0]}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black italic uppercase text-white group-hover:text-emerald-400 transition-colors">{s.teamName}</h3>
                                            <div className="flex items-center gap-4 mt-1">
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${s.hasSubmission ? 'text-emerald-500/60' : 'text-red-500/60'}`}>
                                                    {s.hasSubmission ? 'Transmitted' : 'No Transmission'}
                                                </span>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">
                                                    Judges: {s.scoreCount} Received
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-12">
                                        <div className="text-center">
                                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Final Score</p>
                                            <div className={`px-4 py-1.5 rounded-xl text-sm font-black italic border ${s.isScored ? 'bg-zinc-950 text-white border-zinc-800' : 'bg-zinc-950/40 text-zinc-700 border-zinc-900'
                                                }`}>
                                                {s.isScored ? s.finalScore : 'AW-TNG'}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {s.hasSubmission && (
                                                <button className="p-3 bg-zinc-900 border border-zinc-800 hover:border-emerald-500/30 text-zinc-500 hover:text-emerald-400 rounded-xl transition-all">
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
