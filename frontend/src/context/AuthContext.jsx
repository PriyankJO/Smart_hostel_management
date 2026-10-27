import { createContext, useContext } from "react";
import { useLocalStorage, useSessionStorage } from "../hooks/useLocalStorage";
import { authService } from "../services/auth.service";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useSessionStorage("shms:session", null);

  const loginStaff = async (username, email, selectedRole) => {
    const res = await authService.loginStaff(username, email, selectedRole);
    if (res.ok) {
      setUser({ ...res.user, token: res.token });
    }
    return res;
  };

  const loginStudent = async (studentId, dob) => {
    const res = await authService.loginStudent(studentId, dob);
    if (res.ok) {
      setUser({ ...res.user, token: res.token });
    }
    return res;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, loginStaff, loginStudent, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
