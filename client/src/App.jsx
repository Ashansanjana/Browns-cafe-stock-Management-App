import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GRNLog from './pages/GRNLog';
import IssueLog from './pages/IssueLog';
import AdjLog from './pages/AdjLog';
import UsageLog from './pages/UsageLog';
import MainStore from './pages/MainStore';
import Outlets from './pages/Outlets';
import OutletDetail from './pages/OutletDetail';
import WeeklyTracker from './pages/WeeklyTracker';
import SummaryReport from './pages/SummaryReport';
import ItemMaster from './pages/ItemMaster';
import { StockProvider } from './context/StockContext';

const AppLayout = ({ children }) => (
  <div className="page-layout">
    <Sidebar />
    <div className="main-content">
      <Navbar />
      {children}
    </div>
  </div>
);

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0052CC',
              border: 'none',
              color: '#FFFFFF',
              fontFamily: 'Lato, sans-serif',
              boxShadow: '0 8px 30px rgba(0, 82, 204, 0.3)',
              borderRadius: '8px',
              fontWeight: 600,
            },
          }}
        />
        <StockProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard" element={
              <PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>
            } />
            <Route path="/items" element={
              <PrivateRoute><AppLayout><ItemMaster /></AppLayout></PrivateRoute>
            } />
            <Route path="/grn-log" element={
              <PrivateRoute><AppLayout><GRNLog /></AppLayout></PrivateRoute>
            } />
            <Route path="/issue-log" element={
              <PrivateRoute><AppLayout><IssueLog /></AppLayout></PrivateRoute>
            } />
            <Route path="/usage-log" element={
              <PrivateRoute><AppLayout><UsageLog /></AppLayout></PrivateRoute>
            } />
            <Route path="/adj-log" element={
              <PrivateRoute><AppLayout><AdjLog /></AppLayout></PrivateRoute>
            } />
            <Route path="/main-store" element={
              <PrivateRoute><AppLayout><MainStore /></AppLayout></PrivateRoute>
            } />
            <Route path="/outlets" element={
              <PrivateRoute><AppLayout><Outlets /></AppLayout></PrivateRoute>
            } />
            <Route path="/outlets/:id" element={
              <PrivateRoute><AppLayout><OutletDetail /></AppLayout></PrivateRoute>
            } />
            <Route path="/weekly-tracker" element={
              <PrivateRoute><AppLayout><WeeklyTracker /></AppLayout></PrivateRoute>
            } />
            <Route path="/summary-report" element={
              <PrivateRoute><AppLayout><SummaryReport /></AppLayout></PrivateRoute>
            } />
          </Routes>
        </StockProvider>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
