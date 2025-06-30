import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Listbox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/solid';

const Insumos = () => {
  const API_URL = 'https://api.trailers.trailersdelcaribe.net/api/supply';
  const API_PROVIDERS = 'https://api.trailers.trailersdelcaribe.net/api/provider';

  const insumosVacios = {
    nombre: '',
    proveedores: [],
    unidadMedida: '',
    active: true,
  };

  // Estados
  const [insumos, setInsumos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [busqueda, setBusqueda] = useState('');
 const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modo, setModo] = useState('agregar');
  const [nuevoInsumo, setNuevoInsumo] = useState(insumosVacios);

  const ITEMS_PER_PAGE = 6;

  // Carga proveedores (una sola vez)
  useEffect(() => {
    axios.get(API_PROVIDERS)
      .then(res => setProveedores(res.data.data || res.data))
      .catch(err => console.error('Error cargando proveedores:', err));
  }, []);

  // Carga paginada + búsqueda + activos
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
      setInsumos(data);
      setTotalPages(Math.ceil(total / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error al cargar insumos:', error);
      toast.error('No se pudieron cargar los insumos');
    }
  };

  // Cada vez que cambian búsqueda, switch o página
  useEffect(() => {
    fetchData();
  }, [busqueda, showOnlyActive, currentPage]);

  // Helpers de modal y formulario similares a antes
  const cerrarModal = () => {
    setMostrarModal(false);
    setModo('agregar');
    setNuevoInsumo(insumosVacios);
  };
  const handleChange = e => {
    const { name, value } = e.target;
    setNuevoInsumo(prev => ({ ...prev, [name]: value }));
  };
  const handleGuardar = async () => {
    try {
      const payload = {
        name: nuevoInsumo.nombre,
        measurementUnit: nuevoInsumo.unidadMedida,
        providers: nuevoInsumo.proveedores,
      };
      if (modo === 'editar') {
        await axios.patch(`${API_URL}/${nuevoInsumo.idSupply}`, payload);
        toast.success('Insumo actualizado correctamente');
      } else {
        await axios.post(API_URL, payload);
        toast.success('Insumo creado correctamente');
      }
      await fetchData();
      cerrarModal();
    } catch (err) {
      console.error('Error al guardar:', err.response?.data || err);
      toast.error(err.response?.data?.message || 'Error al guardar');
    }
  };
  const handleEditar = item => {
    setNuevoInsumo({
      idSupply: item.idSupply,
      nombre: item.name,
      unidadMedida: item.measurementUnit,
      proveedores: item.providers?.map(p => p.idProvider) || [],
      active: item.active,
    });
    setModo('editar');
    setMostrarModal(true);
  };
  const handleEliminar = async id => {
    if (!window.confirm('¿Eliminar este insumo?')) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      toast.success('Insumo eliminado correctamente');
      fetchData();
    } catch (err) {
      console.error('Error al eliminar:', err);
      toast.error(err.response?.data?.message || 'Error al eliminar');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-700 mb-6">Insumos</h1>

      <div className="flex justify-between items-center mb-6 space-x-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar"
            className="bg-white border border-gray-200 w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <label htmlFor="toggleActivos" className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Activos</span>
          <div className={`relative inline-block w-12 h-6 transition-colors rounded-full cursor-pointer
            ${showOnlyActive ? 'bg-blue-600' : 'bg-gray-300'}`}>
            <input
              id="toggleActivos"
              type="checkbox"
              className="opacity-0 w-0 h-0"
              checked={showOnlyActive}
              onChange={() => setShowOnlyActive(v => !v)}
            />
            <span className={`absolute left-0 top-0 w-6 h-6 bg-white rounded-full shadow transform transition-transform
              ${showOnlyActive ? 'translate-x-6' : 'translate-x-0'}`} />
          </div>
        </label>

        <button
          onClick={() => { setModo('agregar'); setnuevoInsumo(insumosVacios); setMostrarModal(true); }}
          className="bg-black text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 4v16m8-8H4" />
          </svg>
          Agregar
        </button>
      </div>

       <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Listado de insumos</h2>
        <table className="w-full">
          <thead>
            <tr className="text-left">
              <th className="py-2 text-sm font-medium text-gray-600">Nombre</th>
              <th className="py-2 text-sm font-medium text-gray-600">Unidad de Medida</th>
              <th className="py-2 text-sm font-medium text-gray-600">Proveedor</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {insumos.map(item => (
              <tr key={item.idSupply} className="border-t border-gray-100">
                <td className="py-2">{item.name}</td>
                <td className="py-2">{item.measurementUnit}</td>
                <td className="py-2">
                  {item.providers?.map(p => p.name).join(', ') || '—'}
                </td>
                <td className="py-2 flex gap-2 justify-end">
                  <button
                    onClick={() => handleEditar(item)}
                    disabled={!item.active}
                    className={`p-1 bg-white rounded-full shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300 ${
                      !item.active ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700"
                         fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleEliminar(item.idSupply)}
                    disabled={!item.active}
                    className={`p-1 bg-white rounded-full shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-300 ${
                      !item.active ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700"
                         fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            {insumos.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-4 text-gray-500">
                  No hay coincidencias
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Paginación con flechas y contador */}
        <div className="flex justify-center items-center mt-6 gap-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className={`p-2 rounded hover:bg-gray-200 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >‹</button>
          <span className="text-sm text-gray-700">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`p-2 rounded hover:bg-gray-200 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
          >›</button>
        </div>
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[700px] max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {modo === 'agregar' ? 'Agregar Insumo' : 'Editar Insumo'}
              </h2>
              <button onClick={cerrarModal} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">
                &times;
              </button>
            </div>

            <form onSubmit={e => { e.preventDefault(); handleGuardar(); }}>
              <div className="flex gap-x-4 mb-4">
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    name="nombre"
                    value={nuevoInsumo.nombre}
                    onChange={handleChange}
                    required
                    type="text"
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-x-4 mb-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad de medida *
                  </label>
                  <select
                    name="unidadMedida"
                    value={nuevoInsumo.unidadMedida}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecciona la unidad de medida</option>
                    <option value="unidad">Unidad</option>
                    <option value="kilo">Kilo</option>
                    <option value="litro">Litro</option>
                    <option value="metro">Metro</option>
                    <option value="centimetro">Cm</option>
                    <option value="paquete">Paquete</option>
                    <option value="galon">Galón</option>
                    <option value="caja">Caja</option>
                    <option value="docena">Docena</option>
                    <option value="rollo">Rollo</option>
                    <option value="bolsa">Bolsa</option>
                  </select>
                </div>

                <div className="w-1/2">
                  <Listbox
                    value={nuevoInsumo.proveedores}
                    onChange={vals => setnuevoInsumo({ ...nuevoInsumo, proveedores: vals })}
                    multiple
                  >
                    <Listbox.Label className="block text-sm font-medium text-gray-700 mb-1">
                      Proveedores *
                    </Listbox.Label>
                    <div className="relative">
                      <Listbox.Button className="w-full border border-gray-300 rounded-md p-2 flex justify-between items-center bg-white">
                        <span className="truncate">
                          {Array.isArray(proveedores)
                            ? (
                              proveedores
                                .filter(p => nuevoInsumo.proveedores.includes(p.idProvider))
                                .map(p => p.name)
                                .join(', ')
                            ) || 'Selecciona proveedores'
                            : 'Selecciona proveedores'}
                        </span>
                        <ChevronUpDownIcon className="w-5 h-5 text-gray-400" />
                      </Listbox.Button>

                      <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none">
                        {proveedores.map(p => (
                          <Listbox.Option
                            key={p.idProvider}
                            value={p.idProvider}
                            className={({ active }) =>
                              `cursor-pointer select-none relative py-2 pl-8 pr-4 ${active ? 'bg-blue-100' : ''
                              }`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span
                                  className={`block truncate ${selected ? 'font-semibold' : 'font-normal'
                                    }`}
                                >
                                  {p.name}
                                </span>
                                {selected && (
                                  <CheckIcon
                                    className="absolute left-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-600"
                                  />
                                )}
                              </>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Seleccionados: {nuevoInsumo.proveedores.length}
                    </p>
                  </Listbox>
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

export default Insumos;
