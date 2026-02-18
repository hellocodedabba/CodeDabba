"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthProvider";
import { NavBar } from "@/components/landing/NavBar";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from 'react-hot-toast';
import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HackathonManagementTab from "@/components/admin/HackathonManagementTab";

interface MentorApplication {
    id: string;
    name: string;
    email: string;
    mobileNumber: string;
    linkedinProfile: string;
    portfolioUrl?: string;
    resumeFileId?: string;
    expertise: string;
    bio: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
}

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await logout();
        setIsLoggingOut(false);
    };

    const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'curriculum_reviews' | 'content_reviews' | 'hackathons'>('overview');
    const [applications, setApplications] = useState<MentorApplication[]>([]);
    const [loadingApps, setLoadingApps] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (activeTab === 'applications') {
            fetchApplications();
        }
    }, [activeTab]);

    const fetchApplications = async () => {
        setLoadingApps(true);
        try {
            const { data } = await api.get('/mentor-applications');
            setApplications(data);
        } catch (error) {
            console.error("Failed to fetch applications", error);
        } finally {
            setLoadingApps(false);
        }
    };

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        setActionLoading(id);
        try {
            await api.post(`/mentor-applications/${id}/${action}`);
            setApplications(apps => apps.map(app =>
                app.id === id ? { ...app, status: action === 'approve' ? 'APPROVED' : 'REJECTED' } : app
            ));
        } catch (error) {
            console.error(`Failed to ${action} application`, error);
            toast.error(`Failed to ${action} application`);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <ProtectedRoute allowedRoles={['ADMIN']}>
            {isLoggingOut && <FullScreenLoader message="Signing out..." />}
            <div className="min-h-screen bg-black text-white">
                <NavBar />
                <div className="container mx-auto px-6 py-24">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-pink-500">Super Admin Dashboard</h1>
                            <p className="text-zinc-400">Welcome back, {user?.name || 'Admin'}!</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="px-4 py-2 text-sm text-red-400 border border-red-900/50 bg-red-900/10 rounded-lg hover:bg-red-900/20 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            Sign Out
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 mb-8 border-b border-zinc-800 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'overview'
                                ? 'border-pink-500 text-pink-400'
                                : 'border-transparent text-zinc-400 hover:text-white'
                                }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('applications')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'applications'
                                ? 'border-pink-500 text-pink-400'
                                : 'border-transparent text-zinc-400 hover:text-white'
                                }`}
                        >
                            Mentor Applications
                        </button>
                        <button
                            onClick={() => setActiveTab('curriculum_reviews')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'curriculum_reviews'
                                ? 'border-pink-500 text-pink-400'
                                : 'border-transparent text-zinc-400 hover:text-white'
                                }`}
                        >
                            Curriculum Reviews
                        </button>
                        <button
                            onClick={() => setActiveTab('content_reviews')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'content_reviews'
                                ? 'border-pink-500 text-pink-400'
                                : 'border-transparent text-zinc-400 hover:text-white'
                                }`}
                        >
                            Content Reviews
                        </button>
                        <button
                            onClick={() => setActiveTab('hackathons')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === 'hackathons'
                                ? 'border-pink-500 text-pink-400'
                                : 'border-transparent text-zinc-400 hover:text-white'
                                }`}
                        >
                            Hackathons
                        </button>
                    </div>

                    {activeTab === 'overview' ? (
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800 hover:border-pink-500/30 transition-colors">
                                <h3 className="text-xl font-semibold mb-2">Total Users</h3>
                                <p className="text-3xl font-bold text-white">10.5k</p>
                            </div>
                            <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800 hover:border-pink-500/30 transition-colors">
                                <h3 className="text-xl font-semibold mb-2">Revenue</h3>
                                <p className="text-3xl font-bold text-white">$45k</p>
                            </div>
                            <div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800 hover:border-pink-500/30 transition-colors">
                                <h3 className="text-xl font-semibold mb-2">System Health</h3>
                                <p className="text-sm text-emerald-400">All Systems Operational</p>
                            </div>
                        </div>
                    ) : activeTab === 'applications' ? (
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                            {loadingApps ? (
                                <div className="p-12 flex justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                                </div>
                            ) : applications.length === 0 ? (
                                <div className="p-12 text-center text-zinc-500">
                                    No applications found.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-zinc-400">
                                        <thead className="bg-zinc-900 text-zinc-200 uppercase font-medium">
                                            <tr>
                                                <th className="px-6 py-4">Name</th>
                                                <th className="px-6 py-4">Contact</th>
                                                <th className="px-6 py-4">Expertise</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-800">
                                            {applications.map((app) => (
                                                <tr key={app.id} className="hover:bg-zinc-800/50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-white">
                                                        {app.name}
                                                        <div className="text-xs text-zinc-500">
                                                            Applied: {new Date(app.createdAt).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div>{app.email}</div>
                                                        <div>{app.mobileNumber}</div>
                                                        <div className="flex gap-2 text-xs mt-1">
                                                            <a href={app.linkedinProfile} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">LinkedIn</a>
                                                            {app.portfolioUrl && (
                                                                <a href={app.portfolioUrl} target="_blank" rel="noreferrer" className="text-purple-400 hover:underline">Portfolio</a>
                                                            )}
                                                            {app.resumeFileId && (
                                                                <a href={`${api.defaults.baseURL}/files/${app.resumeFileId}`} target="_blank" rel="noreferrer" className="text-green-400 hover:underline">Resume</a>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 max-w-xs truncate" title={app.expertise}>
                                                        {app.expertise}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${app.status === 'APPROVED' ? 'bg-green-500/10 text-green-400' :
                                                            app.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                                                                'bg-yellow-500/10 text-yellow-400'
                                                            }`}>
                                                            {app.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right space-x-2">
                                                        {app.status === 'PENDING' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleAction(app.id, 'approve')}
                                                                    disabled={!!actionLoading}
                                                                    className="p-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors disabled:opacity-50"
                                                                    title="Approve"
                                                                >
                                                                    {actionLoading === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAction(app.id, 'reject')}
                                                                    disabled={!!actionLoading}
                                                                    className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                                                    title="Reject"
                                                                >
                                                                    <XCircle className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div >
                    ) : activeTab === 'hackathons' ? (
                        <HackathonManagementTab />
                    ) : (
                        <div className="space-y-6">
                            <CourseReviewList phase={activeTab === 'curriculum_reviews' ? 'curriculum' : 'content'} />
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}

function CourseReviewList({ phase }: { phase: 'curriculum' | 'content' }) {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchCourses();
    }, [phase]);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const status = phase === 'curriculum' ? 'curriculum_under_review' : 'content_under_review';
            const { data } = await api.get('/courses/admin/all', { params: { status } });
            setCourses(data.data);
        } catch (error) {
            console.error("Failed to fetch courses", error);
            toast.error("Failed to load reviews");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>;

    if (courses.length === 0) return (
        <div className="text-center py-24 bg-zinc-900/30 border border-zinc-800 rounded-3xl border-dashed">
            <h2 className="text-xl font-bold text-zinc-500 mb-2">All caught up!</h2>
            <p className="text-zinc-600">No {phase} reviews pending at the moment.</p>
        </div>
    );

    return (
        <div className="grid gap-6">
            <h2 className="text-xl font-bold px-1 text-zinc-300 capitalize">{phase} Reviews</h2>
            {courses.map((course) => (
                <div key={course.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row gap-6 hover:border-pink-500/30 transition-all group overflow-hidden relative">
                    {/* Animated background on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="w-full md:w-56 aspect-video bg-zinc-800 rounded-xl overflow-hidden flex-shrink-0 border border-white/5 relative z-10">
                        {course.thumbnailUrl ? (
                            <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-600 italic">No Thumbnail</div>
                        )}
                        <div className="absolute top-2 left-2">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${phase === 'curriculum'
                                ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
                                : 'bg-blue-500/20 text-blue-500 border-blue-500/30'
                                }`}>
                                {phase === 'curriculum' ? 'Phase 1: Structure' : 'Phase 2: Content'}
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 relative z-10 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-pink-400 transition-colors line-clamp-1">{course.title}</h3>
                                    <p className="text-sm text-zinc-400 line-clamp-1">
                                        Applied by <span className="text-zinc-200 font-medium">{course.mentor?.name}</span> •
                                        Submitted {new Date(phase === 'curriculum' ? (course.submittedCurriculumAt || course.createdAt) : (course.submittedContentAt || course.createdAt)).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="px-2 py-1 rounded bg-zinc-800/50 border border-zinc-700 text-[10px] text-zinc-400 uppercase font-bold tracking-tighter">{course.level}</span>
                                    <span className="px-2 py-1 rounded bg-pink-500/10 border border-pink-500/20 text-[10px] text-pink-400 uppercase font-bold tracking-tighter">{course.category}</span>
                                </div>
                            </div>

                            <p className="text-sm text-zinc-500 line-clamp-2 mt-2">
                                {course.description}
                            </p>
                        </div>

                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800/50">
                            <div className="flex gap-4 text-xs font-semibold uppercase tracking-widest">
                                <div><span className="text-zinc-600 mr-2">Price:</span> <span className="text-white">{course.accessType === 'free' ? 'FREE' : `$${course.price}`}</span></div>
                                <div><span className="text-zinc-600 mr-2">Type:</span> <span className="text-white">{course.accessType}</span></div>
                            </div>

                            <Link
                                href={`/admin/dashboard/courses/${course.id}`}
                                className="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-pink-600/20 hover:shadow-pink-600/40 transform hover:-translate-y-1"
                            >
                                Review {phase === 'curriculum' ? 'Curriculum' : 'Content'}
                            </Link>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

