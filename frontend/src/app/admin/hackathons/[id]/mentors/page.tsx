"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { NavBar } from "@/components/landing/NavBar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Loader2, ArrowLeft, Users, Shield, ShieldCheck, Globe, Target, Trash2, Plus, Info, BarChart3, ChevronRight, Activity } from "lucide-react";
import { toast } from 'react-hot-toast';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface Team {
    id: string;
    name: string;
    status: string;
}

interface AssignedMentor {
    id: string;
    mentorId: string;
    assignmentType: 'global' | 'specific';
    mentor: User;
}

export default function AdminMentorAssignment() {
    const { id } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [mentors, setMentors] = useState<User[]>([]);
    const [assigned, setAssigned] = useState<AssignedMentor[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [hackathon, setHackathon] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [hRes, mentorRes, teamRes] = await Promise.all([
                api.get(`/hackathons/${id}`),
                api.get(`/hackathons/${id}/mentors/available`),
                api.get(`/hackathons/${id}/teams`)
            ]);
            setHackathon(hRes.data);
            setMentors(mentorRes.data);
            setAssigned(hRes.data.mentors || []);
            setTeams(teamRes.data);
        } catch (error) {
            console.error("Failed to fetch data", error);
            toast.error("Failed to load command parameters");
        } finally {
            setLoading(false);
        }
    };

    const handleAssignToHackathon = async (mentorId: string, type: 'global' | 'specific') => {
        setSaving(true);
        try {
            await api.post(`/hackathons/${id}/mentors`, {
                mentorIds: [mentorId],
                type
            });
            toast.success("Mentor deployed to AO");
            fetchData();
        } catch (error) {
            toast.error("Deployment failed");
        } finally {
            setSaving(false);
        }
    };

    const handleAssignToTeam = async (mentorId: string, teamId: string) => {
        try {
            await api.post(`/hackathons/${id}/teams/${teamId}/mentor/${mentorId}`);
            toast.success("Squad assigned to Mentor");
            fetchData();
        } catch (error) {
            toast.error("Squad assignment failed");
        }
    };

    const globalMentors = assigned.filter(a => a.assignmentType === 'global');
    const teamCoverage = teams.length > 0 ? (globalMentors.length / teams.length) * 5 : 0;
    const requiredGlobalMentors = Math.ceil(teams.length / 5);

    const handleDistributeTeams = async () => {
        if (!confirm("This will randomly assign all pending squads to active mentors. Continue?")) return;
        setSaving(true);
        try {
            const { data } = await api.post(`/hackathons/${id}/distribute-teams`);
            toast.success(`Strategy Executed: ${data.assignedSquads} squads assigned to ${data.personnelCount} mentors.`);
            fetchData();
        } catch (error) {
            toast.error("Distribution logic failed");
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveMentor = async (mentorId: string) => {
        if (!confirm("Relieve this officer from duty?")) return;
        setSaving(true);
        try {
            await api.delete(`/hackathons/${id}/mentors/${mentorId}`);
            toast.success("Officer relieved");
            fetchData();
        } catch (error) {
            toast.error("Withdrawal protocol failed");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-fuchsia-500" />
        </div>
    );

    return (
        <ProtectedRoute allowedRoles={['ADMIN']}>
            <div className="min-h-screen bg-black text-white pb-24">
                <NavBar />
                <main className="container mx-auto px-6 py-32">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
                        <div className="flex items-center gap-6">
                            <button onClick={() => router.back()} className="p-4 bg-zinc-900 hover:bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all">
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <div>
                                <h1 className="text-5xl font-black italic uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-500">
                                    Command & Distribution
                                </h1>
                                <p className="text-zinc-500 mt-1 uppercase text-[10px] font-black tracking-[0.3em]">{hackathon?.title}</p>
                            </div>
                        </div>

                        {/* Distribution Action */}
                        <div className="flex items-center gap-4">
                            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center gap-8 shadow-2xl">
                                <div className="flex items-center gap-4 border-r border-zinc-800 pr-8">
                                    <div className="p-3 bg-violet-500/10 rounded-xl text-violet-500">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Squads</p>
                                        <p className="text-2xl font-black italic">{teams.filter(t => t.status === 'pending_approval').length}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                                        <Shield className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Active Mentors</p>
                                        <p className="text-2xl font-black italic">{assigned.length}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-full border ${hackathon?.status === 'approval_in_progress' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                                    }`}>
                                    Status: {hackathon?.status?.replace(/_/g, ' ')}
                                </span>
                                <button
                                    onClick={handleDistributeTeams}
                                    disabled={saving || assigned.length === 0 || hackathon?.status !== 'approval_in_progress'}
                                    className="group px-8 py-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-black rounded-3xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center gap-4"
                                >
                                    <Globe className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                    {hackathon?.status === 'approval_in_progress' ? 'Execute Distribution' : 'Awaiting Finalization'}
                                </button>
                                {hackathon?.status === 'registration_open' && (
                                    <button
                                        onClick={async () => {
                                            if (!confirm("This will close registration and lock teams. Continue?")) return;
                                            setSaving(true);
                                            try {
                                                await api.post(`/hackathons/${id}/finalize-teams`);
                                                toast.success("Registration closed. Teams locked.");
                                                fetchData();
                                            } catch (error) {
                                                toast.error("Failed to finalize teams");
                                            } finally {
                                                setSaving(false);
                                            }
                                        }}
                                        disabled={saving}
                                        className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-zinc-800 mt-2"
                                    >
                                        Force Finalize
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-12">
                        {/* Recruitment Panel */}
                        <div className="space-y-8">
                            <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all pointer-events-none">
                                    <Shield className="w-24 h-24" />
                                </div>
                                <h2 className="text-xl font-black italic uppercase tracking-tight mb-8 flex items-center gap-3">
                                    <Plus className="w-5 h-5 text-fuchsia-500" />
                                    Available Units
                                </h2>
                                <div className="space-y-4">
                                    {mentors.map((m) => (
                                        <div key={m.id} className="p-5 bg-black/40 border border-zinc-800 rounded-2xl group/item">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h4 className="font-black text-sm uppercase italic">{m.name}</h4>
                                                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{m.email}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleAssignToHackathon(m.id, 'global')}
                                                    disabled={saving}
                                                    className="relative z-10 w-10 h-10 bg-zinc-900 hover:bg-violet-600 text-zinc-500 hover:text-white rounded-xl flex items-center justify-center transition-all border border-zinc-800 cursor-pointer active:scale-95 disabled:opacity-50"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {mentors.length === 0 && (
                                        <p className="text-center text-zinc-600 text-xs italic">No units available</p>
                                    )}
                                </div>
                            </div>

                            <div className="p-8 bg-black border border-zinc-800 border-dashed rounded-[2.5rem]">
                                <div className="flex items-center gap-3 mb-4">
                                    <Info className="w-4 h-4 text-zinc-500" />
                                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Operation Protocol</h5>
                                </div>
                                <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                                    Step 1: Recruit mentors into the AO.<br />
                                    Step 2: Once registration closes, hit <strong className="text-emerald-500">Distribute Squads</strong>.<br />
                                    Step 3: Mentors will start reviewing assigned units.
                                </p>
                            </div>
                        </div>

                        {/* Deployed Roster */}
                        <div className="lg:col-span-2 space-y-8">
                            <h2 className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-4">
                                <Activity className="w-6 h-6 text-emerald-500" />
                                Deployed Personnel
                            </h2>

                            <div className="grid gap-6">
                                {assigned.map((a) => (
                                    <div key={a.id} className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] hover:border-violet-500/30 transition-all shadow-xl group">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center text-violet-400 font-black text-2xl italic shadow-inner border border-violet-500/10">
                                                    {a.mentor.name[0]}
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black italic uppercase tracking-tight text-white">{a.mentor.name}</h3>
                                                    <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest mt-1">{a.mentor.email}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-8">
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Status</p>
                                                    <span className="px-4 py-1.5 bg-zinc-950 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest rounded-xl">Deployed</span>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveMentor(a.mentorId)}
                                                    className="w-12 h-12 bg-red-950/20 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl flex items-center justify-center transition-all border border-red-950/30 opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {assigned.length === 0 && (
                                    <div className="text-center py-20 bg-zinc-900/40 border border-zinc-800 rounded-[3rem] border-dashed">
                                        <Users className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                                        <p className="text-zinc-600 font-black uppercase text-[10px] tracking-widest">No personnel currently deployed</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
