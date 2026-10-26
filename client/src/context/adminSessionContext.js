import { createContext, useContext } from "react";

// What the admin screens know about the login:
//   status   "checking", "loggedOut", "loggedIn" or "error" (the server could not be reached)
//   admin    { email } when logged in
//   notice   a message for the login screen ("You have been logged out.")
//   error    the problem, when status is "error"
//   login(email, password), logout(), retry()
export const AdminSessionContext = createContext(null);

export function useAdminSession() {
  const value = useContext(AdminSessionContext);
  if (!value)
    throw new Error(
      "useAdminSession must be used inside AdminSessionProvider.",
    );
  return value;
}
