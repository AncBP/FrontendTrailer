import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Proveedores = () => {
  const API_URL = 'https://api.trailers.trailersdelcaribe.net/api/provider';

  // Estados UI
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const [modo, setModo] = useState('agregar');
  const [mostrarModal, setMostrarModal] = useState(false);
  const proveedoresVacio = {
    name: '',
    email: '',
    phoneNumber: '',
    document: { documentNumber: '', documentTypeId: '' }
  };
  const [nuevoProveedor, setNuevoProveedor] = useState(proveedoresVacio);

  // Carga paginada desde la API
  const fetchProveedores = async () => {
    setLoading(true);
    try {
      const params = {
        limit: ITEMS_PER_PAGE,
        offset: (currentPage - 1) * ITEMS_PER_PAGE,
        search: busqueda.trim() || undefined,
      };
      const res = await axios.get(API_URL, { params });
      const { data, total } = res.data;
      setProveedores(data);
      setTotalPages(Math.ceil(total / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
      toast.error('No se pudieron cargar los proveedores');
      setProveedores([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    axios
      .get('https://api.trailers.trailersdelcaribe.net/api/document-type')
      .then(res => setDocumentTypes(res.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    fetchProveedores();
  }, [busqueda, currentPage]);

  // Modal
  const handleAbrirAgregar = () => {
    setModo('agregar');
    setNuevoProveedor(proveedoresVacio);
    setMostrarModal(true);
  };
  const cerrarModal = () => {
    setMostrarModal(false);
    setModo('agregar');
  };

  // Form handlers (igual que antes)
  const handleChange = e => {
    const { name, value } = e.target;
    if (name === 'documentTypeId' || name === 'documentNumber') {
      setNuevoProveedor(prev => ({
        ...prev,
        document: { ...prev.document, [name]: value }
      }));
    } else {
      setNuevoProveedor(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleGuardar = async () => {
    try {
      const payload = {
        name: nuevoProveedor.name,
        email: nuevoProveedor.email,
        phoneNumber: nuevoProveedor.phoneNumber,
        documentType: nuevoProveedor.document.documentTypeId,
        documentNumber: nuevoProveedor.document.documentNumber,
      };
      if (modo === 'editar') {
        await axios.patch(`${API_URL}/${nuevoProveedor.idProvider}`, payload);
        toast.success('Proveedor actualizado');
      } else {
        await axios.post(API_URL, payload);
        toast.success('Proveedor creado');
      }
      cerrarModal();
      fetchProveedores();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Error al guardar');
    }
  };

 const handleEditar = proveedor => {
  setNuevoProveedor({
    idProvider: proveedor.idProvider,
    name: proveedor.name,
    email: proveedor.email,
    phoneNumber: proveedor.phoneNumber,
    document: {
      
      documentTypeId: proveedor.document?.documentType?.idDocumentType || '',
      documentNumber: proveedor.document?.documentNumber || ''
    }
  });
  setModo('editar');
  setMostrarModal(true);
};

  const handleEliminar = async id => {
    if (!window.confirm('¿Eliminar este proveedor?')) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      toast.success('Proveedor eliminado');
      fetchProveedores();
    } catch (error) {
      console.error(error);
      toast.error('Error al eliminar');
    }
  };
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-700 mb-6">Proveedores</h1>

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
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Listado de proveedores</h2>

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
                  <th className="py-2 text-sm font-medium text-gray-600">NIT</th>
                  <th className="py-2 text-sm font-medium text-gray-600">Nombre</th>
                  <th className="py-2 text-sm font-medium text-gray-600">Correo</th>
                  <th className="py-2 text-sm font-medium text-gray-600">Teléfono</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {proveedores.length > 0 ? proveedores.map(p => (
                  <tr key={p.idProvider} className="border-t border-gray-100">
                    <td className="py-3 text-sm">{p.document.documentNumber}</td>
                    <td className="py-3 text-sm ">{p.name}</td>
                    <td className="py-3 text-sm ">{p.email}</td>
                    <td className="py-3 text-sm ">{p.phoneNumber}</td>
                    <td className="py-3 flex gap-2 justify-end">
                      <button onClick={() => handleEditar(p)} className="p-1 bg-white rounded-full shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-150 focus:ring-2 focus:ring-offset-2 focus:ring-blue-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleEliminar(p.idProvider)} className="p-1 bg-white rounded-full shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-150 focus:ring-2 focus:ring-offset-2 focus:ring-red-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="text-center p-4 text-gray-400">No hay proveedores</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="flex justify-center items-center mt-6 gap-4">
              <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className={`p-2 rounded hover:bg-gray-200 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}>‹</button>
              <span className="text-sm text-gray-700">Página {currentPage} de {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className={`p-2 rounded hover:bg-gray-200 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}>›</button>
            </div>
          </>
        )}
      </div>
      {/* Modal */}

      {mostrarModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[700px] max-h-[90vh] ">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{modo === 'agregar' ? 'Agregar Proveedor' : 'Editar Proveedor'}</h2>
              <button onClick={cerrarModal} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">
                &times;
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleGuardar(); }}>
              <div className="flex gap-x-4 mb-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium mb-1">Tipo de documento *</label>
                  <select
                    name="documentTypeId"
                    value={nuevoProveedor.document.documentTypeId}
                    onChange={e => {
                      const { name, value } = e.target;
                      setNuevoProveedor(prev => ({
                        ...prev,
                        document: { ...prev.document, [name]: value }
                      }));
                    }}
                    required
                    className="w-full border border-gray-300 rounded-md p-2"
                  >
                    <option value="">Selecciona un tipo</option>
                    {documentTypes
                      .filter(dt => dt.abbreviation === 'NIT')
                      .map(dt => (
                        <option key={dt.idDocumentType} value={dt.idDocumentType}>
                          {dt.name}
                        </option>
                      ))}
                  </select>

                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de identificación *</label>
                  <input
                    value={nuevoProveedor.document?.documentNumber ?? ''}
                    onChange={(e) =>
                      setNuevoProveedor((prev) => ({
                        ...prev,
                        document: {
                          ...prev.document,
                          documentNumber: e.target.value,
                        },
                      }))
                    }
                    name="documentNumber"
                    required
                    type="text"
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

              </div>
              <div className="w-full mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  value={nuevoProveedor.name}
                  onChange={handleChange}
                  name="name"
                  required
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="w-full mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo *</label>
                <input
                  value={nuevoProveedor.email}
                  onChange={handleChange}
                  name="email"
                  required
                  type="email"
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="w-full mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Teléfono *</label>
                <input
                  value={nuevoProveedor.phoneNumber}
                  onChange={handleChange}
                  name="phoneNumber"
                  required
                  type="tel"
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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

export default Proveedores;