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

  
  const hasRole = (...allowed) =>
    user && allowed.includes(user.role.name);

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
          <Route path="dashboard" element={<Dashboard />} />

          {/* Usuarios: solo Administrador */}
          <Route
            path="usuarios"
            element={
              hasRole("Administrador")
                ? <Usuarios />
                : <Navigate to="/dashboard" replace />
            }
          />
          <Route
            path="clientes"
            element={
              hasRole("Administrador")
                ? <Cliente />
                : <Navigate to="/dashboard" replace />
            }
          />
           <Route
            path="conductores"
            element={
              hasRole("Administrador")
                ? <Conductores />
                : <Navigate to="/dashboard" replace />
            }
          />
           <Route
            path="vehiculos"
            element={
              hasRole("Administrador")
                ? <Vehiculos />
                : <Navigate to="/dashboard" replace />
            }
          />
           <Route
            path="manoDeObra"
            element={
              hasRole("Administrador")
                ? <ManoDeObra />
                : <Navigate to="/dashboard" replace />
            }
          />
           <Route
            path="contactos"
            element={
              hasRole("Administrador")
                ? <Contactos />
                : <Navigate to="/dashboard" replace />
            }
          />


          {/* Órdenes: Contratista y Administrador */}
          <Route
            path="ordenes"
            element={
              hasRole("Contratista", "Administrador")
                ? <OrdenesTrabajo />
                : <Navigate to="/dashboard" replace />
            }
          />
          <Route
            path="AgregarOrden"
            element={
              hasRole("Contratista", "Administrador")
                ? <AgregarOrden />
                : <Navigate to="/dashboard" replace />
            }
          />
          <Route path="/ordenes/:id/editar" 
          element={hasRole("Contratista", "Administrador")
                ? <AgregarOrden />
                : <Navigate to="/dashboard" replace />} />

          {/* Repuestos: Contratista y Administrador */}
          <Route
            path="repuestos"
            element={
              hasRole("Contratista", "Administrador")
                ? <Repuestos />
                : <Navigate to="/dashboard" replace />
            }
          />

          {/* Proveedores: solo Administrador */}
          <Route
            path="proveedores"
            element={
              hasRole("Administrador")
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
