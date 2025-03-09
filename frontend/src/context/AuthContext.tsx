import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { authAPI } from "../api";

interface AuthResponse {
    token: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({children}: {children: ReactNode}) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        return !!localStorage.getItem("token");
      });

    useEffect(() => {
        const token = localStorage.getItem("token");
        setIsAuthenticated(!!token);
      }, [isAuthenticated]);

    const login = async (email: string, password: string) => {
        const response = await authAPI.signIn({email, password});
        const data = response.data as AuthResponse;
        localStorage.setItem("token", data.token);
        setIsAuthenticated(true);
    }

    const logout = () => {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if(!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};


