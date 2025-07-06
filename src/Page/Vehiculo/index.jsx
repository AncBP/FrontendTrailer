import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const API_URL = 'https://api.trailers.trailersdelcaribe.net/api/vehicule';
const DRIVER_API_URL = 'https://api.trailers.trailersdelcaribe.net/api/driver';

const Vehiculos = () => {

  const [vehiculos, setVehiculos] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);


  const [busqueda, setBusqueda] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 6;


  const [modo, setModo] = useState('agregar');
  const [mostrarModal, setMostrarModal] = useState(false);
  const vehiculoVacio = {
    placaCabezote: '',
    placaTrailer: '',
    kmSalida: '',
    tipoVehiculo: '',
    active: true,
  };
  const [nuevoVehiculo, setNuevoVehiculo] = useState(vehiculoVacio);


  const [errorCabe, setErrorCabe] = useState('');
  const [errorTrailer, setErrorTrailer] = useState('');


  useEffect(() => {
    fetchVehicleTypes();
    fetchDrivers();
  }, []);


  useEffect(() => {
    fetchVehiculos();
  }, [busqueda, showActiveOnly, currentPage]);



  async function fetchVehiculos() {
    setLoading(true);
    try {
      const params = {
        limit: ITEMS_PER_PAGE,
        offset: (currentPage - 1) * ITEMS_PER_PAGE,
        search: busqueda.trim() || undefined,
        showActiveOnly,
      };
      const { data: resp } = await axios.get(API_URL, { params });
      setVehiculos(resp.data);
      setTotalPages(Math.ceil(resp.total / ITEMS_PER_PAGE));
    } catch (err) {
      console.error('Error al cargar vehículos:', err);
      toast.error('No se pudieron cargar los vehículos');
    } finally {
      setLoading(false);
    }
  }

  async function fetchVehicleTypes() {
    try {
      const { data } = await axios.get('https://api.trailers.trailersdelcaribe.net/api/vehicule-type');
      setVehicleTypes(data.data || data);
    } catch (err) {
      console.error('Error al cargar tipos de vehículo:', err);
    }
  }

  async function fetchDrivers() {
    try {
      const { data } = await axios.get(DRIVER_API_URL);
      setDrivers(data.data || data);
    } catch (err) {
      console.error('Error al cargar conductores:', err);
    }
  }



  const handleBuscar = e => {
    setBusqueda(e.target.value);
    setCurrentPage(1);
  };
  const handleToggleActivos = () => {
    setShowActiveOnly(v => !v);
    setCurrentPage(1);
  };

  const handleAbrirAgregar = () => {
    setModo('agregar');
    setNuevoVehiculo(vehiculoVacio);
    setErrorCabe('');
    setErrorTrailer('');
    setMostrarModal(true);
  };
  const cerrarModal = () => {
    setMostrarModal(false);
    setModo('agregar');
  };



  const handleChange = e => {
    const { name, value } = e.target;
    setNuevoVehiculo(prev => ({ ...prev, [name]: value }));

    if (name === 'placaCabezote') {
      const colOk = /^[A-Z]{3} \d{3}$/i.test(value);
      const venOk = /^[A-Z]\d{2}[A-Z]{2}\d[A-Z]$/i.test(value);
      setErrorCabe(
        !value ? '' : (colOk || venOk) ? '' : 'Formato colombiano AAA 111 o venezolano A80BA0P'
      );
    }
    if (name === 'placaTrailer') {
      const colOk = /^[A-Z]\d{5}$/i.test(value);
      const venOk = /^[A-Z]\d{2}[A-Z]{2}\d[A-Z]$/i.test(value);
      setErrorTrailer(
        !value ? '' : (colOk || venOk) ? '' : 'Formato colombiano A11111 o venezolano A80BA0P'
      );
    }
  };

  const handleEditar = v => {
    setModo('editar');
    setNuevoVehiculo({
      idVehicule: v.idVehicule,
      placaCabezote: v.placaCabezote,
      placaTrailer: v.placaTrailer,
      kmSalida: v.kmsSalida?.toString() || '',
      tipoVehiculo: v.vehiculeType?.idVehiculeType || '',
      active: v.active,
    });
    setErrorCabe('');
    setErrorTrailer('');
    setMostrarModal(true);
  };

  const handleGuardar = async () => {
    // Validar placas antes
    if (errorCabe || errorTrailer) {
      toast.error('Corrige el formato de las placas antes de guardar');
      return;
    }
    if (!nuevoVehiculo.tipoVehiculo) {
      toast.error('Selecciona un tipo de vehículo');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        placaCabezote: nuevoVehiculo.placaCabezote.trim().toUpperCase(),
        placaTrailer: nuevoVehiculo.placaTrailer.trim().toUpperCase(),
        kmsSalida: parseInt(nuevoVehiculo.kmSalida || '', 10),
        vehiculeType: nuevoVehiculo.tipoVehiculo,
      };

      let res;
      if (modo === 'editar') {
        // sólo en edición enviamos active
        payload.active = nuevoVehiculo.active;
        res = await axios.patch(`${API_URL}/${nuevoVehiculo.idVehicule}`, payload);
        toast.success('Vehículo editado correctamente');
      } else {
        res = await axios.post(API_URL, payload);
        toast.success('Vehículo creado correctamente');
      }

      await fetchVehiculos();
      cerrarModal();
    } catch (err) {
      console.error('Error guardando vehículo:', err.response?.data || err);
      const msg = err.response?.data?.message
        ? Array.isArray(err.response.data.message)
          ? err.response.data.message.join(', ')
          : err.response.data.message
        : 'Error inesperado al guardar';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async id => {
    if (!window.confirm('¿Seguro que quieres eliminar este vehículo?')) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      toast.success('Vehículo eliminado correctamente');
      fetchVehiculos();
    } catch (err) {
      console.error('Error al eliminar:', err);
      toast.error('No se pudo eliminar el vehículo');
    }
  };



  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-700 mb-6">Vehículos</h1>

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
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Listado de Vehículos</h2>

        {loading ? (
          <div className="flex justify-center py-16">
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
                  <th className="py-2 text-sm font-medium text-gray-600">Placa Cabezote</th>
                  <th className="py-2 text-sm font-medium text-gray-600">Placa Trailer</th>
                  <th className="py-2 text-sm font-medium text-gray-600">Km Salida</th>
                  <th className="py-2 text-sm font-medium text-gray-600">Tipo Vehículo</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {vehiculos.length > 0 ? vehiculos.map(v => {
                  const esVehiculoActivo = v.active === true; // o !!v.active

                  return (
                    <tr key={v.idVehicule} className="border-t border-gray-100">
                      <td className="py-3 text-sm">{v.placaCabezote || '—'}</td>
                      <td className="py-3 text-sm">{v.placaTrailer || '—'}</td>
                      <td className="py-3 text-sm">{v.kmsSalida != null ? v.kmsSalida : '—'}</td>
                      <td className="py-3 text-sm">{v.vehiculeType?.name || '—'}</td>
                      <td className="py-3 flex gap-2 justify-end">
                        <button
                          onClick={esVehiculoActivo ? () => handleEditar(v) : undefined}
                          disabled={!esVehiculoActivo}
                          className={`p-1 rounded-full transition-all duration-150 focus:outline-none ${esVehiculoActivo
                            ? 'bg-white shadow-md hover:shadow-xl transform hover:-translate-y-0.5 focus:ring-2 focus:ring-offset-2 focus:ring-blue-300 cursor-pointer'
                            : 'bg-gray-100 cursor-not-allowed opacity-50'
                            }`}
                          title={esVehiculoActivo ? 'Editar vehículo' : 'Vehículo desactivado'}
                        >
                          {/* icono editar */}
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                   m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                        </button>
                        <button
                          onClick={esVehiculoActivo ? () => handleEliminar(v.idVehicule) : undefined}
                          disabled={!esVehiculoActivo}
                          className={`p-1 rounded-full transition-all duration-150 focus:outline-none ${esVehiculoActivo
                            ? 'bg-white shadow-md hover:shadow-xl transform hover:-translate-y-0.5 focus:ring-2 focus:ring-offset-2 focus:ring-red-300 cursor-pointer'
                            : 'bg-gray-100 cursor-not-allowed opacity-50'
                            }`}
                          title={esVehiculoActivo ? 'Eliminar vehículo' : 'Vehículo desactivado'}
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
                    <td colSpan="5" className="text-center p-8 text-gray-400">
                      {vehiculos.length === 0
                        ? 'No hay vehículos registrados'
                        : 'No hay coincidencias con la búsqueda'}
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
          <div className="bg-white p-6 rounded-lg shadow-lg w-[700px] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {modo === 'agregar' ? 'Agregar Vehículo' : 'Editar Vehículo'}
              </h2>
              <button
                onClick={cerrarModal}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                disabled={loading}
              >
                &times;
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleGuardar(); }}>
              <div className="flex gap-x-4 mb-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Placa Cabezote *
                  </label>
                  <input
                    value={nuevoVehiculo.placaCabezote}
                    onChange={handleChange}
                    type="text"
                    name="placaCabezote"
                    required
                    disabled={loading}
                    className={`w-full p-2 border ${errorCabe ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="ej: TRH 864"
                  />
                  {errorCabe && <span className="text-red-500 text-xs">{errorCabe}</span>}
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Placa Trailer *
                  </label>
                  <input
                    value={nuevoVehiculo.placaTrailer}
                    onChange={handleChange}
                    type="text"
                    name="placaTrailer"
                    required
                    disabled={loading}
                    className={`w-full p-2 border ${errorTrailer ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="ej: R74648"
                  />
                  {errorTrailer && <span className="text-red-500 text-xs">{errorTrailer}</span>}
                </div>
              </div>

              <div className="flex gap-x-4 mb-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Km Salida
                  </label>
                  <input
                    value={nuevoVehiculo.kmSalida}
                    onChange={handleChange}
                    type="number"
                    name="kmSalida"

                    min="0"
                    disabled={loading}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Vehículo *
                  </label>
                  <select
                    name="tipoVehiculo"
                    value={nuevoVehiculo.tipoVehiculo}
                    onChange={handleChange}
                    required
                    disabled={loading || modo === 'editar'}
                    className={`w-full border border-gray-300 rounded-md p-2
              focus:outline-none focus:ring-2 focus:ring-blue-500
              ${loading || modo === 'editar'
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'bg-white'}`}
                  >
                    {[...vehicleTypes]
                      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
                      .map((tipo) => (
                        <option key={tipo.idVehiculeType} value={tipo.idVehiculeType}>
                          {tipo.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>



              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 disabled:opacity-50"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehiculos;