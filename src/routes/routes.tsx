import { lazy } from 'react';

export const Auth = lazy(() => import('@/pages/Auth'));
export const CustomerPortal = lazy(() => import('@/pages/CustomerPortal'));
export const Dashboard = lazy(() => import('@/pages/Dashboard'));
export const Vehicles = lazy(() => import('@/pages/Vehicles'));
export const VehicleDetails = lazy(() => import('@/pages/VehicleDetails'));
export const Customers = lazy(() => import('@/pages/Customers'));
export const CustomerProfile = lazy(() => import('@/pages/CustomerProfile'));
export const Agreements = lazy(() => import('@/pages/Agreements'));
export const RemainingAmount = lazy(() => import('@/pages/RemainingAmount'));
export const Settings = lazy(() => import('@/pages/Settings'));
export const Maintenance = lazy(() => import('@/pages/Maintenance'));
export const ChauffeurService = lazy(() => import('@/pages/ChauffeurService'));
export const TrafficFines = lazy(() => import('@/pages/TrafficFines'));
export const Reports = lazy(() => import('@/pages/Reports'));
export const Finance = lazy(() => import('@/pages/Finance'));
export const Help = lazy(() => import('@/pages/Help'));
export const Legal = lazy(() => import('@/pages/Legal'));
export const Audit = lazy(() => import('@/pages/Audit'));

// Export routes configuration
export const routes = [
  {
    path: "/vehicles",
    element: <Vehicles />
  },
  {
    path: "/vehicles/:id",
    element: <VehicleDetails />
  },
  {
    path: "/m/vehicles/:id",
    element: <VehicleDetails />
  },
  {
    path: "*",
    element: <Navigate to="/vehicles" />
  }
];