"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Plus, Loader2, Calendar, Users, Award, ExternalLink, Eye, Trophy } from "lucide-react";
import { toast } from 'react-hot-toast';
import Link from "next/link";

interface Hackathon {
    id: string;
    title: string;
    status: string;
    registrationStart: string;
    registrationEnd: string;
    startDate: string;
    endDate: string;
    maxParticipants?: number;
    maxTeamSize: number;
    bannerUrl?: string;
}

export default function HackathonManagement() {
    const [hackathons, setHackathons] = useState<Hackathon[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHackathons();
    }, []);

    const fetchHackathons = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/hackathons');
            setHackathons(data);
        } catch (error) {
            console.error("Failed to fetch hackathons", error);
            toast.error("Failed to load hackathons");
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            await api.patch(`/hackathons/${id}/status`, { status: newStatus });
            setHackathons(prev => prev.map(h => h.id === id ? { ...h, status: newStatus } : h));
            toast.success(`Hackathon status updated to ${newStatus.replace(/_/g, ' ')}`);
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const finalizeTeams = async (id: string) => {
        try {
            const loadingToast = toast.loading("Finalizing squads and converting individual warriors...");
            await api.post(`/hackathons/${id}/finalize-teams`);
            toast.dismiss(loadingToast);
            toast.success("Squads finalized! Moving to approval phase.");
            fetchHackathons();
        } catch (error) {
            toast.error("Failed to finalize teams");
        }
    };

    if (loading) return <div className="flex justify-center p-24"><Loader2 className="w-12 h-12 animate-spin text-pink-500" /></div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-zinc-900/50 p-8 rounded-[2rem] border border-zinc-800">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Trophy className="w-6 h-6 text-pink-500" />
                        Hackathon Hub
                    </h2>
                    <p className="text-zinc-500 mt-1">Initialize and coordinate competitions</p>
                </div>
                <Link
                    href="/admin/hackathons/create"
                    className="flex items-center gap-2 px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-pink-600/20 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Launch Hackathon
                </Link>
            </div>

            {hackathons.length === 0 ? (
                <div className="text-center py-24 bg-zinc-900/30 border border-zinc-800 rounded-[2rem] border-dashed">
                    <Award className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-zinc-500 mb-2">No active projects</h2>
                    <p className="text-zinc-600">The arena is empty. Start your first competition.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {hackathons.map((h) => (
                        <div key={h.id} className="group bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-pink-500/30 transition-all flex flex-col md:flex-row shadow-xl">
                            {/* Banner Small */}
                            <div className="w-full md:w-64 aspect-video md:aspect-auto bg-zinc-800 relative flex-shrink-0 border-r border-zinc-800">
                                {h.bannerUrl ? (
                                    <img src={h.bannerUrl} alt={h.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-700 font-black italic bg-zinc-900/50">
                                        CD HACK
                                    </div>
                                )}
                                <div className="absolute top-4 left-4">
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest backdrop-blur-md border ${h.status === 'registration_open' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                        h.status === 'registration_closed' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                            h.status === 'approval_in_progress' ? 'bg-violet-500/20 text-violet-400 border-violet-500/30' :
                                                'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                                        }`}>
                                        {h.status.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </div>

                            <div className="p-8 flex-1 flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2">{h.title}</h3>
                                        <div className="flex flex-wrap gap-4 text-xs text-zinc-500 font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(h.startDate).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Users className="w-3.5 h-3.5" />
                                                1-{h.maxTeamSize} Pax
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 text-zinc-400">
                                        <Link href={`/admin/hackathons/${h.id}/mentors`} className="p-2 bg-zinc-800 hover:bg-zinc-700 hover:text-white rounded-lg transition-colors border border-zinc-700" title="Assign Mentors">
                                            <Users className="w-4 h-4" />
                                        </Link>
                                        <Link
                                            href={`/admin/hackathons/${h.id}/preview`}
                                            className="p-2 bg-zinc-800 hover:bg-zinc-700 hover:text-white rounded-lg transition-colors border border-zinc-700"
                                            title="View Preview"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-zinc-800/50">
                                    <div className="flex gap-2">
                                        {h.status === 'draft' && (
                                            <button
                                                onClick={() => updateStatus(h.id, 'registration_open')}
                                                className="px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-md hover:bg-green-500/20 transition-all text-[10px] font-black uppercase tracking-wider"
                                            >
                                                Open Registration
                                            </button>
                                        )}
                                        {h.status === 'registration_open' && (
                                            <button
                                                onClick={() => updateStatus(h.id, 'registration_closed')}
                                                className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md hover:bg-red-500/20 transition-all text-[10px] font-black uppercase tracking-wider"
                                            >
                                                Close Registration
                                            </button>
                                        )}
                                        {h.status === 'registration_closed' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => finalizeTeams(h.id)}
                                                    className="px-3 py-1.5 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-all text-[10px] font-black uppercase tracking-wider shadow-lg shadow-violet-600/20"
                                                >
                                                    Finalize Teams & Review
                                                </button>
                                                <button
                                                    onClick={() => updateStatus(h.id, 'registration_open')}
                                                    className="px-3 py-1.5 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-md hover:bg-zinc-700 transition-all text-[10px] font-black uppercase tracking-wider"
                                                >
                                                    Re-open
                                                </button>
                                            </div>
                                        )}
                                        {h.status === 'approval_in_progress' && (
                                            <Link
                                                href={`/admin/hackathons/${h.id}/approval`}
                                                className="px-3 py-1.5 bg-fuchsia-600 text-white rounded-md hover:bg-fuchsia-700 transition-all text-[10px] font-black uppercase tracking-wider shadow-lg shadow-fuchsia-600/20"
                                            >
                                                Review & Approve Squads
                                            </Link>
                                        )}
                                    </div>
                                    <Link
                                        href={`/admin/hackathons/${h.id}/submissions`}
                                        className="text-[10px] font-black text-pink-500 hover:text-pink-400 uppercase tracking-widest flex items-center gap-1.5"
                                    >
                                        Submissions <ExternalLink className="w-3 h-3" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
