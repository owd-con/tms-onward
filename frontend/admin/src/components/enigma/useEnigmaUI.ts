import { useContext } from "react";
import type { EnigmaContextType } from "./types";
import { EnigmaContext } from "./context";

export const useEnigmaUI = (): EnigmaContextType => {
  const ctx = useContext(EnigmaContext);
  if (!ctx) throw new Error("useEnigmaUI must be used within EnigmaProvider");
  return ctx;
};
