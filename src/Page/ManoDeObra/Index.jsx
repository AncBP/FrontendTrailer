import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ManoDeObra = () => {
  const API_URL = 'https://api.trailers.trailersdelcaribe.net/api/manpower';
  const ITEMS_PER_PAGE = 6;

  const ManoVacio = { nombre: '', active: true };

 
  const [manoDeObra, setManoDeObra] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [modo, setModo] = useState('agregar');
  const [nuevoManoDeObra, setNuevoManoDeObra] = useState(ManoVacio);

  
  useEffect(() => {
    fetchData();
  }, [busqueda, showOnlyActive, currentPage]);

  const fetchData = async () => {
    try {
      const params = {
        limit: ITEMS_PER_PAGE,
        offset: (currentPage - 1) * ITEMS_PER_PAGE,
        search: busqueda.trim() || undefined,
        showActiveOnly: showOnlyActive,
      };
      const res = await axios.get(API_URL, { params });
      const { data, total } = res.data;
      setManoDeObra(data);
      setTotalPages(Math.ceil(total / ITEMS_PER_PAGE));
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar datos');
    }
  };

  const abrirAgregar = () => {
    setModo('agregar');
    setNuevoManoDeObra(ManoVacio);
    setMostrarModal(true);
  };
  const cerrarModal = () => {
    setMostrarModal(false);
    setModo('agregar');
    setNuevoManoDeObra(ManoVacio);
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setNuevoManoDeObra(prev => ({ ...prev, [name]: value }));
  };

  const handleGuardar = async () => {
    try {
      const payload = { name: nuevoManoDeObra.nombre };
      if (modo === 'editar') {
        payload.active = nuevoManoDeObra.active;
        await axios.patch(`${API_URL}/${nuevoManoDeObra.idManPower}`, payload);
        toast.success('Actualizado correctamente');
      } else {
        await axios.post(API_URL, payload);
        toast.success('Creado correctamente');
      }
      await fetchData();
      cerrarModal();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error al guardar');
    }
  };

  const handleEditar = item => {
    setModo('editar');
    setNuevoManoDeObra({
      idManPower: item.idManpower,
      nombre: item.name,
      active: item.active,
    });
    setMostrarModal(true);
  };

  const handleEliminar = async id => {
    if (!window.confirm('¿Eliminar esta mano de obra?')) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      toast.success('Eliminado correctamente');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-700 mb-6">Mano de obra</h1>

      <div className="flex justify-between items-center mb-6 space-x-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar"
            className=" bg-white border border-gray-200 w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none"
            value={busqueda}
            onChange={e => { setBusqueda(e.target.value); setCurrentPage(1); }}
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <label className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Activos</span>
          <button
            onClick={() => { setShowOnlyActive(v => !v); setCurrentPage(1); }}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 
              ${showOnlyActive ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute left-0 top-0 w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-300
              ${showOnlyActive ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </label>

        <button
          onClick={abrirAgregar}
          className="bg-black text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 4v16m8-8H4" />
          </svg>
          Agregar
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Listado de mano de obra</h2>
        <table className="w-full">
          <thead>
            <tr className="text-left">
              <th className="py-2 text-sm font-medium text-gray-600">Nombre</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {manoDeObra.length > 0 ? manoDeObra.map(item => (
              <tr key={item.idManpower} className="border-t border-gray-100">
                <td className="py-2">{item.name}</td>
                <td className="py-2 flex gap-2 justify-end">
                  <button
                    onClick={() => handleEditar(item)}
                    disabled={!item.active}
                    className={`p-1 bg-white rounded-full shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-300
                      ${!item.active ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleEliminar(item.idManpower)}
                    disabled={!item.active}
                    className={`p-1 bg-white rounded-full shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-300
                      ${!item.active ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={2} className="text-center py-4 text-gray-500">
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
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[700px] max-h-[90vh] ">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{modo === 'agregar' ? 'Agregar mano de obra' : 'Editar mano de obra'}</h2>
              <button onClick={cerrarModal} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">
                &times;
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleGuardar(); }}>
              <div className="flex gap-x-4 mb-4">
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <textarea
                    value={nuevoManoDeObra.nombre}
                    onChange={handleChange}
                    name="nombre"
                    required
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={1}
                  />
                </div>

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

export default ManoDeObra;