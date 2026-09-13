import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from 'firebase/auth';
// Firebase is imported lazily so it stays out of the initial bundle.

/** Auth is only wired up on the routes that actually need it. */
const needsAuth = () =>
  typeof window !== 'undefined' &&
  /(^|\/)(admin|auth|login)(\/|$)/.test(window.location.pathname);


type UserRole = 'admin' | 'trainee';

interface UserData {
  uid: string;
  email: string | null;
  role: UserRole;
  displayName?: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Admin credentials
const ADMIN_EMAIL = 'admin@dashboard.com';
const ADMIN_PASSWORD = 'Admin@123';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!needsAuth()) {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const [{ onAuthStateChanged }, { getAuthLazy }] = await Promise.all([
        import('firebase/auth'),
        import('@/lib/firebase'),
      ]);
      const auth = await getAuthLazy();
      if (cancelled) return;

      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setUser(firebaseUser);

        if (firebaseUser) {
          // Check if it's the admin
          if (firebaseUser.email === ADMIN_EMAIL) {
            setUserData({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: 'admin',
              displayName: 'Admin'
            });
          } else {
            const [{ doc, getDoc }, { db }] = await Promise.all([
              import('firebase/firestore'),
              import('@/lib/firebase'),
            ]);
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              setUserData(userDoc.data() as UserData);
            }
          }
        } else {
          setUserData(null);
        }

        setLoading(false);
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const login = async (email: string, password: string) => {
    // Only allow admin login
    if (email !== ADMIN_EMAIL) {
      throw new Error('غير مصرح لك بالدخول / Unauthorized access');
    }
    const [{ signInWithEmailAndPassword }, { getAuthLazy }] = await Promise.all([
      import('firebase/auth'),
      import('@/lib/firebase'),
    ]);
    const auth = await getAuthLazy();
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    const [{ signOut }, { getAuthLazy }] = await Promise.all([
      import('firebase/auth'),
      import('@/lib/firebase'),
    ]);
    const auth = await getAuthLazy();
    await signOut(auth);
  };


  const isAdmin = userData?.role === 'admin' || user?.email === ADMIN_EMAIL;

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
