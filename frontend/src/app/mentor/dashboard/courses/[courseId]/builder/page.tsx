"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { NavBar } from "@/components/landing/NavBar";
import api from "@/lib/axios";
import { ArrowLeft, Plus, Loader2, Save, ChevronDown, ChevronRight, FileText, Eye, Lock, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import toast from 'react-hot-toast';

interface Chapter {
    id: string;
    title: string;
    content: string;
    orderIndex: number;
    isFreePreview: boolean;
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
    status: 'draft' | 'curriculum_under_review' | 'curriculum_rejected' | 'curriculum_approved' | 'content_draft' | 'content_under_review' | 'content_rejected' | 'published' | 'archived';
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

    const isPhase1Editable = course?.status === 'draft' || course?.status === 'curriculum_rejected';
    const isPhase2Editable = course?.status === 'curriculum_approved' || course?.status === 'content_draft' || course?.status === 'content_rejected';
    const isLocked = course?.status === 'curriculum_under_review' || course?.status === 'content_under_review' || course?.status === 'published';

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
            toast.error("Failed to add module");
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
        if (!course) return;

        try {
            if (isPhase1Editable) {
                await api.post(`/courses/${courseId}/submit-curriculum`);
                toast.success("Curriculum submitted for review");
            } else if (isPhase2Editable) {
                await api.post(`/courses/${courseId}/submit-content`);
                toast.success("Content submitted for review");
            }
            fetchCourse();
        } catch (error) {
            console.error("Failed to submit course", error);
            toast.error("Failed to submit course");
        }
    };

    const handleChapterClick = (chapterId: string) => {
        if (isPhase1Editable) {
            toast('Finish curriculum review first before adding content.', { icon: '🔒' });
            return;
        }
        router.push(`/mentor/dashboard/courses/${courseId}/chapters/${chapterId}/edit`);
    };

    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev =>
            prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
        );
    };

    const toggleChapterFree = async (chapterId: string, currentStatus: boolean, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent navigation

        // Allowed in Phase 1 only? Or anytime? Backend restricts to Phase 1.
        if (!isPhase1Editable) {
            toast.error("Cannot change structure settings after curriculum approval");
            return;
        }

        try {
            await api.patch(`/courses/chapters/${chapterId}/free`, {
                isFreePreview: !currentStatus
            });

            // Optimistic update
            setCourse(prev => {
                if (!prev) return null;
                const newModules = prev.modules.map(m => ({
                    ...m,
                    chapters: m.chapters.map(c =>
                        c.id === chapterId ? { ...c, isFreePreview: !currentStatus } : c
                    )
                }));
                return { ...prev, modules: newModules };
            });
            toast.success(currentStatus ? "Chapter locked" : "Free preview enabled");
        } catch (error) {
            console.error("Failed to toggle free status", error);
            toast.error("Failed to update status");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published': return '#22c55e';
            case 'curriculum_rejected':
            case 'content_rejected': return '#ef4444';
            case 'curriculum_under_review':
            case 'content_under_review': return '#eab308';
            case 'curriculum_approved': return '#3b82f6';
            default: return '#71717a';
        }
    };

    const getStatusText = (status: string) => {
        // Pretty print
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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
                            <Link href="/mentor/dashboard" className="text-zinc-400 hover:text-white transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-white">{course.title}</h1>
                                <div className="flex items-center gap-2">
                                    <p className="text-zinc-400 text-sm">Course Builder</p>
                                    <span className="text-zinc-600">•</span>
                                    <span className="text-xs font-medium px-2 py-0.5 rounded border" style={{ borderColor: getStatusColor(course.status), color: getStatusColor(course.status) }}>
                                        {getStatusText(course.status)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {(isPhase1Editable || isPhase2Editable) && (
                                <button
                                    onClick={handleSubmitForReview}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors font-medium shadow-lg shadow-green-900/20"
                                >
                                    <Save className="w-4 h-4" />
                                    {isPhase1Editable ? "Submit Curriculum" : "Submit Content"}
                                </button>
                            )}
                        </div>
                    </div>

                    {(course.rejectReason) && (course.status === 'curriculum_rejected' || course.status === 'content_rejected') && (
                        <div className="mb-8 p-4 bg-red-950/20 border border-red-900/50 rounded-xl text-red-200 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold mb-1 text-red-400">Submission Rejected</h3>
                                <p>{course.rejectReason}</p>
                            </div>
                        </div>
                    )}

                    {course.status === 'curriculum_approved' && (
                        <div className="mb-8 p-6 bg-blue-950/20 border border-blue-900/30 rounded-xl text-blue-100 flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-full">
                                <CheckCircle className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-blue-300">Curriculum Approved!</h3>
                                <p className="text-blue-200/70">You can now start adding content to your lessons. Click on any chapter below to open the content editor.</p>
                            </div>
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
                                                    onClick={() => handleChapterClick(chapter.id)}
                                                    className={`flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg border border-zinc-800 group transition-all ${isPhase1Editable
                                                        ? 'opacity-75 hover:opacity-100 cursor-not-allowed'
                                                        : 'hover:border-violet-500/30 cursor-pointer'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <FileText className={`w-4 h-4 ${isPhase1Editable ? 'text-zinc-600' : 'text-zinc-500 group-hover:text-violet-400'}`} />
                                                        <span className={`text-sm ${isPhase1Editable ? 'text-zinc-400' : 'text-zinc-300 group-hover:text-white'}`}>{chapter.title}</span>
                                                    </div>

                                                    <div className="flex items-center">
                                                        <button
                                                            onClick={(e) => toggleChapterFree(chapter.id, chapter.isFreePreview, e)}
                                                            disabled={!isPhase1Editable}
                                                            className={`p-1.5 rounded-md transition-all ${chapter.isFreePreview
                                                                ? 'bg-green-500/10 text-green-400'
                                                                : 'bg-zinc-800 text-zinc-500'
                                                                } ${isPhase1Editable ? 'hover:bg-zinc-700' : 'opacity-50 cursor-not-allowed'}`}
                                                            title={chapter.isFreePreview ? "Free Preview" : "Locked"}
                                                        >
                                                            {chapter.isFreePreview ? <Eye className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {isPhase1Editable && (
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

                            {isPhase1Editable && (
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
                                    <div className="pt-4 border-t border-zinc-800">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-zinc-400">Current Phase</span>
                                            <span className="text-white font-medium">
                                                {isPhase1Editable ? "Phase 1: Structure" :
                                                    isPhase2Editable ? "Phase 2: Content" :
                                                        "Locked / Published"}
                                            </span>
                                        </div>
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
