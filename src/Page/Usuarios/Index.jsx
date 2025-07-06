import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const Usuarios = () => {
  const API_URL = 'https://api.trailers.trailersdelcaribe.net/api/user';
  const [documentTypes, setDocumentTypes] = useState([]);
  const [roles, setRoles] = useState([]);
  const [status, setStatus] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [mostrarSoloActivos, setMostrarSoloActivos] = useState(true);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const usuarioVacio = {
    nombre: '', apellido: '', tipo: '', numeroIdentificacion: '', correo: '', telefono: '', rol: '', estado: 'Activo',
    document: { number: '', documentType: '' }, password: ''
  };

  const [modo, setModo] = useState('agregar');
  const [mostrarModal, setMostrarModal] = useState(false);
  const cerrarModal = () => {
    setModo('agregar');
    setMostrarModal(false);
  };

  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case 'Activo': return 'bg-green-400';
      case 'De Vacaciones': return 'bg-yellow-400';
      case 'Inactivo': return 'bg-red-400';
      default: return 'bg-gray-300';
    }
  };

  const [nuevoUsuario, setNuevoUsuario] = useState(usuarioVacio);

  // Efecto para cargar datos cuando cambian los filtros o página
  useEffect(() => {
    fetchUsuariosPaginados();
    if (currentPage === 1) {
      fetchTiposDocumento();
      fetchRoles();
      fetchStatus();
    }
  }, [currentPage, mostrarSoloActivos, busqueda]);

  // Reset página cuando cambian los filtros
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [busqueda, mostrarSoloActivos]);

  const fetchUsuariosPaginados = async () => {
    try {

      const params = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
        search: busqueda.trim() || undefined,
        showActiveOnly: mostrarSoloActivos,
      };


      // Remover parámetros undefined
      Object.keys(params).forEach(key =>
        params[key] === undefined && delete params[key]
      );

      const res = await axios.get(API_URL, { params });
      const { data, total } = res.data;
      setUsuarios(data);
      setTotalUsuarios(total);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setUsuarios([]);
      setTotalUsuarios(0);
    }
  };

   const ALLOWED_DOC_TYPES = [
    'Cédula de Ciudadanía',
    'Cédula de Extranjería',
    'Permiso Especial de Permanencia',
    'Número de Identificación Tributaria',
  ];


  const MAX_DIGITS_BY_DOC = {
    'Cédula de Ciudadanía': 10,
    'Cédula de Extranjería': 10,
    'Permiso Especial de Permanencia': 10,
    'Número de Identificación Tributaria': 9,
  };

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

  const handleActivar = async (id) => {
  try {
    await axios.patch(`${API_URL}/${id}`, { active: true }); 
    toast.success('Usuario reactivado');
    await fetchUsuariosPaginados();
  } catch (err) {
    console.error(err);
    toast.error('No se pudo reactivar el usuario');
  }
};

