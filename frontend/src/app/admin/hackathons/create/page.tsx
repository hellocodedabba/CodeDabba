"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { NavBar } from "@/components/landing/NavBar";
import { useState } from "react";
import api from "@/lib/axios";
import { Plus, Trash2, Save, Info, Calendar, Users, ListChecks, ArrowLeft, Loader2, Sparkles, Wand2, Check } from "lucide-react";
import { toast } from 'react-hot-toast';
import { useRouter } from "next/navigation";
import Link from "next/link";
import MarkdownEditor from "@/components/MarkdownEditor";

interface Round {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    isElimination: boolean;
    eliminationThreshold: number | null;
    eliminationCount: number;
    weightagePercentage: number;
    allowZip: boolean;
    allowGithub: boolean;
    allowVideo: boolean;
    allowDescription: boolean;
    maxFileSizeMb: number;
    allowedFileTypes: string[];
}

export default function CreateHackathonPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState<'basic' | 'timeline' | 'participation' | 'rounds'>('basic');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        bannerUrl: '',
        bannerFile: null as File | null,
        rules: '',
        evaluationCriteria: '',
        registrationStart: '',
        registrationEnd: '',
        startDate: '',
        endDate: '',
        maxTeamSize: 1,
        maxParticipants: 0,
        allowIndividual: true,
        allowTeam: true,
    });

    const [rounds, setRounds] = useState<Round[]>([
        {
            title: 'Idea Phase',
            description: '',
            startDate: '',
            endDate: '',
            isElimination: false,
            eliminationThreshold: 0,
            eliminationCount: 0,
            weightagePercentage: 20,
            allowZip: false,
            allowGithub: false,
            allowVideo: false,
            allowDescription: true,
            maxFileSizeMb: 50,
            allowedFileTypes: ['pdf', 'pptx']
        }
    ]);

    const handleAddRound = () => {
        setRounds([...rounds, {
            title: '',
            description: '',
            startDate: '',
            endDate: '',
            isElimination: false,
            eliminationThreshold: 0,
            eliminationCount: 0,
            weightagePercentage: 0,
            allowZip: false,
            allowGithub: true,
            allowVideo: false,
            allowDescription: true,
            maxFileSizeMb: 50,
            allowedFileTypes: []
        }]);
    };

    const handleRemoveRound = (index: number) => {
        if (rounds.length === 1) {
            toast.error("At least one round is required");
            return;
        }
        setRounds(rounds.filter((_, i) => i !== index));
    };

    const handleRoundChange = (index: number, field: keyof Round, value: any) => {
        const newRounds = [...rounds];
        newRounds[index] = { ...newRounds[index], [field]: value };
        setRounds(newRounds);
    };

    const handleSubmit = async () => {
        // Basic Validations
        if (!formData.title || !formData.description) {
            toast.error("Please fill in basic info");
            setActiveSection('basic');
            return;
        }

        // Timeline check
        if (!formData.registrationStart || !formData.registrationEnd || !formData.startDate || !formData.endDate) {
            toast.error("Please fill in the timeline");
            setActiveSection('timeline');
            return;
        }

        // Rounds check
        const totalWeight = rounds.reduce((sum, r) => sum + Number(r.weightagePercentage), 0);
        if (totalWeight !== 100) {
            toast.error(`Total weightage must be 100% (Current: ${totalWeight}%)`);
            setActiveSection('rounds');
            return;
        }

        setLoading(true);
        try {
            let bannerUrl = formData.bannerUrl;

            if (formData.bannerFile) {
                // 1. Get Signature
                const { data: signData } = await api.post('/hackathons/upload-banner', {
                    filename: formData.bannerFile.name,
                    contentType: formData.bannerFile.type
                });

                const { uploadUrl, signature, timestamp, apiKey, publicId } = signData;

                // 2. Upload to Cloudinary
                const uploadFormData = new FormData();
                uploadFormData.append('file', formData.bannerFile);
                uploadFormData.append('api_key', apiKey);
                uploadFormData.append('timestamp', timestamp.toString());
                uploadFormData.append('signature', signature);
                uploadFormData.append('public_id', publicId);

                const cloudinaryRes = await fetch(uploadUrl, {
                    method: 'POST',
                    body: uploadFormData,
                });

                const cloudinaryData = await cloudinaryRes.json();
                if (cloudinaryData.error) throw new Error(cloudinaryData.error.message);
                bannerUrl = cloudinaryData.secure_url;
            }

            const { bannerFile, ...restFormData } = formData;
            const payload = {
                ...restFormData,
                bannerUrl,
                maxParticipants: formData.maxParticipants || undefined,
                rounds: rounds.map(r => ({
                    ...r,
                    weightagePercentage: Number(r.weightagePercentage),
                    eliminationThreshold: r.isElimination ? Number(r.eliminationThreshold) : null,
                    eliminationCount: Number(r.eliminationCount),
                    maxFileSizeMb: Number(r.maxFileSizeMb)
                }))
            };

            const { data } = await api.post('/hackathons', payload);
            toast.success("Hackathon created successfully!");
            router.push('/admin/hackathons');
        } catch (error: any) {
            console.error("Create failed", error);
            toast.error(error.response?.data?.message || error.message || "Failed to create hackathon");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProtectedRoute allowedRoles={['ADMIN']}>
            <div className="min-h-screen bg-black text-white">
                <NavBar />
                <div className="container mx-auto px-6 py-24">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-6">
                            <Link href="/admin/hackathons" className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-all">
                                <ArrowLeft className="w-6 h-6" />
                            </Link>
                            <div>
                                <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                                    Launch New Hackathon
                                    <Sparkles className="w-8 h-8 text-violet-500 animate-pulse" />
                                </h1>
                                <p className="text-zinc-500 mt-1">Define the future of innovation</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex items-center gap-2 px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-violet-600/20 disabled:opacity-50 active:scale-95"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Wand2 className="w-6 h-6" />}
                            Initialize Hackathon
                        </button>
                    </div>

                    <div className="grid lg:grid-cols-4 gap-12">
                        {/* Sidebar Navigation */}
                        <aside className="space-y-2">
                            <button
                                onClick={() => setActiveSection('basic')}
                                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-left transition-all ${activeSection === 'basic' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 text-white'}`}
                            >
                                <Info className="w-5 h-5" />
                                <span className="font-bold">Basic Info</span>
                            </button>
                            <button
                                onClick={() => setActiveSection('timeline')}
                                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-left transition-all ${activeSection === 'timeline' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800'}`}
                            >
                                <Calendar className="w-5 h-5" />
                                <span className="font-bold">Timeline</span>
                            </button>
                            <button
                                onClick={() => setActiveSection('participation')}
                                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-left transition-all ${activeSection === 'participation' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800'}`}
                            >
                                <Users className="w-5 h-5" />
                                <span className="font-bold">Participation</span>
                            </button>
                            <button
                                onClick={() => setActiveSection('rounds')}
                                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-left transition-all ${activeSection === 'rounds' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800'}`}
                            >
                                <ListChecks className="w-5 h-5" />
                                <span className="font-bold">Round Builder</span>
                            </button>
                        </aside>

                        {/* Form Content */}
                        <div className="lg:col-span-3">
                            <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-10 backdrop-blur-sm">
                                {activeSection === 'basic' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="grid gap-6">
                                            <label className="block">
                                                <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Hackathon Title</span>
                                                <input
                                                    type="text"
                                                    value={formData.title}
                                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                    placeholder="e.g., CodeDabba Genesis 2024"
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-violet-500 transition-all outline-none text-lg"
                                                />
                                            </label>

                                            <label className="block">
                                                <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Banner Image</span>
                                                <div className="relative group">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            if (e.target.files?.[0]) {
                                                                setFormData({ ...formData, bannerFile: e.target.files[0] });
                                                            }
                                                        }}
                                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-violet-500 transition-all outline-none file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-violet-600 file:text-white hover:file:bg-violet-700"
                                                    />
                                                </div>
                                                {formData.bannerFile && (
                                                    <p className="text-xs text-violet-400 mt-2 font-medium flex items-center gap-2">
                                                        <Check className="w-3 h-3" /> Selected: {formData.bannerFile.name}
                                                    </p>
                                                )}
                                            </label>
                                        </div>

                                        <div>
                                            <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Description</span>
                                            <MarkdownEditor
                                                value={formData.description}
                                                onChange={(val) => setFormData({ ...formData, description: val })}
                                                placeholder="What is this hackathon about?"
                                            />
                                        </div>

                                        <div>
                                            <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Rules & Regulations</span>
                                            <MarkdownEditor
                                                value={formData.rules}
                                                onChange={(val) => setFormData({ ...formData, rules: val })}
                                                placeholder="List the laws of your battlefield..."
                                            />
                                        </div>

                                        <div>
                                            <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Evaluation Criteria</span>
                                            <MarkdownEditor
                                                value={formData.evaluationCriteria}
                                                onChange={(val) => setFormData({ ...formData, evaluationCriteria: val })}
                                                placeholder="How will the warriors be judged?"
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeSection === 'timeline' && (
                                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="grid md:grid-cols-2 gap-10">
                                            <div className="space-y-6">
                                                <h3 className="text-xl font-bold text-violet-400 flex items-center gap-2">
                                                    <Calendar className="w-5 h-5" />
                                                    Registration Window
                                                </h3>
                                                <div className="grid gap-6">
                                                    <label className="block">
                                                        <span className="text-xs font-bold text-zinc-500 uppercase mb-2 block tracking-widest">Opening Time</span>
                                                        <input
                                                            type="datetime-local"
                                                            value={formData.registrationStart}
                                                            onChange={(e) => setFormData({ ...formData, registrationStart: e.target.value })}
                                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-violet-500 outline-none"
                                                        />
                                                    </label>
                                                    <label className="block">
                                                        <span className="text-xs font-bold text-zinc-500 uppercase mb-2 block tracking-widest">Deadline</span>
                                                        <input
                                                            type="datetime-local"
                                                            value={formData.registrationEnd}
                                                            onChange={(e) => setFormData({ ...formData, registrationEnd: e.target.value })}
                                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-violet-500 outline-none"
                                                        />
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <h3 className="text-xl font-bold text-fuchsia-400 flex items-center gap-2">
                                                    <ListChecks className="w-5 h-5" />
                                                    Competition Period
                                                </h3>
                                                <div className="grid gap-6">
                                                    <label className="block">
                                                        <span className="text-xs font-bold text-zinc-500 uppercase mb-2 block tracking-widest">Hackathon Kickoff</span>
                                                        <input
                                                            type="datetime-local"
                                                            value={formData.startDate}
                                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-fuchsia-500 outline-none"
                                                        />
                                                    </label>
                                                    <label className="block">
                                                        <span className="text-xs font-bold text-zinc-500 uppercase mb-2 block tracking-widest">Final Wrap-up</span>
                                                        <input
                                                            type="datetime-local"
                                                            value={formData.endDate}
                                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-fuchsia-500 outline-none"
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeSection === 'participation' && (
                                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="grid md:grid-cols-2 gap-10">
                                            <label className="block">
                                                <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Maximum Team Size</span>
                                                <input
                                                    type="number"
                                                    value={formData.maxTeamSize}
                                                    onChange={(e) => setFormData({ ...formData, maxTeamSize: Number(e.target.value) })}
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-violet-500 outline-none"
                                                    min="1"
                                                />
                                            </label>
                                            <label className="block">
                                                <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Participant Cap (Optional)</span>
                                                <input
                                                    type="number"
                                                    value={formData.maxParticipants}
                                                    onChange={(e) => setFormData({ ...formData, maxParticipants: Number(e.target.value) })}
                                                    placeholder="Leave empty for no limit"
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-violet-500 outline-none"
                                                    min="0"
                                                />
                                            </label>
                                        </div>

                                        <div className="p-8 bg-zinc-950/50 rounded-[2rem] border border-zinc-800 space-y-6">
                                            <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Registration Modes</p>
                                            <div className="flex flex-wrap gap-8">
                                                <label className="flex items-center gap-4 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.allowIndividual}
                                                        onChange={(e) => setFormData({ ...formData, allowIndividual: e.target.checked })}
                                                        className="w-6 h-6 rounded border-zinc-700 bg-zinc-900 text-violet-500 focus:ring-violet-500"
                                                    />
                                                    <span className="text-zinc-200 group-hover:text-white transition-colors font-medium">Allow Solo Players</span>
                                                </label>
                                                <label className="flex items-center gap-4 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.allowTeam}
                                                        onChange={(e) => setFormData({ ...formData, allowTeam: e.target.checked })}
                                                        className="w-6 h-6 rounded border-zinc-700 bg-zinc-900 text-violet-500 focus:ring-violet-500"
                                                    />
                                                    <span className="text-zinc-200 group-hover:text-white transition-colors font-medium">Allow Teams</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeSection === 'rounds' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Competition Rounds</p>
                                            <button
                                                onClick={handleAddRound}
                                                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition-all"
                                            >
                                                <Plus className="w-4 h-4" /> Add Round
                                            </button>
                                        </div>

                                        <div className="space-y-6">
                                            {rounds.map((round, idx) => (
                                                <div key={idx} className="relative group p-8 bg-zinc-950/50 border border-zinc-800 rounded-[2rem] hover:border-violet-500/30 transition-all">
                                                    <div className="absolute -left-4 top-8 w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center font-bold text-sm shadow-lg shadow-violet-600/20">
                                                        {idx + 1}
                                                    </div>

                                                    <div className="flex justify-between items-start mb-6 pl-2">
                                                        <div className="flex-1 mr-4">
                                                            <input
                                                                type="text"
                                                                value={round.title}
                                                                onChange={(e) => handleRoundChange(idx, 'title', e.target.value)}
                                                                placeholder="Round Title (e.g., Idea Pitch)"
                                                                className="w-full bg-transparent border-b border-zinc-800 py-2 text-xl font-bold text-white focus:border-violet-500 outline-none"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveRound(idx)}
                                                            className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>

                                                    <div className="grid md:grid-cols-2 gap-8 pl-2">
                                                        <div className="space-y-6">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <label className="block">
                                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Start</span>
                                                                    <input
                                                                        type="datetime-local"
                                                                        value={round.startDate}
                                                                        onChange={(e) => handleRoundChange(idx, 'startDate', e.target.value)}
                                                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none"
                                                                    />
                                                                </label>
                                                                <label className="block">
                                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">End</span>
                                                                    <input
                                                                        type="datetime-local"
                                                                        value={round.endDate}
                                                                        onChange={(e) => handleRoundChange(idx, 'endDate', e.target.value)}
                                                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none"
                                                                    />
                                                                </label>
                                                            </div>

                                                            <div className="flex gap-6">
                                                                <label className="block flex-1">
                                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Weightage (%)</span>
                                                                    <input
                                                                        type="number"
                                                                        value={round.weightagePercentage}
                                                                        onChange={(e) => handleRoundChange(idx, 'weightagePercentage', e.target.value)}
                                                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none"
                                                                    />
                                                                </label>
                                                                <div className="flex-1">
                                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Rules</span>
                                                                    <div className="space-y-4">
                                                                        <label className="flex items-center gap-2 mt-3 cursor-pointer">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={round.isElimination}
                                                                                onChange={(e) => handleRoundChange(idx, 'isElimination', e.target.checked)}
                                                                                className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-red-500 focus:ring-red-500"
                                                                            />
                                                                            <span className="text-sm text-zinc-400">Elimination Round</span>
                                                                        </label>
                                                                        {round.isElimination && (
                                                                            <label className="block animate-in fade-in slide-in-from-top-1">
                                                                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Min Score to Survive</span>
                                                                                <input
                                                                                    type="number"
                                                                                    value={round.eliminationThreshold || 0}
                                                                                    onChange={(e) => handleRoundChange(idx, 'eliminationThreshold', e.target.value)}
                                                                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-500/50"
                                                                                    placeholder="Score 0-100"
                                                                                />
                                                                            </label>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-4">
                                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Submission Requirements</p>
                                                            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <input type="checkbox" checked={round.allowZip} onChange={(e) => handleRoundChange(idx, 'allowZip', e.target.checked)} className="rounded border-zinc-700 bg-zinc-900" />
                                                                    <span className="text-xs text-zinc-400">ZIP File</span>
                                                                </label>
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <input type="checkbox" checked={round.allowGithub} onChange={(e) => handleRoundChange(idx, 'allowGithub', e.target.checked)} className="rounded border-zinc-700 bg-zinc-900" />
                                                                    <span className="text-xs text-zinc-400">GitHub Link</span>
                                                                </label>
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <input type="checkbox" checked={round.allowVideo} onChange={(e) => handleRoundChange(idx, 'allowVideo', e.target.checked)} className="rounded border-zinc-700 bg-zinc-900" />
                                                                    <span className="text-xs text-zinc-400">Demo Video</span>
                                                                </label>
                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                    <input type="checkbox" checked={round.allowDescription} onChange={(e) => handleRoundChange(idx, 'allowDescription', e.target.checked)} className="rounded border-zinc-700 bg-zinc-900" />
                                                                    <span className="text-xs text-zinc-400">Description</span>
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
