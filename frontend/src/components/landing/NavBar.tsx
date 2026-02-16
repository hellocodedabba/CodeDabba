"use client";

import Link from "next/link";
import { Code2, Github, Menu, X, Loader2, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthProvider";

export function NavBar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user, isLoading, logout } = useAuth();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="p-2 rounded-lg bg-violet-600/10 border border-violet-500/20 group-hover:border-violet-500/50 transition-colors">
                        <Code2 className="w-5 h-5 text-violet-400" />
                    </div>
                    <span className="font-bold text-lg text-white">CodeDabba</span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    <Link href="#features" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                        Features
                    </Link>
                    <Link href="#blogs" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                        Community
                    </Link>
                    <Link href="/pricing" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                        Pricing
                    </Link>
                    {!user && (
                        <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                            Login
                        </Link>
                    )}
                </div>

                <div className="hidden md:flex items-center gap-4">
                    <a
                        href="https://github.com/your-repo"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-zinc-400 hover:text-white transition-colors"
                    >
                        <Github className="w-5 h-5" />
                    </a>
                    {isLoading ? (
                        <div className="w-24 flex justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
                        </div>
                    ) : user ? (
                        <div className="flex items-center gap-4">
                            <Link
                                href="/dashboard"
                                className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-500 transition-colors shadow-lg shadow-violet-500/20"
                            >
                                Dashboard
                            </Link>
                            <button
                                onClick={() => logout()}
                                className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Link
                                href="/login"
                                className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 border border-white/5 rounded-lg transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                href="/register"
                                className="px-4 py-2 text-sm font-medium text-white bg-white/10 border border-white/10 rounded-lg hover:bg-white/20 transition-all"
                            >
                                Start Learning
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-zinc-400 hover:text-white"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 right-0 bg-zinc-900 border-b border-white/5 p-4 flex flex-col gap-4">
                    <Link href="#features" className="text-sm font-medium text-zinc-400 hover:text-white">
                        Features
                    </Link>
                    <Link href="#blogs" className="text-sm font-medium text-zinc-400 hover:text-white">
                        Community
                    </Link>
                    <hr className="border-white/5" />
                    <div className="flex flex-col gap-2">
                        {isLoading ? (
                            <div className="w-full flex justify-center py-2">
                                <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
                            </div>
                        ) : user ? (
                            <>
                                <Link href="/dashboard" className="px-4 py-2 text-center text-sm font-medium text-white bg-violet-600 rounded-lg">
                                    Dashboard
                                </Link>
                                <button
                                    onClick={() => logout()}
                                    className="px-4 py-2 text-center text-sm font-medium text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="px-4 py-2 text-center text-sm font-medium text-zinc-300 bg-zinc-800 rounded-lg">
                                    Login
                                </Link>
                                <Link href="/register" className="px-4 py-2 text-center text-sm font-medium text-white bg-violet-600 rounded-lg">
                                    Start Learning
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
