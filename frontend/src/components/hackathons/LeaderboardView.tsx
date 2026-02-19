"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Loader2, Trophy, Medal, Award, TrendingUp, TrendingDown, Minus, ChevronDown } from "lucide-react";
import { toast } from 'react-hot-toast';

interface LeaderboardEntry {
    rank: number;
    previousRank: number | null;
    teamName: string;
    teamId: string;
    leadName: string;
    roundScore: number;
    cumulativeScore: number;
    status: string;
    finalPosition?: string;
}

interface LeaderboardViewProps {
    hackathonId: string;
    rounds: any[];
}

export function LeaderboardView({ hackathonId, rounds }: LeaderboardViewProps) {
    const [loading, setLoading] = useState(true);
    const [leaderboard, setLeaderboard] = useState<any>(null);
    const [selectedRound, setSelectedRound] = useState<string>('overall');
    const [hackathonStatus, setHackathonStatus] = useState<string>('');

    useEffect(() => {
        fetchLeaderboard();
    }, [hackathonId, selectedRound]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const roundParam = selectedRound === 'overall' ? '' : `?roundId=${selectedRound}`;
            const { data } = await api.get(`/hackathons/${hackathonId}/leaderboard${roundParam}`);
            setLeaderboard(data);
            setHackathonStatus(data.hackathonStatus);
        } catch (error) {
            toast.error("Leaderboard transmission failed");
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
        if (rank === 2) return <Medal className="w-6 h-6 text-zinc-400" />;
        if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />;
        return <span className="text-xl font-black italic text-zinc-700">#{rank}</span>;
    };

    const getTrendIcon = (current: number, previous: number | null) => {
        if (previous === null) return <Minus className="w-4 h-4 text-zinc-600" />;
        if (current < previous) return <TrendingUp className="w-4 h-4 text-emerald-500" />;
        if (current > previous) return <TrendingDown className="w-4 h-4 text-red-500" />;
        return <Minus className="w-4 h-4 text-zinc-600" />;
    };

    if (loading && !leaderboard) return (
        <div className="py-20 flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
        </div>
    );

    return (
        <div className="space-y-12">
            {/* Header & Filter */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter">Standings</h2>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${hackathonStatus === 'finished'
                                ? 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                                : hackathonStatus === 'round_active'
                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 animate-pulse'
                                    : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            }`}>
                            {hackathonStatus === 'finished' ? 'Completed' : hackathonStatus === 'round_active' ? 'Live' : 'Not Started'}
                        </span>
                    </div>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">Real-time battlefield analytics</p>
                </div>

                <div className="relative group min-w-[250px]">
                    <select
                        value={selectedRound}
                        onChange={(e) => setSelectedRound(e.target.value)}
                        className="w-full appearance-none bg-zinc-900 border border-zinc-800 rounded-2xl px-8 py-4 pr-12 text-xs font-black uppercase tracking-widest outline-none focus:border-emerald-500 transition-all cursor-pointer"
                    >
                        <option value="overall">Overall Standings</option>
                        {rounds.sort((a: any, b: any) => a.roundNumber - b.roundNumber).map((r: any) => (
                            <option key={r.id} value={r.id}>Round {r.roundNumber}: {r.title}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none group-hover:text-white transition-colors" />
                </div>
            </div>

            {/* Top 3 Podium */}
            {selectedRound === 'overall' && leaderboard?.entries.length >= 3 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                    {/* 2nd Place */}
                    <div className="order-2 md:order-1 p-8 bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] text-center transform hover:-translate-y-2 transition-transform h-fit">
                        <Medal className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
                        <h3 className="text-xl font-black italic uppercase truncate">{leaderboard.entries[1].teamName}</h3>
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1">{leaderboard.entries[1].leadName}</p>
                        <div className="mt-6 text-4xl font-black italic text-zinc-400">{leaderboard.entries[1].cumulativeScore.toFixed(1)}</div>
                        <div className="text-[10px] text-zinc-600 font-black uppercase mt-1">Total Score</div>
                    </div>

                    {/* 1st Place */}
                    <div className="order-1 md:order-2 p-10 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-[3rem] text-center transform hover:-translate-y-4 transition-transform relative overflow-hidden">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
                        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]" />
                        <h3 className="text-3xl font-black italic uppercase truncate text-white">{leaderboard.entries[0].teamName}</h3>
                        <p className="text-xs text-emerald-500 font-black uppercase tracking-widest mt-2">{leaderboard.entries[0].leadName}</p>
                        <div className="mt-8 text-6xl font-black italic text-emerald-500">{leaderboard.entries[0].cumulativeScore.toFixed(1)}</div>
                        <div className="text-xs text-emerald-500/60 font-black uppercase mt-2">Champion Tier</div>
                    </div>

                    {/* 3rd Place */}
                    <div className="order-3 p-8 bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] text-center transform hover:-translate-y-2 transition-transform h-fit">
                        <Award className="w-12 h-12 text-amber-600 mx-auto mb-4" />
                        <h3 className="text-xl font-black italic uppercase truncate">{leaderboard.entries[2].teamName}</h3>
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1">{leaderboard.entries[2].leadName}</p>
                        <div className="mt-6 text-4xl font-black italic text-amber-600">{leaderboard.entries[2].cumulativeScore.toFixed(1)}</div>
                        <div className="text-[10px] text-zinc-600 font-black uppercase mt-1">Total Score</div>
                    </div>
                </div>
            )}

            {/* Detailed Table */}
            <div className="bg-zinc-900/30 border border-zinc-900 rounded-[3rem] overflow-hidden">
                <div className="grid grid-cols-12 p-8 border-b border-zinc-900 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                    <div className="col-span-1 text-center">Rank</div>
                    <div className="col-span-5 px-4 text-left">Squad Personnel</div>
                    <div className="col-span-2 text-center">Status</div>
                    <div className="col-span-2 text-center">{selectedRound === 'overall' ? 'Total Accumulation' : 'Round Score'}</div>
                    <div className="col-span-2 text-center">Trend</div>
                </div>

                <div className="divide-y divide-zinc-900">
                    {leaderboard?.entries.length > 0 ? (
                        leaderboard.entries.map((entry: LeaderboardEntry) => (
                            <div
                                key={entry.teamId}
                                className={`grid grid-cols-12 p-8 items-center group transition-all hover:bg-zinc-900/50 ${entry.status === 'eliminated' ? 'opacity-50 grayscale' : ''}`}
                            >
                                <div className="col-span-1 flex justify-center">
                                    {getRankIcon(entry.rank)}
                                </div>
                                <div className="col-span-5 px-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-black italic text-zinc-500 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                                            {entry.teamName[0]}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black italic uppercase group-hover:text-emerald-400 transition-colors">{entry.teamName}</h4>
                                            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Lead Agent: {entry.leadName}</p>
                                        </div>
                                        {entry.finalPosition && (
                                            <span className="ml-4 px-3 py-1 bg-yellow-500 text-black text-[8px] font-black uppercase rounded-full">
                                                {entry.finalPosition}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="col-span-2 flex justify-center">
                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${entry.status === 'eliminated'
                                        ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                        : entry.status === 'winner'
                                            ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                        }`}>
                                        {entry.status}
                                    </span>
                                </div>
                                <div className="col-span-2 text-center">
                                    <span className="text-2xl font-black italic">
                                        {(selectedRound === 'overall' ? entry.cumulativeScore : entry.roundScore).toFixed(1)}
                                    </span>
                                </div>
                                <div className="col-span-2 flex justify-center">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-2xl border border-zinc-800">
                                        {getTrendIcon(entry.rank, entry.previousRank)}
                                        <span className="text-[10px] font-black text-zinc-500 uppercase">
                                            {entry.previousRank ? (entry.previousRank > entry.rank ? 'UP' : entry.previousRank < entry.rank ? 'DOWN' : 'HOLD') : 'NEW'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-20 text-center">
                            <p className="text-zinc-500 font-black uppercase tracking-[0.3em] italic">No data transmissions received yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Intel */}
            <div className="flex flex-col md:flex-row gap-8 justify-between items-center px-8">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                        <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Active Combatant</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                        <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Relieved from Duty</span>
                    </div>
                </div>
                <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-[0.2em] italic">
                    Intel synchronized: {new Date().toLocaleTimeString()} • HQ Protocol 118-CD
                </p>
            </div>
        </div>
    );
}
