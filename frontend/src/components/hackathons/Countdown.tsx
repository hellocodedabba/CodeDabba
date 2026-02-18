"use client";

import { useState, useEffect } from "react";

interface CountdownProps {
    targetDate: string;
    onEnd?: () => void;
}

export function Countdown({ targetDate, onEnd }: CountdownProps) {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = new Date(targetDate).getTime() - new Date().getTime();

            if (difference <= 0) {
                if (onEnd) onEnd();
                return { days: 0, hours: 0, minutes: 0, seconds: 0 };
            }

            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            };
        };

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        setTimeLeft(calculateTimeLeft());

        return () => clearInterval(timer);
    }, [targetDate]);

    return (
        <div className="flex gap-4">
            <div className="flex flex-col items-center">
                <div className="text-4xl font-black italic tracking-tighter text-white tabular-nums">
                    {String(timeLeft.days).padStart(2, '0')}
                </div>
                <div className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mt-1">Days</div>
            </div>
            <div className="text-4xl font-black italic text-zinc-800">:</div>
            <div className="flex flex-col items-center">
                <div className="text-4xl font-black italic tracking-tighter text-white tabular-nums">
                    {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <div className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mt-1">Hours</div>
            </div>
            <div className="text-4xl font-black italic text-zinc-800">:</div>
            <div className="flex flex-col items-center">
                <div className="text-4xl font-black italic tracking-tighter text-white tabular-nums">
                    {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <div className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mt-1">Mins</div>
            </div>
            <div className="text-4xl font-black italic text-zinc-800">:</div>
            <div className="flex flex-col items-center">
                <div className="text-4xl font-black italic tracking-tighter text-fuchsia-500 tabular-nums">
                    {String(timeLeft.seconds).padStart(2, '0')}
                </div>
                <div className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mt-1">Secs</div>
            </div>
        </div>
    );
}
