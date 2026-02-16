"use client";

import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ResponsiveRobot } from "@/components/ResponsiveRobot";

export default function DashboardRoutingPage() {
    const { user, isLoading, role } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push("/login");
            } else {
                if (role === 'ADMIN') router.push("/admin/dashboard");
                else if (role === 'MENTOR') router.push("/mentor/dashboard");
                else router.push("/student/dashboard");
            }
        }
    }, [user, isLoading, role, router]);

    return (
        <div className="flex h-screen w-full items-center justify-center bg-black text-white">
            <div className="flex flex-col items-center gap-4">
                <ResponsiveRobot focusedField={null} />
                <p className="animate-pulse text-lg font-medium text-violet-400">Redirecting to your dashboard...</p>
            </div>
        </div>
    );
}
