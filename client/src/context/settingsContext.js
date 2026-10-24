import { createContext, useContext } from "react";

// What the whole website knows about the business contact details.
//   contact: null until the details have loaded (and stays null if loading failed)
//   status:  "loading", "ready" or "error"
export const SettingsContext = createContext({
  contact: null,
  status: "loading",
});

// Usage in a component:  const { contact, status } = useSettings();
export function useSettings() {
  return useContext(SettingsContext);
}
