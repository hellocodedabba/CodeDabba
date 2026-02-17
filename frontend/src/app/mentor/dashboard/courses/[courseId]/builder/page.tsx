"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { NavBar } from "@/components/landing/NavBar";
import api from "@/lib/axios";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Loader2, Save, ChevronDown, ChevronRight, FileText } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import toast from 'react-hot-toast';

interface Chapter {
    id: string;
    title: string;
    content: string;
    orderIndex: number;
}

interface Module {
    id: string;
    title: string;
    orderIndex: number;
    chapters: Chapter[];
}

interface Course {
    id: string;
    title: string;
    modules: Module[];
    status: 'draft' | 'under_review' | 'published' | 'rejected' | 'archived';
    rejectReason?: string;
}

export default function CourseBuilderPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.courseId as string;
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [newModuleTitle, setNewModuleTitle] = useState("");
    const [addingModule, setAddingModule] = useState(false);

    // Simple state for building structure first
    const [expandedModules, setExpandedModules] = useState<string[]>([]);

    // Modal state
    const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
    const [newChapterTitle, setNewChapterTitle] = useState("");
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

    useEffect(() => {
        fetchCourse();
    }, [courseId]);

    const fetchCourse = async () => {
        try {
            const { data } = await api.get(`/courses/${courseId}`);
            setCourse(data);
            setExpandedModules(data.modules.map((m: Module) => m.id)); // Expand all initially
        } catch (error) {
            console.error("Failed to fetch course", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddModule = async () => {
        if (!newModuleTitle.trim()) return;
        try {
            const maxOrderIndex = course?.modules.length
                ? Math.max(...course.modules.map(m => m.orderIndex))
                : -1;

            const { data } = await api.post(`/courses/${courseId}/modules`, {
                title: newModuleTitle,
                orderIndex: maxOrderIndex + 1
            });
            setCourse(prev => prev ? { ...prev, modules: [...prev.modules, { ...data, chapters: [] }] } : null);
            setNewModuleTitle("");
            setAddingModule(false);
            setExpandedModules(prev => [...prev, data.id]);
        } catch (error) {
            console.error("Failed to add module", error);
        }
    };

    const handleAddChapterClick = (moduleId: string) => {
        setActiveModuleId(moduleId);
        setNewChapterTitle("");
        setIsChapterModalOpen(true);
    };

    const handleConfirmAddChapter = async () => {
        if (!newChapterTitle.trim() || !activeModuleId) return;

        try {
            // Find existing chapters count for order
            const module = course?.modules.find(m => m.id === activeModuleId);
            if (!module) return;

            const maxOrderIndex = module.chapters.length
                ? Math.max(...module.chapters.map(c => c.orderIndex))
                : -1;

            const { data } = await api.post(`/courses/modules/${activeModuleId}/chapters`, {
                title: newChapterTitle,
                content: "# New Chapter\nStart writing...",
                orderIndex: maxOrderIndex + 1
            });

            // Update local state
            setCourse(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    modules: prev.modules.map(m =>
                        m.id === activeModuleId ? { ...m, chapters: [...m.chapters, data] } : m
                    )
                };
            });
            setIsChapterModalOpen(false);
            toast.success("Chapter added successfully");
        } catch (error) {
            console.error("Failed to add chapter", error);
            toast.error("Failed to add chapter");
        }
    };

    const handleSubmitForReview = async () => {
        try {
            await api.post(`/courses/${courseId}/submit`);
            toast.success("Course submitted for review");
            fetchCourse();
        } catch (error) {
            console.error("Failed to submit course", error);
            toast.error("Failed to submit course");
        }
    };

    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev =>
            prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        );
    }

    if (!course) return null;

    return (
        <ProtectedRoute allowedRoles={['MENTOR', 'ADMIN']}>
            <div className="min-h-screen bg-black text-white">
                <NavBar />
                <div className="container mx-auto px-6 py-24">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <Link href="/mentor/dashboard/courses" className="text-zinc-400 hover:text-white transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-white">{course.title}</h1>
                                <p className="text-zinc-400 text-sm">Course Builder</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="px-3 py-1 rounded-full text-xs font-medium border uppercase tracking-wider h-fit self-center"
                                style={{
                                    borderColor:
                                        course.status === 'published' ? '#22c55e' :
                                            course.status === 'rejected' ? '#ef4444' :
                                                course.status === 'under_review' ? '#eab308' :
                                                    '#71717a',
                                    color:
                                        course.status === 'published' ? '#22c55e' :
                                            course.status === 'rejected' ? '#ef4444' :
                                                course.status === 'under_review' ? '#eab308' :
                                                    '#a1a1aa'
                                }}
                            >
                                {course.status.replace('_', ' ')}
                            </div>

                            {course.status === 'draft' || course.status === 'rejected' ? (
                                <button
                                    onClick={handleSubmitForReview}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Submit for Review
                                </button>
                            ) : null}
                        </div>
                    </div>

                    {course.status === 'rejected' && course.rejectReason && (
                        <div className="mb-8 p-4 bg-red-950/20 border border-red-900/50 rounded-xl text-red-200">
                            <h3 className="font-semibold mb-1 text-red-400">Submission Rejected</h3>
                            <p>{course.rejectReason}</p>
                        </div>
                    )}

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Course Structure */}
                        <div className="lg:col-span-2 space-y-6">
                            {course.modules.map((module) => (
                                <div key={module.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                                    <div
                                        className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50 transition-colors"
                                        onClick={() => toggleModule(module.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            {expandedModules.includes(module.id) ? (
                                                <ChevronDown className="w-5 h-5 text-zinc-500" />
                                            ) : (
                                                <ChevronRight className="w-5 h-5 text-zinc-500" />
                                            )}
                                            <h3 className="font-medium text-white">{module.title}</h3>
                                        </div>
                                        <span className="text-xs text-zinc-500">{module.chapters.length} Chapters</span>
                                    </div>

                                    {expandedModules.includes(module.id) && (
                                        <div className="p-4 space-y-2">
                                            {module.chapters.map((chapter) => (
                                                <div
                                                    key={chapter.id}
                                                    onClick={() => router.push(`/mentor/dashboard/courses/${courseId}/chapters/${chapter.id}/edit`)}
                                                    className="flex items-center gap-3 p-3 bg-zinc-950/50 rounded-lg border border-zinc-800 hover:border-violet-500/30 cursor-pointer group"
                                                >
                                                    <FileText className="w-4 h-4 text-zinc-500 group-hover:text-violet-400" />
                                                    <span className="text-sm text-zinc-300 group-hover:text-white">{chapter.title}</span>
                                                </div>
                                            ))}
                                            {(course.status === 'draft' || course.status === 'rejected') && (
                                                <button
                                                    onClick={() => handleAddChapterClick(module.id)}
                                                    className="w-full py-2 text-sm text-zinc-500 hover:text-violet-400 border border-dashed border-zinc-800 hover:border-violet-500/30 rounded-lg flex items-center justify-center gap-2 transition-all"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Add Chapter
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {(course.status === 'draft' || course.status === 'rejected') && (
                                addingModule ? (
                                    <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-4">
                                        <input
                                            autoFocus
                                            value={newModuleTitle}
                                            onChange={(e) => setNewModuleTitle(e.target.value)}
                                            placeholder="Module Title"
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500 transition-colors"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleAddModule}
                                                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg"
                                            >
                                                Add
                                            </button>
                                            <button
                                                onClick={() => setAddingModule(false)}
                                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm rounded-lg"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setAddingModule(true)}
                                        className="w-full py-4 bg-zinc-900/30 border border-dashed border-zinc-800 hover:border-violet-500 hover:bg-violet-500/5 text-zinc-400 hover:text-violet-400 rounded-xl flex items-center justify-center gap-2 transition-all font-medium"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Add New Module
                                    </button>
                                )
                            )}
                        </div>

                        {/* Sidebar / Stats */}
                        <div className="space-y-6">
                            <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                                <h3 className="font-semibold text-white mb-4">Course Status</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-400">Total Modules</span>
                                        <span className="text-white">{course.modules.length}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-400">Total Chapters</span>
                                        <span className="text-white">{course.modules.reduce((acc, m) => acc + m.chapters.length, 0)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Dialog open={isChapterModalOpen} onOpenChange={setIsChapterModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Chapter</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <input
                            autoFocus
                            value={newChapterTitle}
                            onChange={(e) => setNewChapterTitle(e.target.value)}
                            placeholder="Chapter Title"
                            className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleConfirmAddChapter();
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <button
                            onClick={() => setIsChapterModalOpen(false)}
                            className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmAddChapter}
                            disabled={!newChapterTitle.trim()}
                            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg disabled:opacity-50 transition-colors"
                        >
                            Add Chapter
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ProtectedRoute >
    );
}
