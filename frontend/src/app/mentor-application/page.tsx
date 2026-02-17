"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Send, Loader2, ArrowLeft } from "lucide-react";
import api from "@/lib/axios";
import Link from "next/link";
import { NavBar } from "@/components/landing/NavBar";
import { toast } from 'react-hot-toast';

export default function MentorApplicationPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        mobileNumber: "",
        linkedinProfile: "",
        portfolioUrl: "",
        resumeFileId: "",
        expertise: "",
        bio: "",
    });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);

    const handleSendOtp = async () => {
        if (!formData.email) {
            setError("Please enter an email address first.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            await api.post('/otp/send', { email: formData.email, type: 'MENTOR_APPLICATION' });
            setOtpSent(true);
            toast.success("OTP sent to your email!");
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to send OTP.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp) return;
        setLoading(true);
        setError("");
        try {
            const res = await api.post('/otp/verify', { email: formData.email, otp, type: 'MENTOR_APPLICATION' });
            if (res.data.valid) {
                setOtpVerified(true);
                toast.success("Email verified successfully!");
            } else {
                setError("Invalid OTP");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Verification failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploading(true);
            const file = e.target.files[0];
            const data = new FormData();
            data.append('file', file);

            try {
                const res = await api.post('/files/upload', data, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                setFormData(prev => ({ ...prev, resumeFileId: res.data.id }));
            } catch (err) {
                console.error("Upload failed", err);
                setError("Failed to upload resume. Please try again.");
            } finally {
                setUploading(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!otpVerified) {
            setError("Please verify your email first.");
            return;
        }

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
                portfolioUrl: "",
                resumeFileId: "",
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
                                        disabled={otpVerified}
                                        className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                        placeholder="john@example.com"
                                    />
                                    {!otpVerified && (
                                        <div className="flex gap-2 mt-2">
                                            {!otpSent ? (
                                                <button
                                                    type="button"
                                                    onClick={handleSendOtp}
                                                    disabled={loading || !formData.email}
                                                    className="w-full py-2 bg-violet-600/50 text-white rounded-md text-sm hover:bg-violet-700 disabled:opacity-50"
                                                >
                                                    Verify Email to Apply
                                                </button>
                                            ) : (
                                                <>
                                                    <input
                                                        placeholder="Enter OTP"
                                                        value={otp}
                                                        onChange={(e) => setOtp(e.target.value)}
                                                        className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-2 text-white"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleVerifyOtp}
                                                        disabled={loading || !otp}
                                                        className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
                                                    >
                                                        Verify
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    {otpVerified && <p className="text-green-400 text-xs mt-1">✓ Verified</p>}
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-zinc-400">Portfolio URL (Optional)</label>
                                    <input
                                        name="portfolioUrl"
                                        value={formData.portfolioUrl}
                                        onChange={handleChange}
                                        className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                        placeholder="your-portfolio.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-zinc-400">Resume / CV (PDF)</label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={handleFileChange}
                                            className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-700"
                                        />
                                        {uploading && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-violet-400 text-sm flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Uploading...
                                            </div>
                                        )}
                                        {formData.resumeFileId && !uploading && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400 text-sm flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Uploaded
                                            </div>
                                        )}
                                    </div>
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
