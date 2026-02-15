"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { CourseCard } from "@/components/CourseCard";


interface Course {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    instructor: string;
    progress: number;
    totalModules: number;
}

export default function DashboardPage() {
    const { user, logout } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        // Ideally check auth here, but protected route wrapper handles it mostly.
        // However, fetching data:
        const fetchCourses = async () => {
            try {
                const response = await api.get('/courses');
                setCourses(response.data);
            } catch (error: unknown) {
                console.error("Failed to fetch courses", error);
                // Fallback demo data if API fails (or for initial demo if backend not ready)
                // But backend IS ready, so let's rely on it or handle error gracefully.
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <nav className="bg-white dark:bg-gray-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-indigo-600">CodeDabba</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-700 dark:text-gray-200">
                                Welcome, {user?.name || user?.email}
                            </span>
                            <button
                                onClick={logout}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                            >
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        Your Courses
                    </h2>

                    {courses.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 dark:text-gray-400">No courses found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.map((course) => (
                                <CourseCard key={course.id} course={course} />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
