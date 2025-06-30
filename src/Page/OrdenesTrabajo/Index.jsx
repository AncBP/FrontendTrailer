import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { descargarOrdenCompletaPDF_pdfmake } from './DescargarOrden';
import { descargarOrdenCompletaPDFClinete_pdfmake } from './DescargarCliente';
import { useNavigate } from 'react-router-dom';

const API_URL = 'https://api.trailers.trailersdelcaribe.net/api';

const OrdenesTrabajo = ({ user }) => {
  const [ordenes, setOrdenes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const navigate = useNavigate();
  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    if (!user?.idUser) return;
    const fetchOrdenes = async () => {
      setLoading(true);
      try {
        const limit = ITEMS_PER_PAGE;
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;

        const params = {
          limit,
          offset,
          search: busqueda.trim() || undefined,
          showActiveOnly,
          userId: ['Mecánico', 'Colaborador', 'Contratista']
            .includes(user.role.name)
            ? user.idUser
            : undefined,
        };

        const resp = await axios.get(`${API_URL}/order`, { params });
        setOrdenes(resp.data.data);
        setTotalPages(Math.ceil(resp.data.total / limit));
      } catch {
        toast.error('No se pudieron cargar las órdenes');
      } finally {
        setLoading(false);
      }
    };
    fetchOrdenes();
  }, [currentPage, user, busqueda, showActiveOnly]);

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
    } catch {
      toast.error('No se pudo eliminar la orden');
    }
  };

  const handleDescargarPDFClinte = async (idOrder) => {
    try {
      const { data: orden } = await axios.get(`${API_URL}/order/${idOrder}`);
      const { data: allContacts } = await axios.get(`${API_URL}/contacts`);
      const contactosCliente = Array.isArray(allContacts)
        ? allContacts.filter(c =>
          c.client?.idClient === orden.client.idClient && c.active
        )
        : [];
      await descargarOrdenCompletaPDFClinete_pdfmake({ ...orden, contacts: contactosCliente });
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDescargarPDF = async (idOrder) => {
    try {
      const { data: orden } = await axios.get(`${API_URL}/order/${idOrder}`);
      const { data: allContacts } = await axios.get(`${API_URL}/contacts`);
      const contactosCliente = Array.isArray(allContacts)
        ? allContacts.filter(c =>
          c.client?.idClient === orden.client.idClient && c.active
        )
        : [];
      await descargarOrdenCompletaPDF_pdfmake({ ...orden, contacts: contactosCliente });
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-700 mb-6">Orden de trabajo</h1>

      {/* Barra superior: buscador + switch + botón */}
      <div className="flex justify-between items-center mb-6 space-x-4">
        {/* Buscador */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar"
            className="bg-white border border-gray-200 w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none"
            value={busqueda}
            onChange={e => { setBusqueda(e.target.value); setCurrentPage(1); }}
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Switch “Activas” */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Activas</span>
          <button
            type="button"
            onClick={() => { setShowActiveOnly(v => !v); setCurrentPage(1); }}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 
              ${showActiveOnly ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute left-0 top-0 w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-300
              ${showActiveOnly ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Botón “Agregar orden” */}
        {!['Almacenista', 'Auxiliar Administrativo', 'Contratista', 'Mecánico', 'Colaborador']
          .includes(user?.role?.name) && (
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
          )}
      </div>

      {/* Tarjeta con tabla */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Listado de Órdenes de Trabajo</h2>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <svg className="animate-spin h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 24 24">
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
                  <th className="py-2 text-sm font-medium text-gray-600">Código</th>
                  <th className="py-2 text-sm font-medium text-gray-600">Cliente</th>
                  <th className="py-2 text-sm font-medium text-gray-600">Estado</th>
                  <th className="py-2 text-sm font-medium text-gray-600">Tipo de servicio</th>
                  <th className="py-2 text-sm font-medium text-gray-600">Fecha creación</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {ordenes.length > 0 ? (
                  ordenes.map(o => (
                    <tr key={o.idOrder} className="border-t border-gray-100">
                      <td className="py-3 text-sm text-yellow-800">{o.orderNumber || '-'}</td>
                      <td className="py-3 text-sm text-blue-800">{o.client?.name || '-'}</td>
                      <td className="py-3">
                        <span className="bg-blue-400 text-white text-sm rounded-full px-4 py-1">
                          {o.orderStatus?.name || '-'}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-blue-600">
                        {Array.isArray(o.serviceTypes)
                          ? o.serviceTypes.map(st => st?.name).join(', ')
                          : '-'}
                      </td>
                      <td className="py-3 text-sm text-gray-600">
                        {o.createdAt
                          ? new Date(o.createdAt).toLocaleString()
                          : '-'}
                      </td>
                      <td className="py-3 flex gap-2 justify-end">
                        <button
                          onClick={() => navigate(`/ordenes/${o.idOrder}/editar`)}
                          className="p-1 bg-white rounded-full shadow-md hover:shadow-xl
                                     transform hover:-translate-y-0.5 transition-all duration-150
                                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300"
                          title="Editar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                                 m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {!['Almacenista', 'Auxiliar Administrativo', 'Contratista', 'Mecánico', 'Colaborador']
                          .includes(user?.role?.name) && (
                            <>
                              <button
                                onClick={() => handleDescargarPDF(o.idOrder)}
                                title="PDF Completa"
                                className="p-1 bg-white rounded-full shadow-md hover:shadow-xl
                                         transform hover:-translate-y-0.5 transition-all duration-150
                                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg"
                                  className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2
                                     M7 10l5 5 5-5M12 15V3" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDescargarPDFClinte(o.idOrder)}
                                title="PDF Cliente"
                                className="p-1 bg-white rounded-full shadow-md hover:shadow-xl
                                         transform hover:-translate-y-0.5 transition-all duration-150
                                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg"
                                  className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2
                                     M7 10l5 5 5-5M12 15V3" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(o.idOrder)}
                                title="Eliminar"
                                className="p-1 bg-white rounded-full shadow-md hover:shadow-xl
                                         transform hover:-translate-y-0.5 transition-all duration-150
                                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-300"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg"
                                  className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862
                                     a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6
                                     m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3
                                     M4 7h16" />
                                </svg>
                              </button>
                            </>
                          )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center p-4 text-gray-400">
                      {busqueda ? 'No hay coincidencias' : 'No hay órdenes para mostrar'}
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
    </div>
  );
};

export default OrdenesTrabajo;

