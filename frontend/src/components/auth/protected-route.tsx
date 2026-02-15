"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({
    children,
    roles = [],
}: {
    children: React.ReactNode;
    roles?: string[];
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
    }

    if (!user) {
        return null; // Will redirect
    }

    if (roles.length > 0 && user) {
        if (!roles.includes(user.role)) {
            return <div className="flex min-h-screen items-center justify-center text-red-500">Unauthorized Access</div>;
        }
    }

    return <>{children}</>;
}
