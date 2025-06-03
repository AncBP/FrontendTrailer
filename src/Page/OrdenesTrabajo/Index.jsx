import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { descargarOrdenCompletaPDF_pdfmake } from  './DescargarOrden';
import { useNavigate } from 'react-router-dom';

const API_URL = 'https://api.trailers.trailersdelcaribe.net/api';

const OrdenesTrabajo = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();


  useEffect(() => {
    const fetchOrdenes = async () => {
      try {
        const limit = 5;
        const offset = (currentPage - 1) * limit;
        const resp = await axios.get(`${API_URL}/order`, { params: { limit, offset } });
        setOrdenes(resp.data.data);
        setTotalPages(Math.ceil(resp.data.total / limit));
      } catch (err) {
        console.error('Error cargando órdenes:', err);
      }
    };
    fetchOrdenes();
  }, [currentPage]);

  useEffect(() => {
    if (location.state?.newOrder) {
      setOrdenes(prev => [location.state.newOrder, ...prev]);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const handleDelete = async (idOrder) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta orden?')) return;
    try {
      await axios.delete(`${API_URL}/order/${idOrder}`);

      setOrdenes(prev => prev.filter(o => o.idOrder !== idOrder));
      toast.success('Orden eliminada');
    } catch (err) {
      console.error('Error eliminando orden:', err);
      toast.error('No se pudo eliminar la orden');
    }
  };

  const filtrados = ordenes.filter(o => {
    const q = busqueda.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.client.name.toLowerCase().includes(q) ||
      o.orderStatus.name.toLowerCase().includes(q) ||
      o.serviceTypes.map(st => st.name).join(' ').toLowerCase().includes(q) ||
      new Date(o.createdAt).toLocaleString().toLowerCase().includes(q)
    );
  });

 const handleDescargarPDF = async (idOrder) => {
  try {
    // 1. Trae la orden (como ya lo haces)
    const { data: orden } = await axios.get(`${API_URL}/order/${idOrder}`);

    // 2. Trae todos los contactos
    const { data: allContacts } = await axios.get(`${API_URL}/contacts`);
    // 3. Filtra SOLO los contactos de ese cliente (empresa)
    const contactosCliente = allContacts.filter(
      c => c.client.idClient === orden.client.idClient
    );

    // 4. Añade los contactos filtrados al objeto orden
    const ordenConContactos = { ...orden, contacts: contactosCliente };

    // 5. Genera el PDF
    await descargarOrdenCompletaPDF_pdfmake(ordenConContactos);

  } catch (error) {
    alert(error.message);
  }
};




  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-700 mb-6">Orden de trabajo</h1>

      <div className="flex justify-between mb-6">
        <div className="relative w-72">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            {/* ícono de lupa */}
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="bg-white border border-gray-200 pl-10 py-3 px-5 text-base rounded-lg focus:outline-none w-full sm:w-[400px] md:w-[500px] lg:w-[600px]"
            placeholder="Buscar"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <button
          onClick={() => navigate('/AgregarOrden')}
          className="bg-black text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 4v16m8-8H4" />
          </svg>
          Agregar orden
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Listado de Órdenes de Trabajo</h2>

        <table className="w-full">
          <thead>
            <tr className="text-left">
              <th className="py-2 text-sm font-medium text-gray-600">Código</th>
              <th className="py-2 text-sm font-medium text-gray-600">Cliente</th>
              <th className="py-2 text-sm font-medium text-gray-600">Estado</th>
              <th className="py-2 text-sm font-medium text-gray-600">Tipo de servicio</th>
              <th className="py-2 text-sm font-medium text-gray-600">Fecha de creación</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length > 0 ? (
              filtrados.map((o) => (
                <tr key={o.idOrder} className="border-t border-gray-100">
                  <td className="py-3 text-sm text-yellow-800">{o.orderNumber}</td>
                  <td className="py-3 text-sm text-blue-800">{o.client.name}</td>
                  <td className="py-3">
                    <span className="bg-blue-400 text-white text-sm rounded-full px-4 py-1">
                      {o.orderStatus.name}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-blue-600">
                    {o.serviceTypes.map(st => st.name).join(', ')}
                  </td>
                  <td className="py-3 text-sm text-gray-600">
                    {new Date(o.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 flex gap-2 justify-end">

                    <button onClick={() => navigate(`/ordenes/${o.idOrder}/editar`)} className="p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDescargarPDF(o.idOrder)} className="p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(o.idOrder)} className="p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center p-2 text-gray-400">
                  No hay coincidencias
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Paginación igual que antes, adaptada a totalPages */}
        <div className="flex justify-center mt-6 gap-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="w-6 h-6 flex items-center justify-center rounded-md text-sm"
          >‹</button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-6 h-6 flex items-center justify-center rounded-md text-sm ${currentPage === i + 1 ? 'bg-gray-800 text-white' : ''
                }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="w-6 h-6 flex items-center justify-center rounded-md text-sm"
          >›</button>
        </div>
      </div>
    </div>
  );
};

export default OrdenesTrabajo;
