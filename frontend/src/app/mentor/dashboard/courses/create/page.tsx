"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { NavBar } from "@/components/landing/NavBar";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from 'react-hot-toast';

export default function CreateCoursePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "Development",
        level: "beginner",
        tags: "",
        accessType: "free",
        price: "0",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                category: formData.category,
                level: formData.level,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
                accessType: formData.accessType,
                price: parseFloat(formData.price) || 0,
            };
            const { data } = await api.post('/courses', payload);
            router.push(`/mentor/dashboard/courses/${data.id}/builder`);
        } catch (error: any) {
            console.error("Failed to create course", error);
            const message = error.response?.data?.message || "Failed to create course";
            toast.error(Array.isArray(message) ? message.join('\n') : message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProtectedRoute allowedRoles={['MENTOR', 'ADMIN']}>
            <div className="min-h-screen bg-black text-white">
                <NavBar />
                <div className="container mx-auto px-6 py-24">
                    <Link href="/mentor/dashboard/courses" className="inline-flex items-center text-zinc-400 hover:text-white mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Courses
                    </Link>

                    <div className="max-w-xl mx-auto">
                        <h1 className="text-3xl font-bold text-white mb-8">Create New Course</h1>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm text-zinc-400">Course Title</label>
                                <input
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                    placeholder="e.g. Advanced React Patterns"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-zinc-400">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                    rows={4}
                                    className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all resize-none"
                                    placeholder="What will students learn? (Min 20 characters)"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-zinc-400">Category</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all appearance-none"
                                    >
                                        <option value="Development">Development</option>
                                        <option value="Design">Design</option>
                                        <option value="Business">Business</option>
                                        <option value="Data Science">Data Science</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-zinc-400">Level</label>
                                    <select
                                        name="level"
                                        value={formData.level}
                                        onChange={handleChange}
                                        className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all appearance-none"
                                    >
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-zinc-400">Tags (comma separated)</label>
                                <input
                                    name="tags"
                                    value={formData.tags}
                                    onChange={handleChange}
                                    className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                    placeholder="e.g. React, Frontend, Web Dev"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-zinc-400">Access Type</label>
                                    <select
                                        name="accessType"
                                        value={formData.accessType}
                                        onChange={handleChange}
                                        className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all appearance-none"
                                    >
                                        <option value="free">Free</option>
                                        <option value="paid">Paid</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-zinc-400">Price</label>
                                    <input
                                        name="price"
                                        type="number"
                                        value={formData.price}
                                        onChange={handleChange}
                                        disabled={formData.accessType === 'free'}
                                        min="0"
                                        className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all disabled:opacity-50"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-violet-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Continue to Builder"
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
