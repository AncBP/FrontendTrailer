import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Logo from "../assets/Logo sin fondo.png";
import Home from "../assets/casa.png";
import ordenT from "../assets/planificacion.png";
import User from "../assets/user.png";
import conductores from '../assets/conductores.png';
import cliente from "../assets/cliente.png"
import compra from "../assets/piezas-de-repuesto.png";
import manoDeObra from "../assets/ingeniero.png"
import proveedores from "../assets/proveedor64.png";
import listaIcon from "../assets/lista.png";
import contactos from "../assets/agenda.png";
import vehiculos from "../assets/vehiculos.png";
import suministros from '../assets/suministro.png';


const accessControl = {
  dashboard: [
    'Administrador',
    'Usuario',
    'Almacenista',
    'Auxiliar Administrativo',
    'Coordinador de Operaciones',
    'Cliente Externo'
  ],
  ordenes: [
    'Administrador',
    'Contratista',
    'Mecánico',
    'Colaborador',
    'Usuario',
    'Coordinador de Operaciones',
    'Cliente Externo',
    'Almacenista',
    'Auxiliar Administrativo'
  ],
  usuarios: [
    'Administrador'
  ],
  repuestos: [
    'Administrador',
    'Almacenista',
    'Auxiliar Administrativo',
    'Coordinador de Operaciones'
  ],
  proveedores: [
    'Administrador',
    'Coordinador de Operaciones'
  ],
  clientes: [
    'Administrador',
    'Coordinador de Operaciones'
  ],
  conductores: [
    'Administrador',
    'Coordinador de Operaciones'
  ],
  manoDeObra: [
    'Administrador',
    'Coordinador de Operaciones'
    
  ],
  contactos: [
    'Administrador',
    'Coordinador de Operaciones'
  ],
  vehiculos: [
    'Administrador',
    'Coordinador de Operaciones'
  ],
  Insumos: [
    'Administrador',
    'Coordinador de Operaciones'
  ]
};


