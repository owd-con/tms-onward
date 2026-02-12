import { createContext } from "react";
import type { EnigmaContextType } from "./types";

export const EnigmaContext = createContext<EnigmaContextType | undefined>(
  undefined
);
