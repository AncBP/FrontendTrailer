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

  // States
  const [contactos, setContactos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [nuevoContacto, setNuevoContacto] = useState(ContactoVacio);
  const [busqueda, setBusqueda] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const [modo, setModo] = useState('agregar');
  const [mostrarModal, setMostrarModal] = useState(false);

  const cargarContactos = async () => {
    try {
      const res = await axios.get(API_URL);
      const ContactoArray = Array.isArray(res.data) ? res.data : res.data.data;
      const activos = ContactoArray.filter(c => c.active);
      setContactos(activos);
    } catch (error) {
      toast.error('Error al cargar contactos');
      setContactos([]);
    }
  };

  const cargarClientes = async () => {
    try {
      const res = await axios.get(API_URL_CLIENT);
      setClientes(Array.isArray(res.data) ? res.data : res.data.data);
    } catch (e) {
      toast.error("Error al cargar clientes");
    }
  };

  useEffect(() => {
    cargarContactos();
    cargarClientes();
  }, []);

  useEffect(() => { setCurrentPage(1); }, [busqueda]);

  const filtrados = contactos.filter(d =>
    (d.name || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (d.email || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (d.phoneNumber || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (d.document?.documentNumber || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPages = Math.ceil(filtrados.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filtrados.slice(indexOfFirst, indexOfLast);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setNuevoContacto(prev => ({
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
    try {
      // Preparar payload según el modo
      const payload = {
        name: nuevoContacto.name,
        email: nuevoContacto.email,
        phoneNumber: nuevoContacto.phoneNumber,
        isPrincipalContact: nuevoContacto.isPrincipalContact,
      };

      // Solo agregar client si tiene valor
      if (nuevoContacto.client) {
        payload.client = nuevoContacto.client;
      }


      if (modo === 'editar') {
        // Verificar que tenemos el ID
        if (!nuevoContacto.idContact) {
          toast.error('Error: ID de contacto no encontrado');
          return;
        }

        const response = await axios.patch(`${API_URL}/${nuevoContacto.idContact}`, payload);

        toast.success('Contacto actualizado');
      } else {
        const response = await axios.post(API_URL, payload);

        toast.success('Contacto creado');
      }

      await cargarContactos();
      setMostrarModal(false);
      setNuevoContacto(ContactoVacio);
    } catch (err) {


      // Mostrar error más específico
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Error al guardar';
      toast.error(`Error: ${errorMessage}`);
    }
  };

  const handleEditar = contacto => {


    setNuevoContacto({
      idContact: contacto.idContact,
      name: contacto.name || '',
      email: contacto.email || '',
      phoneNumber: contacto.phoneNumber || '',
      isPrincipalContact: contacto.isPrincipalContact || false,
      // Manejar el client de manera más robusta
      client: contacto.client?.idClient || contacto.clientId || contacto.client || '',
    });

    setModo('editar');
    setMostrarModal(true);
  };

  const handleEliminar = async id => {
    if (!window.confirm('¿Seguro que quieres eliminar este contacto?')) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      toast.success('Contacto eliminado correctamente');
      await cargarContactos();
    } catch (error) {
      console.error('Error al eliminar:', error);
      const mensaje = error.response?.data?.message || 'Error al eliminar contacto';
      toast.error(mensaje);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-700 mb-6">Contactos</h1>

      <div className="flex justify-between mb-6">
        <div className="relative w-72">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="bg-white border border-gray-200 pl-10 py-3 px-5 text-base rounded-lg focus:outline-none 
             w-full sm:w-[400px] md:w-[500px] lg:w-[600px]"
            placeholder="Buscar"
            onChange={(e) => setBusqueda(e.target.value)}
            value={busqueda}
          />
        </div>
        <button onClick={handleAbrirAgregar} className="bg-black text-white px-4 py-2 rounded-md flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Listado de Contactos</h2>

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
            {currentItems.length > 0 ? (
              currentItems.map((contacto) => (
                <tr key={contacto.idContact} className="border-t border-gray-100">
                  <td className="py-3 text-sm text-blue-800">{contacto.name}</td>
                  <td className="py-3 text-sm text-blue-600">{contacto.email}</td>
                  <td className="py-3 text-sm text-gray-600">{contacto.phoneNumber}</td>
                  <td className="py-3 text-sm text-gray-600">
                    {contacto.client?.name || 'Sin cliente'}
                  </td>
                  <td className="py-3 flex gap-2 justify-end">
                    <button onClick={() => handleEditar(contacto)} className="p-1 bg-white rounded-full
                    shadow-md hover:shadow-xl
                    transform hover:-translate-y-0.5
                    transition-all duration-150
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300
                    disabled:opacity-50 disabled:cursor-not-allowed">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => handleEliminar(contacto.idContact)} className="p-1 bg-white rounded-full
                    shadow-md hover:shadow-xl
                    transform hover:-translate-y-0.5
                    transition-all duration-150
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300
                    disabled:opacity-50 disabled:cursor-not-allowed">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>

                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center p-2 text-gray-400">
                  No hay coincidencias
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Paginación */}
        <div className="flex justify-center mt-6 gap-1">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`
                w-6 h-6 flex items-center justify-center rounded-md text-sm
                ${currentPage === i + 1 ? 'bg-gray-800 text-white' : ''}
              `}
            >
              {i + 1}
            </button>
          ))}
        </div>
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