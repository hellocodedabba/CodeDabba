"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthProvider";
import { NavBar } from "@/components/landing/NavBar";
import { useState, useEffect } from "react";
import { Loader2, BookOpen, PlayCircle } from "lucide-react";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import api from "@/lib/axios";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface EnrolledCourse {
    id: string;
    title: string;
    description: string;
    thumbnailUrl?: string;
    progress?: {
        percentage: number;
        completedLessons: number;
        totalLessons: number;
    };
}

export default function StudentDashboard() {
    const { user, logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEnrolledCourses();
    }, []);

    const fetchEnrolledCourses = async () => {
        try {
            const { data } = await api.get('/courses/enrolled');
            setEnrolledCourses(data);
        } catch (error) {
            console.error("Failed to fetch enrolled courses", error);
            // toast.error("Failed to load your courses");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await logout();
        setIsLoggingOut(false);
    };

    return (
        <ProtectedRoute allowedRoles={['STUDENT']}>
            <div className="min-h-screen bg-black text-white">
                <NavBar />
                <div className="container mx-auto px-6 py-24">
                    <div className="mb-12">
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-pink-400 mb-2">My Learning</h1>
                        <p className="text-zinc-400">Welcome back, {user?.name}!</p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                        </div>
                    ) : enrolledCourses.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {enrolledCourses.map((course) => (
                                <div key={course.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-violet-500/50 transition-all group flex flex-col">
                                    <div className="aspect-video bg-zinc-800 relative">
                                        {course.thumbnailUrl ? (
                                            <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                                <BookOpen className="w-12 h-12 opacity-20" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Link href={`/learn/${course.id}`} className="px-6 py-2 bg-white text-black rounded-full font-bold transform translate-y-4 group-hover:translate-y-0 transition-all flex items-center gap-2">
                                                <PlayCircle className="w-5 h-5" /> Continue
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <h3 className="text-xl font-bold mb-2 line-clamp-1 text-zinc-100">{course.title}</h3>
                                        <p className="text-sm text-zinc-400 line-clamp-2 mb-4 flex-1">{course.description}</p>

                                        <div className="space-y-2 mt-auto">
                                            <div className="flex justify-between text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                                <span>Progress</span>
                                                <span>{course.progress?.percentage || 0}%</span>
                                            </div>
                                            <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
                                                <div
                                                    className="bg-gradient-to-r from-violet-600 to-pink-600 h-full rounded-full transition-all duration-1000 ease-out"
                                                    style={{ width: `${course.progress?.percentage || 0}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 bg-zinc-900/30 border border-zinc-800 rounded-3xl border-dashed">
                            <BookOpen className="w-16 h-16 text-zinc-700 mx-auto mb-6" />
                            <h2 className="text-2xl font-bold text-white mb-2">You haven't enrolled in any courses yet</h2>
                            <p className="text-zinc-400 mb-8 max-w-md mx-auto">Explore our catalog to find your next skill to master.</p>
                            <Link href="/courses" className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-all">
                                Browse Courses
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
