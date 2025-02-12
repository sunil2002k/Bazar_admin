// ProtectedRoute.js
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) {
    return <Navigate to="/" />; // Redirect to the login page if not authenticated
  }

  return children; // If authenticated, render the protected component (AdminPanel)
};

export default ProtectedRoute;
