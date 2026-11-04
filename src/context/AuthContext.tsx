import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, googleProvider, signInWithPopup, fbSignOut } from '../firebase';
import { UserProfile, UserRole } from '../types/inventory';
import { DEMO_USERS } from '../data/seedData';
import { inventoryService } from '../services/inventoryService';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile;
  role: UserRole;
  switchDemoRole: (role: UserRole) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isVendor: boolean;
  isEndUser: boolean;
  activeVendorId: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // Default to Admin profile (jnieves0402@gmail.com) for immediate testing
  const [userProfile, setUserProfile] = useState<UserProfile>(DEMO_USERS[0]);
  const [activeVendorId, setActiveVendorId] = useState<string>('vendor-sunvolt');

  useEffect(() => {
    // Seed initial data to Firestore if not already seeded
    inventoryService.seedIfEmpty();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        const isAdminUser = user.email === 'jnieves0402@gmail.com';
        setUserProfile({
          id: user.uid,
          email: user.email || 'user@counsol.america',
          displayName: user.displayName || user.email?.split('@')[0] || 'Solar Specialist',
          role: isAdminUser ? 'admin' : 'end_user',
          companyName: isAdminUser ? 'counSOL america Corporate' : 'Solar Partner Network',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const switchDemoRole = (targetRole: UserRole) => {
    const matched = DEMO_USERS.find((u) => u.role === targetRole) || {
      id: `user-${targetRole}`,
      email: `${targetRole}@counsol.america`,
      displayName: `${targetRole.toUpperCase()} Test User`,
      role: targetRole,
      companyName:
        targetRole === 'admin'
          ? 'counSOL america HQ'
          : targetRole === 'vendor'
          ? 'SunVolt Dynamics Inc.'
          : 'Apex Solar Contractors LLC',
      status: 'active' as const,
      vendorId: targetRole === 'vendor' ? 'vendor-sunvolt' : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setUserProfile(matched);
    if (targetRole === 'vendor') {
      setActiveVendorId(matched.vendorId || 'vendor-sunvolt');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google Sign-In failed:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await fbSignOut(auth);
      // Reset back to demo admin
      setUserProfile(DEMO_USERS[0]);
    } catch (err) {
      console.error('Sign-Out failed:', err);
    }
  };

  const role = userProfile.role;
  const isAdmin = role === 'admin';
  const isVendor = role === 'vendor';
  const isEndUser = role === 'end_user';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        role,
        switchDemoRole,
        signInWithGoogle: handleGoogleSignIn,
        signOut: handleSignOut,
        isAdmin,
        isVendor,
        isEndUser,
        activeVendorId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
