"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthProvider";
import { NavBar } from "@/components/landing/NavBar";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface MentorApplication {
    id: string;
    name: string;
    email: string;
    mobileNumber: string;
    linkedinProfile: string;
    expertise: string;
    bio: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
}

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'applications'>('overview');
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
            // Refresh list or update local state
            setApplications(apps => apps.map(app =>
                app.id === id ? { ...app, status: action === 'approve' ? 'APPROVED' : 'REJECTED' } : app
            ));
        } catch (error) {
            console.error(`Failed to ${action} application`, error);
            alert(`Failed to ${action} application`);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <ProtectedRoute allowedRoles={['ADMIN']}>
            <div className="min-h-screen bg-black text-white">
                <NavBar />
                <div className="container mx-auto px-6 py-24">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-pink-500">Super Admin Dashboard</h1>
                            <p className="text-zinc-400">Welcome back, {user?.name || 'Admin'}!</p>
                        </div>
                        <button
                            onClick={logout}
                            className="px-4 py-2 text-sm text-red-400 border border-red-900/50 bg-red-900/10 rounded-lg hover:bg-red-900/20 transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 mb-8 border-b border-zinc-800">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview'
                                    ? 'border-pink-500 text-pink-400'
                                    : 'border-transparent text-zinc-400 hover:text-white'
                                }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('applications')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'applications'
                                    ? 'border-pink-500 text-pink-400'
                                    : 'border-transparent text-zinc-400 hover:text-white'
                                }`}
                        >
                            Mentor Applications
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
                    ) : (
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
                                                        <a href={app.linkedinProfile} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-xs">LinkedIn</a>
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
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
