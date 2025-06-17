import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const Vehiculos = () => {

    const API_URL = 'https://api.trailers.trailersdelcaribe.net/api/vehicule';
    const DRIVER_API_URL = 'https://api.trailers.trailersdelcaribe.net/api/driver';
    const [vehicleTypes, setVehicleTypes] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [vehiculos, setVehiculos] = useState([]);
    const vehiculosVacio = {
        placaCabezote: '',
        placaTrailer: '',
        kmSalida: '',
        tipoVehiculo: '',
        drivers: []
    };

    const [errorCabe, setErrorCabe] = useState("");
    const [errorTrailer, setErrorTrailer] = useState("");
    const [modo, setModo] = useState('agregar');
    const [mostrarModal, setMostrarModal] = useState(false);
    const cerrarModal = () => {
        setModo('agregar');
        setMostrarModal(false);
    };

    const [nuevoVehiculo, setNuevoVehiculo] = useState({
        placaCabezote: '',
        placaTrailer: '',
        kmSalida: '',
        tipoVehiculo: '',
        drivers: []
    });

    const [busqueda, setBusqueda] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;

    // Reset de página al cambiar búsqueda
    useEffect(() => { setCurrentPage(1); }, [busqueda]);

    const filtrados = vehiculos.filter(v =>
        v.placaCabezote?.toLowerCase().includes(busqueda.toLowerCase()) ||
        v.placaTrailer?.toLowerCase().includes(busqueda.toLowerCase()) ||
        v.driver?.firstName?.toLowerCase().includes(busqueda.toLowerCase()) ||
        v.driver?.lastName?.toLowerCase().includes(busqueda.toLowerCase()) ||
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
            setErrorCabe(!/^[A-Z]{3} \d{3}$/i.test(value) && value ? "Formato: AAA 111" : "");
        }
        if (name === "placaTrailer") {
            setErrorTrailer(!/^[A-Z]\d{5}$/i.test(value) && value ? "Formato: A11111" : "");
        }
    };

    const handleGuardar = async () => {

        const error = validarPlacas(nuevoVehiculo.placaTrailer, nuevoVehiculo.placaCabezote);
        if (error) {
            toast.error(error);
            return;
        }
        try {
            const payload = {
                placaCabezote: nuevoVehiculo.placaCabezote,
                placaTrailer: nuevoVehiculo.placaTrailer,
                kmsSalida: Number(nuevoVehiculo.kmSalida) || 0,
                vehiculeType: nuevoVehiculo.tipoVehiculo,
                drivers: nuevoVehiculo.drivers,
            };
            if (modo === 'editar') {
                await axios.patch(`${API_URL}/${nuevoVehiculo.idVehicule}`, payload);
                toast.success('Vehículo editado correctamente');
            } else {
                await axios.post(API_URL, payload);
                toast.success('Vehículo creado correctamente');
            }

            await fetchVehiculos();
            setNuevoVehiculo(vehiculosVacio);
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
            console.error('Error guardando vehículo:', error);
        }
    };

    const handleEditar = (v) => {
        setNuevoVehiculo({
            idVehicule: v.idVehicule,
            placaCabezote: v.placaCabezote || '',
            placaTrailer: v.placaTrailer || '',
            kmSalida: v.kmsSalida?.toString() || '',
            tipoVehiculo: v.vehiculeType?.idVehiculeType || '',
            drivers: Array.isArray(v.drivers) ? v.drivers.map(d => d.idDriver) : [],
        });
        setModo('editar');
        setMostrarModal(true);
    };

    const handleAbrirAgregar = () => {
        setModo('agregar');
        setNuevoVehiculo(vehiculosVacio);
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
            const res = await axios.get(API_URL);

            const vehiculoArray = Array.isArray(res.data) ? res.data : res.data.data;
            setVehiculos(vehiculoArray);
        } catch (error) {
            console.error('Error al obtener vehículos:', error);
        }
    };

    const fetchDrivers = async () => {
        try {
            const res = await axios.get(DRIVER_API_URL);
            const driverArray = Array.isArray(res.data) ? res.data : res.data.data;
            setDrivers(driverArray);
        } catch (error) {
            console.error('Error al cargar conductores:', error);
        }
    };

    const fetchVehicleTypes = async () => {
        try {
            const res = await axios.get('https://api.trailers.trailersdelcaribe.net/api/vehicule-type');
            setVehicleTypes(res.data);
        } catch (error) {
            console.error('Error al cargar tipos de vehículo:', error);
        }
    };

    useEffect(() => {
        fetchVehicleTypes();
        fetchDrivers();
        fetchVehiculos();
    }, []);

    function validarPlacas(placaTrailer, placaCabezote) {
        const regexTrailer = /^[A-Z]\d{5}$/i;
        const regexCabe = /^[A-Z]{3} \d{3}$/i;

        if (!regexTrailer.test(placaTrailer)) {
            return "La placa del tráiler debe tener 1 letra seguida de 5 números (ej: R74648)";
        }
        if (!regexCabe.test(placaCabezote)) {
            return "La placa del cabezote debe tener 3 letras, un espacio y 3 números (ej: TRH 864)";
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
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Listado de Vehículos</h2>

                <table className="w-full">
                    <thead>
                        <tr className="text-left">
                            <th className="py-2 text-sm font-medium text-gray-600">Placa Cabezote</th>
                            <th className="py-2 text-sm font-medium text-gray-600">Placa Trailer</th>
                            <th className="py-2 text-sm font-medium text-gray-600">Km Salida</th>
                            <th className="py-2 text-sm font-medium text-gray-600">Tipo Vehículo</th>
                            <th className="py-2 text-sm font-medium text-gray-600">Conductor</th>
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
                                        {vehiculo.kmsSalida || '—'}
                                    </td>
                                    <td className="py-3 text-sm">
                                        {vehiculo.vehiculeType?.name || '—'}
                                    </td>
                                    <td className="py-3 text-sm">
                                        {Array.isArray(vehiculo.drivers) && vehiculo.drivers.length
                                            ? vehiculo.drivers.map(d => `${d.firstName} ${d.lastName}`).join(', ')
                                            : '—'}
                                    </td>
                                    <td className="py-3 flex gap-2 justify-end">
                                        <button onClick={() => handleEditar(vehiculo)} className="p-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button onClick={() => handleEliminar(vehiculo.idVehicule)} className="p-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="text-center p-2 text-gray-400">No hay coincidencias</td>
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
                    <div className="bg-white p-6 rounded-lg shadow-lg w-[700px] max-h-[90vh]">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">{modo === 'agregar' ? 'Agregar Vehículo' : 'Editar Vehículo'}</h2>
                            <button onClick={cerrarModal} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">
                                &times;
                            </button>
                        </div>

                        <form>
                            <div className="flex gap-x-4 mb-4">
                                <div className="w-1/2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Placa Cabezote *</label>
                                    <input
                                        value={nuevoVehiculo.placaCabezote}
                                        onChange={handleChange}
                                        type="text"
                                        name="placaCabezote"
                                        required
                                        className={`w-full p-2 border ${errorCabe ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    />
                                    {errorCabe && <span className="text-red-500 text-xs">{errorCabe}</span>}
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Placa Trailer *</label>
                                    <input
                                        value={nuevoVehiculo.placaTrailer}
                                        onChange={handleChange}
                                        type="text"
                                        name="placaTrailer"
                                        required
                                        className={`w-full p-2 border ${errorTrailer ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    />
                                    {errorTrailer && <span className="text-red-500 text-xs">{errorTrailer}</span>}
                                </div>
                            </div>

                            <div className="flex gap-x-4 mb-4">
                                <div className="w-1/2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Km Salida *</label>
                                    <input
                                        value={nuevoVehiculo.kmSalida}
                                        onChange={handleChange}
                                        type="number"
                                        name="kmSalida"
                                        required
                                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Vehículo *</label>
                                    <select
                                        name="tipoVehiculo"
                                        value={nuevoVehiculo.tipoVehiculo}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-gray-300 rounded-md p-2"
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

                            <div className="w-full mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Conductores *</label>
                                <select
                                    name="drivers"
                                    value={nuevoVehiculo.drivers}
                                    onChange={e => {
                                        const values = Array.from(e.target.selectedOptions, opt => opt.value);
                                        setNuevoVehiculo({ ...nuevoVehiculo, drivers: values });
                                    }}
                                    multiple
                                    required
                                    className="w-full border border-gray-300 rounded-md p-2"
                                    size={Math.min(drivers.length, 5)} // para que se vea bien
                                >
                                    {drivers.map((driver) => (
                                        <option key={driver.idDriver} value={driver.idDriver}>
                                            {driver.firstName} {driver.lastName} - {driver.document?.documentType?.abbreviation} {driver.document?.documentNumber}
                                        </option>
                                    ))}
                                </select>
                                <span className="text-xs text-gray-500">Ctrl/Cmd + click para seleccionar varios</span>
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

export default Vehiculos;