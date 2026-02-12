import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import { Provider as StateProvider } from "react-redux";

import { EnigmaProvider, ToastContainer } from "@/components";
// import { ErrorBoundary } from "@/components/ErrorBoundary";
import { store } from "@/services/store";

import App from "./App.tsx";
import "./theme/style.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      {/* <ErrorBoundary> */}
      <StateProvider store={store}>
        <BrowserRouter>
          <EnigmaProvider>
            <ToastContainer />
            <App />
          </EnigmaProvider>
        </BrowserRouter>
      </StateProvider>
      {/* </ErrorBoundary> */}
    </HelmetProvider>
  </StrictMode>
);
