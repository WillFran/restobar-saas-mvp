import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import WaiterPage from '../pages/WaiterPage'
import KitchenPage from '../pages/KitchenPage'
import CashierPage from '../pages/CashierPage'
import AdminDashboardPage from '../pages/AdminDashboardPage'
import LoginPage from '../pages/LoginPage'
import AdminProductsPage from '../pages/admin/AdminProductsPage'
import AdminTablesPage from '../pages/admin/AdminTablesPage'

import ProtectedRoute from './ProtectedRoute'
import RoleGuard from './RoleGuard'

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/waiter"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['waiter']}>
                <WaiterPage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/kitchen"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['kitchen']}>
                <KitchenPage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/cashier"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['cashier']}>
                <CashierPage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['admin']}>
                <AdminDashboardPage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/products"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['admin']}>
                <AdminProductsPage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-5xl font-bold mb-4">404</h1>
                <p className="text-zinc-400">Página no encontrada</p>
              </div>
            </div>
          }
        />
        <Route
          path="/admin/tables"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['admin']}>
                <AdminTablesPage />
              </RoleGuard>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}