import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";

/**
 * Custom hook to access authentication context.
 * Provides user state, in-memory token status, role, login, register, and logout handlers.
 *
 * @returns {import('../context/AuthContext.jsx').AuthContextType}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default useAuth;
