"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/axios';
import { GoogleOAuthProvider } from '@react-oauth/google';

interface User {
    id: string;
    email: string;
    role: string;
    name?: string;
    password?: string;
}

interface AuthContextType {
    user: User | null;
    role: string | null;
    isLoading: boolean;
    login: (userData: any) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = () => {
            try {
                // Check for existing session
                const storedUser = localStorage.getItem('user');
                const storedRole = localStorage.getItem('user_role');
                const token = localStorage.getItem('access_token');

                if (token && storedUser) {
                    setUser(JSON.parse(storedUser));
                    setRole(storedRole);
                }
            } catch (error) {
                console.error("Failed to restore validation session:", error);
                // Clear potentially corrupted data
                localStorage.clear();
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = (data: any) => {
        // Expected data: { user: User, access_token: string, refresh_token: string }
        if (!data.user) {
            console.error("Login failed: User data missing in response", data);
            return;
        }
        setUser(data.user);
        setRole(data.user.role);
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('user_id', data.user.id);
        localStorage.setItem('user_role', data.user.role);
        localStorage.setItem('user', JSON.stringify(data.user));
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout failed', error);
        } finally {
            setUser(null);
            setRole(null);
            localStorage.clear();
            window.location.href = '/login';
        }
    };

    return (
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID"}>
            <AuthContext.Provider value={{ user, role, isLoading, login, logout }}>
                {children}
            </AuthContext.Provider>
        </GoogleOAuthProvider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
