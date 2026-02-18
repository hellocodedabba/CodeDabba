import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CheckCircle2, Code, Info, Play, Send, HelpCircle } from 'lucide-react';

export interface TaskOption {
    id?: string;
    optionText: string;
    isCorrect: boolean;
}

export interface TestCase {
    id?: string;
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
}

export interface Task {
    id?: string;
    title: string;
    type: 'MCQ' | 'CODING';
    problemStatement: string;
    points: number;
    isRequired: boolean;
    options?: TaskOption[];
    testCases?: TestCase[];
    starterCode?: string;
    language?: string;
}

interface TaskPreviewProps {
    task: Task;
    showResults?: boolean; // For Admin/Mentor to see correct answers
}

export default function TaskPreview({ task, showResults = false }: TaskPreviewProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [code, setCode] = useState(task.starterCode || '');
    const [activeTab, setActiveTab] = useState<'problem' | 'solution'>('problem');

    const isMCQ = task.type === 'MCQ';
    const isCoding = task.type === 'CODING';

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isCoding ? 'bg-blue-500/10 text-blue-400' : 'bg-pink-500/10 text-pink-400'}`}>
                        {isCoding ? <Code className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-sm md:text-base">{task.title}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-0.5">
                            <span>{task.type}</span>
                            <span>•</span>
                            <span className="text-violet-400">{task.points} Points</span>
                            {task.isRequired && (
                                <>
                                    <span>•</span>
                                    <span className="text-red-400">Required</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {isCoding && (
                    <div className="flex bg-black/50 p-1 rounded-lg border border-zinc-800">
                        <button
                            onClick={() => setActiveTab('problem')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'problem' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Problem
                        </button>
                        <button
                            onClick={() => setActiveTab('solution')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'solution' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Solution
                        </button>
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="p-6">
                {(activeTab === 'problem' || isMCQ) && (
                    <div className="space-y-6">
                        {/* Problem Statement */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                <Info className="w-3.5 h-3.5" />
                                Question
                            </div>
                            <div className="prose prose-invert prose-sm max-w-none text-zinc-300 bg-zinc-950/30 p-4 rounded-xl border border-zinc-800/50 min-h-[60px]">
                                {task.problemStatement ? (
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{task.problemStatement}</ReactMarkdown>
                                ) : (
                                    <p className="text-zinc-500 italic">No problem statement provided for this task.</p>
                                )}
                            </div>
                        </div>

                        {/* Interactive Area */}
                        {isMCQ && (
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Select the correct option:</p>
                                <div className="grid grid-cols-1 gap-3">
                                    {task.options?.map((option, idx) => (
                                        <button
                                            key={option.id || idx}
                                            onClick={() => setSelectedOption(option.id || idx.toString())}
                                            className={`
                                                w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group
                                                ${selectedOption === (option.id || idx.toString())
                                                    ? 'bg-violet-500/10 border-violet-500/50 text-violet-200'
                                                    : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900'
                                                }
                                                ${showResults && option.isCorrect ? 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20' : ''}
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`
                                                    w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all
                                                    ${selectedOption === (option.id || idx.toString())
                                                        ? 'border-violet-500 bg-violet-500 text-white'
                                                        : 'border-zinc-700 bg-zinc-900 text-zinc-500 group-hover:border-zinc-600'
                                                    }
                                                    ${showResults && option.isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' : ''}
                                                `}>
                                                    {String.fromCharCode(65 + idx)}
                                                </div>
                                                <span className="text-sm">{option.optionText}</span>
                                            </div>
                                            {showResults && option.isCorrect && (
                                                <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Correct Answer
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isCoding && activeTab === 'problem' && (
                            <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden">
                                <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center">
                                    <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold tracking-widest">{task.language || 'Python'} Editor</span>
                                </div>
                                <textarea
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="w-full h-48 p-4 bg-transparent text-zinc-300 font-mono text-sm outline-none resize-none"
                                    placeholder="# Write your code here..."
                                />
                            </div>
                        )}
                    </div>
                )}

                {isCoding && activeTab === 'solution' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Info className="w-3.5 h-3.5" />
                                Test Cases ({task.testCases?.length || 0})
                            </p>
                            <div className="space-y-3">
                                {task.testCases?.map((tc, idx) => (
                                    <div key={tc.id || idx} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
                                        <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                            <span>Test Case #{idx + 1}</span>
                                            {tc.isHidden && <span className="text-yellow-600">Hidden</span>}
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] text-zinc-600 uppercase font-bold block mb-1">Input</label>
                                                <div className="bg-black p-2 rounded border border-zinc-800 font-mono text-xs text-zinc-400 min-h-[40px] break-all">
                                                    {tc.input || 'None'}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-zinc-600 uppercase font-bold block mb-1">Expected Output</label>
                                                <div className="bg-black p-2 rounded border border-zinc-800 font-mono text-xs text-emerald-500/80 min-h-[40px] break-all">
                                                    {tc.expectedOutput}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></div>
                    Demo Preview Mode
                </div>

                <div className="flex gap-3">
                    {isCoding && activeTab === 'problem' && (
                        <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition-all border border-zinc-700">
                            <Play className="w-3.5 h-3.5" />
                            Run Tests
                        </button>
                    )}
                    <button className="flex items-center gap-2 px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-violet-900/20">
                        <Send className="w-3.5 h-3.5" />
                        Submit Answer
                    </button>
                </div>
            </div>
        </div>
    );
}
