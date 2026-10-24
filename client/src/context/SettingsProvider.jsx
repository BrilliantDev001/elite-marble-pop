import { useMemo } from "react";
import useApi from "../hooks/useApi";
import { SettingsContext } from "./settingsContext";

// Loads the business contact details ONCE and shares them with the whole website.
// Until they load (or if loading fails) there are deliberately NO contact details at all,
// so a visitor can never tap a placeholder phone number.
export default function SettingsProvider({ children }) {
  const { data, status } = useApi("/api/settings");

  const value = useMemo(() => {
    const settings = data?.settings;
    if (!settings) return { contact: null, status };

    return {
      status,
      contact: {
        ...settings,
        // The phone number as dialled, without spaces or brackets, for tel: links.
        phoneHref: settings.phoneDisplay.replace(/[\s\-()]/g, ""),
      },
    };
  }, [data, status]);

  return <SettingsContext value={value}>{children}</SettingsContext>;
}
