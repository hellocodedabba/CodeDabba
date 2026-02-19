"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { NavBar } from "@/components/landing/NavBar";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
    Loader2, ArrowLeft, Users, Shield, CheckCircle,
    XCircle, Info, Activity, Globe, MessageSquare,
    ExternalLink, Trash2, ShieldAlert, Zap, Calendar,
    Trophy, Clock, Github, Video, FileArchive, MessageCircle, ChevronRight
} from "lucide-react";
import { toast } from 'react-hot-toast';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

interface Team {
    id: string;
    name: string;
    status: string;
    lead: {
        name: string;
        email: string;
    };
    members?: {
        student: {
            name: string;
            email: string;
        }
    }[];
}

interface Round {
    id: string;
    roundNumber: number;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    status: string;
    isElimination: boolean;
    weightagePercentage: number;
    allowZip: boolean;
    allowGithub: boolean;
    allowVideo: boolean;
    allowDescription: boolean;
}

interface Hackathon {
    id: string;
    title: string;
    description: string;
    bannerUrl?: string;
    rules?: string;
    evaluationCriteria?: string;
    startDate: string;
    endDate: string;
    registrationEnd: string;
    maxTeamSize: number;
    status: string;
    rounds: Round[];
}

export default function MentorHackathonUnified() {
    const { id } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'briefing' | 'operations'>('operations');
    const [teams, setTeams] = useState<Team[]>([]);
    const [hackathon, setHackathon] = useState<Hackathon | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [reason, setReason] = useState("");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [tRes, hRes] = await Promise.all([
                api.get(`/hackathons/mentor/hackathons/${id}/teams`),
                api.get(`/hackathons/${id}`)
            ]);
            setTeams(tRes.data);
            setHackathon(hRes.data);
        } catch (error) {
            toast.error("Failed to sync with HQ intel");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (teamId: string) => {
        if (!confirm("Clear this squad for deployment?")) return;
        setProcessing(true);
        try {
            await api.patch(`/hackathons/teams/${teamId}/approve`);
            toast.success("Squad status: DEPLOYED");
            fetchData();
            setSelectedTeam(null);
        } catch (error) {
            toast.error("Deployment clearance failed");
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async (teamId: string) => {
        if (!reason) return toast.error("Deployment denial requires a valid reason for HQ records");
        setProcessing(true);
        try {
            await api.patch(`/hackathons/teams/${teamId}/reject`, { reason });
            toast.success("Squad status: REJECTED");
            fetchData();
            setSelectedTeam(null);
            setReason("");
        } catch (error) {
            toast.error("Rejection protocol failed");
        } finally {
            setProcessing(false);
        }
    };

    const [submissions, setSubmissions] = useState<any[]>([]);
    const [currentRound, setCurrentRound] = useState<any>(null);
    const [gradeScore, setGradeScore] = useState<number>(0);
    const [gradeFeedback, setGradeFeedback] = useState("");

    const fetchTeamDetails = async (teamId: string) => {
        try {
            const { data } = await api.get(`/hackathons/${id}/teams/${teamId}/round-status`);
            setSubmissions(data.submissions || []);
            setCurrentRound(data.currentRound);
        } catch (error) {
            console.error(error);
        }
    };

    const handleGrade = async (submissionId: string) => {
        setProcessing(true);
        try {
            await api.post(`/hackathons/submissions/${submissionId}/evaluate`, {
                score: Number(gradeScore),
                feedback: gradeFeedback
            });
            toast.success("Evaluation transmitted to HQ");
            fetchTeamDetails(selectedTeam!.id); // Refresh
            setGradeScore(0);
            setGradeFeedback("");
        } catch (error) {
            toast.error("Evaluation upload failed");
        } finally {
            setProcessing(false);
        }
    };

    const pendingTeams = teams.filter(t => t.status === 'pending_approval');
    const activeTeams = teams.filter(t => t.status === 'approved');

    if (loading || !hackathon) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
        </div>
    );

    return (
        <ProtectedRoute allowedRoles={['MENTOR']}>
            <div className="min-h-screen bg-black text-white pb-24">
                <NavBar />

                {/* Hero Header Reused Style */}
                <div className="relative h-[300px] w-full mt-20">
                    {hackathon.bannerUrl ? (
                        <img src={hackathon.bannerUrl} alt={hackathon.title} className="w-full h-full object-cover opacity-60" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-900/40 via-zinc-900 to-black flex items-center justify-center">
                            <Shield className="w-32 h-32 text-white/5" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                    <div className="absolute bottom-0 left-0 w-full p-12">
                        <div className="container mx-auto">
                            <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <button onClick={() => router.back()} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md transition-all mr-4">
                                            <ArrowLeft className="w-5 h-5 text-white" />
                                        </button>
                                        <div className="flex flex-col">
                                            <span className="px-3 py-1 bg-emerald-500 text-black text-[9px] font-black uppercase tracking-widest rounded-full w-fit mb-2">
                                                Field Operator Access
                                            </span>
                                            <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">{hackathon.title}</h1>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 p-1.5 bg-zinc-900/80 border border-zinc-800 rounded-3xl backdrop-blur-xl">
                                    <button
                                        onClick={() => setActiveTab('operations')}
                                        className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'operations' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-white'}`}
                                    >
                                        Active Operations
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('briefing')}
                                        className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'briefing' ? 'bg-white text-black shadow-lg shadow-white/20' : 'text-zinc-500 hover:text-white'}`}
                                    >
                                        Mission Briefing
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Intel Bar */}
                <div className="container mx-auto px-6 -mt-6 relative z-30">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-zinc-900/90 border border-zinc-800 rounded-[2.5rem] backdrop-blur-md shadow-2xl">
                        <div className="flex items-center gap-4 px-6 border-r border-zinc-800">
                            <Calendar className="w-5 h-5 text-emerald-500" />
                            <div>
                                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Timeline</p>
                                <p className="text-xs font-black italic">{new Date(hackathon.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(hackathon.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 px-6 md:border-r border-zinc-800">
                            <Users className="w-5 h-5 text-fuchsia-500" />
                            <div>
                                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Squad Size</p>
                                <p className="text-xs font-black italic">1-{hackathon.maxTeamSize} Members</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 px-6 border-r border-zinc-800">
                            <Trophy className="w-5 h-5 text-violet-500" />
                            <div>
                                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Phases</p>
                                <p className="text-xs font-black italic">{hackathon.rounds.length} Tactical Rounds</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 px-6">
                            <Activity className="w-5 h-5 text-emerald-500" />
                            <div>
                                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">My Assignment</p>
                                <p className="text-xs font-black italic">{teams.length} Units Distributed</p>
                            </div>
                        </div>
                    </div>
                </div>

                <main className="container mx-auto px-6 mt-16">
                    {activeTab === 'operations' ? (
                        <div className="grid lg:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-6 duration-500">
                            {/* Tactical Roster */}
                            <div className="space-y-12">
                                {/* Pending Approvals */}
                                {pendingTeams.length > 0 && (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-4 text-amber-500">
                                                <ShieldAlert className="w-5 h-5" />
                                                Pending Clearance
                                            </h2>
                                            <div className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black">
                                                {pendingTeams.length} UNITS
                                            </div>
                                        </div>
                                        <div className="grid gap-4">
                                            {pendingTeams.map((team) => (
                                                <button
                                                    key={team.id}
                                                    onClick={() => { setSelectedTeam(team); setSubmissions([]); }}
                                                    className={`w-full text-left p-6 rounded-[2.5rem] border transition-all flex items-center justify-between group overflow-hidden relative ${selectedTeam?.id === team.id
                                                        ? 'bg-amber-500 border-amber-500 text-black shadow-xl shadow-amber-500/20'
                                                        : 'bg-zinc-900 border-zinc-800 hover:border-amber-500/50'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-6 relative z-10">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black italic text-xl shadow-inner ${selectedTeam?.id === team.id ? 'bg-black text-amber-500' : 'bg-black text-zinc-600'}`}>
                                                            {team.name[0]}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-black italic uppercase text-lg leading-none tracking-tight">{team.name}</h3>
                                                            <p className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${selectedTeam?.id === team.id ? 'text-black/60' : 'text-zinc-600'}`}>L: {team.lead?.name}</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Active Deployments */}
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-4 text-emerald-500">
                                            <Activity className="w-5 h-5" />
                                            Active Deployments
                                        </h2>
                                        <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black">
                                            {activeTeams.length} UNITS
                                        </div>
                                    </div>
                                    {activeTeams.length === 0 ? (
                                        <div className="text-center py-12 bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] border-dashed">
                                            <p className="text-zinc-600 font-black uppercase tracking-widest text-[10px]">No active units</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4">
                                            {activeTeams.map((team) => (
                                                <button
                                                    key={team.id}
                                                    onClick={() => { setSelectedTeam(team); fetchTeamDetails(team.id); }}
                                                    className={`w-full text-left p-6 rounded-[2.5rem] border transition-all flex items-center justify-between group overflow-hidden relative ${selectedTeam?.id === team.id
                                                        ? 'bg-emerald-500 border-emerald-500 text-black shadow-xl shadow-emerald-500/20'
                                                        : 'bg-zinc-900 border-zinc-800 hover:border-emerald-500/50'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-6 relative z-10">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black italic text-xl shadow-inner ${selectedTeam?.id === team.id ? 'bg-black text-emerald-500' : 'bg-black text-zinc-600'}`}>
                                                            {team.name[0]}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-black italic uppercase text-lg leading-none tracking-tight">{team.name}</h3>
                                                            <p className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${selectedTeam?.id === team.id ? 'text-black/60' : 'text-zinc-600'}`}>L: {team.lead?.name}</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Detail Panel */}
                            <div className="sticky top-24 h-fit">
                                {selectedTeam ? (
                                    <div className="p-10 bg-zinc-950 border border-zinc-800 rounded-[3rem] shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-right-8 duration-500">
                                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                                            <Shield className="w-48 h-48" />
                                        </div>

                                        <div className="flex justify-between items-start mb-12">
                                            <div>
                                                <div className="flex items-center gap-3 mb-4">
                                                    <span className={`w-2 h-2 rounded-full animate-ping ${selectedTeam.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${selectedTeam.status === 'approved' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                        {selectedTeam.status === 'approved' ? 'Active Duty' : 'Awaiting Clearance'}
                                                    </span>
                                                </div>
                                                <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">{selectedTeam.name}</h2>
                                                <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest mt-3">ID: {selectedTeam.id.split('-')[0]} • {selectedTeam.lead?.email}</p>
                                            </div>
                                        </div>

                                        {/* If Approved, Show Grading UI */}
                                        {selectedTeam.status === 'approved' && (
                                            <div className="mb-12 space-y-8">
                                                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl">
                                                    <h4 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center justify-between">
                                                        <span>Current Objective: {currentRound?.title || 'Unknown'}</span>
                                                        <span className="text-zinc-400">{currentRound?.status}</span>
                                                    </h4>

                                                    {submissions.length === 0 ? (
                                                        <p className="text-zinc-600 text-xs italic">No transmissions received yet.</p>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            {submissions.map((sub, idx) => (
                                                                <div key={sub.id} className="p-4 bg-black rounded-2xl border border-zinc-800">
                                                                    <div className="flex justify-between items-start mb-3">
                                                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Version {sub.versionNumber}</span>
                                                                        <span className="text-[9px] text-zinc-600">{new Date(sub.submittedAt).toLocaleString()}</span>
                                                                    </div>
                                                                    <p className="text-xs text-zinc-400 mb-4">{sub.description}</p>
                                                                    <div className="flex gap-4">
                                                                        {sub.githubLink && (
                                                                            <a href={sub.githubLink} target="_blank" className="text-[10px] text-zinc-500 hover:text-white flex items-center gap-2"><Github className="w-3 h-3" /> Code</a>
                                                                        )}
                                                                        {sub.zipUrl && (
                                                                            <a href={sub.zipUrl} target="_blank" className="text-[10px] text-zinc-500 hover:text-white flex items-center gap-2"><FileArchive className="w-3 h-3" /> Package</a>
                                                                        )}
                                                                        {sub.videoUrl && (
                                                                            <a href={sub.videoUrl} target="_blank" className="text-[10px] text-zinc-500 hover:text-white flex items-center gap-2"><Video className="w-3 h-3" /> Briefing</a>
                                                                        )}
                                                                    </div>

                                                                    {/* Grading Form */}
                                                                    <div className="mt-6 pt-6 border-t border-zinc-800/50">
                                                                        {sub.score ? (
                                                                            <div className="flex items-center gap-4">
                                                                                <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                                                                    <span className="text-xl font-black italic text-emerald-500">{sub.score}</span>
                                                                                </div>
                                                                                <p className="text-xs text-zinc-500 italic">"{sub.feedback}"</p>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="space-y-4">
                                                                                <input
                                                                                    type="number"
                                                                                    placeholder="Score"
                                                                                    value={gradeScore}
                                                                                    onChange={e => setGradeScore(Number(e.target.value))}
                                                                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-500"
                                                                                />
                                                                                <textarea
                                                                                    placeholder="Feedback"
                                                                                    value={gradeFeedback}
                                                                                    onChange={e => setGradeFeedback(e.target.value)}
                                                                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-500 min-h-[60px]"
                                                                                />
                                                                                <button
                                                                                    onClick={() => handleGrade(sub.id)}
                                                                                    disabled={processing}
                                                                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all"
                                                                                >
                                                                                    Submit Evaluation
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Approval/Rejection Controls (Only for Pending) */}
                                        {selectedTeam.status === 'pending_approval' && (
                                            <div className="pt-10 border-t border-zinc-900 space-y-8">
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Denial Reason (Mandatory for rejection)</label>
                                                        <span className="text-[10px] text-red-500/60 font-bold italic">* Notify members</span>
                                                    </div>
                                                    <textarea
                                                        value={reason}
                                                        onChange={(e) => setReason(e.target.value)}
                                                        placeholder="Provide clear technical or administrative reasons for rejection..."
                                                        className="w-full bg-black border border-zinc-800 rounded-3xl p-6 text-sm focus:outline-none focus:border-emerald-500/30 transition-all min-h-[120px] resize-none text-zinc-400 font-medium"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <button
                                                        onClick={() => handleReject(selectedTeam.id)}
                                                        disabled={processing}
                                                        className="py-5 bg-red-950/10 text-red-500 border border-red-950/20 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                        Reject Unit
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(selectedTeam.id)}
                                                        disabled={processing}
                                                        className="py-5 bg-emerald-600 hover:bg-emerald-500 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                        Clear Deployment
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-20 border-2 border-dashed border-zinc-900 rounded-[4rem] text-center bg-zinc-950/20">
                                        <div className="w-24 h-24 bg-zinc-900 rounded-[2.5rem] flex items-center justify-center text-zinc-800 mx-auto mb-10 border border-zinc-800 shadow-inner">
                                            <ShieldAlert className="w-12 h-12" />
                                        </div>
                                        <h3 className="text-2xl font-black italic uppercase text-zinc-800 tracking-tighter mb-4">Awaiting Selection</h3>
                                        <p className="text-zinc-800 text-[10px] font-black leading-relaxed max-w-[200px] mx-auto italic uppercase tracking-[0.2em]">
                                            Select a squad from the roster to inspect deployment status.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="grid lg:grid-cols-3 gap-16 animate-in fade-in slide-in-from-bottom-6 duration-500">
                            <div className="lg:col-span-2 space-y-24">
                                {/* Bio Section */}
                                <section>
                                    <h2 className="text-4xl font-black mb-10 italic uppercase tracking-tighter flex items-center gap-4">
                                        <span className="w-3 h-10 bg-emerald-500 rounded-full" />
                                        Mission Briefing
                                    </h2>
                                    <div className="prose prose-invert prose-emerald max-w-none text-zinc-400">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{hackathon.description}</ReactMarkdown>
                                    </div>
                                </section>

                                {/* Rounds */}
                                <section>
                                    <h2 className="text-4xl font-black mb-12 italic uppercase tracking-tighter flex items-center gap-4">
                                        <span className="w-3 h-10 bg-white rounded-full" />
                                        Phases & Objectives
                                    </h2>
                                    <div className="space-y-6">
                                        {hackathon.rounds.sort((a, b) => a.roundNumber - b.roundNumber).map((round, idx) => (
                                            <div key={idx} className="group p-10 bg-zinc-900/50 border border-zinc-800 rounded-[3rem] hover:border-emerald-500/30 transition-all relative overflow-hidden">
                                                <div className="absolute -top-6 -right-6 p-10 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                                                    <span className="text-[15rem] font-black italic leading-none">{round.roundNumber}</span>
                                                </div>
                                                <div className="relative z-10">
                                                    <div className="flex justify-between items-start mb-8">
                                                        <div>
                                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-2 block">PHASE {round.roundNumber}</span>
                                                            <h3 className="text-3xl font-black italic uppercase tracking-tight">{round.title}</h3>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xl font-black italic text-zinc-300">{new Date(round.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">Completion Target: {new Date(round.endDate).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-zinc-500 mb-10 max-w-2xl font-medium leading-relaxed">{round.description}</p>
                                                    <div className="flex flex-wrap gap-4 items-center">
                                                        {round.allowGithub && <span className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-xl text-[10px] font-black text-zinc-400 border border-zinc-800"><Github className="w-3 h-3" /> GitHub Integration</span>}
                                                        {round.allowVideo && <span className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-xl text-[10px] font-black text-zinc-400 border border-zinc-800"><Video className="w-3 h-3" /> Pitch Media</span>}
                                                        <div className="ml-auto flex items-center gap-4">
                                                            {round.status === 'judging' && (
                                                                <Link
                                                                    href={`/mentor/dashboard/hackathons/${id}/rounds/${round.id}/judging`}
                                                                    className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
                                                                >
                                                                    <Trophy className="w-3 h-3" /> Execute Judging
                                                                </Link>
                                                            )}
                                                            <div className="px-6 py-2 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                                                <span className="text-2xl font-black italic text-emerald-500">{round.weightagePercentage}%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Evaluation Criteria */}
                                {hackathon.evaluationCriteria && (
                                    <section>
                                        <h2 className="text-4xl font-black mb-10 italic uppercase tracking-tighter flex items-center gap-4">
                                            <span className="w-3 h-10 bg-fuchsia-600 rounded-full" />
                                            Judgement Criteria
                                        </h2>
                                        <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] prose prose-invert prose-fuchsia max-w-none text-zinc-400">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{hackathon.evaluationCriteria}</ReactMarkdown>
                                        </div>
                                    </section>
                                )}
                            </div>

                            {/* Sidebar Laws */}
                            <div className="space-y-12">
                                {hackathon.rules && (
                                    <div className="bg-zinc-950 border border-zinc-800 p-10 rounded-[3rem] relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-all">
                                            <ShieldAlert className="w-20 h-20 text-red-500" />
                                        </div>
                                        <h3 className="text-2xl font-black italic uppercase mb-8 flex items-center gap-3">
                                            <Shield className="w-6 h-6 text-red-500" />
                                            Engagement Laws
                                        </h3>
                                        <div className="prose prose-invert prose-sm prose-red max-w-none text-zinc-500 font-medium">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{hackathon.rules}</ReactMarkdown>
                                        </div>
                                    </div>
                                )}

                                <div className="p-8 bg-black/40 border border-zinc-800 border-dashed rounded-[3rem] space-y-6">
                                    <h3 className="text-xs font-black uppercase italic text-zinc-600 tracking-widest flex items-center gap-2">
                                        <Info className="w-4 h-4" /> Operator Guidelines
                                    </h3>
                                    <p className="text-[10px] text-zinc-700 font-bold leading-relaxed uppercase tracking-wide">
                                        Confirm squad eligibility based on mission briefing. Ensure all members meet the tactical requirements before clearing for deployment.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
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
