import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Layout from "./components/Layout.jsx";
import Dashboard from "./Page/Dashboard/Dashboard.jsx";
import Usuarios from "./Page/Usuarios/Index.jsx";
import OrdenesTrabajo from "./Page/OrdenesTrabajo/Index.jsx";
import Repuestos from "./Page/RepuestosMateriales/Index.jsx";
import Proveedores from "./Page/Proveedores/Index.jsx";
import Login from "./Page/Login/Login.jsx";
import AgregarOrden from "./Page/OrdenesTrabajo/Agregar.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cliente from "./Page/Cliente/Index.jsx";
import Conductores from "./Page/Conductores/Index.jsx";
import ManoDeObra from "./Page/ManoDeObra/Index.jsx";
import Contactos from "./Page/Contactos/Index.jsx";
import Vehiculos from "./Page/Vehiculo/index.jsx";

function App() {

  const [user, setUser] = useState(null);

  const login = (foundUser) => {
    setUser(foundUser);
  };


  const routeAccess = {
    dashboard: [
      "Administrador","Usuario", "Contratista", "Mecánico", "Colaborador", "Almacenista", "Auxiliar Administrativo", "Coordinador de Operaciones", "Cliente Externo"
    ],
    usuarios: ["Administrador"],
    clientes: ["Administrador", "Coordinador de Operaciones"],
    conductores: ["Administrador", "Coordinador de Operaciones"],
    vehiculos: ["Administrador", "Coordinador de Operaciones"],
    manoDeObra: ["Administrador", "Coordinador de Operaciones","Contratista", "Mecánico", "Colaborador"],
    contactos: ["Administrador", 'Coordinador de Operaciones'],
    ordenes: [
      "Administrador", "Contratista", "Mecánico", "Colaborador", "Usuario", "Coordinador de Operaciones", "Cliente Externo", "Almacenista", "Auxiliar Administrativo"
    ],
    AgregarOrden: [
      "Administrador", "Contratista", "Mecánico", "Colaborador","Coordinador de Operaciones", "Cliente Externo", "Almacenista", "Auxiliar Administrativo"
    ],
    repuestos: ["Administrador", "Almacenista", "Auxiliar Administrativo", "Coordinador de Operaciones"],
    proveedores: ["Administrador", "Coordinador de Operaciones"]
  };

  const canRoute = (section) =>
    user && routeAccess[section]?.includes(user.role.name);

  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        draggable
      />

      <Routes>
        <Route
          path="/login"
          element={
            !user
              ? <Login onLogin={login} />
              : <Navigate to="/dashboard" replace />
          }
        />

        {/* Rutas protegidas bajo Layout */}
        <Route
          path="/"
          element={
            user
              ? <Layout user={user} onLogout={() => setUser(null)} />
              : <Navigate to="/login" replace />
          }
        >
          <Route index element={<Dashboard />} />
          <Route
            path="dashboard"
            element={
              canRoute("dashboard")
                ? <Dashboard user={user} />
                : <Navigate to="/login" replace />
            }
          />
          <Route
            path="usuarios"
            element={
              canRoute("usuarios")
                ? <Usuarios />
                : <Navigate to="/dashboard" replace />
            }
          />
          <Route
            path="clientes"
            element={
              canRoute("clientes")
                ? <Cliente />
                : <Navigate to="/dashboard" replace />
            }
          />
          <Route
            path="conductores"
            element={
              canRoute("conductores")
                ? <Conductores />
                : <Navigate to="/dashboard" replace />
            }
          />
          <Route
            path="vehiculos"
            element={
              canRoute("vehiculos")
                ? <Vehiculos />
                : <Navigate to="/dashboard" replace />
            }
          />
          <Route
            path="manoDeObra"
            element={
              canRoute("manoDeObra")
                ? <ManoDeObra />
                : <Navigate to="/dashboard" replace />
            }
          />
          <Route
            path="contactos"
            element={
              canRoute("contactos")
                ? <Contactos />
                : <Navigate to="/dashboard" replace />
            }
          />
          <Route
            path="ordenes"
            element={
              canRoute("ordenes")
                ? <OrdenesTrabajo user={user} />
                : <Navigate to="/dashboard" replace />
            }
          />
          <Route
            path="AgregarOrden"
            element={
              canRoute("AgregarOrden")
                ? <AgregarOrden user={user} />
                : <Navigate to="/dashboard" replace />
            }
          />
          <Route
            path="/ordenes/:id/editar"
            element={
              canRoute("AgregarOrden")
                ? <AgregarOrden user={user} />
                : <Navigate to="/dashboard" replace />
            }
          />
          <Route
            path="repuestos"
            element={
              canRoute("repuestos")
                ? <Repuestos />
                : <Navigate to="/dashboard" replace />
            }
          />
          <Route
            path="proveedores"
            element={
              canRoute("proveedores")
                ? <Proveedores />
                : <Navigate to="/dashboard" replace />
            }
          />
        </Route>

        <Route
          path="*"
          element={
            user
              ? <Navigate to="/dashboard" replace />
              : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
