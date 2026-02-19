"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { NavBar } from "@/components/landing/NavBar";
import { Loader2 } from "lucide-react";
import { toast } from 'react-hot-toast';
import { LeaderboardView } from "@/components/hackathons/LeaderboardView";

export default function HackathonLeaderboardPage() {
    const { id } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [hackathon, setHackathon] = useState<any>(null);

    useEffect(() => {
        fetchHackathon();
    }, [id]);

    const fetchHackathon = async () => {
        try {
            const { data } = await api.get(`/hackathons/${id}`);
            setHackathon(data);
        } catch (error) {
            toast.error("Failed to load intel");
        } finally {
            setLoading(false);
        }
    };

    if (loading || !hackathon) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white pb-24">
            <NavBar />

            <main className="container mx-auto px-6 py-32">
                <div className="mb-16">
                    <h1 className="text-6xl font-black italic uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
                        Leaderboard
                    </h1>
                    <p className="text-zinc-500 mt-2 uppercase text-xs font-black tracking-[0.4em]">{hackathon.title}</p>
                </div>

                <LeaderboardView hackathonId={id as string} rounds={hackathon.rounds} />
            </main>
        </div>
    );
}
