"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { NavBar } from "@/components/landing/NavBar";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function CreateCoursePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "Development",
        difficulty: "Beginner",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/courses', formData);
            router.push(`/mentor/dashboard/courses/${data.id}/builder`);
        } catch (error) {
            console.error("Failed to create course", error);
            // Handle error (show toast etc.)
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
                                    placeholder="What will students learn?"
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
                                    <label className="text-sm text-zinc-400">Difficulty</label>
                                    <select
                                        name="difficulty"
                                        value={formData.difficulty}
                                        onChange={handleChange}
                                        className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all appearance-none"
                                    >
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                    </select>
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
