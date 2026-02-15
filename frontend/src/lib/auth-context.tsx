"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "./api";

interface User {
    id: string;
    email: string;
    role: string;
    name?: string;
}

interface AuthContextType {
    user: User | null;
    login: (token: string, userData: User) => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: () => { },
    logout: () => { },
    loading: true,
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            // Create a function to fetch user profile
            const fetchUser = async () => {
                try {
                    const { data } = await api.get('/users/me');
                    setUser(data);
                } catch (error: unknown) {
                    console.error("Auth check failed", error);
                    localStorage.removeItem("token");
                } finally {
                    setLoading(false);
                }
            };
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const login = (token: string, userData: User) => {
        localStorage.setItem("token", token);
        setUser(userData);
        router.push("/dashboard");
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}
