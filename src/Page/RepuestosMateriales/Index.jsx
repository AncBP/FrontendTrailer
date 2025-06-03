import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';


const RepuestosYMateriales = () => {
  const API_URL = 'https://api.trailers.trailersdelcaribe.net/api/spare-part-material';
  const API_PROVIDERS = 'https://api.trailers.trailersdelcaribe.net/api/provider';
  const API_VEHICULO = 'https://api.trailers.trailersdelcaribe.net/api/vehicule-type';

  const repuestoVacio = {
    nombre: '',
    proveedor: '',
    costoUnitario: '',
    tipoVehiculo: '',
    active: true,
  };

  // Estados
  const [repuestos, setRepuestos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modo, setModo] = useState('agregar');
  const [nuevoRepuesto, setNuevoRepuesto] = useState(repuestoVacio);
  const [vehicleTypeOptions, setVehicleTypeOptions] = useState([]);

  // Parámetro de paginación
  const itemsPerPage = 4;

  // Carga inicial de datos
  const fetchData = async () => {
    try {
      const repuestosParams = showOnlyActive
        ? { params: { filter: 'Activo' } }
        : {};
      const [resRepuestos, resProveedores] = await Promise.all([
        axios.get(API_URL, repuestosParams),
        axios.get(API_PROVIDERS),
      ]);
      setRepuestos(resRepuestos.data.data);
      setProveedores(resProveedores.data.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };


  const cargarOpciones = async () => {
    try {
      const { data } = await axios.get(`${API_VEHICULO}`);
      setVehicleTypeOptions(data);
    } catch (error) {
      toast.error("Error al cargar Tipo vehiculo");
    }
  };


  useEffect(() => {
    fetchData();
    cargarOpciones();
  }, [showOnlyActive]);

  // Filtrado
  const filtrados = repuestos.filter(d =>
    d.name.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.provider?.name.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Paginación sobre el filtrado
  const totalPages = Math.ceil(filtrados.length / itemsPerPage);
  const idxLast = currentPage * itemsPerPage;
  const idxFirst = idxLast - itemsPerPage;
  const currentItems = filtrados.slice(idxFirst, idxLast);

  // Resetear página al cambiar búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [busqueda]);

  // Helpers de modal
  const cerrarModal = () => {
    setMostrarModal(false);
    setModo('agregar');
    setNuevoRepuesto(repuestoVacio);
  };
  const abrirAgregar = () => {
    setModo('agregar');
    setNuevoRepuesto(repuestoVacio);
    setMostrarModal(true);
  };


  const handleGuardar = async () => {
    try {

      const payload = {
        name: nuevoRepuesto.nombre,
        type: nuevoRepuesto.tipoVehiculo,
        measurementUnit: nuevoRepuesto.unidadMedida,
        unitaryCost: parseFloat(nuevoRepuesto.costoUnitario),
        provider: nuevoRepuesto.proveedor.trim(),
      };


      if (modo === 'editar') {
        payload.active = nuevoRepuesto.active;
        await axios.patch(
          `${API_URL}/${nuevoRepuesto.idSparePartMaterial}`,
          payload
        );
        toast.success('Repuesto actualizado correctamente');
      } else {
        await axios.post(API_URL, payload);
        toast.success('Repuesto creado correctamente');
      }


      await fetchData();
      cerrarModal();
    } catch (error) {
      console.error('Error al guardar:', error.response?.data || error);
      toast.error(
        error.response?.data?.message ||
        'Ocurrió un error al guardar. Revisa la consola.'
      );
    }
  };

  const handleEditar = (item) => {
    setNuevoRepuesto({
      idSparePartMaterial: item.idSparePartMaterial,
      nombre: item.name,
      unidadMedida: item.measurementUnit,
      proveedor: item.provider?.idProvider || '',
      costoUnitario: item.unitaryCost,
       tipoVehiculo: item.type,
      active: item.active,
    });
    setModo('editar');
    setMostrarModal(true);
  };
  const handleEliminar = async id => {
    if (!window.confirm('¿Eliminar este repuesto?')) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      toast.success('Repuesto eliminado correctamente');
      await fetchData();
    } catch (err) {
      console.error('Error al eliminar:', err);
      toast.error(
        err.response?.data?.message ||
        'Ocurrió un error al eliminar el repuesto.'
      );
    }
  };

  // Input change
  const handleChange = e => {
    const { name, value } = e.target;
    setNuevoRepuesto(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-700 mb-6">Repuestos y materiales</h1>

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
          onClick={() => setMostrarModal(true)}
          className="bg-black text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Listado de repuestos y materiales</h2>

        <table className="w-full">
          <thead>
            <tr className="text-left">

              <th className="py-2 text-sm font-medium text-gray-600">Nombre</th>
              <th className="py-2 text-sm font-medium text-gray-600">Unidad de Medida</th>
              <th className="py-2 text-sm font-medium text-gray-600">Proveedor</th>
              <th className="py-2 text-sm font-medium text-gray-600">Costo Unitario</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map(Rep => (
                <tr key={Rep.idSparePartMaterial} className="border-t border-gray-100">
                  <td className="py-2">{Rep.name}</td>
                  <td className="py-2">{Rep.measurementUnit}</td>
                  <td className="py-2">{Rep.provider?.name}</td>
                  <td className="py-2">${Rep.unitaryCost.toLocaleString()}</td>
                  <td className="py-2 flex gap-2 justify-end">
                    <button onClick={() => handleEliminar(Rep.idSparePartMaterial)}
                      disabled={!Rep.active}
                      className={`p-1 transition-opacity ${!Rep.active
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:text-red-600'
                        }`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <button onClick={() => handleEditar(Rep)}
                      disabled={!Rep.active}
                      className={`p-1 transition-opacity ${!Rep.active
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:text-blue-600'
                        }`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-500">
                  No hay coincidencias
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Paginación */}
        <div className="flex justify-center mt-4 space-x-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-8 h-8 flex items-center justify-center rounded ${currentPage === i + 1
                ? 'bg-gray-800 text-white'
                : 'bg-gray-200'
                }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
      {mostrarModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[700px] max-h-[90vh] ">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{modo === 'agregar' ? 'Agregar repuestos y materiales' : 'Editar repuestos y material'}</h2>
              <button onClick={cerrarModal} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">
                &times;
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleGuardar(); }}>
              <div className="flex gap-x-4 mb-4">
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    value={nuevoRepuesto.nombre}
                    onChange={handleChange}
                    name="nombre"
                    disabled={modo === 'editar'}
                    required
                    type="text"
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
               
              </div>
              <div className="flex gap-x-4 mb-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de medida *</label>
                  <input
                    value={nuevoRepuesto.unidadMedida}
                    onChange={handleChange}
                    name="unidadMedida"
                    required
                    type="text"
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Costo unitario *</label>
                  <input
                    value={nuevoRepuesto.costoUnitario}
                    onChange={handleChange}
                    name="costoUnitario"
                    required
                    type="number"
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>


              </div>
              <div className="flex gap-x-4 mb-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label>
                  <select
                    value={nuevoRepuesto.proveedor}
                    onChange={handleChange}
                    name="proveedor"
                    required
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecciona proveedor</option>
                    {proveedores.map((prov) => (
                      <option key={prov.idProvider} value={prov.idProvider}>
                        {prov.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de vehículo
                  </label>
                  <select
                    name="tipoVehiculo"
                    value={nuevoRepuesto.tipoVehiculo}
                    onChange={handleChange}
                     className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecciona tipo de vehículo</option>
                    {vehicleTypeOptions.map(vt => (
                      <option key={vt.idVehiculeType} value={vt.name}>
                        {vt.name}
                      </option>
                    ))}
                  </select>
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

export default RepuestosYMateriales;