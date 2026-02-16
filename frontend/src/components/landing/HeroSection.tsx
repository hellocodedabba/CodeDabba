"use client";

import Link from "next/link";
import { ArrowRight, Terminal, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function HeroSection() {
    return (
        <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-black selection:bg-violet-500/30">

            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute top-[20%] left-[50%] transform -translate-x-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[100px] opacity-50" />
            </div>

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">

                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-left"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-violet-300 text-sm font-medium mb-6">
                        <Sparkles className="w-4 h-4" />
                        <span>The Future of Coding Education</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1] mb-6">
                        Boost Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-white animate-gradient">
                            Startup Career
                        </span>
                    </h1>

                    <p className="text-lg text-zinc-400 mb-8 max-w-lg leading-relaxed">
                        Stop watching tutorials. Start building real-world projects with an automated mentorship platform that tracks your every line of code.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center lg:justify-start">
                        <Link
                            href="/register"
                            className="px-8 py-4 text-lg font-bold text-white bg-violet-600 rounded-2xl hover:bg-violet-500 transition-all hover:scale-105 shadow-xl shadow-violet-500/20 flex items-center justify-center gap-2"
                        >
                            Start Learning Now
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="#features"
                            className="px-8 py-4 text-lg font-bold text-zinc-300 border border-zinc-700 bg-zinc-900/50 backdrop-blur-sm rounded-2xl hover:bg-zinc-800 transition-all hover:text-white flex items-center justify-center"
                        >
                            Explore Features
                        </Link>
                    </div>
                    <div className="mt-4 text-sm text-zinc-500 text-center lg:text-left">
                        Already have an account?{" "}
                        <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">
                            Log in
                        </Link>
                    </div>

                    {/* Stats Mini */}
                    <div className="mt-12 flex items-center gap-8 text-sm font-medium text-zinc-500">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-zinc-300">1.2k Online Now</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-violet-500" />
                            <span className="text-zinc-300">Run code in browser</span>
                        </div>
                    </div>
                </motion.div>

                {/* Visual Content (3D-like Card) */}
                <motion.div
                    initial={{ opacity: 0, y: 50, rotateX: 10 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="relative hidden lg:block"
                >
                    <div className="relative z-10 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl shadow-violet-500/10 transform rotate-y-[-12deg] hover:rotate-y-0 transition-transform duration-500 perspective-1000">
                        {/* Mock Code Window */}
                        <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-4">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <div className="ml-auto text-xs text-zinc-500 font-mono">app.tsx</div>
                        </div>
                        <div className="space-y-3 font-mono text-sm">
                            <div className="flex">
                                <span className="text-zinc-600 mr-4">1</span>
                                <span className="text-pink-400">import</span>
                                <span className="text-white ml-2">{"{ Future }"}</span>
                                <span className="text-pink-400 ml-2">from</span>
                                <span className="text-green-400 ml-2">'codedabba'</span>
                                <span className="text-zinc-500">;</span>
                            </div>
                            <div className="flex">
                                <span className="text-zinc-600 mr-4">2</span>
                            </div>
                            <div className="flex">
                                <span className="text-zinc-600 mr-4">3</span>
                                <span className="text-violet-400">function</span>
                                <span className="text-yellow-300 ml-2">BuildCareer</span>
                                <span className="text-zinc-400">() {"{"}</span>
                            </div>
                            <div className="flex">
                                <span className="text-zinc-600 mr-4">4</span>
                                <span className="text-zinc-400 ml-4">const</span>
                                <span className="text-blue-300 ml-2">skills</span>
                                <span className="text-pink-400 ml-2">=</span>
                                <span className="text-white ml-2">await</span>
                                <span className="text-green-300 ml-2">learn()</span>
                                <span className="text-zinc-500">;</span>
                            </div>
                            <div className="flex">
                                <span className="text-zinc-600 mr-4">5</span>
                                <span className="text-zinc-400 ml-4">return</span>
                                <span className="text-orange-300 ml-2">skills.mastery</span>
                                <span className="text-zinc-400">;</span>
                            </div>
                            <div className="flex">
                                <span className="text-zinc-600 mr-4">6</span>
                                <span className="text-zinc-400">{"}"}</span>
                                <span className="animate-pulse ml-1 w-2 h-4 bg-violet-500 block"></span>
                            </div>
                        </div>

                        {/* Floating Badge */}
                        <div className="absolute -bottom-6 -right-6 bg-zinc-800 p-4 rounded-xl border border-white/10 shadow-xl flex items-center gap-3 animate-bounce-slow">
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                                <ArrowRight className="w-5 h-5 -rotate-45" />
                            </div>
                            <div>
                                <div className="text-xs text-zinc-400">Growth</div>
                                <div className="text-sm font-bold text-white">+125% Skills</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
