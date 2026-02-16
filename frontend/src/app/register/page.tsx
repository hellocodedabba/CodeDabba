"use client";

import { useState, FormEvent, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/components/AuthLayout";
import { useAuth } from "@/context/AuthProvider";
import { ResponsiveRobot } from "@/components/ResponsiveRobot";

function RegisterForm() {
    const { user, isLoading: authLoading } = useAuth();
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const roleParam = searchParams.get("role");

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        mobileNumber: "",
        location: "",
        password: "",
        confirmPassword: "",
        role: "STUDENT", // Default to STUDENT
    });
    const [loading, setLoading] = useState(false);

    // Redirect if already logged in
    useEffect(() => {
        if (!authLoading && user) {
            router.push("/dashboard");
        }
    }, [user, authLoading, router]);

    // Prevent flashing of register form while checking auth
    if (authLoading || user) {
        return null; // Or a loading spinner
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            setLoading(false);
            return;
        }

        if (!/^[0-9]{10}$/.test(formData.mobileNumber)) {
            alert("Mobile number must be 10 digits!");
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            alert("Password must be at least 6 characters!");
            setLoading(false);
            return;
        }

        try {
            const { confirmPassword, ...dataToSend } = formData;
            // Ensure mobileNumber is sent correctly (already validated)
            await api.post('/auth/register', dataToSend);
            alert("Registration successful! Please login.");
            router.push(`/login`);
        } catch (e: any) {
            console.error(e);

            // Extract meaningful error message
            let message = "Registration failed";
            if (e.response?.data?.message) {
                if (Array.isArray(e.response.data.message)) {
                    message = e.response.data.message.join(', ');
                } else {
                    message = e.response.data.message;
                }
            }
            alert(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="Join CodeDabba" subtitle="Create your account">
            <div className="w-full">
                {/* Robot Assistant */}
                <div className="flex justify-center -mt-8 mb-6">
                    <ResponsiveRobot focusedField={focusedField} />
                </div>

                <div className="text-center lg:text-left">
                    <h2 className="text-2xl font-bold tracking-tight text-white">
                        Create an account
                    </h2>
                    <p className="mt-2 text-sm text-zinc-400">
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className="font-medium text-violet-400 hover:text-violet-300 transition-colors"
                        >
                            Login
                        </Link>
                    </p>
                </div>

                <form className="mt-8 space-y-5" onSubmit={handleRegister}>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-4">
                            <Input
                                id="name"
                                name="name"
                                placeholder="Full Name"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                onFocus={() => setFocusedField("name")}
                                onBlur={() => setFocusedField(null)}
                                required
                                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-violet-500/50"
                            />
                            <Input
                                id="email"
                                name="email"
                                placeholder="Email Address"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                onFocus={() => setFocusedField("email")}
                                onBlur={() => setFocusedField(null)}
                                required
                                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-violet-500/50"
                            />
                            {/* Role Selection Removed - Defaulting to Student internally */}

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    id="mobileNumber"
                                    name="mobileNumber"
                                    placeholder="Mobile Number"
                                    type="text"
                                    value={formData.mobileNumber}
                                    onChange={handleChange}
                                    onFocus={() => setFocusedField("mobileNumber")}
                                    onBlur={() => setFocusedField(null)}
                                    required
                                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-violet-500/50"
                                />
                                <Input
                                    id="location"
                                    name="location"
                                    placeholder="Location"
                                    type="text"
                                    value={formData.location}
                                    onChange={handleChange}
                                    onFocus={() => setFocusedField("location")}
                                    onBlur={() => setFocusedField(null)}
                                    required
                                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-violet-500/50"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    id="password"
                                    name="password"
                                    placeholder="Password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    onFocus={() => setFocusedField("password")}
                                    onBlur={() => setFocusedField(null)}
                                    required
                                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-violet-500/50"
                                />
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    placeholder="Confirm Password"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    onFocus={() => setFocusedField("confirmPassword")}
                                    onBlur={() => setFocusedField(null)}
                                    required
                                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-violet-500/50"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <input
                            id="terms"
                            name="terms"
                            type="checkbox"
                            className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-violet-600 focus:ring-violet-600"
                            required
                        />
                        <label
                            htmlFor="terms"
                            className="ml-2 block text-sm text-zinc-400"
                        >
                            I agree to the <span className="text-violet-400 cursor-pointer hover:underline">Terms & Conditions</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full justify-center rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                    >
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-zinc-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-zinc-950 px-2 text-zinc-500">
                            Or register with
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
                    >
                        Google
                    </button>
                </div>
            </div>
        </AuthLayout>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <RegisterForm />
        </Suspense>
    );
}