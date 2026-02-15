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
        <div className="min-h-screen w-full flex">
            {/* Left Side - Visual */}
            <div className="hidden lg:flex w-1/2 relative bg-slate-950 flex-col items-center justify-center p-12 text-white overflow-hidden">
                <BackgroundBeams />
                <div className="relative z-10 max-w-lg text-center">
                    <h1 className="text-4xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600">
                        {title}
                    </h1>
                    <p className="text-lg text-neutral-400 leading-relaxed">
                        {subtitle}
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 bg-white dark:bg-black flex items-center justify-center p-8">
                <div className="w-full max-w-md space-y-8">
                    {children}
                </div>
            </div>
        </div>
    );
}
