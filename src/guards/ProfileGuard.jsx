import { Navigate } from "react-router-dom";

export default function ProfileGuard({ userProfile, allowedProfile, children }) {
  if (userProfile !== allowedProfile) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
