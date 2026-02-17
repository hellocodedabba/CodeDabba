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
    isPublished: boolean;
    createdAt: string;
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

    return (
        <ProtectedRoute allowedRoles={['MENTOR', 'ADMIN']}>
            <div className="min-h-screen bg-black text-white">
                <NavBar />
                <div className="container mx-auto px-6 py-24">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-violet-500">My Courses</h1>
                            <p className="text-zinc-400">Manage your valuable content.</p>
                        </div>
                        <Link
                            href="/mentor/dashboard/courses/create"
                            className="inline-flex items-center px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Create Course
                        </Link>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
                            <BookOpen className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-white mb-2">No courses yet</h3>
                            <p className="text-zinc-400 mb-6">Start sharing your knowledge by creating your first course.</p>
                            <Link
                                href="/mentor/dashboard/courses/create"
                                className="inline-flex items-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Course
                            </Link>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.map((course) => (
                                <Link
                                    key={course.id}
                                    href={`/mentor/dashboard/courses/${course.id}/builder`}
                                    className="block p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-violet-500/50 transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`px-2 py-1 rounded text-xs font-medium ${course.isPublished ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                            {course.isPublished ? 'Published' : 'Draft'}
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-violet-400 transition-colors">{course.title}</h3>
                                    <p className="text-zinc-400 text-sm line-clamp-2 mb-4">{course.description}</p>
                                    <div className="text-xs text-zinc-500">
                                        Created: {new Date(course.createdAt).toLocaleDateString()}
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
