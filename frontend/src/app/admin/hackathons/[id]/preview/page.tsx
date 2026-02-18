"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { NavBar } from "@/components/landing/NavBar";
import { Loader2, Calendar, Users, ListChecks, ArrowLeft, Trophy, ShieldAlert, Clock, Github, Video, FileArchive, MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Round {
    roundNumber: number;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
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
    registrationStart: string;
    registrationEnd: string;
    startDate: string;
    endDate: string;
    maxTeamSize: number;
    maxParticipants?: number;
    allowIndividual: boolean;
    allowTeam: boolean;
    rounds: Round[];
}

export default function HackathonPreviewPage() {
    const { id } = useParams();
    const router = useRouter();
    const [hackathon, setHackathon] = useState<Hackathon | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHackathon = async () => {
            try {
                const { data } = await api.get(`/hackathons/${id}`);
                setHackathon(data);
            } catch (error) {
                console.error("Failed to fetch hackathon", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHackathon();
    }, [id]);

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-violet-500" /></div>;
    if (!hackathon) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Hackathon not found</div>;

    return (
        <div className="min-h-screen bg-black text-white pb-24">
            <NavBar />

            {/* Admin Preview Banner */}
            <div className="bg-amber-500 text-black py-2 px-6 flex items-center justify-between font-bold text-sm sticky top-0 z-50 shadow-lg">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 font-bold" />
                    ADMIN PREVIEW MODE - This is how students see the page
                </div>
                <button
                    onClick={() => router.push('/admin/hackathons')}
                    className="flex items-center gap-1 hover:underline"
                >
                    <ArrowLeft className="w-4 h-4" /> Exit Preview
                </button>
            </div>

            {/* Hero Section */}
            <div className="relative h-[400px] w-full mt-4">
                {hackathon.bannerUrl ? (
                    <img src={hackathon.bannerUrl} alt={hackathon.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-900/40 via-fuchsia-900/20 to-black flex items-center justify-center">
                        <Trophy className="w-32 h-32 text-white/10" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full p-12">
                    <div className="container mx-auto">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                            <div>
                                <h1 className="text-6xl font-black mb-4 tracking-tighter uppercase italic">{hackathon.title}</h1>
                                <div className="flex flex-wrap gap-6 text-zinc-300 font-medium">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
                                        <Calendar className="w-4 h-4 text-violet-400" />
                                        {new Date(hackathon.startDate).toLocaleDateString()} - {new Date(hackathon.endDate).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
                                        <Users className="w-4 h-4 text-fuchsia-400" />
                                        Team: 1-{hackathon.maxTeamSize}
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
                                        <Clock className="w-4 h-4 text-emerald-400" />
                                        Reg Ends: {new Date(hackathon.registrationEnd).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            <div className="flex-shrink-0">
                                <button disabled className="px-12 py-5 bg-zinc-800 text-zinc-500 font-black text-xl rounded-2xl border-b-4 border-black cursor-not-allowed uppercase tracking-widest shadow-2xl">
                                    Register Now
                                </button>
                                <p className="text-center text-zinc-600 text-xs mt-3 uppercase tracking-widest font-bold">Registration Opens Soon</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 mt-16">
                <div className="grid lg:grid-cols-3 gap-16">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-20">
                        {/* Description */}
                        <section>
                            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                                <span className="w-2 h-8 bg-violet-600 rounded-full" />
                                Mission Briefing
                            </h2>
                            <div className="prose prose-invert prose-violet max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{hackathon.description}</ReactMarkdown>
                            </div>
                        </section>

                        {/* Timeline / Rounds */}
                        <section>
                            <h2 className="text-3xl font-bold mb-10 flex items-center gap-3">
                                <span className="w-2 h-8 bg-fuchsia-600 rounded-full" />
                                Battle Phases
                            </h2>
                            <div className="space-y-4">
                                {hackathon.rounds.sort((a, b) => a.roundNumber - b.roundNumber).map((round, idx) => (
                                    <div key={idx} className="group relative p-8 bg-zinc-900 border border-zinc-800 rounded-[2rem] hover:border-white/20 transition-all overflow-hidden">
                                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <span className="text-9xl font-black italic">{round.roundNumber}</span>
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <span className="text-[10px] font-black text-violet-500 uppercase tracking-[0.2em] mb-1 block">Phase {round.roundNumber}</span>
                                                    <h3 className="text-3xl font-bold italic uppercase">{round.title}</h3>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-zinc-400">{new Date(round.startDate).toLocaleDateString()}</p>
                                                    <p className="text-xs text-zinc-600">to {new Date(round.endDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-zinc-400 mb-8 max-w-xl">
                                                {round.description}
                                            </div>
                                            <div className="flex flex-wrap gap-4">
                                                {round.allowZip && <span className="flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-lg text-xs font-bold text-zinc-400"><FileArchive className="w-3 h-3" /> Source Code</span>}
                                                {round.allowGithub && <span className="flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-lg text-xs font-bold text-zinc-400"><Github className="w-3 h-3" /> GitHub Repo</span>}
                                                {round.allowVideo && <span className="flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-lg text-xs font-bold text-zinc-400"><Video className="w-3 h-3" /> Pitch Video</span>}
                                                {round.allowDescription && <span className="flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-lg text-xs font-bold text-zinc-400"><MessageCircle className="w-3 h-3" /> Documentation</span>}
                                                <div className="ml-auto flex items-center gap-3">
                                                    <span className="text-[10px] font-black uppercase text-zinc-600">Weightage</span>
                                                    <span className="text-xl font-black italic text-violet-500">{round.weightagePercentage}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Evaluation */}
                        {hackathon.evaluationCriteria && (
                            <section>
                                <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                                    <span className="w-2 h-8 bg-emerald-600 rounded-full" />
                                    Judgment Protocol
                                </h2>
                                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] prose prose-invert prose-emerald max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{hackathon.evaluationCriteria}</ReactMarkdown>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-12">
                        {/* Status Card */}
                        <div className="bg-gradient-to-br from-violet-600 to-fuchsia-700 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20" />
                            <div className="relative z-10">
                                <h3 className="text-xl font-black uppercase italic mb-6">Battle Stats</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-4 border-b border-white/20">
                                        <span className="text-white/60 text-sm font-bold uppercase">Registration</span>
                                        <span className="text-white font-black">Pre-Launch</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-4 border-b border-white/20">
                                        <span className="text-white/60 text-sm font-bold uppercase">Warriors Joined</span>
                                        <span className="text-white font-black">0</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/60 text-sm font-bold uppercase">Status</span>
                                        <span className="px-3 py-1 bg-black/20 rounded-full text-[10px] font-black uppercase tracking-widest text-white border border-white/40 animate-pulse">Draft</span>
                                    </div>
                                </div>
                                <button disabled className="w-full mt-8 py-4 bg-white text-black font-black uppercase italic rounded-2xl shadow-xl hover:scale-105 transition-transform disabled:opacity-50">
                                    Locked
                                </button>
                            </div>
                        </div>

                        {/* Rules */}
                        {hackathon.rules && (
                            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem]">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <ShieldAlert className="w-5 h-5 text-red-500" />
                                    Battle Laws
                                </h3>
                                <div className="prose prose-invert prose-sm prose-red max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{hackathon.rules}</ReactMarkdown>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
