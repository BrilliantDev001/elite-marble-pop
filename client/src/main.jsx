import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import SettingsProvider from "./context/SettingsProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* BrowserRouter lets the app read and change the page URL */}
    <BrowserRouter>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </BrowserRouter>
  </StrictMode>,
);
