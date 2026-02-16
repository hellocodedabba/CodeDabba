"use client";

import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ResponsiveRobot } from "./ResponsiveRobot";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, isLoading, role } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push("/login");
            } else if (allowedRoles && !allowedRoles.includes(role || "")) {
                // Redirect to appropriate dashboard if role is unauthorized for current route
                if (role === 'ADMIN') router.push("/admin/dashboard");
                else if (role === 'MENTOR') router.push("/mentor/dashboard");
                else router.push("/student/dashboard");
            }
        }
    }, [user, isLoading, role, router, allowedRoles]);

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white">
                <div className="flex flex-col items-center gap-4">
                    <ResponsiveRobot focusedField={null} />
                    <p className="animate-pulse text-lg font-medium text-blue-400">Verifying Access...</p>
                </div>
            </div>
        );
    }

    if (!user || (allowedRoles && !allowedRoles.includes(role || ""))) {
        return null;
    }

    return <>{children}</>;
}
