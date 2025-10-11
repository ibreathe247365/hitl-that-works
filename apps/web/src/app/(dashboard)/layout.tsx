"use client";

import { Sidebar } from "@/components/sidebar";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "convex/react";
import { useState } from "react";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <>
      <Authenticated>
        <div className="flex h-screen">
          <Sidebar />
          <main className="flex-1 ml-16 overflow-hidden">
            {children}
          </main>
        </div>
      </Authenticated>
      <Unauthenticated>
        <div className="flex h-screen items-center justify-center">
          {showSignIn ? (
            <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
          ) : (
            <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
          )}
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="flex h-screen items-center justify-center">
          <div>Loading...</div>
        </div>
      </AuthLoading>
    </>
  );
}
