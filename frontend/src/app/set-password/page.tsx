"use client";

import { useAuth } from "@/context/AuthProvider";
import { useState, FormEvent, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { AuthLayout } from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { ResponsiveRobot } from "@/components/ResponsiveRobot";
import { Eye, EyeOff } from "lucide-react";

function SetPasswordForm() {
    const { user, isLoading: authLoading } = useAuth();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    const handleSetPassword = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            alert("Password must be at least 6 characters!");
            setLoading(false);
            return;
        }

        try {
            await api.post('/auth/set-password', { password });
            alert("Password set successfully!");
            router.push("/dashboard");
        } catch (e: any) {
            console.error(e);
            alert("Failed to set password: " + (e.response?.data?.message || "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || !user) return null;

    return (
        <AuthLayout
            title="Set Password"
            subtitle="Secure your account by setting a password."
        >
            <div className="flex justify-center -mt-8">
                <ResponsiveRobot focusedField={focusedField} />
            </div>

            <div className="text-center lg:text-left">
                <h2 className="text-2xl font-bold tracking-tight text-white">
                    Set a Password
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                    You can now use this password to login additionally.
                </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSetPassword}>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="relative">
                            <Input
                                id="password"
                                placeholder="New Password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setFocusedField("password")}
                                onBlur={() => setFocusedField(null)}
                                required
                                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-violet-500/50 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff size={20} />
                                ) : (
                                    <Eye size={20} />
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                placeholder="Confirm New Password"
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                onFocus={() => setFocusedField("confirmPassword")}
                                onBlur={() => setFocusedField(null)}
                                required
                                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-violet-500/50 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                            >
                                {showConfirmPassword ? (
                                    <EyeOff size={20} />
                                ) : (
                                    <Eye size={20} />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full justify-center rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? "Setting Password..." : "Set Password"}
                </button>
            </form>
        </AuthLayout>
    );
}

export default function SetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SetPasswordForm />
        </Suspense>
    );
}
