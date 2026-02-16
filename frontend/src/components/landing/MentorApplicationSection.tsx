"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Send, Loader2 } from "lucide-react";
import api from "@/lib/axios";

export function MentorApplicationSection() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        mobileNumber: "",
        linkedinProfile: "",
        expertise: "",
        bio: "",
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await api.post('/mentor-applications', formData);
            setSuccess(true);
            setFormData({
                name: "",
                email: "",
                mobileNumber: "",
                linkedinProfile: "",
                expertise: "",
                bio: "",
            });
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to submit application. Please try again.");
        } finally {
            setLoading(false);
        }
    };

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

                    {/* Form Side */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
                    >
                        {success ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Application Received!</h3>
                                <p className="text-zinc-400">
                                    Thank you for your interest. Our team will review your profile and get back to you shortly.
                                </p>
                                <button
                                    onClick={() => setSuccess(false)}
                                    className="mt-6 text-violet-400 hover:text-violet-300 font-medium"
                                >
                                    Submit another application
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <h3 className="text-xl font-bold text-white mb-6">Apply to Mentor</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm text-zinc-400">Full Name</label>
                                        <input
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-zinc-400">Email</label>
                                        <input
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm text-zinc-400">Mobile Number</label>
                                        <input
                                            name="mobileNumber"
                                            value={formData.mobileNumber}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                            placeholder="+1 234 567 890"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-zinc-400">LinkedIn Profile</label>
                                        <input
                                            name="linkedinProfile"
                                            value={formData.linkedinProfile}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                            placeholder="linkedin.com/in/..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-zinc-400">Primary Expertise</label>
                                    <input
                                        name="expertise"
                                        value={formData.expertise}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                        placeholder="React, Node.js, Python, System Design..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-zinc-400">Short Bio</label>
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        required
                                        rows={3}
                                        className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all resize-none"
                                        placeholder="Tell us about your experience..."
                                    />
                                </div>

                                {error && (
                                    <p className="text-red-400 text-sm">{error}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-violet-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            Submit Application
                                            <Send className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
