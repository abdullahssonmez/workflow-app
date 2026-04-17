import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Sayfa Importları
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './components/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import Calendar from "./pages/Calendar/Calendar";
import Workflows from './pages/Workflows/Workflows';
import Chat from './pages/Chat/Chat';
import Customers from './pages/Customers/Customers';
import Profile from './pages/Profile/Profile'; // YENİ: Profil sayfası eklendi

// Korumalı Rota Bileşeni (Giriş yapılmamışsa Login'e atar)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <Toaster position="top-right" containerStyle={{ zIndex: 99999 }} />
      <Routes>
        {/* Public Rotalar */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Korumalı Rotalar (DashboardLayout İçinde) */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          {/* Ana Sayfa */}
          <Route index element={<DashboardHome />} />

          {/* Menü Sayfaları */}
          <Route path="calendar" element={<Calendar />} />
          <Route path="workflows" element={<Workflows />} />
          <Route path="chat" element={<Chat />} />
          <Route path="customers" element={<Customers />} />

          {/* YENİ: Profil Sayfası Rotası */}
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
