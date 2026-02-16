"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ResponsiveRobotProps {
    focusedField: string | null;
}

export function ResponsiveRobot({ focusedField }: ResponsiveRobotProps) {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    // Track mouse movement
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
            const y = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
            setMousePosition({ x, y });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    const isBlindfolded = focusedField === "password" || focusedField === "confirmPassword";

    // Head rotation (Center when blindfolded)
    const headX = isBlindfolded ? 0 : mousePosition.x * 5;
    const headY = isBlindfolded ? 10 : mousePosition.y * 5; // Look slightly down when blindfolded

    // Eye movement
    const eyeX = isBlindfolded ? 0 : mousePosition.x * 12;
    const eyeY = isBlindfolded ? 0 : (focusedField ? 8 : mousePosition.y * 10);

    return (
        <div className="w-48 h-48 mx-auto -mb-4 relative z-10">
            <svg
                viewBox="0 0 200 240"
                className="w-full h-full drop-shadow-2xl"
                style={{ overflow: "visible" }}
            >
                <defs>
                    <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#e4e4e7" /> {/* Zinc-200 */}
                        <stop offset="50%" stopColor="#f4f4f5" /> {/* Zinc-100 */}
                        <stop offset="100%" stopColor="#d4d4d8" /> {/* Zinc-300 */}
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* --- Body / Torso --- */}
                <g transform="translate(100, 170)">
                    {/* Chest Plate */}
                    <path
                        d="M-45,-50 L45,-50 L35,60 L-35,60 Z"
                        fill="url(#bodyGradient)"
                        stroke="#52525b"
                        strokeWidth="1"
                    />
                    {/* Neck */}
                    <rect x="-18" y="-70" width="36" height="30" fill="#3f3f46" rx="6" />
                </g>

                {/* --- Head Group --- */}
                <motion.g
                    initial={{ x: 0, y: 0 }}
                    animate={{ x: headX, y: headY }}
                    transition={{ type: "spring", stiffness: 180, damping: 20 }}
                >
                    {/* Helmet Shape */}
                    <path
                        d="M50,40 C50,5 150,5 150,40 C150,90 130,120 100,120 C70,120 50,90 50,40"
                        fill="url(#bodyGradient)"
                        stroke="#d4d4d8"
                        strokeWidth="1"
                        filter="drop-shadow(0px 4px 4px rgba(0,0,0,0.25))"
                    />

                    {/* Black Visor Face */}
                    <path
                        d="M60,50 C60,25 140,25 140,50 C140,85 120,105 100,105 C80,105 60,85 60,50"
                        fill="#18181b"
                        stroke="#27272a"
                        strokeWidth="1"
                    />

                    {/* Animated "Eyes" */}
                    <motion.g
                        animate={{ x: eyeX, y: eyeY }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                        {!isBlindfolded && (
                            <>
                                <circle cx="85" cy="60" r="4" fill="#0ea5e9" filter="url(#glow)" />
                                <circle cx="115" cy="60" r="4" fill="#0ea5e9" filter="url(#glow)" />
                            </>
                        )}
                        {/* Visor Glare */}
                        <path
                            d="M75,35 Q100,20 125,35"
                            fill="none"
                            stroke="rgba(255,255,255,0.15)"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                    </motion.g>

                    {/* Ear pieces */}
                    <rect x="45" y="45" width="10" height="25" rx="3" fill="#71717a" />
                    <rect x="145" y="45" width="10" height="25" rx="3" fill="#71717a" />
                </motion.g>

                {/* --- Arms Group (Pivoting from Shoulders using nested groups) --- */}
                {/* Shoulders (Visible circles) */}
                <circle cx="45" cy="140" r="25" fill="url(#bodyGradient)" stroke="#52525b" />
                <circle cx="155" cy="140" r="25" fill="url(#bodyGradient)" stroke="#52525b" />

                {/* Left Arm covering eye */}
                <g transform="translate(45, 140)"> {/* Move to Left Shoulder Position */}
                    <motion.g
                        initial={{ rotate: 0 }}
                        animate={{
                            rotate: isBlindfolded ? 170 : 10, // Rotate around (0,0) which is now physically at shoulder
                        }}
                        transition={{ type: "spring", stiffness: 120, damping: 15 }}
                    >
                        {/* Arms drawn relative to 0,0 (shoulder connection point) */}
                        {/* x=-15 centers the arm width (30) on 0. y=0 starts it at shoulder */}
                        <g transform="translate(-15, 0)">
                            {/* Arm Segment */}
                            <rect x="0" y="0" width="30" height="80" rx="15" fill="url(#bodyGradient)" stroke="#52525b" />
                            {/* Hand at the end of the arm */}
                            <path d="M0,70 L30,70 L30,90 L20,100 L10,100 L0,90 Z" fill="#d4d4d8" stroke="#52525b" />
                        </g>
                    </motion.g>
                </g>

                {/* Right Arm covering eye */}
                <g transform="translate(155, 140)"> {/* Move to Right Shoulder Position */}
                    <motion.g
                        initial={{ rotate: 0 }}
                        animate={{
                            rotate: isBlindfolded ? -170 : -10, // Rotate around 0,0
                        }}
                        transition={{ type: "spring", stiffness: 120, damping: 15 }}
                    >
                        {/* Arms drawn relative to 0,0 (shoulder connection point) */}
                        <g transform="translate(-15, 0)">
                            {/* Arm Segment */}
                            <rect x="0" y="0" width="30" height="80" rx="15" fill="url(#bodyGradient)" stroke="#52525b" />
                            {/* Hand */}
                            <path d="M0,70 L30,70 L30,90 L20,100 L10,100 L0,90 Z" fill="#d4d4d8" stroke="#52525b" />
                        </g>
                    </motion.g>
                </g>

            </svg>
        </div>
    );
}
