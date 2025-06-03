import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const Conductores = () => {

  const API_URL = 'https://api.trailers.trailersdelcaribe.net/api/driver';
  const [documentTypes, setDocumentTypes] = useState([]);
  const [conductores, setConductores] = useState([]);
  const conductoresVacio = {
    nombre: '',
    apellido: '',
    tipo: '',
    telefono: '',
    document: {
      number: '',
      documentType: ''
    }
  };

  const [modo, setModo] = useState('agregar');
  const [mostrarModal, setMostrarModal] = useState(false);
  const cerrarModal = () => {
    setModo('agregar');
    setMostrarModal(false);
  };
  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case 'Activo':
        return 'bg-green-400';
      case 'De Vacaciones':
        return 'bg-yellow-400';
      case 'Inactivo':
        return 'bg-red-400';
      default:
        return 'bg-gray-300';
    }
  };

  const [nuevoConductores, setNuevoConductores] = useState({
     nombre: '',
    apellido: '',
    tipo: '',
    telefono: '',
    document: {
      number: '',
      documentType: ''
    }
  });


  const [busqueda, setBusqueda] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;


  // Reset de página al cambiar búsqueda
  useEffect(() => { setCurrentPage(1); }, [busqueda]);

  const filtrados = conductores.filter(u =>
    u.firstName?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.lastName?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.document?.documentNumber?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.phone?.toLowerCase().includes(busqueda.toLowerCase()) 
  );

  // Paginación sobre el array filtrado
  const totalPages = Math.ceil(filtrados.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filtrados.slice(indexOfFirst, indexOfLast);


  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'documentType' || name === 'number') {
      setNuevoConductores(prev => ({
        ...prev,
        document: { ...prev.document, [name]: value }
      }));

    } else {
      setNuevoConductores(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleGuardar = async () => {
    try {
      const payload = {
        firstName: nuevoConductores.nombre,
        lastName: nuevoConductores.apellido,
        phoneNumber: nuevoConductores.telefono,
        documentType: nuevoConductores.document.documentType,
        documentNumber: nuevoConductores.document.number,
        active: true // Add the required active field
      };

      if (modo === 'editar') {
         payload.active = true; 
        await axios.patch(`${API_URL}/${nuevoConductores.idDriver}`, payload);
        toast.success('Usuario editado correctamente');
      } else {
        await axios.post(API_URL, payload);
        toast.success('Usuario creado correctamente');
      }

      await fetchconductores();
      setNuevoConductores(conductoresVacio);
      setModo('agregar');
      setMostrarModal(false);

    } catch (error) {
      const data = error.response?.data;
      const msg = data?.message
        ? Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message
        : 'Error inesperado al guardar';
      toast.error(`No se pudo guardar: ${msg}`);
      console.error('Error guardando usuario:', error);
    }
  };




  const handleEditar = (c) => {
    setNuevoConductores({
      idDriver: c.idDriver,
      nombre: c.firstName,
      apellido: c.lastName,  
      telefono: c.phoneNumber,
      document: {
        number: c.document?.documentNumber || '',
        documentType: c.document?.documentType?.idDocumentType || '',
      },
      
    });
    setModo('editar');
    setMostrarModal(true);
  };
  const handleAbrirAgregar = () => {
    setModo('agregar');
    setNuevoConductores(conductoresVacio);
    setMostrarModal(true);
  };



  const handleEliminar = async (id) => {

    const confirmar = window.confirm('¿Seguro que quieres eliminar este usuario?');
    if (!confirmar) {
      return;
    }

    try {

      await axios.delete(`${API_URL}/${id}`);

      await fetchconductores()

      toast.success('Conductores eliminado correctamente');
    } catch (error) {

      const msg = error.response?.data?.message
        ? Array.isArray(error.response.data.message)
          ? error.response.data.message.join(', ')
          : error.response.data.message
        : 'Error al eliminar conductor';
      toast.error(msg);
      console.error('Error al eliminar conductor:', error);
    }
  };

  const fetchconductores = async () => {
    try {
      const res = await axios.get(API_URL);
      


      const clienteArray = Array.isArray(res.data) ? res.data : res.data.data;

      setConductores(clienteArray);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
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

  


  useEffect(() => {
    fetchTiposDocumento();
    fetchconductores();
  }, []);



  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-700 mb-6">Conductores</h1>

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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
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
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Listado de Conductores</h2>

        <table className="w-full">
          <thead>
            <tr className="text-left">
              <th className="py-2 text-sm font-medium text-gray-600">Tipo</th>
              <th className="py-2 text-sm font-medium text-gray-600">Identificación</th>
              <th className="py-2 text-sm font-medium text-gray-600">Nombres</th>
              <th className="py-2 text-sm font-medium text-gray-600">Apellidos</th>
              <th className="py-2 text-sm font-medium text-gray-600">Teléfono</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((con) => (
                <tr key={con.idDriver} className="border-t border-gray-100">
                  <td className="py-3 text-sm">
                    {con.document?.documentType?.abbreviation || '—'}
                  </td>
                  <td className="py-3 text-sm">
                    {con.document?.documentNumber || '—'}
                  </td>
                  <td className="py-3 text-sm">
                    {con.firstName || '—'}
                  </td>
                  <td className="py-3 text-sm">
                    {con.lastName || '—'}
                  </td>
                  <td className="py-3 text-sm">
                    {con.phoneNumber || '—'}
                  </td>
                 
                  <td className="py-3 flex gap-2 justify-end">
                    <button onClick={() => handleEditar(con)} className="p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => handleEliminar(con.idDriver)} className="p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center p-2 text-gray-400">No hay coincidencias</td>
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
          <div className="bg-white p-6 rounded-lg shadow-lg w-[700px] max-h-[90vh] ">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{modo === 'agregar' ? 'Agregar Conductores' : 'Editar Conductores'}</h2>
              <button onClick={cerrarModal} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">
                &times;
              </button>
            </div>

            <form>
              <div className="flex gap-x-4 mb-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombres *</label>
                  <input
                    value={nuevoConductores.nombre}
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
                    value={nuevoConductores.apellido}
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
                    value={nuevoConductores.document.documentType}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-md p-2"
                  >
                    <option value="">Selecciona un tipo</option>
                    {documentTypes.map((tipo) => (
                      <option key={tipo.idDocumentType} value={tipo.idDocumentType}>
                        {tipo.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-2/3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de identificación *</label>
                  <input

                    value={nuevoConductores.document.number}
                    onChange={handleChange}
                    name="number"
                    required
                    type="text"
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

             
              <div className="w-full mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Teléfono *</label>
                <input
                  value={nuevoConductores.telefono}
                  onChange={handleChange}
                  name="telefono"
                  required
                  type="tel"
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
             

              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={cerrarModal} className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400">
                  Cerrar
                </button>
                <button type="button" onClick={handleGuardar} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
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

export default Conductores;