const handleChange = (e) => {
  const { name, value } = e.target;

  /* Teléfono → solo 10 dígitos */
  if (name === 'telefono') {
    const sanitized = value.replace(/\D/g, '').slice(0, 10);
    setNuevoUsuario((prev) => ({ ...prev, telefono: sanitized }));
    return;
  }

  /* Nº de documento → solo dígitos (longitud según tipo) */
  if (name === 'number') {
    const selectedTypeId   = nuevoUsuario.document.documentType;
    const selectedTypeName =
      documentTypes.find((t) => t.idDocumentType === selectedTypeId)?.name || '';

    const maxLen   = MAX_DIGITS_BY_DOC[selectedTypeName] || 30;
    const sanitized = value.replace(/\D/g, '').slice(0, maxLen);

    setNuevoUsuario((prev) => ({
      ...prev,
      document: { ...prev.document, number: sanitized },
    }));
    return;
  }

  /* Cambio de tipo de documento */
  if (name === 'documentType') {
    setNuevoUsuario((prev) => ({
      ...prev,
      document: { ...prev.document, documentType: value },
    }));
  } else {
    setNuevoUsuario((prev) => ({ ...prev, [name]: value }));
  }
};

  const handleToggleActivos = () => {
    setMostrarSoloActivos(prev => !prev);
  };

  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value);
  };

  const handleGuardar = async () => {
    if (!EMAIL_REGEX.test(nuevoUsuario.correo)) {
          toast.error('Ingrese un correo electrónico válido (ejemplo@dominio.com)');
          return;
        }
    try {
      const payload = {
        firstName: nuevoUsuario.nombre,
        lastName: nuevoUsuario.apellido,
        email: nuevoUsuario.correo,
        phone: nuevoUsuario.telefono,
        role: nuevoUsuario.rol,
        userStatus: nuevoUsuario.estado,
        documentType: nuevoUsuario.document.documentType,
        documentNumber: nuevoUsuario.document.number,
      };
      if (modo === 'editar') {
        payload.password = 'tempPassword';
        await axios.patch(`${API_URL}/${nuevoUsuario.idUser}`, payload);
        toast.success('Usuario editado correctamente');
      } else {
        await axios.post(API_URL, payload);
        toast.success('Usuario creado correctamente');
      }
      await fetchUsuariosPaginados();
      setNuevoUsuario(usuarioVacio);
      setModo('agregar');
      setMostrarModal(false);
    } catch (error) {
      const data = error.response?.data;
      const msg = data?.message ? (Array.isArray(data.message) ? data.message.join(', ') : data.message) : 'Error inesperado al guardar';
      toast.error(`No se pudo guardar: ${msg}`);
      console.error('Error guardando usuario:', error);
    }
  };

  const handleEditar = (usuario) => {
    setNuevoUsuario({
      idUser: usuario.idUser,
      nombre: usuario.firstName,
      apellido: usuario.lastName,
      correo: usuario.email,
      telefono: usuario.phone,
      rol: usuario.role?.idRole || '',
      estado: usuario.userStatus?.idUserStatus || '',
      document: {
        number: usuario.document?.documentNumber || '',
        documentType: usuario.document?.documentType?.idDocumentType || '',
      },
      password: 'tempPassword'
    });
    setModo('editar');
    setMostrarModal(true);
  };

  const handleAbrirAgregar = () => {
    setModo('agregar');
    setNuevoUsuario(usuarioVacio);
    setMostrarModal(true);
  };

  const handleEliminar = async (id) => {
    const confirmar = window.confirm('¿Seguro que quieres eliminar este usuario?');
    if (!confirmar) return;

    try {
      // 1) Marca primero active: false
      const inactivo = status.find(s => s.name === 'Inactivo');
      await axios.patch(`${API_URL}/${id}`, {
        userStatus: inactivo.idUserStatus
      });

      // 2) Ahora llama al delete real
      await axios.delete(`${API_URL}/${id}`);

      await fetchUsuariosPaginados();
      toast.success('Usuario eliminado correctamente');
    } catch (error) {
      const msg = error.response?.data?.message
        ? Array.isArray(error.response.data.message)
          ? error.response.data.message.join(', ')
          : error.response.data.message
        : 'Error al eliminar usuario';
      toast.error(msg);
      console.error('Error al eliminar usuario:', error);
    }
  };



  const fetchTiposDocumento = async () => {
    try {
      const res = await axios.get('https://api.trailers.trailersdelcaribe.net/api/document-type');
      setDocumentTypes(res.data);
    } catch (error) {
      console.error('Error al cargar tipos de documento:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await axios.get('https://api.trailers.trailersdelcaribe.net/api/role');
      setRoles(res.data);
    } catch (error) {
      console.error('Error al cargar roles:', error);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await axios.get('https://api.trailers.trailersdelcaribe.net/api/user-status');
      setStatus(res.data);
    } catch (error) {
      console.error('Error al cargar estados:', error);
    }
  };

  const totalPages = Math.ceil(totalUsuarios / itemsPerPage);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-700 mb-6">Usuarios</h1>

      <div className="flex justify-between items-center mb-6 space-x-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar"
            className="bg-white border border-gray-200 w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none"
            value={busqueda}
            onChange={handleBusquedaChange}
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Activos</span>
          <button
            type="button"
            onClick={handleToggleActivos}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 
      ${mostrarSoloActivos ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span
              className={`absolute left-0 top-0 w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-300
        ${mostrarSoloActivos ? 'translate-x-6' : 'translate-x-0'}`}
            />
          </button>
        </div>


        <button
          onClick={handleAbrirAgregar}
          className="bg-black text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar
        </button>


      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Listado de Usuarios
        </h2>

        <table className="w-full">
          <thead>
            <tr className="text-left">
              <th className="py-2 text-sm font-medium text-gray-600">Tipo</th>
              <th className="py-2 text-sm font-medium text-gray-600">Identificación</th>
              <th className="py-2 text-sm font-medium text-gray-600">Nombres</th>
              <th className="py-2 text-sm font-medium text-gray-600">Apellidos</th>
              <th className="py-2 text-sm font-medium text-gray-600">Rol</th>
              <th className="py-2 text-sm font-medium text-gray-600">Correo</th>
              <th className="py-2 text-sm font-medium text-gray-600">Teléfono</th>
              <th className="py-2 text-sm font-medium text-gray-600">Estado</th>
              <th className="py-2"></th>
            </tr>
          </thead>
         <tbody>
  {usuarios.length > 0 ? (
    usuarios.map((user) => {
      const esUsuarioActivo = user.active === true;   // ← estado lógico

      return (
        <tr key={user.idUser} className="border-t border-gray-100">
          <td className="py-3 text-sm">{user.document?.documentType?.abbreviation || '—'}</td>
          <td className="py-3 text-sm">{user.document?.documentNumber      || '—'}</td>
          <td className="py-3 text-sm">{user.firstName                     || '—'}</td>
          <td className="py-3 text-sm">{user.lastName                      || '—'}</td>
          <td className="py-3 text-sm">{user.role?.name                    || '—'}</td>
          <td className="py-3 text-sm">{user.email                         || '—'}</td>
          <td className="py-3 text-sm">{user.phone                         || '—'}</td>
          <td className="py-3 text-sm">
            <span className={`${obtenerColorEstado(user.userStatus?.name)} text-white text-sm rounded-full px-4 py-1`}>
              {user.userStatus?.name || '—'}
            </span>
          </td>

          {/* --------- Acciones --------- */}
          <td className="py-3 flex gap-2 justify-end">
            {esUsuarioActivo ? (
              /* ---------- USUARIO ACTIVO: Editar + Eliminar ---------- */
              <>
                {/* Editar */}
                <button
                  onClick={() => handleEditar(user)}
                  className="p-1 rounded-full bg-white shadow-md hover:shadow-xl transform hover:-translate-y-0.5
                             focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300"
                  title="Editar usuario"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700" fill="none"
                       viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                             m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>

                {/* Eliminar (desactivar) */}
                <button
                  onClick={() => handleEliminar(user.idUser)}
                  className="p-1 rounded-full bg-white shadow-md hover:shadow-xl transform hover:-translate-y-0.5
                             focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-300"
                  title="Eliminar usuario"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700" fill="none"
                       viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862
                             a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6
                             m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3
                             M4 7h16"/>
                  </svg>
                </button>
              </>
            ) : (
              /* ---------- USUARIO INACTIVO: botón Activar ---------- */
              <button
                onClick={() => handleActivar(user.idUser)}
                className="p-1 rounded-full bg-green-600 hover:bg-green-700 text-white
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-300"
                title="Activar usuario"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
                     viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}
          </td>
        </tr>
      );
    })
  ) : (
    <tr>
      <td colSpan="9" className="text-center p-4 text-gray-400">
        {busqueda ? 'No hay coincidencias' : 'No hay usuarios registrados'}
      </td>
    </tr>
  )}
</tbody>


        </table>

        <div className="flex justify-center items-center mt-6 gap-4">
          {/* Flecha Anterior */}
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className={`p-2 rounded hover:bg-gray-200 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            ‹
          </button>

          {/* Indicador de página */}
          <span className="text-sm text-gray-700">
            Página {currentPage} de {totalPages}
          </span>

          {/* Flecha Siguiente */}
          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`p-2 rounded hover:bg-gray-200 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            ›
          </button>
        </div>
      </div>
      {/* Modal */}
      {mostrarModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[700px] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {modo === 'agregar' ? 'Agregar Usuario' : 'Editar Usuario'}
              </h2>
              <button
                onClick={cerrarModal}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleGuardar(); }}>
              <div className="flex gap-x-4 mb-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombres *</label>
                  <input
                    value={nuevoUsuario.nombre}
                    onChange={handleChange}
                    type="text"
                    name="nombre"
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label>
                  <input
                    value={nuevoUsuario.apellido}
                    onChange={handleChange}
                    type="text"
                    name="apellido"
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-x-4 mb-4">
                <div className="w-1/3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de documento *</label>
                  <select
                    name="documentType"
                    value={nuevoUsuario.document.documentType}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecciona un tipo</option>
                     {documentTypes
                      .filter((t) => ALLOWED_DOC_TYPES.includes(t.name))  
    .map((tipo) => (
                    <option key={tipo.idDocumentType} value={tipo.idDocumentType}>
                      {tipo.name === 'Número de Identificación Tributaria' ? 'NIT' : tipo.name}
                    </option>
    ))}
                  </select>
                </div>
                <div className="w-2/3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de identificación *</label>
                  <input
                    value={nuevoUsuario.document.number}
                    onChange={handleChange}
                    name="number"
                    required
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="w-full mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo *</label>
                <input
                  value={nuevoUsuario.correo}
                  onChange={handleChange}
                  name="correo"
                  required
                    pattern="^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$"
                    title="Ejemplo: usuario@dominio.com"
                  type="email"
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="w-full mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Teléfono *</label>
                <input
                  value={nuevoUsuario.telefono}
                  onChange={handleChange}
                  name="telefono"
                  required
                  type="tel"
                   maxLength={10}
                  inputMode="numeric"
                  pattern="\d{10}"
                  onKeyDown={(e) => {
                    if (
                      !/^\d$/.test(e.key) &&
                      !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)
                    ) { e.preventDefault(); }
                  }}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-x-4 mb-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                  <select
                    value={nuevoUsuario.rol}
                    onChange={handleChange}
                    name="rol"
                    required
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecciona un rol</option>
                    {roles.map((rol) => (
                      <option key={rol.idRole} value={rol.idRole}>
                        {rol.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                  <select
                    value={nuevoUsuario.estado}
                    onChange={handleChange}
                    name="estado"
                    required
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecciona un estado</option>
                    {status.map((estado) => (
                      <option key={estado.idUserStatus} value={estado.idUserStatus}>
                        {estado.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>



              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;