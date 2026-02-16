"use client";
import React from "react";
import { BackgroundBeams } from "@/components/ui/background-beams";

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-neutral-950 p-4">
            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 min-h-[600px]">
                {/* Left Side - Visual */}
                <div className="hidden lg:flex relative bg-indigo-950 flex-col justify-between p-12 text-white overflow-hidden">
                    {/* Background Image/Gradient */}
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                    {/* Top Content */}
                    <div className="relative z-10 flex justify-between items-center w-full">
                        <div className="text-2xl font-bold tracking-tighter flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">CD</span>
                            CodeDabba
                        </div>
                    </div>

                    {/* Bottom Content */}
                    <div className="relative z-10 max-w-lg space-y-4">
                        <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center mb-6 shadow-glow">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 2v20" /><path d="m17 5-5-3-5 3" /><path d="m17 19-5 3-5-3" /></svg>
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">
                            "Discipline is the bridge between goals and accomplishment."
                        </h1>
                        <p className="text-lg text-zinc-300 font-medium">
                            Join thousands of developers building their future with consistent practice.
                        </p>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full bg-zinc-950 p-8 lg:p-12 flex items-center justify-center">
                    <div className="w-full max-w-md space-y-8">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
