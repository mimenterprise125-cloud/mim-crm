import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { userService } from "@/services/userService";

export type UserRole = "admin" | "sales" | "operations" | "accounts";

interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  phone?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from session on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const session = localStorage.getItem("user_session");
        if (session) {
          const userData = JSON.parse(session);
          setUser({
            id: userData.id,
            full_name: userData.full_name,
            email: userData.email,
            role: userData.role,
            phone: userData.phone,
          });
        }
      } catch (error) {
        localStorage.removeItem("user_session");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const result = await userService.login(email, password);

      if (result.success && result.data) {
        const userData = result.data;
        const userObj = {
          id: userData.id,
          full_name: userData.full_name,
          email: userData.email,
          role: userData.role,
          phone: userData.phone,
        };
        setUser(userObj);
        localStorage.setItem("user_session", JSON.stringify(userData));
        return true;
      }
      return false;
    } catch (error) {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("user_session");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
