"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const stats = [
    { label: "Active Learners", value: "10K+", suffix: "" },
    { label: "Code Submissions", value: "1.5M", suffix: "+" },
    { label: "Mentors", value: "500", suffix: "+" },
    { label: "Countries", value: "30", suffix: "+" },
];

export function StatsSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section className="py-20 border-y border-white/5 bg-black/20" ref={ref}>
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                    {stats.map((stat, index) => (
                        <div key={index} className="flex flex-col items-center text-center">
                            <motion.span
                                initial={{ opacity: 0, y: 20 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50 mb-2 font-mono"
                            >
                                {stat.value}
                            </motion.span>
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={isInView ? { opacity: 1 } : {}}
                                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                                className="text-sm md:text-base text-zinc-500 uppercase tracking-wider font-medium"
                            >
                                {stat.label}
                            </motion.span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
