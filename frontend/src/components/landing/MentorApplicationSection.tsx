"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

export function MentorApplicationSection() {
    return (
        <section id="become-mentor" className="py-24 bg-zinc-950 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Content Side */}
                    <div className="text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-6">
                            <span>Join Our Network</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                            Become a <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Mentor</span>
                        </h2>
                        <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
                            Share your expertise and help shape the next generation of developers.
                            As a CodeDabba mentor, you'll guide students through real-world projects, review code, and earn rewards.
                        </p>

                        <div className="space-y-4">
                            {[
                                "Earn competitive compensation for your time",
                                "Flexible schedule - mentor on your terms",
                                "Network with other industry experts",
                                "Access to exclusive teaching resources"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <span className="text-zinc-300">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Call to Action Side */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col items-center justify-center text-center bg-zinc-900/30 backdrop-blur-xl border border-white/5 rounded-3xl p-12 shadow-2xl"
                    >
                        <div className="w-20 h-20 bg-violet-500/10 rounded-full flex items-center justify-center mb-6">
                            <ArrowRight className="w-10 h-10 text-violet-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">Ready to make an impact?</h3>
                        <p className="text-zinc-400 mb-8 max-w-md">
                            Join hundreds of mentors who are already changing lives through code. Applications are reviewed on a rolling basis.
                        </p>
                        <Link
                            href="/mentor-application"
                            className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-500 transition-all hover:scale-105 shadow-xl shadow-violet-500/20 gap-2"
                        >
                            Apply Now
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
