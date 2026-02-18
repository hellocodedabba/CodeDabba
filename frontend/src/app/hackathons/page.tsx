"use client";

import { NavBar } from "@/components/landing/NavBar";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Loader2, Calendar, Users, ArrowRight, Trophy, Sparkles } from "lucide-react";
import Link from "next/link";

interface Hackathon {
    id: string;
    title: string;
    status: string;
    registrationStart: string;
    registrationEnd: string;
    startDate: string;
    endDate: string;
    maxTeamSize: number;
    bannerUrl?: string;
    isRegistered?: boolean;
}

export default function HackathonsListingPage() {
    const [hackathons, setHackathons] = useState<Hackathon[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHackathons = async () => {
            try {
                // Only show relevant hackathons for students
                const { data } = await api.get('/hackathons');
                // Filter out drafts for students (backend might already do this but let's be safe)
                setHackathons(data.filter((h: any) => h.status !== 'draft'));
            } catch (error) {
                console.error("Failed to fetch hackathons", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHackathons();
    }, []);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-violet-500/30">
            <NavBar />

            <main className="container mx-auto px-6 py-32">
                {/* Header Section */}
                <div className="relative mb-24 text-center">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/20 rounded-full blur-[100px] -z-10" />
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-violet-300 text-sm font-medium mb-6">
                        <Sparkles className="w-4 h-4" />
                        <span>Compete. Build. Conquer.</span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-400 to-zinc-600">
                        The Battlefield
                    </h1>
                    <p className="text-xl text-zinc-500 max-w-2xl mx-auto font-medium">
                        Join the most prestigious coding hackathons and show the world what you can build in a weekend.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center p-32">
                        <Loader2 className="w-16 h-16 animate-spin text-violet-500" />
                    </div>
                ) : hackathons.length === 0 ? (
                    <div className="text-center py-40 bg-zinc-900/30 border border-zinc-800 rounded-[3rem] border-dashed">
                        <Trophy className="w-20 h-20 text-zinc-700 mx-auto mb-6" />
                        <h2 className="text-3xl font-bold text-zinc-500 mb-3">No active hackathons</h2>
                        <p className="text-zinc-600">Prepare your tools, new challenges are coming soon.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-10">
                        {hackathons.map((h) => {
                            const now = new Date();
                            const regStart = new Date(h.registrationStart);
                            const regEnd = new Date(h.registrationEnd);

                            let statusText = h.status.replace(/_/g, ' ').toUpperCase();
                            let statusColor = 'bg-zinc-800 text-zinc-400 border-zinc-700';
                            let countdownText = '';

                            if (h.status === 'registration_open') {
                                statusColor = 'bg-green-500/20 text-green-400 border-green-500/30';
                                const diff = regEnd.getTime() - now.getTime();
                                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                countdownText = days > 0 ? `${days}d ${hours}h left` : `${hours}h left`;
                            } else if (h.status === 'registration_closed' || h.status === 'teams_forming') {
                                statusText = 'FINALIZING TEAMS';
                                statusColor = 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
                            } else if (h.status === 'approval_in_progress') {
                                statusText = 'UNDER REVIEW';
                                statusColor = 'bg-violet-500/20 text-violet-400 border-violet-500/30';
                            } else if (h.status === 'ready_for_round_1' || h.status === 'round_active') {
                                statusText = 'IN BATTLE';
                                statusColor = 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30';
                            } else if (h.status === 'completed') {
                                statusColor = 'bg-red-500/20 text-red-400 border-red-500/30';
                            } else if (now < regStart) {
                                statusText = 'UPCOMING';
                                statusColor = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
                            }

                            return (
                                <Link
                                    href={`/hackathons/${h.id}`}
                                    key={h.id}
                                    className="group bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden hover:border-violet-500/40 transition-all hover:shadow-2xl hover:shadow-violet-600/10 flex flex-col"
                                >
                                    {/* Banner */}
                                    <div className="relative h-60 w-full overflow-hidden bg-zinc-800 flex-shrink-0">
                                        {h.bannerUrl ? (
                                            <img src={h.bannerUrl} alt={h.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-black">
                                                <Trophy className="w-16 h-16 text-zinc-700" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />

                                        <div className="absolute top-6 left-6 flex gap-2">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md border ${statusColor}`}>
                                                {statusText}
                                            </span>
                                            {countdownText && (
                                                <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md border bg-black/40 text-white border-white/10">
                                                    {countdownText}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-10 flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-3xl font-black italic uppercase mb-6 tracking-tight group-hover:text-violet-400 transition-colors leading-none">
                                                {h.title}
                                            </h3>

                                            <div className="space-y-4 mb-8">
                                                <div className="flex items-center gap-3 text-sm font-bold text-zinc-400">
                                                    <Calendar className="w-5 h-5 text-violet-500" />
                                                    <span>{new Date(h.startDate).toLocaleDateString()} - {new Date(h.endDate).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm font-bold text-zinc-400">
                                                    <Users className="w-5 h-5 text-fuchsia-500" />
                                                    <span>Team Size: 1-{h.maxTeamSize}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-8 border-t border-zinc-800">
                                            <span className="text-xs font-black uppercase text-zinc-600 tracking-widest">
                                                {h.isRegistered ? 'Manage Squad' : statusText === 'REGISTRATION OPEN' ? 'Join Now' : 'View Details'}
                                            </span>
                                            <div className="w-12 h-12 bg-zinc-800 group-hover:bg-violet-600 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-12">
                                                <ArrowRight className="w-6 h-6 text-white group-hover:-rotate-45 transition-transform" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
