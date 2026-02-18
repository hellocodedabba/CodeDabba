"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { NavBar } from "@/components/landing/NavBar";
import HackathonManagementTab from "@/components/admin/HackathonManagementTab";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminHackathonsPage() {
    return (
        <ProtectedRoute allowedRoles={['ADMIN']}>
            <div className="min-h-screen bg-black text-white">
                <NavBar />
                <div className="container mx-auto px-6 py-24">
                    <div className="flex items-center gap-6 mb-12">
                        <Link href="/admin/dashboard" className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-all">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-500">
                                Hackathon Hub
                            </h1>
                            <p className="text-zinc-400 mt-2">Specialized management view</p>
                        </div>
                    </div>

                    <HackathonManagementTab />
                </div>
            </div>
        </ProtectedRoute>
    );
}
