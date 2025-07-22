// src/App.jsx
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
import Cliente from "./Page/Cliente/Index.jsx";
import Conductores from "./Page/Conductores/Index.jsx";
import ManoDeObra from "./Page/ManoDeObra/Index.jsx";
import Contactos from "./Page/Contactos/Index.jsx";
import Vehiculos from "./Page/Vehiculo/index.jsx";
import Insumos from "./Page/Insumos/Index.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [user, setUser] = useState(null);
  const login = (foundUser) => setUser(foundUser);

  const routeAccess = {
    dashboard: ["Administrador","Usuario","Almacenista","Auxiliar Administrativo","Coordinador de Operaciones","Cliente Externo"],
    usuarios: ["Administrador"],
    clientes: ["Administrador","Coordinador de Operaciones"],
    conductores: ["Administrador","Coordinador de Operaciones"],
    vehiculos: ["Administrador","Coordinador de Operaciones"],
    manoDeObra: ["Administrador","Coordinador de Operaciones"],
    contactos: ["Administrador","Coordinador de Operaciones"],
    ordenes: ["Administrador","Contratista","Mecánico","Colaborador","Usuario","Coordinador de Operaciones","Cliente Externo","Almacenista","Auxiliar Administrativo"],
    AgregarOrden: ["Administrador","Contratista","Mecánico","Colaborador","Coordinador de Operaciones","Cliente Externo","Almacenista","Auxiliar Administrativo"],
    repuestos: ["Administrador","Almacenista","Auxiliar Administrativo","Coordinador de Operaciones"],
    proveedores: ["Administrador","Coordinador de Operaciones"],
    insumos: ["Administrador","Coordinador de Operaciones"]
  };
  const canRoute = (section) =>
    user && routeAccess[section]?.includes(user.role.name);

  
  const getHomePath = () => {
    if (!user) return "/login";
    switch (user.role.name) {
      case "Contratista":
      case "Mecánico":
      case "Colaborador":
        return "/ordenes";
      case "Almacenista":
      case "Auxiliar Administrativo":
        return "/repuestos";
      default:
        return "/dashboard";
    }
  };

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        {/* Login */}
        <Route
          path="/login"
          element={
            !user
              ? <Login onLogin={login} />
              : <Navigate to={getHomePath()} replace />
          }
        />

        {/* Rutas protegidas */}
        <Route
          path="/"
          element={
            user
              ? <Layout user={user} onLogout={() => setUser(null)} />
              : <Navigate to="/login" replace />
          }
        >
          {/* Home (índice) */}
          <Route
            index
            element={
              <Navigate to={getHomePath()} replace />
            }
          />

          {/* Dashboard */}
          <Route
            path="dashboard"
            element={
              canRoute("dashboard")
                ? <Dashboard user={user} />
                : <Navigate to={getHomePath()} replace />
            }
          />

          {/* Usuarios */}
          <Route
            path="usuarios"
            element={
              canRoute("usuarios")
                ? <Usuarios />
                : <Navigate to={getHomePath()} replace />
            }
          />

          {/* Clientes */}
          <Route
            path="clientes"
            element={
              canRoute("clientes")
                ? <Cliente />
                : <Navigate to={getHomePath()} replace />
            }
          />

          {/* Conductores */}
          <Route
            path="conductores"
            element={
              canRoute("conductores")
                ? <Conductores />
                : <Navigate to={getHomePath()} replace />
            }
          />

          {/* Vehículos */}
          <Route
            path="vehiculos"
            element={
              canRoute("vehiculos")
                ? <Vehiculos />
                : <Navigate to={getHomePath()} replace />
            }
          />

          {/* Mano de Obra */}
          <Route
            path="manoDeObra"
            element={
              canRoute("manoDeObra")
                ? <ManoDeObra />
                : <Navigate to={getHomePath()} replace />
            }
          />

          {/* Contactos */}
          <Route
            path="contactos"
            element={
              canRoute("contactos")
                ? <Contactos />
                : <Navigate to={getHomePath()} replace />
            }
          />

          {/* Órdenes */}
          <Route
            path="ordenes"
            element={
              canRoute("ordenes")
                ? <OrdenesTrabajo user={user} />
                : <Navigate to={getHomePath()} replace />
            }
          />

          {/* Agregar / Editar Orden */}
          <Route
            path="AgregarOrden"
            element={
              canRoute("AgregarOrden")
                ? <AgregarOrden user={user} />
                : <Navigate to={getHomePath()} replace />
            }
          />
          <Route
            path="ordenes/:id/editar"
            element={
              canRoute("AgregarOrden")
                ? <AgregarOrden user={user} />
                : <Navigate to={getHomePath()} replace />
            }
          />

          {/* Repuestos */}
          <Route
            path="repuestos"
            element={
              canRoute("repuestos")
                ? <Repuestos />
                : <Navigate to={getHomePath()} replace />
            }
          />

          {/* Insumos */}
          <Route
            path="insumos"
            element={
              canRoute("insumos")
                ? <Insumos />
                : <Navigate to={getHomePath()} replace />
            }
          />

          {/* Proveedores */}
          <Route
            path="proveedores"
            element={
              canRoute("proveedores")
                ? <Proveedores />
                : <Navigate to={getHomePath()} replace />
            }
          />

          {/* Catch-all dentro del Layout */}
          <Route
            path="*"
            element={<Navigate to={getHomePath()} replace />}
          />
        </Route>

        {/* Catch-all fuera del Layout */}
        <Route
          path="*"
          element={
            user
              ? <Navigate to={getHomePath()} replace />
              : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

