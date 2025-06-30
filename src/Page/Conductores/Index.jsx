import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = 'https://api.trailers.trailersdelcaribe.net/api/driver';

const Conductores = () => {
  // Estados UI
  const [conductores, setConductores] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [busqueda, setBusqueda] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;
  const [totalPages, setTotalPages] = useState(1);


  const [modo, setModo] = useState('agregar');
  const [mostrarModal, setMostrarModal] = useState(false);
  const conductorVacio = {
    nombre: '',
    apellido: '',
    telefono: '',
    document: { number: '', documentType: '' },
    active: true,
  };
  const [nuevoConductor, setNuevoConductor] = useState(conductorVacio);

  useEffect(() => {
    axios.get('https://api.trailers.trailersdelcaribe.net/api/document-type')
      .then(res => setDocumentTypes(res.data))
      .catch(err => console.error('Error cargando tipos:', err));
  }, []);


  useEffect(() => {
    fetchConductores();
  }, [busqueda, showActiveOnly, currentPage]);

  const fetchConductores = async () => {
    setLoading(true);
    try {
      const params = {
        search: busqueda.trim() || undefined,
        showActiveOnly,
        limit: ITEMS_PER_PAGE,
        offset: (currentPage - 1) * ITEMS_PER_PAGE,
      };
      const res = await axios.get(API_URL, { params });
      const { data, total } = res.data;
      setConductores(data);
      setTotalPages(Math.ceil(total / ITEMS_PER_PAGE));
    } catch (err) {
      console.error(err);
      toast.error('No se pudieron cargar los conductores');
    } finally {
      setLoading(false);
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
  const handleAbrirAgregar = () => {
    setModo('agregar');
    setNuevoConductor(conductorVacio);
    setMostrarModal(true);
  };
  const cerrarModal = () => {
    setModo('agregar');
    setMostrarModal(false);
  };


  const handleChange = e => {
    const { name, value } = e.target;
    if (name === 'number' || name === 'documentType') {
      setNuevoConductor(prev => ({
        ...prev,
        document: { ...prev.document, [name]: value }
      }));
    } else {
      setNuevoConductor(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleGuardar = async () => {
    try {

      const payload = {
        firstName: nuevoConductor.nombre,
        lastName: nuevoConductor.apellido,
        phoneNumber: nuevoConductor.telefono,
        documentType: nuevoConductor.document.documentType,
        documentNumber: nuevoConductor.document.number,
      };

      if (modo === 'editar') {

        payload.active = nuevoConductor.active;
        await axios.patch(`${API_URL}/${nuevoConductor.idDriver}`, payload);
        toast.success('Conductor actualizado');
      } else {

        await axios.post(API_URL, payload);
        toast.success('Conductor creado');
      }

      cerrarModal();
      fetchConductores();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar conductor');
    }
  };
  const handleEditar = c => {
    setModo('editar');
    setNuevoConductor({
      idDriver: c.idDriver,
      nombre: c.firstName,
      apellido: c.lastName,
      telefono: c.phoneNumber,
      document: {
        number: c.document?.documentNumber || '',
        documentType: c.document?.documentType?.idDocumentType || ''
      },
      active: c.active,
    });
    setMostrarModal(true);
  };


  const handleEliminar = async id => {
    if (!window.confirm('¿Seguro que quieres eliminar este conductor?')) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      toast.success('Conductor eliminado');
      fetchConductores();
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar conductor');
    }
  };
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
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Listado de Conductores</h2>

        {loading ? (
          <div className="flex justify-center py-16">
            <svg className="animate-spin h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
        ) : (
          <>
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
                {conductores.length > 0 ? conductores.map(con => {
                  const esConductorActivo = con.active === true; // o !!con.active

                  return (
                    <tr key={con.idDriver} className="border-t border-gray-100">
                      <td className="py-3 text-sm">{con.document?.documentType?.abbreviation || '—'}</td>
                      <td className="py-3 text-sm">{con.document?.documentNumber || '—'}</td>
                      <td className="py-3 text-sm">{con.firstName || '—'}</td>
                      <td className="py-3 text-sm">{con.lastName || '—'}</td>
                      <td className="py-3 text-sm">{con.phoneNumber || '—'}</td>
                      <td className="py-3 flex gap-2 justify-end">
                        <button
                          onClick={esConductorActivo ? () => handleEditar(con) : undefined}
                          disabled={!esConductorActivo}
                          className={`p-1 rounded-full transition-all duration-150 focus:outline-none ${esConductorActivo
                              ? 'bg-white shadow-md hover:shadow-xl transform hover:-translate-y-0.5 focus:ring-2 focus:ring-offset-2 focus:ring-blue-300 cursor-pointer'
                              : 'bg-gray-100 cursor-not-allowed opacity-50'
                            }`}
                          title={esConductorActivo ? 'Editar conductor' : 'Conductor desactivado'}
                        >
                          {/* icono editar */}
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                   m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                        </button>

                        <button
                          onClick={esConductorActivo ? () => handleEliminar(con.idDriver) : undefined}
                          disabled={!esConductorActivo}
                          className={`p-1 rounded-full transition-all duration-150 focus:outline-none ${esConductorActivo
                              ? 'bg-white shadow-md hover:shadow-xl transform hover:-translate-y-0.5 focus:ring-2 focus:ring-offset-2 focus:ring-red-300 cursor-pointer'
                              : 'bg-gray-100 cursor-not-allowed opacity-50'
                            }`}
                          title={esConductorActivo ? 'Eliminar conductor' : 'Conductor desactivado'}
                        >
                          {/* icono eliminar */}
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862
                   a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6
                   m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3
                   M4 7h16"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="6" className="text-center p-2 text-gray-400">
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
                    value={nuevoConductor.nombre}
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
                    value={nuevoConductor.apellido}
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
                    value={nuevoConductor.document.documentType}
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

                    value={nuevoConductor.document.number}
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
                  value={nuevoConductor.telefono}
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