"use client";

import { useAuth } from "@/lib/auth-context";
import { useState, FormEvent } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { AuthLayout } from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });
            login(response.data.access_token, response.data.user);
        } catch (e: unknown) {
            console.error(e);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            alert((e as any).response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Sign in to continue your journey with CodeDabba. Access your courses, track your progress, and level up your skills."
        >
            <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold text-neutral-800 dark:text-neutral-200">
                    Sign In
                </h2>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/register"
                        className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 transition-colors"
                    >
                        Register
                    </Link>
                </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            placeholder="projectmayhem@fc.com"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            placeholder="••••••••"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 dark:border-neutral-600 dark:bg-neutral-700"
                        />
                        <label
                            htmlFor="remember-me"
                            className="ml-2 block text-sm text-neutral-600 dark:text-neutral-300"
                        >
                            Remember me
                        </label>
                    </div>

                    <div className="text-sm">
                        <a
                            href="#"
                            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                        >
                            Forgot password?
                        </a>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="group relative flex w-full justify-center rounded-md bg-gradient-to-br from-black to-neutral-600 dark:from-zinc-900 dark:to-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-input hover:scale-[1.01] hover:shadow-2xl hover:shadow-black/20 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 dark:focus:ring-neutral-400 dark:focus:ring-offset-neutral-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? "Signing in..." : "Sign In →"}
                    <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 blur-sm transition-opacity group-hover:opacity-100" />
                </button>
            </form>

            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-neutral-300 dark:border-neutral-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-neutral-500 dark:bg-black dark:text-neutral-400">
                        Or continue with
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button
                    className="relative group/btn flex space-x-2 items-center justify-start px-4 w-full text-black rounded-md h-10 font-medium shadow-input bg-gray-50 dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_var(--neutral-800)]"
                    type="button"
                >
                    <span className="text-neutral-700 dark:text-neutral-300 text-sm"> GitHub</span>
                    <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition-opacity group-hover/btn:opacity-100" />
                </button>
                <button
                    className="relative group/btn flex space-x-2 items-center justify-start px-4 w-full text-black rounded-md h-10 font-medium shadow-input bg-gray-50 dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_var(--neutral-800)]"
                    type="button"
                >
                    <span className="text-neutral-700 dark:text-neutral-300 text-sm"> Google</span>
                    <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition-opacity group-hover/btn:opacity-100" />
                </button>
            </div>
        </AuthLayout>
    );
}
