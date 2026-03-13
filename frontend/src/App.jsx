import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './routes/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DonateFoodPage from './pages/DonateFoodPage';
import DonationsPage from './pages/DonationsPage';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AdminDashboard from './pages/AdminDashboard';

const App = () => (
  <div className="min-h-screen flex flex-col bg-gray-50">
    <Navbar />
    <main className="flex-1">
      <Routes>
        <Route path="/"          element={<HomePage />} />
        <Route path="/login"     element={<LoginPage />} />
        <Route path="/register"  element={<RegisterPage />} />
        <Route path="/donate"    element={
          <ProtectedRoute roles={['donor']}>
            <DonateFoodPage />
          </ProtectedRoute>
        } />
        <Route path="/donations" element={
          <ProtectedRoute>
            <DonationsPage />
          </ProtectedRoute>
        } />
        <Route path="/volunteer" element={
          <ProtectedRoute roles={['volunteer']}>
            <VolunteerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin"     element={
          <ProtectedRoute roles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </main>
    <Footer />
  </div>
);

export default App;
