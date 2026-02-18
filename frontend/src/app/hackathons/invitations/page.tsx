"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthProvider";
import { NavBar } from "@/components/landing/NavBar";
import { useState, useEffect } from "react";
import { Loader2, Mail, Check, X, Trophy, Users, Clock, AlertTriangle } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import Link from "next/link";

interface Invitation {
    id: string;
    hackathonId: string;
    hackathon: {
        id: string;
        title: string;
        bannerUrl?: string;
    };
    teamName: string;
    invitedEmail: string;
    invitedName?: string;
    invitedMobile?: string;
    invitedTrack?: string;
    invitedBy: {
        name: string;
    };
    expiresAt: string;
    status: string;
}

export default function HackathonInvitationsPage() {
    const { user } = useAuth();
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchInvitations();
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (token) {
            // We could auto-accept here, but it's safer to let them click.
            // Highlight logic can be added later.
        }
    }, []);

    const fetchInvitations = async () => {
        try {
            const { data } = await api.get('/hackathons/mine/invitations');
            setInvitations(data);
        } catch (error) {
            console.error("Failed to fetch invitations", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (id: string) => {
        setProcessingId(id);
        try {
            await api.patch(`/hackathons/invitations/${id}/accept`);
            toast.success(`Mission Accepted! You've joined the squad.`);
            setInvitations(invitations.filter(i => i.id !== id));
        } catch (error: any) {
            console.error("Failed to accept invitation", error);
            toast.error(error.response?.data?.message || "Failed to join the squad");
        } finally {
            setProcessingId(null);
        }
    };

    const handleDecline = async (id: string) => {
        setProcessingId(id);
        try {
            await api.patch(`/hackathons/invitations/${id}/decline`);
            toast.success("Invitation declined");
            setInvitations(invitations.filter(i => i.id !== id));
        } catch (error) {
            console.error("Failed to decline invitation", error);
            toast.error("Failed to decline invitation");
        } finally {
            setProcessingId(null);
        }
    };

    const getRemainingTime = (expiryDate: string) => {
        const remaining = new Date(expiryDate).getTime() - new Date().getTime();
        if (remaining <= 0) return "EXPIRED";

        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m remaining`;
    };

    return (
        <ProtectedRoute allowedRoles={['STUDENT']}>
            <div className="min-h-screen bg-black text-white pb-24">
                <NavBar />

                <div className="container mx-auto px-6 pt-32">
                    <div className="mb-12">
                        <span className="text-[10px] font-black text-fuchsia-500 uppercase tracking-[0.5em] mb-3 block">RECRUITMENT CENTER</span>
                        <h1 className="text-5xl font-black italic uppercase tracking-tighter">Unit Invitations</h1>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-12 h-12 animate-spin text-fuchsia-500" />
                        </div>
                    ) : invitations.length > 0 ? (
                        <div className="grid md:grid-cols-2 gap-8">
                            {invitations.map((inv) => {
                                const isExpired = new Date(inv.expiresAt) < new Date();

                                return (
                                    <div key={inv.id} className="group bg-zinc-900 border border-zinc-800 rounded-[3rem] overflow-hidden hover:border-fuchsia-500/50 transition-all p-10 flex flex-col justify-between relative shadow-2xl">
                                        <div className="absolute top-0 right-0 p-8 opacity-5">
                                            <Trophy className="w-32 h-32" />
                                        </div>

                                        <div className="relative z-10">
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center">
                                                    <Users className="w-8 h-8 text-fuchsia-500" />
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Squad Invitation</span>
                                                    <h3 className="text-2xl font-black italic uppercase text-white">{inv.teamName}</h3>
                                                </div>
                                            </div>

                                            <div className="space-y-4 mb-10">
                                                <p className="text-zinc-400 text-lg leading-relaxed">
                                                    You've been recruited by <strong className="text-white">{inv.invitedBy.name}</strong> for the upcoming <strong className="text-fuchsia-400">{inv.hackathon.title}</strong> mission.
                                                </p>

                                                <div className="flex flex-wrap gap-4">
                                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${isExpired ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-zinc-800 text-zinc-500 border-white/5'}`}>
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {getRemainingTime(inv.expiresAt)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="relative z-10 flex gap-4">
                                            {!isExpired ? (
                                                <>
                                                    <button
                                                        onClick={() => handleAccept(inv.id)}
                                                        disabled={processingId !== null}
                                                        className="flex-1 py-4 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-black italic uppercase rounded-2xl transition-all shadow-lg shadow-fuchsia-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                                    >
                                                        {processingId === inv.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />} Accept Mission
                                                    </button>
                                                    <button
                                                        onClick={() => handleDecline(inv.id)}
                                                        disabled={processingId !== null}
                                                        className="px-6 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-2xl transition-all disabled:opacity-50"
                                                    >
                                                        <X className="w-6 h-6" />
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="w-full py-4 bg-zinc-950 border border-zinc-900 text-zinc-700 font-black italic uppercase rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed">
                                                    <AlertTriangle className="w-5 h-5" /> Mission Expired
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-32 bg-zinc-900/30 border border-zinc-800 rounded-[4rem] border-dashed">
                            <Mail className="w-20 h-20 text-zinc-800 mx-auto mb-8 opacity-50" />
                            <h2 className="text-3xl font-black italic uppercase text-zinc-600">No active summons</h2>
                            <p className="text-zinc-500 mt-4 max-w-sm mx-auto font-medium">Your squad hasn't called for you yet. Keep training until the next mission arrives.</p>
                            <Link href="/hackathons" className="inline-block mt-10 px-10 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black italic uppercase rounded-2xl transition-all">
                                Explore Missions
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
