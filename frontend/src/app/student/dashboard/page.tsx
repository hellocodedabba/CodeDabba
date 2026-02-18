"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthProvider";
import { NavBar } from "@/components/landing/NavBar";
import { useState, useEffect } from "react";
import { Loader2, BookOpen, PlayCircle, Trophy, Users as UsersIcon, ArrowRight, Calendar } from "lucide-react";
import api from "@/lib/axios";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface EnrolledCourse {
    id: string;
    title: string;
    description: string;
    thumbnailUrl?: string;
    progress?: {
        percentage: number;
        completedLessons: number;
        totalLessons: number;
    };
}

interface HackathonRegistration {
    id: string;
    hackathon: {
        id: string;
        title: string;
        bannerUrl?: string;
        startDate: string;
        status: string;
    };
    registrationType: 'individual' | 'team';
    teamName?: string;
    isTeamLead: boolean;
    teamMembers?: {
        id: string;
        name: string;
        email: string;
        isTeamLead: boolean;
    }[];
}

export default function StudentDashboard() {
    const { user, logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
    const [myHackathons, setMyHackathons] = useState<HackathonRegistration[]>([]);
    const [invitationCount, setInvitationCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [hackathonsLoading, setHackathonsLoading] = useState(true);

    useEffect(() => {
        fetchEnrolledCourses();
        fetchMyHackathons();
        fetchInvitationCount();
    }, []);

    const fetchEnrolledCourses = async () => {
        try {
            const { data } = await api.get('/courses/enrolled');
            setEnrolledCourses(data);
        } catch (error) {
            console.error("Failed to fetch enrolled courses", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyHackathons = async () => {
        try {
            const { data } = await api.get('/hackathons/mine/registrations');
            setMyHackathons(data);
        } catch (error) {
            console.error("Failed to fetch hackathons", error);
        } finally {
            setHackathonsLoading(false);
        }
    };

    const fetchInvitationCount = async () => {
        try {
            const { data } = await api.get('/hackathons/mine/invitations');
            setInvitationCount(data.length);
        } catch (error) {
            console.error("Failed to fetch invitations", error);
        }
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await logout();
        setIsLoggingOut(false);
    };

    return (
        <ProtectedRoute allowedRoles={['STUDENT']}>
            <div className="min-h-screen bg-black text-white">
                <NavBar />
                <div className="container mx-auto px-6 py-24">
                    <div className="mb-12">
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-pink-400 mb-2">My Learning</h1>
                        <p className="text-zinc-400">Welcome back, {user?.name}!</p>
                    </div>

                    {invitationCount > 0 && (
                        <div className="mb-12 animate-in slide-in-from-top-4 duration-500">
                            <Link href="/hackathons/invitations" className="group block p-1 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-[2rem] hover:scale-[1.01] transition-all overflow-hidden shadow-2xl shadow-fuchsia-600/20">
                                <div className="bg-zinc-950 rounded-[1.9rem] p-8 flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-fuchsia-600/10 rounded-2xl flex items-center justify-center border border-fuchsia-600/20">
                                            <Trophy className="w-8 h-8 text-fuchsia-500 animate-bounce" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black italic uppercase italic tracking-tight">Active Recruitment Alert</h2>
                                            <p className="text-zinc-400 font-medium">You have <span className="text-fuchsia-400 font-bold">{invitationCount}</span> pending squad invitations. Deploy to battle now.</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-8 h-8 text-fuchsia-500 group-hover:translate-x-2 transition-transform" />
                                </div>
                            </Link>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                        </div>
                    ) : enrolledCourses.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {enrolledCourses.map((course) => (
                                <div key={course.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-violet-500/50 transition-all group flex flex-col">
                                    <div className="aspect-video bg-zinc-800 relative">
                                        {course.thumbnailUrl ? (
                                            <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                                <BookOpen className="w-12 h-12 opacity-20" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Link href={`/learn/${course.id}`} className="px-6 py-2 bg-white text-black rounded-full font-bold transform translate-y-4 group-hover:translate-y-0 transition-all flex items-center gap-2">
                                                <PlayCircle className="w-5 h-5" /> Continue
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <h3 className="text-xl font-bold mb-2 line-clamp-1 text-zinc-100">{course.title}</h3>
                                        <p className="text-sm text-zinc-400 line-clamp-2 mb-4 flex-1">{course.description}</p>

                                        <div className="space-y-2 mt-auto">
                                            <div className="flex justify-between text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                                <span>Progress</span>
                                                <span>{course.progress?.percentage || 0}%</span>
                                            </div>
                                            <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
                                                <div
                                                    className="bg-gradient-to-r from-violet-600 to-pink-600 h-full rounded-full transition-all duration-1000 ease-out"
                                                    style={{ width: `${course.progress?.percentage || 0}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 bg-zinc-900/30 border border-zinc-800 rounded-3xl border-dashed">
                            <BookOpen className="w-16 h-16 text-zinc-700 mx-auto mb-6" />
                            <h2 className="text-2xl font-bold text-white mb-2">You haven't enrolled in any courses yet</h2>
                            <p className="text-zinc-400 mb-8 max-w-md mx-auto">Explore our catalog to find your next skill to master.</p>
                            <Link href="/courses" className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-all">
                                Browse Courses
                            </Link>
                        </div>
                    )}

                    {/* Hackathons Section */}
                    <div className="mt-24">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-violet-400">My Hackathons</h2>
                            <Link href="/hackathons" className="text-sm font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
                                Explore All <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {hackathonsLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
                            </div>
                        ) : myHackathons.length > 0 ? (
                            <div className="grid md:grid-cols-2 gap-8">
                                {myHackathons.map((reg) => (
                                    <div key={reg.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-fuchsia-500/50 transition-all group p-8">
                                        <div className="flex gap-8">
                                            <div className="w-32 h-32 rounded-2xl overflow-hidden bg-zinc-800 flex-shrink-0">
                                                {reg.hackathon.bannerUrl ? (
                                                    <img src={reg.hackathon.bannerUrl} alt={reg.hackathon.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                                                        <Trophy className="w-12 h-12" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none group-hover:text-fuchsia-400 transition-colors">
                                                        {reg.hackathon.title}
                                                    </h3>
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${reg.hackathon.status === 'registration_open' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                        {reg.hackathon.status === 'registration_open' ? 'REGISTRATION OPEN' : 'CLOSED'}
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap gap-4 mt-6">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                                        <Calendar className="w-4 h-4 text-violet-500" />
                                                        {new Date(reg.hackathon.startDate).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                                        <UsersIcon className="w-4 h-4 text-fuchsia-500" />
                                                        {reg.registrationType === 'individual' ? 'SOLO' : `TEAM: ${reg.teamName}`}
                                                    </div>
                                                </div>

                                                {reg.registrationType === 'team' && reg.teamMembers && (
                                                    <div className="mt-6 pt-6 border-t border-white/5">
                                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-3">Unit Members</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {reg.teamMembers.map(m => (
                                                                <div key={m.id} title={m.email} className={`px-3 py-1 rounded-lg text-xs font-bold border ${m.isTeamLead ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20' : 'bg-zinc-800 text-zinc-400 border-white/5'}`}>
                                                                    {m.name} {m.isTeamLead && '👑'}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="mt-8">
                                                    <Link href={`/hackathons/${reg.hackathon.id}/team`} className="inline-flex items-center gap-2 text-sm font-black italic uppercase text-white hover:text-fuchsia-400 transition-colors">
                                                        Operational Command <ArrowRight className="w-4 h-4" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-zinc-900/30 border border-zinc-800 rounded-[3rem] border-dashed">
                                <Trophy className="w-16 h-16 text-zinc-700 mx-auto mb-6 opacity-20" />
                                <h3 className="text-2xl font-bold text-zinc-500 mb-2">No active missions</h3>
                                <p className="text-zinc-600 mb-8 max-w-sm mx-auto">You haven't enlisted in any hackathons yet. The arena is waiting.</p>
                                <Link href="/hackathons" className="px-8 py-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-2xl font-black italic uppercase transition-all shadow-xl shadow-fuchsia-600/20">
                                    Browse Missions
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
