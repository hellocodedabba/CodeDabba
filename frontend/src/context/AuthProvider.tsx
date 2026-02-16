"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/axios';

interface User {
    id: string;
    email: string;
    role: string;
    name?: string;
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
        // Check for existing session
        const storedUser = localStorage.getItem('user');
        const storedRole = localStorage.getItem('user_role');
        const token = localStorage.getItem('access_token');

        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
            setRole(storedRole);
        }
        setIsLoading(false);
    }, []);

    const login = (data: any) => {
        // Expected data: { user: User, access_token: string, refresh_token: string }
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
        <AuthContext.Provider value={{ user, role, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
