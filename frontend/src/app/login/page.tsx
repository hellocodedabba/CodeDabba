"use client";

import { useAuth } from "@/context/AuthProvider";
import { useState, FormEvent, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { useGoogleLogin } from '@react-oauth/google';
import { AuthLayout } from "@/components/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

import { ResponsiveRobot } from "@/components/ResponsiveRobot";

function LoginForm() {
    const { login, user, isLoading: authLoading } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const roleParam = searchParams.get("role");

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const res = await api.post('/auth/google', { token: tokenResponse.access_token });
                login(res.data);
                router.push("/dashboard"); // Directly go to dashboard on login, skip password set
            } catch (error) {
                console.error(error);
                alert("Google Login Failed");
            }
        },
        onError: () => console.log('Login Failed'),
    });

    // Redirect if already logged in
    useEffect(() => {
        if (!authLoading && user) {
            if (user.role === 'ADMIN') router.push("/admin/dashboard");
            else if (user.role === 'MENTOR') router.push("/mentor/dashboard");
            else router.push("/dashboard"); // Default to student dashboard
        }
    }, [user, authLoading, router]);

    // Prevent flashing of login form while checking auth
    if (authLoading || user) {
        return null;
    }

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });
            login(response.data);
            // Redirection handled by useEffect or could be done here immediately
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
            subtitle="Sign in to continue your journey with CodeDabba."
        >
            {/* Robot Assistant */}
            <div className="flex justify-center -mt-8">
                <ResponsiveRobot focusedField={focusedField} />
            </div>

            <div className="text-center lg:text-left">
                <h2 className="text-2xl font-bold tracking-tight text-white">
                    Sign in to your account
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                    Don't have an account?{" "}
                    <Link
                        href="/register"
                        className="font-medium text-violet-400 hover:text-violet-300 transition-colors"
                    >
                        Register
                    </Link>
                </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                <div className="space-y-4">
                    <div className="space-y-2">
                        {/* <Label htmlFor="email" className="text-zinc-300">Email Address</Label> */}
                        <Input
                            id="email"
                            placeholder="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onFocus={() => setFocusedField("email")}
                            onBlur={() => setFocusedField(null)}
                            required
                            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-violet-500/50"
                        />
                    </div>
                    <div className="space-y-2">
                        {/* <Label htmlFor="password" className="text-zinc-300">Password</Label> */}
                        <div className="relative">
                            <Input
                                id="password"
                                placeholder="Password"
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
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-violet-600 focus:ring-violet-600"
                        />
                        <label
                            htmlFor="remember-me"
                            className="ml-2 block text-sm text-zinc-400"
                        >
                            I agree to the <span className="text-violet-400 cursor-pointer hover:underline">Terms & Conditions</span>
                        </label>
                    </div>

                    <div className="text-sm">
                        <a
                            href="#"
                            className="font-medium text-violet-400 hover:text-violet-300"
                        >
                            Forgot password?
                        </a>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full justify-center rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? "Signing in..." : "Sign In"}
                </button>
            </form>

            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-zinc-950 px-2 text-zinc-500">
                        Or login with
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button
                    className="relative flex items-center justify-center px-4 w-full rounded-lg h-10 font-medium bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white transition-colors"
                    type="button"
                >
                    GitHub
                </button>
                <button
                    className="relative flex items-center justify-center px-4 w-full rounded-lg h-10 font-medium bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white transition-colors"
                    type="button"
                    onClick={() => googleLogin()}
                >
                    Google
                </button>
            </div>

            <div className="mt-8 text-center text-sm text-zinc-400">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-medium text-violet-400 hover:text-violet-300 transition-colors">
                    Register
                </Link>
            </div>
        </AuthLayout>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
}
