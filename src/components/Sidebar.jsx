import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Logo from "../assets/Logo_sin_fondo.png";
import Home from "../assets/casa.png";
import ordenT from "../assets/planificacion.png";
import User from "../assets/user.png";
import conductores from '../assets/conductores.png';
import cliente from "../assets/cliente.png"
import compra from "../assets/piezas-de-repuesto.png";
import manoDeObra from "../assets/ingeniero.png"
import proveedores from "../assets/proveedor64.png";
import listaIcon from "../assets/lista.png";
import contactos from "../assets/agenda.png"
import vehiculos from "../assets/vehiculos.png"

// Define aquí los roles permitidos por sección
const accessControl = {
  dashboard: ['Administrador', 'Usuario', 'Contratista'],
  ordenes: ['Administrador', 'Contratista'],
  usuarios: ['Administrador'],
  repuestos: ['Administrador', 'Contratista'],
  proveedores: ['Administrador'],
  clientes:['Administrador'],
  conductores:['Administrador'],
  manoDeObra:['Administrador'],
  contactos:['Administrador'],
  vehiculos:['Administrador']
};

export default function Sidebar({ user }) {
  const [collapsed, setCollapsed] = useState(true);

  // Helper para comprobar permiso
  const canAccess = (section) => {
    return user && accessControl[section]?.includes(user.role.name);
  };

  return (
    <div className="flex">
      <div className={`bg-[#EBEBEB] text-black h-screen transition-all duration-300 ${collapsed ? 'w-20' : 'w-60'} p-3`}>

        {collapsed ? (
          <div className="flex justify-center pt-4">
            <button
              onClick={() => setCollapsed(false)}
              className="cursor-pointer border-none bg-transparent"
            >
              <img src={listaIcon} alt="Abrir menú" className="w-5" />
            </button>
          </div>
        ) : (
          <div className="absolute top-2 left-2">
            <button
              onClick={() => setCollapsed(true)}
              className="cursor-pointer border-none bg-transparent"
            >
              <span className="text-xl">✖</span>
            </button>
          </div>
        )}

        {!collapsed && (
          <div className="mb-4 mt-2 pl-6 pt-10">
            <Link to="/">
              <img src={Logo} alt="Logo" className="w-36" />
            </Link>
          </div>
        )}

        <ul className="p-0 list-none">
          {canAccess('dashboard') && (
            <li className="my-4">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `flex items-center ${collapsed ? 'justify-center px-1' : 'px-3'} py-2 rounded text-black text-sm no-underline transition duration-200 hover:bg-white hover:font-bold ${isActive ? 'bg-white font-bold' : ''}`
                }
              >
                <img src={Home} alt="Dashboard" className="w-5" />
                {!collapsed && <span className="ml-2">Dashboard</span>}
              </NavLink>
            </li>
          )}

          {canAccess('ordenes') && (
            <li className="my-4">
              <NavLink
                to="/ordenes"
                className={({ isActive }) =>
                  `flex items-center ${collapsed ? 'justify-center px-1' : 'px-3'} py-2 rounded text-black text-sm no-underline transition duration-200 hover:bg-white hover:font-bold ${isActive ? 'bg-white font-bold' : ''}`
                }
              >
                <img src={ordenT} alt="Órdenes" className="w-5" />
                {!collapsed && <span className="ml-2">Órdenes de Trabajo</span>}
              </NavLink>
            </li>
          )}

          {canAccess('usuarios') && (
            <li className="my-4">
              <NavLink
                to="/usuarios"
                className={({ isActive }) =>
                  `flex items-center ${collapsed ? 'justify-center px-1' : 'px-3'} py-2 rounded text-black text-sm no-underline transition duration-200 hover:bg-white hover:font-bold ${isActive ? 'bg-white font-bold' : ''}`
                }
              >
                <img src={User} alt="Usuarios" className="w-5" />
                {!collapsed && <span className="ml-2">Usuarios</span>}
              </NavLink>
            </li>
          )}
          {canAccess('clientes') && (
            <li className="my-4">
              <NavLink
                to="/clientes"
                className={({ isActive }) =>
                  `flex items-center ${collapsed ? 'justify-center px-1' : 'px-3'} py-2 rounded text-black text-sm no-underline transition duration-200 hover:bg-white hover:font-bold ${isActive ? 'bg-white font-bold' : ''}`
                }
              >
                <img src={cliente} alt="Cliente" className="w-5" />
                {!collapsed && <span className="ml-2">Clientes</span>}
              </NavLink>
            </li>
          )}
          {canAccess('contactos') && (
            <li className="my-4">
              <NavLink
                to="/contactos"
                className={({ isActive }) =>
                  `flex items-center ${collapsed ? 'justify-center px-1' : 'px-3'} py-2 rounded text-black text-sm no-underline transition duration-200 hover:bg-white hover:font-bold ${isActive ? 'bg-white font-bold' : ''}`
                }
              >
                <img src={contactos} alt="Contactos" className="w-5" />
                {!collapsed && <span className="ml-2">Contactos</span>}
              </NavLink>
            </li>
          )}

           {canAccess('conductores') && (
            <li className="my-4">
              <NavLink
                to="/conductores"
                className={({ isActive }) =>
                  `flex items-center ${collapsed ? 'justify-center px-1' : 'px-3'} py-2 rounded text-black text-sm no-underline transition duration-200 hover:bg-white hover:font-bold ${isActive ? 'bg-white font-bold' : ''}`
                }
              >
                <img src={conductores} alt="Conductores" className="w-5" />
                {!collapsed && <span className="ml-2">Conductores</span>}
              </NavLink>
            </li>
          )}
           {canAccess('vehiculos') && (
            <li className="my-4">
              <NavLink
                to="/vehiculos"
                className={({ isActive }) =>
                  `flex items-center ${collapsed ? 'justify-center px-1' : 'px-3'} py-2 rounded text-black text-sm no-underline transition duration-200 hover:bg-white hover:font-bold ${isActive ? 'bg-white font-bold' : ''}`
                }
              >
                <img src={vehiculos} alt="Vehículos" className="w-5" />
                {!collapsed && <span className="ml-2">Vehículos</span>}
              </NavLink>
            </li>
          )}


          {canAccess('manoDeObra') && (
            <li className="my-4">
              <NavLink
                to="/manoDeObra"
                className={({ isActive }) =>
                  `flex items-center ${collapsed ? 'justify-center px-1' : 'px-3'} py-2 rounded text-black text-sm no-underline transition duration-200 hover:bg-white hover:font-bold ${isActive ? 'bg-white font-bold' : ''}`
                }
              >
                <img src={manoDeObra} alt="Mano de obra" className="w-5" />
                {!collapsed && <span className="ml-2">Mano de obra</span>}
              </NavLink>
            </li>
          )}

          {canAccess('repuestos') && (
            <li className="my-4">
              <NavLink
                to="/repuestos"
                className={({ isActive }) =>
                  `flex items-center ${collapsed ? 'justify-center px-1' : 'px-3'} py-2 rounded text-black text-sm no-underline transition duration-200 hover:bg-white hover:font-bold ${isActive ? 'bg-white font-bold' : ''}`
                }
              >
                <img src={compra} alt="Repuestos" className="w-5" />
                {!collapsed && <span className="ml-2">Repuestos y Materiales</span>}
              </NavLink>
            </li>
          )}

          {canAccess('proveedores') && (
            <li className="my-4">
              <NavLink
                to="/proveedores"
                className={({ isActive }) =>
                  `flex items-center ${collapsed ? 'justify-center px-1' : 'px-3'} py-2 rounded text-black text-sm no-underline transition duration-200 hover:bg-white hover:font-bold ${isActive ? 'bg-white font-bold' : ''}`
                }
              >
                <img src={proveedores} alt="Proveedores" className="w-5" />
                {!collapsed && <span className="ml-2">Proveedores</span>}
              </NavLink>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};
