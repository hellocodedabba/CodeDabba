"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthProvider";
import { NavBar } from "@/components/landing/NavBar";

export default function MentorDashboard() {
    const { user, logout } = useAuth();

    return (
        <ProtectedRoute allowedRoles={['MENTOR']}>
            <div className="min-h-screen bg-black text-white">
                <NavBar />
                <div className="container mx-auto px-6 py-24">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
                        <h1 className="text-3xl font-bold mb-4 text-emerald-400">Mentor Dashboard</h1>
                        <p className="text-zinc-400 mb-6">Welcome back, {user?.name || 'Mentor'}!</p>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="p-6 bg-black/50 rounded-xl border border-zinc-800 hover:border-emerald-500/30 transition-colors">
                                <h3 className="text-xl font-semibold mb-2">My Students</h3>
                                <p className="text-sm text-zinc-500">You have 0 active students.</p>
                            </div>
                            <div className="p-6 bg-black/50 rounded-xl border border-zinc-800 hover:border-emerald-500/30 transition-colors">
                                <h3 className="text-xl font-semibold mb-2">Pending Reviews</h3>
                                <p className="text-sm text-zinc-500">No submissions pending review.</p>
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
