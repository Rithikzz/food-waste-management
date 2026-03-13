// App.jsx – Root component with auth + route definitions
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DonationProvider } from "./context/DonationContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Donate from "./pages/Donate";
import Donations from "./pages/Donations";
import Volunteer from "./pages/Volunteer";
import Admin from "./pages/Admin";

const App = () => (
  <AuthProvider>
    <DonationProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/"          element={<Home />} />
              <Route path="/login"     element={<Login />} />
              <Route path="/donate"    element={
                <ProtectedRoute roles={["donor"]}>
                  <Donate />
                </ProtectedRoute>
              } />
              <Route path="/donations" element={
                <ProtectedRoute>
                  <Donations />
                </ProtectedRoute>
              } />
              <Route path="/volunteer" element={
                <ProtectedRoute roles={["volunteer"]}>
                  <Volunteer />
                </ProtectedRoute>
              } />
              <Route path="/admin"     element={
                <ProtectedRoute roles={["admin"]}>
                  <Admin />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </DonationProvider>
  </AuthProvider>
);

export default App;
