"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { NavBar } from "@/components/landing/NavBar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Loader2, ArrowLeft, Shield, Star, MessageSquare, Save, ExternalLink, Github, Youtube, FileArchive, Info, AlertTriangle } from "lucide-react";
import { toast } from 'react-hot-toast';

interface Team {
    id: string;
    name: string;
    lead: any;
    submissions: any[];
}

export default function MentorJudgingPage() {
    const { id, roundId } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [hackathon, setHackathon] = useState<any>(null);
    const [round, setRound] = useState<any>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [scores, setScores] = useState<Record<string, { score: number, remarks: string }>>({});

    useEffect(() => {
        fetchData();
    }, [id, roundId]);

    const fetchData = async () => {
        try {
            const [hRes, tRes] = await Promise.all([
                api.get(`/hackathons/${id}`),
                api.get(`/hackathons/mentor/hackathons/${id}/teams`)
            ]);
            setHackathon(hRes.data);
            const r = hRes.data.rounds.find((r: any) => r.id === roundId);
            setRound(r);

            // For each team, we need to fetch their latest submission for this round
            const teamsWithSubs = await Promise.all(tRes.data.map(async (team: any) => {
                const { data } = await api.get(`/hackathons/${id}/teams/${team.id}/round-status`);
                return { ...team, submissions: data.submissions || [] };
            }));

            setTeams(teamsWithSubs);
            if (teamsWithSubs.length > 0) setSelectedTeam(teamsWithSubs[0]);
        } catch (error) {
            console.error("Failed to fetch data", error);
            toast.error("Protocol failed to load");
        } finally {
            setLoading(false);
        }
    };

    const handleScoreChange = (teamId: string, field: 'score' | 'remarks', value: any) => {
        setScores(prev => ({
            ...prev,
            [teamId]: {
                ...(prev[teamId] || { score: 0, remarks: "" }),
                [field]: value
            }
        }));
    };

    const handleSubmitScore = async (team: Team) => {
        const scoreData = scores[team.id];
        if (!scoreData || scoreData.score < 0 || scoreData.score > 100) {
            toast.error("Valid score (0-100) required");
            return;
        }

        const submission = team.submissions.find(s => s.isFinal);
        if (!submission) {
            toast.error("No final transmission found for this squad");
            return;
        }

        setProcessing(true);
        try {
            await api.post(`/hackathons/submissions/${submission.id}/score`, {
                score: Number(scoreData.score),
                remarks: scoreData.remarks
            });
            toast.success("Score transmitted to HQ");
            fetchData(); // Refresh to show updated scores if needed
        } catch (error) {
            toast.error("Transmission failed");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
        </div>
    );

    const latestSub = selectedTeam?.submissions.find(s => s.isFinal);

    return (
        <ProtectedRoute allowedRoles={['MENTOR', 'ADMIN']}>
            <div className="min-h-screen bg-black text-white pb-24">
                <NavBar />
                <main className="container mx-auto px-6 py-32">
                    <div className="flex items-center gap-6 mb-12">
                        <button onClick={() => router.back()} className="p-4 bg-zinc-900 hover:bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-5xl font-black italic uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-600">
                                Mission Evaluation
                            </h1>
                            <p className="text-zinc-500 mt-1 uppercase text-[10px] font-black tracking-[0.3em]">{hackathon?.title} / {round?.title}</p>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-4 gap-12">
                        {/* Squad Sidebar */}
                        <aside className="space-y-4">
                            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-4">Assigned Squads</h3>
                            <div className="space-y-2">
                                {teams.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setSelectedTeam(t)}
                                        className={`w-full group p-4 rounded-2xl text-left transition-all border ${selectedTeam?.id === t.id
                                            ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400 shadow-xl shadow-emerald-500/5'
                                            : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-white'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black italic text-xs ${selectedTeam?.id === t.id ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-500'
                                                }`}>
                                                {t.name[0]}
                                            </div>
                                            <span className="font-black italic uppercase text-xs truncate">{t.name}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </aside>

                        {/* Evaluation Panel */}
                        <div className="lg:col-span-3 space-y-8">
                            {selectedTeam ? (
                                <div className="space-y-12">
                                    {/* Submission Preview */}
                                    <section className="p-10 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-10">
                                            <div>
                                                <h2 className="text-3xl font-black italic uppercase text-white mb-2">{selectedTeam.name}</h2>
                                                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                                    Latest Transmission: <span className="text-emerald-500">{latestSub ? new Date(latestSub.submittedAt).toLocaleString() : 'No data'}</span>
                                                </p>
                                            </div>
                                            {latestSub && (
                                                <div className="p-3 bg-zinc-800 rounded-2xl border border-zinc-700">
                                                    <span className="text-[10px] font-black text-zinc-400">VERSION {latestSub.versionNumber}</span>
                                                </div>
                                            )}
                                        </div>

                                        {latestSub ? (
                                            <div className="space-y-10">
                                                {/* Links */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {latestSub.githubLink && (
                                                        <a href={latestSub.githubLink} target="_blank" className="p-6 bg-black border border-zinc-800 rounded-3xl flex items-center gap-4 hover:border-violet-500/50 transition-all group">
                                                            <div className="p-3 bg-violet-500/10 rounded-xl text-violet-500 group-hover:scale-110 transition-transform">
                                                                <Github className="w-6 h-6" />
                                                            </div>
                                                            <span className="text-xs font-black uppercase tracking-wider">Repository</span>
                                                        </a>
                                                    )}
                                                    {latestSub.videoUrl && (
                                                        <a href={latestSub.videoUrl} target="_blank" className="p-6 bg-black border border-zinc-800 rounded-3xl flex items-center gap-4 hover:border-red-500/50 transition-all group">
                                                            <div className="p-3 bg-red-500/10 rounded-xl text-red-500 group-hover:scale-110 transition-transform">
                                                                <Youtube className="w-6 h-6" />
                                                            </div>
                                                            <span className="text-xs font-black uppercase tracking-wider">Demo Video</span>
                                                        </a>
                                                    )}
                                                    {latestSub.zipUrl && (
                                                        <a href={latestSub.zipUrl} target="_blank" className="p-6 bg-black border border-zinc-800 rounded-3xl flex items-center gap-4 hover:border-emerald-500/50 transition-all group">
                                                            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 group-hover:scale-110 transition-transform">
                                                                <FileArchive className="w-6 h-6" />
                                                            </div>
                                                            <span className="text-xs font-black uppercase tracking-wider">Bundle</span>
                                                        </a>
                                                    )}
                                                </div>

                                                <div className="p-8 bg-black/40 border border-zinc-800 rounded-3xl">
                                                    <div className="flex items-center gap-2 mb-4 text-zinc-600">
                                                        <Info className="w-4 h-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Protocol Description</span>
                                                    </div>
                                                    <p className="text-sm text-zinc-400 leading-relaxed italic">"{latestSub.description || 'No description provided.'}"</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-20 text-center border-2 border-dashed border-zinc-800 rounded-3xl">
                                                <AlertTriangle className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                                                <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">No transmissions detected for this squad</p>
                                            </div>
                                        )}
                                    </section>

                                    {/* Scoring Form */}
                                    <section className="grid md:grid-cols-3 gap-8">
                                        <div className="md:col-span-2 space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">Officer Remarks</label>
                                                <textarea
                                                    value={scores[selectedTeam.id]?.remarks || ""}
                                                    onChange={(e) => handleScoreChange(selectedTeam.id, 'remarks', e.target.value)}
                                                    placeholder="Detailed feedback regarding squad performance..."
                                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-sm text-white focus:border-emerald-500/30 outline-none min-h-[160px] transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">Performance Rating</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={scores[selectedTeam.id]?.score || ""}
                                                        onChange={(e) => handleScoreChange(selectedTeam.id, 'score', e.target.value)}
                                                        placeholder="0-100"
                                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-4xl font-black italic text-emerald-500 outline-none focus:border-emerald-500 focus:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all text-center"
                                                        min="0"
                                                        max="100"
                                                    />
                                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-700 font-black text-xl italic select-none">/ 100</div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleSubmitScore(selectedTeam)}
                                                disabled={processing || !latestSub || round?.status !== 'judging'}
                                                className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-black rounded-3xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-3"
                                            >
                                                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                                Transmit Score
                                            </button>
                                        </div>
                                    </section>
                                </div>
                            ) : (
                                <div className="h-[600px] bg-zinc-900/40 border border-zinc-800 rounded-[3rem] border-dashed flex flex-center items-center justify-center">
                                    <div className="text-center">
                                        <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-700">
                                            <Star className="w-10 h-10" />
                                        </div>
                                        <p className="text-zinc-600 font-black uppercase text-xs tracking-widest">Select a squad to begin evaluation</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
