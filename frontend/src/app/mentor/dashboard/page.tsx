"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";
import {
    ArrowRight, Trophy, Users, Shield, Clock, CheckCircle,
    ChevronRight, LayoutDashboard, Settings, BookOpen, Plus,
    Loader2, Search, Filter, Activity, BarChart3, Globe, Sparkles
} from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { NavBar } from "@/components/landing/NavBar";
import api from "@/lib/axios";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";

interface MentorHackathon {
    id: string;
    title: string;
    status: string;
    assignmentType: string;
    startDate: string;
    endDate: string;
}

interface Course {
    id: string;
    title: string;
    description: string;
    status: 'draft_curriculum' | 'curriculum_under_review' | 'curriculum_rejected' | 'curriculum_approved' | 'content_draft' | 'content_under_review' | 'content_rejected' | 'published' | 'archived';
    createdAt: string;
    rejectReason?: string;
    thumbnailUrl?: string;
}

export default function MentorDashboard() {
    const { user, logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [activeTab, setActiveTab] = useState<'hackathons' | 'courses'>('hackathons');
    const [hackathons, setHackathons] = useState<MentorHackathon[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [hRes, cRes] = await Promise.all([
                api.get('/hackathons/mentor/hackathons'),
                api.get('/courses/my-courses')
            ]);
            setHackathons(hRes.data);
            setCourses(cRes.data);
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await logout();
        setIsLoggingOut(false);
    };

    const getCourseStatusBadge = (status: string, reason?: string) => {
        switch (status) {
            case 'published':
                return <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 text-[9px] font-black uppercase tracking-widest rounded-full">Live</span>;
            case 'curriculum_under_review':
            case 'content_under_review':
                return <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-black uppercase tracking-widest rounded-full">In Review</span>;
            case 'curriculum_rejected':
            case 'content_rejected':
                return <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-black uppercase tracking-widest rounded-full">Revision Needed</span>;
            case 'curriculum_approved':
                return <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest rounded-full">Approved</span>;
            case 'content_draft':
                return <span className="px-3 py-1 bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[9px] font-black uppercase tracking-widest rounded-full">Content Draft</span>;
            default:
                return <span className="px-3 py-1 bg-zinc-800 text-zinc-400 border border-zinc-700 text-[9px] font-black uppercase tracking-widest rounded-full">Draft</span>;
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <LayoutDashboard className="w-12 h-12 animate-pulse text-emerald-500" />
        </div>
    );

    return (
        <ProtectedRoute allowedRoles={['MENTOR']}>
            {isLoggingOut && <FullScreenLoader message="Signing out..." />}
            <div className="min-h-screen bg-black text-white pb-24">
                <NavBar />

                {/* Unified Hero Header */}
                <div className="relative overflow-hidden bg-zinc-950 pt-32 pb-16 border-b border-zinc-800">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -z-10" />
                    <div className="container mx-auto px-6">
                        <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">
                                        Commander Access Granted
                                    </span>
                                </div>
                                <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-2">Mentor HQ</h1>
                                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Directing operations for {user?.name}</p>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={handleLogout}
                                    className="px-6 py-3 bg-red-950/20 text-red-500 border border-red-950/30 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-950/40 transition-all active:scale-95"
                                >
                                    Log Out
                                </button>
                            </div>
                        </div>

                        {/* Premium Tab Switcher */}
                        <div className="flex gap-2 p-1.5 bg-zinc-900/50 border border-zinc-800 rounded-2xl w-fit mt-12 backdrop-blur-md">
                            <button
                                onClick={() => setActiveTab('hackathons')}
                                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${activeTab === 'hackathons'
                                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                                    : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                                    }`}
                            >
                                <Trophy className="w-4 h-4" />
                                Hackathons
                            </button>
                            <button
                                onClick={() => setActiveTab('courses')}
                                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${activeTab === 'courses'
                                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                                    : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                                    }`}
                            >
                                <BookOpen className="w-4 h-4" />
                                My Academy
                            </button>
                        </div>
                    </div>
                </div>

                <main className="container mx-auto px-6 mt-12">
                    {activeTab === 'hackathons' ? (
                        <div className="grid lg:grid-cols-3 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Stats Panel */}
                            <div className="space-y-6">
                                <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all pointer-events-none">
                                        <Activity className="w-24 h-24 text-emerald-500" />
                                    </div>
                                    <h3 className="text-xl font-black italic uppercase mb-8 flex items-center gap-3">
                                        <Shield className="w-5 h-5 text-emerald-500" />
                                        Deployment Summary
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="p-6 bg-black/40 rounded-3xl border border-zinc-800/50">
                                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Active Missions</p>
                                            <p className="text-4xl font-black italic text-white leading-none">{hackathons.length}</p>
                                        </div>
                                        <div className="p-6 bg-black/40 rounded-3xl border border-zinc-800/50">
                                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Unit Ranking</p>
                                            <p className="text-3xl font-black italic text-emerald-500 uppercase">Expert</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-black border border-zinc-800 border-dashed rounded-[2.5rem]">
                                    <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                                        Validate squads and provide technical oversight during the registration and formation phases.
                                    </p>
                                </div>
                            </div>

                            {/* Hackathons List */}
                            <div className="lg:col-span-2 space-y-8">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-4">
                                        Ongoing Operations
                                    </h2>
                                    <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl">
                                        <Filter className="w-4 h-4 text-zinc-600" />
                                    </div>
                                </div>

                                {hackathons.length === 0 ? (
                                    <div className="text-center py-24 bg-zinc-900/30 border border-zinc-800 rounded-[3rem] border-dashed">
                                        <Clock className="w-16 h-16 text-zinc-800 mx-auto mb-6" />
                                        <h3 className="text-lg font-black uppercase text-zinc-600 tracking-widest">No Missions Assigned</h3>
                                        <p className="text-zinc-700 mt-2 text-sm italic font-bold">Waiting for deployment orders from HQ...</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-6">
                                        {hackathons.map((h) => (
                                            <Link key={`${h.id}-${h.assignmentType}`} href={`/mentor/dashboard/hackathons/${h.id}`} className="group flex flex-col md:flex-row items-center gap-8 p-8 bg-zinc-900 border border-zinc-800 rounded-[3rem] hover:border-emerald-500/40 transition-all hover:bg-zinc-900/80 shadow-xl">
                                                <div className="w-20 h-20 bg-emerald-500/5 rounded-[2rem] flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500/10 transition-all shadow-inner border border-emerald-500/10 group-hover:scale-105">
                                                    <Globe className="w-10 h-10 group-hover:rotate-12 transition-transform" />
                                                </div>

                                                <div className="flex-1 text-center md:text-left">
                                                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
                                                        <span className="px-3 py-1 bg-zinc-800 text-zinc-400 text-[8px] font-black uppercase tracking-widest rounded-full border border-zinc-700">
                                                            {h.status?.replace(/_/g, ' ') || 'ACTIVE'}
                                                        </span>
                                                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">
                                                            {h.assignmentType} Scope
                                                        </span>
                                                    </div>
                                                    <h3 className="text-2xl font-black italic uppercase tracking-tight group-hover:text-emerald-400 transition-colors leading-none">{h.title}</h3>
                                                    <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.2em] mt-2">ID: {h.id?.split('-')[0] || 'N/A'}</p>
                                                </div>

                                                <div className="flex flex-col items-center md:items-end gap-4 w-full md:w-auto mt-4 md:mt-0 pt-6 md:pt-0 border-t md:border-t-0 border-zinc-800">
                                                    <div className="flex items-center gap-2 px-5 py-3 bg-black/40 border border-zinc-800 rounded-2xl group-hover:border-emerald-500/50 transition-colors">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-3">
                                                            View Hubs <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                                <div>
                                    <h2 className="text-4xl font-black italic uppercase tracking-tighter flex items-center gap-4">
                                        <BookOpen className="w-10 h-10 text-violet-500" />
                                        Academy Hub
                                    </h2>
                                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mt-1">Directing {courses.length} educational programs</p>
                                </div>
                                <Link
                                    href="/mentor/dashboard/courses/create"
                                    className="flex items-center gap-3 px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-lg shadow-violet-600/20 active:scale-95 group"
                                >
                                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                                    Launch New Course
                                </Link>
                            </div>

                            {courses.length === 0 ? (
                                <div className="text-center py-32 bg-zinc-900/30 border border-zinc-800 rounded-[3rem] border-dashed">
                                    <Sparkles className="w-16 h-16 text-zinc-800 mx-auto mb-6" />
                                    <h3 className="text-xl font-black uppercase text-zinc-600 tracking-widest">Academy Dormant</h3>
                                    <p className="text-zinc-700 mt-2 text-sm italic font-bold max-w-xs mx-auto">Upload your curriculum to ignite the database.</p>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
                                    {courses.map((course) => (
                                        <Link
                                            key={course.id}
                                            href={`/mentor/dashboard/courses/${course.id}/builder`}
                                            className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden hover:border-violet-500/50 transition-all hover:-translate-y-2 shadow-xl group"
                                        >
                                            <div className="h-44 bg-black relative p-6 flex flex-col justify-between overflow-hidden">
                                                {course.thumbnailUrl ? (
                                                    <img src={course.thumbnailUrl} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700" />
                                                ) : (
                                                    <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 opacity-30" />
                                                )}
                                                <div className="relative z-10 flex justify-end">
                                                    {getCourseStatusBadge(course.status, course.rejectReason)}
                                                </div>
                                                <div className="relative z-10">
                                                    <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Module Stream</span>
                                                </div>
                                            </div>
                                            <div className="p-8 flex-1 flex flex-col bg-zinc-900/80 backdrop-blur-xl">
                                                <h3 className="text-xl font-black italic uppercase tracking-tight text-white mb-3 group-hover:text-violet-400 transition-colors line-clamp-1">{course.title}</h3>
                                                <p className="text-zinc-500 text-xs font-medium line-clamp-2 mb-8 leading-relaxed">{course.description}</p>

                                                <div className="mt-auto flex items-center justify-between pt-6 border-t border-zinc-800">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-none">Registered</span>
                                                        <span className="text-xs font-bold text-zinc-400 mt-1">{new Date(course.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-zinc-600 group-hover:text-violet-500 border border-zinc-800 group-hover:border-violet-500/30 transition-all">
                                                        <ChevronRight className="w-5 h-5" />
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </ProtectedRoute>
    );
}
