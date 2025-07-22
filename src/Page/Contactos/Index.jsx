import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Contactos = () => {
  const API_URL = 'https://api.trailers.trailersdelcaribe.net/api/contacts';
  const API_URL_CLIENT = 'https://api.trailers.trailersdelcaribe.net/api/client';

  const ContactoVacio = {
    name: '',
    email: '',
    phoneNumber: '',
    isPrincipalContact: false,
    client: '',
  };


  const [contactos, setContactos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [nuevoContacto, setNuevoContacto] = useState(ContactoVacio);

  const [busqueda, setBusqueda] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [modo, setModo] = useState('agregar');
  const [mostrarModal, setMostrarModal] = useState(false);

  
  useEffect(() => {
    axios.get(API_URL_CLIENT, { params: { limit: 1000, offset: 0, showActiveOnly: true } })
      .then(res => {
        const arr = Array.isArray(res.data.data) ? res.data.data : res.data;
        setClientes(arr);
      })
      .catch(() => toast.error("Error al cargar clientes"));
  }, []);

  
  useEffect(() => {
    cargarContactos();
  }, [busqueda, showActiveOnly, currentPage]);

  const cargarContactos = async () => {
    setLoading(true);
    try {
      const params = {
        search: busqueda.trim() || undefined,
        showActiveOnly,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      };
      const res = await axios.get(API_URL, { params });
      const { data, total } = res.data;
      setContactos(data);
      setTotalPages(Math.ceil(total / itemsPerPage));
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar contactos');
    } finally {
      setLoading(false);
    }
  };

  const handleActivar = async (id) => {
    try {
      await axios.patch(`${API_URL}/${id}`, { active: true });
      toast.success('Contacto reactivado');
      cargarContactos();
    } catch (err) {
      console.error(err);
      toast.error('No se pudo reactivar el contacto');
    }
  };


  const PHONE_MAX = 10;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;


    if (name === 'phoneNumber') {
      const sanitized = value.replace(/\D/g, '').slice(0, PHONE_MAX);
      setNuevoContacto((prev) => ({ ...prev, phoneNumber: sanitized }));
      return;
    }

    setNuevoContacto((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAbrirAgregar = () => {
    setModo('agregar');
    setNuevoContacto(ContactoVacio);
    setMostrarModal(true);
  };
  const cerrarModal = () => {
    setModo('agregar');
    setMostrarModal(false);
  };

  const handleGuardar = async () => {

    if (!EMAIL_REGEX.test(nuevoContacto.email)) {
      toast.error('Ingrese un correo electrónico válido (ejemplo@dominio.com)');
      return;
    }
    if (nuevoContacto.phoneNumber.length !== PHONE_MAX) {
      toast.error('El número de teléfono debe tener 10 dígitos');
      return;
    }
    try {
      const payload = {
        name: nuevoContacto.name,
        email: nuevoContacto.email,
        phoneNumber: nuevoContacto.phoneNumber,
        isPrincipalContact: nuevoContacto.isPrincipalContact,
      };
      if (nuevoContacto.client) payload.client = nuevoContacto.client;

      if (modo === 'editar') {
        if (!nuevoContacto.idContact) throw new Error('ID no encontrado');
        await axios.patch(`${API_URL}/${nuevoContacto.idContact}`, payload);
        toast.success('Contacto actualizado');
      } else {
        await axios.post(API_URL, payload);
        toast.success('Contacto creado');
      }
      cerrarModal();
      cargarContactos();
    } catch (err) {
      const mensaje = err.response?.data?.message || err.message || 'Error al guardar';
      toast.error(mensaje);
    }
  };

  const handleEditar = contacto => {
    setNuevoContacto({
      idContact: contacto.idContact,
      name: contacto.name || '',
      email: contacto.email || '',
      phoneNumber: contacto.phoneNumber || '',
      isPrincipalContact: contacto.isPrincipalContact || false,
      client: contacto.client?.idClient || '',
    });
    setModo('editar');
    setMostrarModal(true);
  };

  const handleEliminar = async (id) => {
  if (!window.confirm('¿Seguro que quieres desactivar este contacto?')) return;
  try {
    await axios.patch(`${API_URL}/${id}`, { active: false });  
    toast.success('Contacto desactivado');
    cargarContactos();
  } catch (err) {
    const msg = err.response?.data?.message || 'Error al desactivar';
    toast.error(msg);
  }
};

  const handleBusquedaChange = e => {
    setBusqueda(e.target.value);
    setCurrentPage(1);
  };
  const handleToggleActivos = () => {
    setShowActiveOnly(v => !v);
    setCurrentPage(1);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-700 mb-6">Contactos</h1>

      <div className="flex justify-between items-center mb-6 space-x-4">

        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar"
            className=" bg-white border border-gray-200 w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Activos</span>
          <button
            onClick={handleToggleActivos}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300
              ${showActiveOnly ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute left-0 top-0 w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-300
              ${showActiveOnly ? 'translate-x-6' : 'translate-x-0'}`} />
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
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Listado de Contactos</h2>

        {loading ? (
          <div className="flex justify-center py-16">
            <svg className="animate-spin h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="py-2 text-sm font-medium text-gray-600">Nombre</th>
                  <th className="py-2 text-sm font-medium text-gray-600">Correo</th>
                  <th className="py-2 text-sm font-medium text-gray-600">Número Teléfono</th>
                  <th className="py-2 text-sm font-medium text-gray-600">Cliente</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {contactos.length > 0 ? (
                  contactos.map(contacto => {
                    const esContactoActivo = contacto.active === true;

                    return (
                      <tr key={contacto.idContact} className="border-t border-gray-100">
                        <td className="py-3 text-sm">{contacto.name}</td>
                        <td className="py-3 text-sm">{contacto.email}</td>
                        <td className="py-3 text-sm">{contacto.phoneNumber}</td>
                        <td className="py-3 text-sm">{contacto.client?.name || 'Sin cliente'}</td>
                        <td className="py-3 flex gap-2 justify-end">
                          {esContactoActivo ? (
                            
                            <>
                              {/* Editar */}
                              <button
                                onClick={() => handleEditar(contacto)}
                                className="p-1 rounded-full bg-white shadow-md hover:shadow-xl transform hover:-translate-y-0.5
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300"
                                title="Editar contacto"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700" fill="none"
                                  viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                   m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                </svg>
                              </button>

                              {/* Eliminar*/}
                              <button
                                onClick={() => handleEliminar(contacto.idContact)}
                                className="p-1 rounded-full bg-white shadow-md hover:shadow-xl transform hover:-translate-y-0.5
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-300"
                                title="Eliminar contacto"
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
                            
                            <button
                              onClick={() => handleActivar(contacto.idContact)}
                              className="p-1 rounded-full bg-green-600 hover:bg-green-700 text-white
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-300"
                              title="Activar contacto"
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
                    <td colSpan="5" className="text-center p-2 text-gray-400">
                      No hay coincidencias
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
          </>
        )}
      </div>

      {/* Modal */}
      {mostrarModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[700px] max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {modo === 'agregar' ? 'Agregar Contacto' : 'Editar Contacto'}
              </h2>
              <button onClick={cerrarModal} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">
                &times;
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleGuardar(); }}>
              <div className="flex gap-x-4 mb-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    value={nuevoContacto.name}
                    onChange={handleChange}
                    name="name"
                    required
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
                  <input
                    value={nuevoContacto.email}
                    onChange={handleChange}
                    name="email"
                    type="email"
                    required
                    pattern="^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$"
                    title="Ejemplo: usuario@dominio.com"
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-x-4 mb-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de Teléfono *</label>
                  <input
                    value={nuevoContacto.phoneNumber}
                    onChange={handleChange}
                    name="phoneNumber"
                    required
                    type="tel"
                    maxLength={PHONE_MAX}
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
                <div className="w-1/2 flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    name="isPrincipalContact"
                    checked={nuevoContacto.isPrincipalContact}
                    onChange={handleChange}
                    className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label className="text-sm font-medium text-gray-700">¿Es contacto principal?</label>
                </div>
              </div>

              <div className="w-full mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                <select
                  name="client"
                  value={nuevoContacto.client || ''}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-md p-2"
                >
                  <option value="">Selecciona un cliente</option>
                  {clientes.map(c => (
                    <option key={c.idClient} value={c.idClient}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={cerrarModal} className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400">
                  Cerrar
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
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

export default Contactos;