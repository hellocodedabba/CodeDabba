"use client";

import { Video, Code, ShieldCheck, Award } from "lucide-react";

export function FeaturesSection() {
    return (
        <section id="features" className="py-24 bg-zinc-950 relative overflow-hidden">
            {/* Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-900/10 rounded-full blur-[100px]" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
                        Why CodeDabba Works
                    </h2>
                    <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                        We've replaced passive watching with active building. Experience a platform designed for mastery.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <FeatureCard
                        icon={<Video className="h-6 w-6 text-blue-400" />}
                        title="Structured Learning"
                        description="Modules and chapters are locked. You must complete the task to unlock the next video."
                        color="bg-blue-500/10 border-blue-500/20 hover:border-blue-500/50"
                    />
                    <FeatureCard
                        icon={<Code className="h-6 w-6 text-emerald-400" />}
                        title="Hands-on Coding"
                        description="Write code in our online compiler. It's automatically tested and verified instantly."
                        color="bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/50"
                    />
                    <FeatureCard
                        icon={<ShieldCheck className="h-6 w-6 text-purple-400" />}
                        title="Verified Certification"
                        description="Earn certificates that actually mean something because you proved your skills."
                        color="bg-purple-500/10 border-purple-500/20 hover:border-purple-500/50"
                    />
                    <FeatureCard
                        icon={<Award className="h-6 w-6 text-amber-400" />}
                        title="Expert Mentorship"
                        description="Learn from industry pros. Get your code reviewed and doubt cleared in live sessions."
                        color="bg-amber-500/10 border-amber-500/20 hover:border-amber-500/50"
                    />
                </div>
            </div>
        </section>
    );
}

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: string }) {
    return (
        <div className={`p-8 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${color}`}>
            <div className="mb-4 bg-zinc-900/50 w-12 h-12 rounded-xl flex items-center justify-center border border-white/5">
                {icon}
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">{title}</h3>
            <p className="text-zinc-400 leading-relaxed text-sm">{description}</p>
        </div>
    );
}
