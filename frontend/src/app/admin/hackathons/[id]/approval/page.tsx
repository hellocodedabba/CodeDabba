"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { NavBar } from "@/components/landing/NavBar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Loader2, ArrowLeft, Trophy, Users, CheckCircle, XCircle, AlertCircle, MessageSquare } from "lucide-react";
import { toast } from 'react-hot-toast';

interface TeamMember {
    id: string;
    student: {
        name: string;
        email: string;
    };
    role: string;
}

interface Team {
    id: string;
    name: string;
    status: string;
    lead: {
        name: string;
        email: string;
    };
    members?: TeamMember[];
}

export default function AdminTeamApproval() {
    const { id } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [teams, setTeams] = useState<Team[]>([]);
    const [rejecting, setRejecting] = useState<string | null>(null);
    const [reason, setReason] = useState("");

    useEffect(() => {
        fetchTeams();
    }, [id]);

    const fetchTeams = async () => {
        try {
            const { data } = await api.get(`/hackathons/${id}/mentor/approval-list`);
            setTeams(data);
        } catch (error) {
            console.error("Failed to fetch teams", error);
            toast.error("Failed to load squads");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (teamId: string) => {
        try {
            await api.patch(`/hackathons/teams/${teamId}/approve`);
            toast.success("Squad approved!");
            setTeams(prev => prev.filter(t => t.id !== teamId));
        } catch (error) {
            toast.error("Failed to approve squad");
        }
    };

    const handleReject = async (teamId: string) => {
        if (!reason) return toast.error("Please provide a reason for exile");
        try {
            await api.patch(`/hackathons/teams/${teamId}/reject`, { reason });
            toast.success("Squad rejected.");
            setRejecting(null);
            setReason("");
            setTeams(prev => prev.filter(t => t.id !== teamId));
        } catch (error) {
            toast.error("Failed to reject squad");
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-fuchsia-500" />
        </div>
    );

    return (
        <ProtectedRoute allowedRoles={['ADMIN', 'MENTOR']}>
            <div className="min-h-screen bg-black text-white">
                <NavBar />
                <main className="container mx-auto px-6 py-32">
                    <div className="flex items-center gap-6 mb-12">
                        <button onClick={() => router.back()} className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-all">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-4xl font-black italic uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-pink-500">
                                Squad Approval
                            </h1>
                            <p className="text-zinc-500 mt-1 uppercase text-xs font-black tracking-widest leading-none">Review and validate incoming combatants</p>
                        </div>
                    </div>

                    {teams.length === 0 ? (
                        <div className="text-center py-32 bg-zinc-900/30 border border-zinc-800 rounded-[3rem] border-dashed">
                            <CheckCircle className="w-20 h-20 text-green-500/20 mx-auto mb-6" />
                            <h2 className="text-2xl font-black uppercase text-zinc-500">All squads reviewed</h2>
                            <p className="text-zinc-600 mt-2">There are no more squads awaiting validation.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {teams.map((team) => (
                                <div key={team.id} className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 hover:border-fuchsia-500/30 transition-all shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-600/5 rounded-full blur-[100px] -z-10 group-hover:bg-fuchsia-600/10 transition-all" />

                                    <div className="flex flex-col lg:flex-row justify-between gap-12">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-16 h-16 bg-fuchsia-500/10 rounded-3xl flex items-center justify-center text-fuchsia-500">
                                                    <Trophy className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-black italic uppercase tracking-tight">{team.name}</h3>
                                                    <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Squad Identifier: {team.id.split('-')[0]}</p>
                                                </div>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-8">
                                                <div className="space-y-4">
                                                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Squad Lead</h4>
                                                    <div className="p-4 bg-black/40 rounded-2xl border border-zinc-800">
                                                        <p className="font-bold text-lg">{team.lead.name}</p>
                                                        <p className="text-sm text-zinc-500">{team.lead.email}</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Deployment Status</h4>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-4 py-2 bg-yellow-500/10 text-yellow-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-yellow-500/20">
                                                            Awaiting Approval
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="w-full lg:w-80 flex flex-col justify-center gap-4 border-l border-zinc-800 lg:pl-12">
                                            {rejecting === team.id ? (
                                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                                    <div className="relative">
                                                        <textarea
                                                            placeholder="State reason for rejection..."
                                                            value={reason}
                                                            onChange={(e) => setReason(e.target.value)}
                                                            className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-red-500/50 outline-none transition-all placeholder:text-zinc-700 min-h-[100px]"
                                                        />
                                                        <MessageSquare className="absolute bottom-4 right-4 w-4 h-4 text-zinc-800" />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleReject(team.id)}
                                                            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-95"
                                                        >
                                                            Confirm Exile
                                                        </button>
                                                        <button
                                                            onClick={() => { setRejecting(null); setReason(""); }}
                                                            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(team.id)}
                                                        className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg shadow-green-600/20 active:scale-95 flex items-center justify-center gap-3"
                                                    >
                                                        <CheckCircle className="w-5 h-5" />
                                                        Approve Deployment
                                                    </button>
                                                    <button
                                                        onClick={() => setRejecting(team.id)}
                                                        className="w-full py-4 bg-zinc-800 hover:bg-red-950/30 hover:text-red-400 hover:border-red-950 text-zinc-400 border border-zinc-800 font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                        Exile Squad
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </ProtectedRoute>
    );
}
