"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthProvider";
import { NavBar } from "@/components/landing/NavBar";

export default function StudentDashboard() {
    const { user, logout } = useAuth();

    return (
        <ProtectedRoute allowedRoles={['STUDENT']}>
            <div className="min-h-screen bg-black text-white">
                <NavBar />
                <div className="container mx-auto px-6 py-24">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
                        <h1 className="text-3xl font-bold mb-4 text-violet-400">Student Dashboard</h1>
                        <p className="text-zinc-400 mb-6">Welcome back, {user?.name || 'Student'}!</p>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="p-6 bg-black/50 rounded-xl border border-zinc-800 hover:border-violet-500/30 transition-colors">
                                <h3 className="text-xl font-semibold mb-2">My Courses</h3>
                                <p className="text-sm text-zinc-500">You are enrolled in 0 courses.</p>
                                <button className="mt-4 px-4 py-2 bg-violet-600 rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors">
                                    Browse Courses
                                </button>
                            </div>
                            <div className="p-6 bg-black/50 rounded-xl border border-zinc-800 hover:border-violet-500/30 transition-colors">
                                <h3 className="text-xl font-semibold mb-2">Progress</h3>
                                <div className="w-full bg-zinc-800 rounded-full h-2.5 mb-4 dark:bg-zinc-700 mt-2">
                                    <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: '10%' }}></div>
                                </div>
                                <p className="text-sm text-zinc-500">10% Completed</p>
                            </div>
                        </div>

                        <div className="mt-8">
                            <button
                                onClick={logout}
                                className="px-4 py-2 text-sm text-red-400 border border-red-900/50 bg-red-900/10 rounded-lg hover:bg-red-900/20 transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
