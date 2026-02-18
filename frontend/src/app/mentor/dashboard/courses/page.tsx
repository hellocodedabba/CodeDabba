"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { NavBar } from "@/components/landing/NavBar";
import api from "@/lib/axios";
import Link from "next/link";
import { Plus, BookOpen, Loader2 } from "lucide-react";

interface Course {
    id: string;
    title: string;
    description: string;
    status: 'draft' | 'under_review' | 'published' | 'rejected' | 'archived';
    createdAt: string;
    rejectReason?: string;
}

export default function MentorCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const { data } = await api.get('/courses/my-courses');
            setCourses(data);
        } catch (error) {
            console.error("Failed to fetch courses", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string, reason?: string) => {
        switch (status) {
            case 'published':
                return <span className="px-2 py-1 rounded-md text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">Live</span>;
            case 'under_review':
                return <span className="px-2 py-1 rounded-md text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">Under Review</span>;
            case 'rejected':
                return (
                    <div className="flex flex-col gap-1">
                        <span className="px-2 py-1 rounded-md text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 w-fit">Rejected</span>
                        {reason && <span className="text-[10px] text-red-400 max-w-[150px] truncate" title={reason}>{reason}</span>}
                    </div>
                );
            case 'draft':
            default:
                return <span className="px-2 py-1 rounded-md text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Draft</span>;
        }
    };

    return (
        <ProtectedRoute allowedRoles={['MENTOR', 'ADMIN']}>
            <div className="min-h-screen bg-black text-white">
                <NavBar />
                <div className="container mx-auto px-6 py-24">
                    <div className="flex justify-between items-center mb-12">
                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-pink-400 mb-2">My Courses</h1>
                            <p className="text-zinc-400">Manage and create your educational content.</p>
                        </div>
                        <Link
                            href="/mentor/dashboard/courses/create"
                            className="inline-flex items-center px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-violet-900/20"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Create Course
                        </Link>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="text-center py-24 bg-zinc-900/30 border border-zinc-800 rounded-3xl border-dashed">
                            <BookOpen className="w-16 h-16 text-zinc-700 mx-auto mb-6" />
                            <h3 className="text-xl font-bold text-white mb-2">No courses yet</h3>
                            <p className="text-zinc-400 mb-8 max-w-md mx-auto">Start sharing your knowledge by creating your first course.</p>
                            <Link
                                href="/mentor/dashboard/courses/create"
                                className="inline-flex items-center px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-all"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Course
                            </Link>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {courses.map((course) => (
                                <Link
                                    key={course.id}
                                    href={`/mentor/dashboard/courses/${course.id}/builder`}
                                    className="flex flex-col h-full bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden hover:border-violet-500/50 transition-all group"
                                >
                                    <div className="h-48 bg-zinc-800 relative">
                                        {/* Thumbnail placeholder if needed */}
                                        <div className="absolute top-4 right-4">
                                            {getStatusBadge(course.status, course.rejectReason)}
                                        </div>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-violet-400 transition-colors line-clamp-1">{course.title}</h3>
                                        <p className="text-zinc-400 text-sm line-clamp-2 mb-6 flex-1">{course.description}</p>
                                        <div className="pt-4 border-t border-zinc-800/50 flex justify-between items-center text-xs text-zinc-500">
                                            <span>Created {new Date(course.createdAt).toLocaleDateString()}</span>
                                            {/* <span>{course.lessonsCount || 0} Lessons</span> */}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
