import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction
} from "react";
import { API } from "../api";

export type User = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  isSubscribed: boolean;
  isRegistrationComplete: boolean;
  kycVerified: boolean;
  subscriptionId?: string | null;
  paymentVerifiedAt?: string | null;
  activePlanId?: string | null;
  activePlanName?: string | null;
  activePlanAmount?: number | null;
  activePlanCurrency?: string | null;
  governmentIdType?: string | null;
  governmentIdNumber?: string | null;
  governmentDocumentUrl?: string | null;
  termsAcceptedAt?: string | null;
  riskPolicyAcceptedAt?: string | null;
  isAdmin: boolean;
};

type LoginPayload = {
  token: string;
  user: User;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  login: (payload: LoginPayload) => void;
  logout: () => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
  setUser: Dispatch<SetStateAction<User | null>>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as User);
      } catch {
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((payload: LoginPayload) => {
    localStorage.setItem("token", payload.token);
    localStorage.setItem("user", JSON.stringify(payload.user));
    setToken(payload.token);
    setUser(payload.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const response = await API.get<User>("/auth/me");
      localStorage.setItem("user", JSON.stringify(response.data));
      setUser(response.data);
    } catch {
      logout();
    }
  }, [token, logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      login,
      logout,
      loading,
      refreshUser,
      setUser
    }),
    [user, token, loading, login, logout, refreshUser]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">Preparing application...</p>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
