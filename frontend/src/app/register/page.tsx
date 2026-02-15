"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        mobileNumber: "",
        location: "",
        password: "",
        confirmPassword: "",
    });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        try {
            const { confirmPassword, ...dataToSend } = formData;
            await api.post('/auth/register', dataToSend);
            alert("Registration successful! Please login.");
            router.push("/login");
        } catch (e: unknown) {
            console.error(e);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            alert((e as any).response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex w-full items-center justify-center dark:bg-black">
            <div className="w-full flex">
                <div className="hidden lg:flex w-1/2 relative bg-slate-950 flex-col items-center justify-center p-12 text-white overflow-hidden min-h-screen">
                    <div
                        className={cn(
                            "absolute h-full w-full inset-0 bg-neutral-950"
                        )}
                    >
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                    </div>
                    <div className="relative z-10 max-w-lg text-center">
                        <h1 className="text-5xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
                            Join CodeDabba
                        </h1>
                        <p className="text-lg text-neutral-400 leading-relaxed">
                            Start your learning journey today. Create an account to access premium courses, mentor support, and a community of developers.
                        </p>
                    </div>
                </div>

                <div className="w-full lg:w-1/2 bg-white dark:bg-black flex items-center justify-center p-8 min-h-screen">
                    <div className="w-full max-w-md space-y-8">
                        <div className="text-center lg:text-left">
                            <h2 className="text-3xl font-bold text-neutral-800 dark:text-neutral-200">
                                Create Account
                            </h2>
                            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                                Already have an account?{" "}
                                <Link
                                    href="/login"
                                    className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 transition-colors"
                                >
                                    Sign In
                                </Link>
                            </p>
                        </div>

                        <form className="mt-8 space-y-5" onSubmit={handleRegister}>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="Tyler Durden"
                                        type="text"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        placeholder="projectmayhem@fc.com"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mobileNumber">Mobile Number</Label>
                                    <Input
                                        id="mobileNumber"
                                        name="mobileNumber"
                                        placeholder="9876543210"
                                        type="text"
                                        value={formData.mobileNumber}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location">Location</Label>
                                    <Input
                                        id="location"
                                        name="location"
                                        placeholder="New York, USA"
                                        type="text"
                                        value={formData.location}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input
                                            id="password"
                                            name="password"
                                            placeholder="••••••••"
                                            type="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm</Label>
                                        <Input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            placeholder="••••••••"
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative flex w-full justify-center rounded-md bg-gradient-to-br from-black to-neutral-600 dark:from-zinc-900 dark:to-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-input hover:scale-[1.01] hover:shadow-2xl hover:shadow-black/20 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 dark:focus:ring-neutral-400 dark:focus:ring-offset-neutral-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                            >
                                {loading ? "Creating Account..." : "Sign Up →"}
                                <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                                <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 blur-sm transition-opacity group-hover:opacity-100" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
