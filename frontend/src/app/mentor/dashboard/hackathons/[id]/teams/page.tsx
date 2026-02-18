"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { NavBar } from "@/components/landing/NavBar";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
    Loader2, ArrowLeft, Users, Shield, CheckCircle,
    XCircle, Info, Activity, Globe, MessageSquare,
    ExternalLink, Trash2, ShieldAlert, Zap
} from "lucide-react";
import { toast } from 'react-hot-toast';

interface Team {
    id: string;
    name: string;
    status: string;
    lead: {
        name: string;
        email: string;
    };
    hackathon: {
        title: string;
        description: string;
    };
    members?: {
        student: {
            name: string;
            email: string;
        }
    }[];
}

export default function MentorTeamReview() {
    const { id } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [teams, setTeams] = useState<Team[]>([]);
    const [hackathon, setHackathon] = useState<any>(null);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [reason, setReason] = useState("");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchTeams();
    }, [id]);

    const fetchTeams = async () => {
        try {
            const [tRes, hRes] = await Promise.all([
                api.get(`/hackathons/mentor/hackathons/${id}/teams`),
                api.get(`/hackathons/${id}`)
            ]);
            setTeams(tRes.data);
            setHackathon(hRes.data);
        } catch (error) {
            toast.error("Failed to load recruitment data");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (teamId: string) => {
        if (!confirm("Confirm deployment for this squad?")) return;
        setProcessing(true);
        try {
            await api.patch(`/hackathons/teams/${teamId}/approve`);
            toast.success("Squad deployed successfully");
            fetchTeams();
            setSelectedTeam(null);
        } catch (error) {
            toast.error("Deployment clearance failed");
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async (teamId: string) => {
        if (!reason) return toast.error("Deployment denial requires a valid reason");
        setProcessing(true);
        try {
            await api.patch(`/hackathons/teams/${teamId}/reject`, { reason });
            toast.success("Squad deployment rejected");
            fetchTeams();
            setSelectedTeam(null);
            setReason("");
        } catch (error) {
            toast.error("Rejection protocol failed");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
        </div>
    );

    return (
        <ProtectedRoute allowedRoles={['MENTOR']}>
            <div className="min-h-screen bg-black text-white pb-24">
                <NavBar />
                <main className="container mx-auto px-6 py-32">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
                        <div className="flex items-center gap-6">
                            <button onClick={() => router.back()} className="p-4 bg-zinc-900 hover:bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all shadow-xl">
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <div>
                                <h1 className="text-4xl font-black italic uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">
                                    Recruitment Hub
                                </h1>
                                <p className="text-zinc-500 mt-1 uppercase text-[10px] font-black tracking-[0.3em]">{hackathon?.title}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 p-6 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl">
                            <div className="flex items-center gap-4 border-r border-zinc-800 pr-8">
                                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Queue</p>
                                    <p className="text-2xl font-black italic">{teams.length}</p>
                                </div>
                            </div>
                            <div className="text-xs text-zinc-500 font-bold max-w-[200px] leading-relaxed italic">
                                Evaluate squad readiness and clear them for deployment.
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* Squad List */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-black italic uppercase tracking-widest text-zinc-600 flex items-center gap-4 mb-8">
                                <Users className="w-5 h-5" />
                                Assigned Squads
                            </h2>

                            {teams.length === 0 ? (
                                <div className="text-center py-24 bg-zinc-900/40 border border-zinc-800 rounded-[3rem] border-dashed">
                                    <Globe className="w-16 h-16 text-zinc-800 mx-auto mb-6" />
                                    <h3 className="text-lg font-black uppercase text-zinc-600 tracking-widest">Awaiting Distribution</h3>
                                    <p className="text-zinc-700 mt-2 text-sm italic font-bold">HQ has not yet assigned squads to your sector.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {teams.map((team) => (
                                        <button
                                            key={team.id}
                                            onClick={() => setSelectedTeam(team)}
                                            className={`w-full text-left p-6 rounded-[2rem] border transition-all flex items-center justify-between group ${selectedTeam?.id === team.id
                                                    ? 'bg-emerald-500 border-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                                                    : 'bg-zinc-900 border-zinc-800 hover:border-emerald-500/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black italic text-xl ${selectedTeam?.id === team.id ? 'bg-black text-emerald-500' : 'bg-black text-zinc-600'
                                                    }`}>
                                                    {team.name[0]}
                                                </div>
                                                <div>
                                                    <h3 className="font-black italic uppercase text-lg leading-none">{team.name}</h3>
                                                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${selectedTeam?.id === team.id ? 'text-black/60' : 'text-zinc-500'
                                                        }`}>Lead: {team.lead?.name}</p>
                                                </div>
                                            </div>
                                            <div className={`p-3 rounded-lg ${selectedTeam?.id === team.id ? 'bg-black text-emerald-500' : 'bg-black text-zinc-600'
                                                }`}>
                                                <ArrowLeft className="w-4 h-4 rotate-180" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Detail / Review Panel */}
                        <div className="sticky top-32 h-fit">
                            {selectedTeam ? (
                                <div className="p-10 bg-zinc-900 border border-zinc-800 rounded-[3rem] shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-right-8 duration-500">
                                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                                        <ShieldCheck className="w-32 h-32" />
                                    </div>

                                    <div className="flex justify-between items-start mb-12">
                                        <div>
                                            <span className="px-4 py-1 bg-black text-emerald-500 border border-emerald-500/20 text-[8px] font-black uppercase tracking-widest rounded-full mb-4 inline-block">
                                                Reviewing Personnel
                                            </span>
                                            <h2 className="text-4xl font-black italic uppercase tracking-tighter">{selectedTeam.name}</h2>
                                        </div>
                                        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-emerald-500 border border-zinc-800 shadow-inner">
                                            <Shield className="w-8 h-8" />
                                        </div>
                                    </div>

                                    <div className="space-y-8 mb-12">
                                        <div>
                                            <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <Info className="w-3 h-3" /> Squad Intel
                                            </h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-black rounded-2xl border border-zinc-800/50">
                                                    <p className="text-[9px] font-black text-zinc-700 uppercase mb-1">Lead ID</p>
                                                    <p className="font-bold text-sm truncate">{selectedTeam.lead?.email}</p>
                                                </div>
                                                <div className="p-4 bg-black rounded-2xl border border-zinc-800/50">
                                                    <p className="text-[9px] font-black text-zinc-700 uppercase mb-1">Formation</p>
                                                    <p className="font-bold text-sm uppercase italic">Locked</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-4">Operational Roster</h4>
                                            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                                <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800/30">
                                                    <span className="text-xs font-bold uppercase italic text-emerald-500">{selectedTeam.lead?.name} (L)</span>
                                                    <span className="text-[10px] text-zinc-600">{selectedTeam.lead?.email}</span>
                                                </div>
                                                {selectedTeam.members?.map((m, i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800/30">
                                                        <span className="text-xs font-bold uppercase italic text-zinc-400">{m.student?.name}</span>
                                                        <span className="text-[10px] text-zinc-600">{m.student?.email}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-zinc-800/50 space-y-6">
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Denial Reason (Required for rejection)</h4>
                                            <textarea
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                                placeholder="Explain why this squad is being denied deployment..."
                                                className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-sm focus:outline-none focus:border-red-500/50 transition-colors min-h-[100px] resize-none text-zinc-300"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => handleReject(selectedTeam.id)}
                                                disabled={processing}
                                                className="py-4 bg-red-950/20 text-red-500 border border-red-950/30 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Deny Deployment
                                            </button>
                                            <button
                                                onClick={() => handleApprove(selectedTeam.id)}
                                                disabled={processing}
                                                className="py-4 bg-emerald-600 hover:bg-emerald-500 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-3"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Clear for Launch
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-16 border-2 border-dashed border-zinc-900 rounded-[3rem] text-center">
                                    <div className="w-20 h-20 bg-zinc-950 rounded-[2rem] flex items-center justify-center text-zinc-800 mx-auto mb-8 border border-zinc-900">
                                        <ShieldAlert className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-black italic uppercase text-zinc-800 tracking-widest mb-4">No Active Intel</h3>
                                    <p className="text-zinc-800 text-xs font-bold leading-relaxed max-w-xs mx-auto italic uppercase">
                                        Select a squad from the tactical roster to inspect deployment readiness.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}

function ShieldCheck(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}
