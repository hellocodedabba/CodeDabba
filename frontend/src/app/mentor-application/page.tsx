"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Send, Loader2, ArrowLeft } from "lucide-react";
import api from "@/lib/axios";
import Link from "next/link";
import { NavBar } from "@/components/landing/NavBar";

export default function MentorApplicationPage() {
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
        <div className="min-h-screen bg-black text-white selection:bg-violet-500/30">
            <NavBar />

            <div className="pt-32 pb-12 container mx-auto px-6">
                <Link href="/#become-mentor" className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-2xl mx-auto bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
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
                            <Link
                                href="/"
                                className="inline-block mt-6 text-violet-400 hover:text-violet-300 font-medium"
                            >
                                Return Home
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-white mb-2">Mentor Application</h1>
                                <p className="text-zinc-400">Join our community of expert mentors.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    rows={4}
                                    className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all resize-none"
                                    placeholder="Tell us about your experience..."
                                />
                            </div>

                            {error && (
                                <p className="text-red-400 text-sm text-center">{error}</p>
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
    );
}
