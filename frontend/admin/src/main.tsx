import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { Provider as StateProvider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

import { EnigmaProvider, ToastContainer } from "@/components";
// import { ErrorBoundary } from "@/components/ErrorBoundary";
import { persistor, store } from "@/services/store";

import App from "./App.tsx";
import "./theme/style.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* <ErrorBoundary> */}
    <StateProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <EnigmaProvider>
            <ToastContainer />
            <App />
          </EnigmaProvider>
        </BrowserRouter>
      </PersistGate>
    </StateProvider>
    {/* </ErrorBoundary> */}
  </StrictMode>
);
