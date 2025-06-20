import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';


const Vehiculos = () => {

    const API_URL = 'https://api.trailers.trailersdelcaribe.net/api/vehicule';
    const DRIVER_API_URL = 'https://api.trailers.trailersdelcaribe.net/api/driver';
    const [vehicleTypes, setVehicleTypes] = useState([]);

    const [vehiculos, setVehiculos] = useState([]);
    const vehiculosVacio = {
        placaCabezote: '',
        placaTrailer: '',
        kmSalida: '',
        tipoVehiculo: ''
        
    };

    const [errorCabe, setErrorCabe] = useState("");
    const [errorTrailer, setErrorTrailer] = useState("");
    const [modo, setModo] = useState('agregar');
    const [mostrarModal, setMostrarModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const cerrarModal = () => {
        setModo('agregar');
        setMostrarModal(false);
        setNuevoVehiculo(vehiculosVacio);
        setErrorCabe("");
        setErrorTrailer("");
    };

    const [nuevoVehiculo, setNuevoVehiculo] = useState({
        placaCabezote: '',
        placaTrailer: '',
        kmSalida: '',
        tipoVehiculo: ''
        
    });

    const [busqueda, setBusqueda] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;

    // Reset de página al cambiar búsqueda
    useEffect(() => { setCurrentPage(1); }, [busqueda]);

    const filtrados = vehiculos.filter(v =>
        v.placaCabezote?.toLowerCase().includes(busqueda.toLowerCase()) ||
        v.placaTrailer?.toLowerCase().includes(busqueda.toLowerCase()) ||
        v.vehiculeType?.name?.toLowerCase().includes(busqueda.toLowerCase())
    );

    // Paginación sobre el array filtrado
    const totalPages = Math.ceil(filtrados.length / itemsPerPage);
    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentItems = filtrados.slice(indexOfFirst, indexOfLast);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNuevoVehiculo({ ...nuevoVehiculo, [name]: value });


        if (name === "placaCabezote") {
            const colOk = /^[A-Z]{3} \d{3}$/i.test(value);
            const venOk = /^[A-Z]\d{2}[A-Z]{2}\d[A-Z]$/i.test(value);
            setErrorCabe(
                !value
                    ? ""
                    : (colOk || venOk)
                        ? ""
                        : "Formato colombiano AAA 111 o venezolano A80BA0P"
            );
        }
        if (name === "placaTrailer") {
            const colOk = /^[A-Z]\d{5}$/i.test(value);
            const venOk = /^[A-Z]\d{2}[A-Z]{2}\d[A-Z]$/i.test(value);
            setErrorTrailer(
                !value
                    ? ""
                    : (colOk || venOk)
                        ? ""
                        : "Formato colombiano A11111 o venezolano A80BA0P"
            );
        }
    };

    const handleGuardar = async () => {
        const error = validarPlacas(nuevoVehiculo.placaTrailer, nuevoVehiculo.placaCabezote);
        if (error) {
            toast.error(error);
            return;
        }

        // Validaciones adicionales
        if (!nuevoVehiculo.tipoVehiculo) {
            toast.error('Selecciona un tipo de vehículo');
            return;
        }
        setLoading(true);
        try {


            const payload = {
                placaCabezote: nuevoVehiculo.placaCabezote.trim().toUpperCase(),
                placaTrailer: nuevoVehiculo.placaTrailer.trim().toUpperCase(),
                kmsSalida: parseInt(nuevoVehiculo.kmSalida, 10),
                vehiculeType: String(nuevoVehiculo.tipoVehiculo),

            };



            let response;
            if (modo === 'editar') {
                response = await axios.patch(`${API_URL}/${nuevoVehiculo.idVehicule}`, payload);
                toast.success('Vehículo editado correctamente');
            } else {
                response = await axios.post(API_URL, payload);
                toast.success('Vehículo creado correctamente');
            }

            console.log('Respuesta del servidor:', response.data); // Debug

            // Recargar inmediatamente y luego cerrar modal
            await fetchVehiculos();

            // Cerrar modal después de recargar
            setTimeout(() => {
                cerrarModal();
                setLoading(false);
            }, 200);

        } catch (error) {
            setLoading(false);
            console.error('Error completo:', error);
            console.error('Respuesta del error:', error.response?.data);
            console.error('Status del error:', error.response?.status);

            const data = error.response?.data;
            let msg = 'Error inesperado al guardar';

            if (data?.message) {
                if (Array.isArray(data.message)) {
                    msg = data.message.join(', ');
                } else {
                    msg = data.message;
                }
            } else if (data?.error) {
                msg = data.error;
            } else if (error.response?.status === 400) {
                msg = 'Datos inválidos. Verifica que todos los campos estén correctos.';
            } else if (error.response?.status === 404) {
                msg = 'Recurso no encontrado. Verifica que el tipo de vehículo y conductores existan.';
            } else if (error.response?.status === 500) {
                msg = 'Error interno del servidor. Intenta de nuevo.';
            }

            toast.error(`No se pudo guardar: ${msg}`);
        }
    };

    const handleEditar = (v) => {
        console.log('Editando vehículo:', v); // Debug
        setNuevoVehiculo({
            idVehicule: v.idVehicule,
            placaCabezote: v.placaCabezote || '',
            placaTrailer: v.placaTrailer || '',
            kmSalida: v.kmsSalida?.toString() || '',
            tipoVehiculo: v.vehiculeType?.idVehiculeType || '',

        });
        setModo('editar');
        setMostrarModal(true);
    };

    const handleAbrirAgregar = () => {
        setModo('agregar');
        setNuevoVehiculo(vehiculosVacio);
        setErrorCabe("");
        setErrorTrailer("");
        setMostrarModal(true);
    };

    const handleEliminar = async (id) => {
        const confirmar = window.confirm('¿Seguro que quieres eliminar este vehículo?');
        if (!confirmar) {
            return;
        }

        try {
            await axios.delete(`${API_URL}/${id}`);
            await fetchVehiculos();
            toast.success('Vehículo eliminado correctamente');
        } catch (error) {
            const msg = error.response?.data?.message
                ? Array.isArray(error.response.data.message)
                    ? error.response.data.message.join(', ')
                    : error.response.data.message
                : 'Error al eliminar vehículo';
            toast.error(msg);
            console.error('Error al eliminar vehículo:', error);
        }
    };

    const fetchVehiculos = async () => {
        try {
            console.log('Obteniendo vehículos...'); // Debug
            const res = await axios.get(API_URL);
            console.log('Respuesta completa de vehículos:', res.data); // Debug

            // Manejo más flexible de la respuesta
            let vehiculoArray = [];

            if (Array.isArray(res.data)) {
                vehiculoArray = res.data;
            } else if (res.data && Array.isArray(res.data.data)) {
                vehiculoArray = res.data.data;
            } else if (res.data && Array.isArray(res.data.vehiculos)) {
                vehiculoArray = res.data.vehiculos;
            } else if (res.data && res.data.results && Array.isArray(res.data.results)) {
                vehiculoArray = res.data.results;
            } else {
                console.warn('Estructura de respuesta inesperada:', res.data);
                vehiculoArray = [];
            }

            console.log('Array de vehículos procesado:', vehiculoArray); // Debug
            setVehiculos(vehiculoArray);

        } catch (error) {
            console.error('Error al obtener vehículos:', error);
            toast.error('Error al cargar vehículos');
            setVehiculos([]);
        }
    };

    const fetchDrivers = async () => {
        try {
            const res = await axios.get(DRIVER_API_URL);
            console.log('Respuesta de conductores:', res.data); // Debug

            let driverArray = [];
            if (Array.isArray(res.data)) {
                driverArray = res.data;
            } else if (res.data && Array.isArray(res.data.data)) {
                driverArray = res.data.data;
            } else {
                console.warn('Estructura de respuesta de conductores inesperada:', res.data);
            }

            setDrivers(driverArray);
        } catch (error) {
            console.error('Error al cargar conductores:', error);
            setDrivers([]);
        }
    };

    const fetchVehicleTypes = async () => {
        try {
            const res = await axios.get('https://api.trailers.trailersdelcaribe.net/api/vehicule-type');
            console.log('Respuesta de tipos de vehículo:', res.data); // Debug

            let typesArray = [];
            if (Array.isArray(res.data)) {
                typesArray = res.data;
            } else if (res.data && Array.isArray(res.data.data)) {
                typesArray = res.data.data;
            } else {
                console.warn('Estructura de respuesta de tipos inesperada:', res.data);
            }

            setVehicleTypes(typesArray);
        } catch (error) {
            console.error('Error al cargar tipos de vehículo:', error);
            setVehicleTypes([]);
        }
    };

    useEffect(() => {
        fetchVehicleTypes();
        fetchDrivers();
        fetchVehiculos();
    }, []);

    function validarPlacas(placaTrailer, placaCabezote) {
        const regexColTrailer = /^[A-Z]\d{5}$/i;
        const regexColCabe = /^[A-Z]{3} \d{3}$/i;
        const regexVen = /^[A-Z]\d{2}[A-Z]{2}\d[A-Z]$/i;

        if (!(regexColTrailer.test(placaTrailer) || regexVen.test(placaTrailer))) {
            return "Placa tráiler: formato colombiano A11111 o venezolano A80BA0P";
        }
        if (!(regexColCabe.test(placaCabezote) || regexVen.test(placaCabezote))) {
            return "Placa cabezote: formato colombiano AAA 111 o venezolano A80BA0P";
        }
        return null;
    }
    

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold text-gray-700 mb-6">Vehículos</h1>

            <div className="flex justify-between items-center mb-6 space-x-4">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Buscar"
                        className="bg-white border border-gray-200 w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none"
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-700">Listado de Vehículos</h2>

                </div>

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
                        {currentItems.length > 0 ? (
                            currentItems.map((vehiculo) => (
                                <tr key={vehiculo.idVehicule} className="border-t border-gray-100">
                                    <td className="py-3 text-sm">
                                        {vehiculo.placaCabezote || '—'}
                                    </td>
                                    <td className="py-3 text-sm">
                                        {vehiculo.placaTrailer || '—'}
                                    </td>
                                    <td className="py-3 text-sm">
                                        {vehiculo.kmsSalida != null ? vehiculo.kmsSalida : '—'}
                                    </td>
                                    <td className="py-3 text-sm">
                                        {vehiculo.vehiculeType?.name || '—'}
                                    </td>

                                    <td className="py-3 flex gap-2 justify-end">
                                        <button onClick={() => handleEditar(vehiculo)} className="p-1" title="Editar">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button onClick={() => handleEliminar(vehiculo.idVehicule)} className="p-1" title="Eliminar">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="text-center p-8 text-gray-400">
                                    {vehiculos.length === 0 ? 'No hay vehículos registrados' : 'No hay coincidencias con la búsqueda'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Paginación */}
                {totalPages > 1 && (
                    <div className="flex justify-center mt-6 gap-1">
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`
                                    w-8 h-8 flex items-center justify-center rounded-md text-sm
                                    ${currentPage === i + 1
                                        ? 'bg-gray-800 text-white'
                                        : 'hover:bg-gray-100 text-gray-600'
                                    }
                                `}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
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
                                        Km Salida *
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
                                        disabled={loading}
                                        className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Selecciona un tipo</option>
                                        {vehicleTypes.map((tipo) => (
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