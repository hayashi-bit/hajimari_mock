import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: "admin" | "user";
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<boolean>;
  signOut: () => void;
}

const MOCK_USERS: Array<User & { password: string }> = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@hajimari.dev",
    username: "admin",
    password: "password",
    role: "admin",
  },
  {
    id: "2",
    name: "Demo User",
    email: "demo@hajimari.dev",
    username: "demo",
    password: "demo123",
    role: "user",
  },
];

const SESSION_KEY = "hajimari-session";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
    setIsLoading(false);
  }, []);

  const signIn = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      // Simulate async auth
      await new Promise((r) => setTimeout(r, 400));
      const found = MOCK_USERS.find(
        (u) => u.username === username && u.password === password
      );
      if (!found) return false;
      const { password: _pw, ...userData } = found;
      setUser(userData);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData));
      return true;
    },
    []
  );

  const signOut = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
