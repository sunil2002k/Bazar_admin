// App.js
import { useState } from "react";
import { Routes, Route, BrowserRouter as Router } from "react-router-dom";
import AdminPanel from "./components/AdminPanel";
import AdminLogin from "./components/AdminLogin";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Router>
      <Routes>
        {/* Home route that renders login form */}
        <Route
          path="/"
          element={<AdminLogin setIsAuthenticated={setIsAuthenticated} />}
        />

        {/* Protected Admin route */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <AdminPanel setIsAuthenticated={setIsAuthenticated} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
