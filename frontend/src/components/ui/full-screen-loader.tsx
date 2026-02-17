"use client";

import { Code2 } from "lucide-react";

interface FullScreenLoaderProps {
    message?: string;
}

export function FullScreenLoader({ message = "Loading..." }: FullScreenLoaderProps) {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative flex items-center justify-center mb-8">
                {/* Outer pulsing ring */}
                <div className="absolute inset-0 rounded-full border-4 border-violet-500/30 animate-ping opacity-75 h-24 w-24"></div>

                {/* Spinning ring */}
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-500 animate-spin h-24 w-24"></div>

                {/* Inner Icon */}
                <div className="relative z-10 bg-black p-4 rounded-full border border-violet-500/50 shadow-lg shadow-violet-500/20">
                    <Code2 className="w-10 h-10 text-violet-400 animate-pulse" />
                </div>
            </div>

            <h2 className="text-xl font-bold text-white tracking-wider animate-pulse">
                {message}
            </h2>
            <div className="mt-2 flex gap-1">
                <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce"></div>
            </div>
        </div>
    );
}
