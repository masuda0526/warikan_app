import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import CreateGroup from './pages/CreateGroup';
import RegistPayment from './pages/RegistPayment';
import Result from './pages/Result';
import './App.css';

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/create" replace /> },
  { path: '/create', element: <CreateGroup /> },
  { path: '/regist-payment/:id', element: <RegistPayment /> },
  { path: '/result/:id', element: <Result /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
