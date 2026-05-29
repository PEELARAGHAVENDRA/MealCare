"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface DemoContextType {
  isDemoMode: boolean;
  setDemoMode: (mode: boolean) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("demoMode");
      if (stored !== null) {
        setIsDemoMode(stored === "true");
      }
    } catch (e) {
      console.warn("Failed to load demoMode status from localStorage:", e);
    }
  }, []);

  const setDemoMode = (mode: boolean) => {
    setIsDemoMode(mode);
    try {
      localStorage.setItem("demoMode", String(mode));
    } catch (e) {
      console.warn("Failed to save demoMode status to localStorage:", e);
    }
  };

  return (
    <DemoContext.Provider value={{ isDemoMode, setDemoMode }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
}