export default function Sidebar({ user }) {
  const [collapsed, setCollapsed] = useState(true);

 
  const canAccess = (section) => {
    return user && accessControl[section]?.includes(user.role.name);
  };

  return (
    <div className="flex">
      <div className={`bg-[#EBEBEB] text-black h-screen overflow-y-auto transition-all duration-300 ${collapsed ? 'w-20' : 'w-60'} relative`}>
        
        
        <div className="sticky top-0 bg-[#EBEBEB] z-10 p-3">
          {collapsed ? (
            <div className="flex justify-center">
              <button
                onClick={() => setCollapsed(false)}
                className="cursor-pointer border-none bg-transparent"
              >
                <img src={listaIcon} alt="Abrir menú" className="w-5" />
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCollapsed(true)}
                className="cursor-pointer border-none bg-transparent"
              >
                <span className="text-xl">✖</span>
              </button>
            </div>
          )}

          {!collapsed && (
            <div className="mb-4 mt-2 flex justify-center">
              <Link to="/">
                <img src={Logo} alt="Logo" className="w-36" />
              </Link>
            </div>
          )}
        </div>

        
        <div className="px-3 pb-4">
          <ul className="list-none space-y-2">
            {canAccess('dashboard') && (
              <li>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `flex items-center ${collapsed ? 'justify-center px-1' : 'px-3'} py-2 rounded text-black text-sm no-underline transition duration-200 hover:bg-white hover:font-bold ${isActive ? 'bg-white font-bold' : ''}`
                  }
                >
                  <img src={Home} alt="Dashboard" className="w-5 flex-shrink-0" />
                  {!collapsed && <span className="ml-2">Dashboard</span>}
                </NavLink>
              </li>
            )}

            {canAccess('ordenes') && (
              <li>
                <NavLink
                  to="/ordenes"
                  className={({ isActive }) =>
                    `flex items-center ${collapsed ? 'justify-center px-1' : 'px-3'} py-2 rounded text-black text-sm no-underline transition duration-200 hover:bg-white hover:font-bold ${isActive ? 'bg-white font-bold' : ''}`
                  }
                >
                  <img src={ordenT} alt="Órdenes" className="w-5 flex-shrink-0" />
                  {!collapsed && <span className="ml-2">Órdenes de Trabajo</span>}
                </NavLink>
              </li>
            )}

            {canAccess('usuarios') && (
              <li>
                <NavLink
                  to="/usuarios"
                  className={({ isActive }) =>
                    `flex items-center ${collapsed ? 'justify-center px-1' : 'px-3'} py-2 rounded text-black text-sm no-underline transition duration-200 hover:bg-white hover:font-bold ${isActive ? 'bg-white font-bold' : ''}`
                  }
                >
                  <img src={User} alt="Usuarios" className="w-5 flex-shrink-0" />
                  {!collapsed && <span className="ml-2">Usuarios</span>}
                </NavLink>
              </li>
            )}

            {canAccess('clientes') && (
              <li>
                <NavLink
                  to="/clientes"
                  className={({ isActive }) =>
                    `flex items-center ${collapsed ? 'justify-center px-1' : 'px-3'} py-2 rounded text-black text-sm no-underline transition duration-200 hover:bg-white hover:font-bold ${isActive ? 'bg-white font-bold' : ''}`
                  }
                >
                  <img src={cliente} alt="Cliente" className="w-5 flex-shrink-0" />
                  {!collapsed && <span className="ml-2">Clientes</span>}
                </NavLink>
              </li>
            )}

            {canAccess('contactos') && (
              <li>
                <NavLink
                  to="/contactos"
                  className={({ isActive }) =>
                    `flex items-center ${collapsed ? 'justify-center px-1' : 'px-3'} py-2 rounded text-black text-sm no-underline transition duration-200 hover:bg-white hover:font-bold ${isActive ? 'bg-white font-bold' : ''}`
                  }
                >
                  <img src={contactos} alt="Contactos" className="w-5 flex-shrink-0" />
                  {!collapsed && <span className="ml-2">Contactos</span>}
                </NavLink>
              </li>
            )}

            {canAccess('conductores') && (
              <li>
                <NavLink
                  to="/conductores"
                  className={({ isActive }) =>
                    `flex items-center ${collapsed ? 'justify-center px-1' : 'px-3'} py-2 rounded text-black text-sm no-underline transition duration-200 hover:bg-white hover:font-bold ${isActive ? 'bg-white font-bold' : ''}`
                  }
                >
                  <img src={conductores} alt="Conductores" className="w-5 flex-shrink-0" />
                  {!collapsed && <span className="ml-2">Conductores</span>}
                </NavLink>
              </li>
            )}

            {canAccess('vehiculos') && (
              <li>
                <NavLink
                  to="/vehiculos"
                  className={({ isActive }) =>
                    `flex items-center ${collapsed ? 'justify-center px-1' : 'px-3'} py-2 rounded text-black text-sm no-underline transition duration-200 hover:bg-white hover:font-bold ${isActive ? 'bg-white font-bold' : ''}`
                  }
                >
                  <img src={vehiculos} alt="Vehículos" className="w-5 flex-shrink-0" />
                  {!collapsed && <span className="ml-2">Vehículos</span>}
                </NavLink>
              </li>
            )}

            {canAccess('manoDeObra') && (
              <li>
                <NavLink
                  to="/manoDeObra"
                  className={({ isActive }) =>
                    `flex items-center ${collapsed ? 'justify-center px-1' : 'px-3'} py-2 rounded text-black text-sm no-underline transition duration-200 hover:bg-white hover:font-bold ${isActive ? 'bg-white font-bold' : ''}`
                  }
                >
                  <img src={manoDeObra} alt="Mano de obra" className="w-5 flex-shrink-0" />
                  {!collapsed && <span className="ml-2">Mano de obra</span>}
                </NavLink>
              </li>
            )}

            {canAccess('repuestos') && (
              <li>
                <NavLink
                  to="/repuestos"
                  className={({ isActive }) =>
                    `flex items-center ${collapsed ? 'justify-center px-1' : 'px-3'} py-2 rounded text-black text-sm no-underline transition duration-200 hover:bg-white hover:font-bold ${isActive ? 'bg-white font-bold' : ''}`
                  }
                >
                  <img src={compra} alt="Repuestos" className="w-5 flex-shrink-0" />
                  {!collapsed && <span className="ml-2">Repuestos</span>}
                </NavLink>
              </li>
            )}
            {canAccess('Insumos') && (
              <li>
                <NavLink
                  to="/insumos"
                  className={({ isActive }) =>
                    `flex items-center ${collapsed ? 'justify-center px-1' : 'px-3'} py-2 rounded text-black text-sm no-underline transition duration-200 hover:bg-white hover:font-bold ${isActive ? 'bg-white font-bold' : ''}`
                  }
                >
                  <img src={suministros} alt="Repuestos" className="w-5 flex-shrink-0" />
                  {!collapsed && <span className="ml-2">Insumos</span>}
                </NavLink>
              </li>
            )}

            {canAccess('proveedores') && (
              <li>
                <NavLink
                  to="/proveedores"
                  className={({ isActive }) =>
                    `flex items-center ${collapsed ? 'justify-center px-1' : 'px-3'} py-2 rounded text-black text-sm no-underline transition duration-200 hover:bg-white hover:font-bold ${isActive ? 'bg-white font-bold' : ''}`
                  }
                >
                  <img src={proveedores} alt="Proveedores" className="w-5 flex-shrink-0" />
                  {!collapsed && <span className="ml-2">Proveedores</span>}
                </NavLink>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
