import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaChevronUp, FaChevronDown, FaTimes } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Listbox } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/solid'


const NuevaOrdenTrabajo = ({ user }) => {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const rolesSoloManoObra = ["Colaborador", "Contratista", "Mecánico"];
    const soloPuedeEditarManoObra = isEdit && user && rolesSoloManoObra.includes(user.role.name);
    const rolesSoloRepuestos = ["Almacenista", "Auxiliar Administrativo"];
    const soloPuedeEditarRepuestos = isEdit && user && rolesSoloRepuestos.includes(user.role.name);
    const API_URL = 'https://api.trailers.trailersdelcaribe.net/api';
    const navigate = useNavigate();

    const [secciones, setSecciones] = useState(() => {
        if (soloPuedeEditarRepuestos) {
            return {
                infoOrden: false,
                infoCliente: false,
                infoVehiculo: false,
                repuestosMateriales: true,
                manoObra: true,
                infoCotizacion: false,
            };
        } else if (soloPuedeEditarManoObra) {
            return {
                infoOrden: false,
                infoCliente: false,
                infoCotizacion: false,
                infoVehiculo: false,
                repuestosMateriales: true,
                manoObra: true
            };
        } else {
            return {
                infoOrden: true,
                infoCliente: false,
                infoVehiculo: false,
                repuestosMateriales: false,
                manoObra: false,
                infoCotizacion: false,
            };
        }
    });

    const [formulario, setFormulario] = useState({
        numeroOrden: '',
        Asignado: [],
        fechaSalida: '',
        horaSalida: '',
        fechaCreacion: '',
        horaCreacion: '',
        tipoServicio: [],
        orderStatusId: '',
        cliente: '',
        vehicule: '',
        placaCabezote: '',
        placaTrailer: '',
        kmSalida: '',
        tipoVehiculo: '',
        conductor: '',
        numeroCotizacion: '',
        fechaCotizacion: '',
        fechaFacturacion: '',
        cotizadoPor: '',
        numeroFacturacion: '',
        facturadoPor: '',
        numeroActaEntrega: '',
        nombreSolicitud: '',

        // Totales
        totals: {
            subtotalCostosRepuestos: 0,
            subtotalVentasRepuestos: 0,
            subtotalCostosManoObra: 0,
            subtotalVentasManoObra: 0,
            subtotalCostos: 0,
            subtotalVentas: 0,
            iva: 0,
            totalVenta: 0
        }
    });

    const [statusOptions, setStatusOptions] = useState([]);
    const idTrabajoRealizado = statusOptions.find(s => s.name === 'Trabajo Realizado')?.idOrderStatus;
    const [opcRepuestos, setOpcRepuestos] = useState([]);
    const [serviceTypeOptions, setServiceTypeOptions] = useState([]);
    const [vehicleTypeOptions, setVehicleTypeOptions] = useState([]);
    const [userOptions, setUserOptions] = useState([]);
    const [driverOptions, setDriverOptions] = useState([]);
    const [clientOptions, setClientOptions] = useState([]);
    const [opcionesCargadas, setOpcionesCargadas] = useState(false);
    const [manpowers, setManpowers] = useState([]);
    const [vehiculeOptions, setVehiculeOptions] = useState([]);
    const [driversByVehicle, setDriversByVehicle] = useState([]);
    const canEditFactor = user && ['Coordinador de Operaciones', 'Administrador'].includes(user.role.name);
    const [repuestos, setRepuestos] = useState([]);
    const [manoDeObra, setManoDeObra] = useState([]);
    const [contactos, setContactos] = useState([]);
    const [contactosData, setContactosData] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [contactosDisponibles, setContactosDisponibles] = useState([]);
    const [supplyOptions, setSupplyOptions] = useState([])
    const [contactosSeleccionados, setContactosSeleccionados] = useState([]);


    function toDisplayDate(fechaISO) {
        if (!fechaISO) return '';

        try {
            const fecha = new Date(fechaISO);
            if (isNaN(fecha.getTime())) return '';

            const día = String(fecha.getDate()).padStart(2, '0');
            const mes = String(fecha.getMonth() + 1).padStart(2, '0');
            const año = fecha.getFullYear();

            return `${día}/${mes}/${año}`;
        } catch (error) {
            console.error('Error formateando fecha:', error);
            return '';
        }
    }
    function toInputDate(fechaISO) {
        if (!fechaISO) return '';

        try {
            const fecha = new Date(fechaISO);
            // Verificar que la fecha sea válida
            if (isNaN(fecha.getTime())) return '';

            // Obtener año, mes y día en zona horaria local
            const año = fecha.getFullYear();
            const mes = String(fecha.getMonth() + 1).padStart(2, '0');
            const día = String(fecha.getDate()).padStart(2, '0');

            return `${año}-${mes}-${día}`;
        } catch (error) {
            console.error('Error formateando fecha:', error);
            return '';
        }
    }


    function formatearFechaLocal(fechaISO) {
        if (!fechaISO) return '';

        try {
            const fecha = new Date(fechaISO);
            if (isNaN(fecha.getTime())) return '';


            return fecha.toLocaleDateString('es-CO', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                timeZone: 'America/Bogota'
            });
        } catch (error) {
            console.error('Error formateando fecha local:', error);
            return '';
        }
    }
    function formatearHoraLocal(fechaISO) {
        if (!fechaISO) return '';
        const fecha = new Date(fechaISO);
        // Asegura formato de 2 dígitos
        const horas = String(fecha.getHours()).padStart(2, '0');
        const minutos = String(fecha.getMinutes()).padStart(2, '0');
        return `${horas}:${minutos}`;
    }
    // PRIMER USEEFFECT: Cargar todas las opciones iniciales
    useEffect(() => {
        const cargarDatosIniciales = async () => {
            try {
                // Cargar todas las opciones en paralelo
                const requests = [
                    axios.get(`${API_URL}/order-status`).catch(() => ({ data: [] })),
                    axios.get(`${API_URL}/spare-part-material`, { params: { filter: 'Activo' } }).catch(() => ({ data: [] })),
                    axios.get(`${API_URL}/service-type`).catch(() => ({ data: [] })),
                    axios.get(`${API_URL}/vehicule-type`).catch(() => ({ data: [] })),
                    axios.get(`${API_URL}/user`).catch(() => ({ data: { data: [] } })),
                    axios.get(`${API_URL}/driver`).catch(() => ({ data: [] })),
                    axios.get(`${API_URL}/provider`).catch(() => ({ data: [] })),
                    axios.get(`${API_URL}/client`).catch(() => ({ data: { data: [] } })),
                    axios.get(`${API_URL}/manpower`, { params: { filter: 'Activo' } }).catch(() => ({ data: [] })),
                    axios.get(`${API_URL}/vehicule`).catch(() => ({ data: { data: [] } })),
                    axios.get(`${API_URL}/contacts`).catch(() => ({ data: [] })),
                    axios.get(`${API_URL}/supply`, { params: { filter: 'Activo' } })
                ];

                const [
                    statusResp,         // order-status
                    repuestosResp,      // spare-part-material
                    serviceResp,        // service-type
                    vehicleTypeResp,    // vehicule-type
                    userResp,           // user
                    driverResp,         // driver
                    proveedoresResp,    // provider
                    clientResp,         // client
                    manpowerResp,       // manpower
                    vehiculeResp,       // vehicule
                    contactsResp,      // contacts
                    supplyResp         // supply

                ] = await Promise.all(requests);

                const rawProv = proveedoresResp.data;
                const listaProveedores = Array.isArray(rawProv)
                    ? rawProv
                    : Array.isArray(rawProv.data)
                        ? rawProv.data
                        : [];

                setProveedores(listaProveedores);

                setStatusOptions(statusResp.data || []);
                setOpcRepuestos(Array.isArray(repuestosResp.data) ? repuestosResp.data : (repuestosResp.data?.data || []));
                setServiceTypeOptions(serviceResp.data || []);
                setVehicleTypeOptions(vehicleTypeResp.data || []);

                setUserOptions(userResp.data?.data || userResp.data || []);
                setDriverOptions(driverResp.data || []);
                setClientOptions(clientResp.data?.data || clientResp.data || []);
                setManpowers(Array.isArray(manpowerResp.data) ? manpowerResp.data : (manpowerResp.data?.data || []));
                setVehiculeOptions(vehiculeResp.data?.data || vehiculeResp.data || []);
                setContactosData(contactsResp.data || []);
                setSupplyOptions(supplyResp.data || []);

                setOpcionesCargadas(true);

            } catch (error) {

                toast.error("Error al cargar las opciones iniciales");
                setOpcionesCargadas(true);
            }
        };

        cargarDatosIniciales();
    }, []);


    useEffect(() => {
        if (!isEdit || !id || !opcionesCargadas) return;

        const cargarDatosOrden = async () => {
            try {
                const resp = await axios.get(`${API_URL}/order/${id}`);


                // Extrae la orden ya sea de resp.data.data[0], resp.data.data o resp.data
                let orden;
                if (resp.data.data !== undefined) {
                    orden = Array.isArray(resp.data.data)
                        ? resp.data.data[0]
                        : resp.data.data;
                } else {
                    orden = resp.data;
                }

                if (!orden) {
                    throw new Error('No se recibió la orden a editar');
                }

                const isTrabajoRealizado = orden.orderStatus?.idOrderStatus === idTrabajoRealizado;

                const asignadosBackend = Array.isArray(orden.assignTo)
                    ? orden.assignTo.map(u => u.idUser)
                    : orden.assignTo
                        ? [orden.assignTo.idUser]
                        : [];

                setFormulario(prev => ({
                    ...prev,
                    numeroOrden: orden.orderNumber || '',
                    fechaCreacion: orden.createdAt,
                    horaCreacion: formatearHoraLocal(orden.createdAt),
                    Asignado: asignadosBackend,
                    fechaSalida: isTrabajoRealizado ? toInputDate(orden.outDate) : '',
                    horaSalida: isTrabajoRealizado ? formatearHoraLocal(orden.outDate) : '',
                    tipoServicio: orden.serviceTypes?.map(st => st.idServiceType.toString()) || [],
                    orderStatusId: orden.orderStatus?.idOrderStatus?.toString() || '',
                    cliente: orden.client?.idClient || '',
                    vehicule: orden.vehicule?.idVehicule || '',
                    placaCabezote: orden.vehicule?.placaCabezote || '',
                    placaTrailer: orden.vehicule?.placaTrailer || '',
                    tipoVehiculo: orden.vehicule?.vehiculeType?.idVehiculeType || '',
                    kmSalida: orden.kilometers != null ? orden.kilometers.toString() : '',
                    conductor: orden.assignedDriver?.idDriver || '',
                    nombreSolicitud: orden.contacts?.find(c => c.isPrincipalContact)?.name || '',
                    totals: {
                        subtotalCostosRepuestos: orden.total?.subtotalCostosRepuestos || 0,
                        subtotalVentasRepuestos: orden.total?.subtotalVentasRepuestos || 0,
                        subtotalCostosManoObra: orden.total?.subtotalCostosManoObra || 0,
                        subtotalVentasManoObra: orden.total?.subtotalVentasManoObra || 0,
                        subtotalCostos: orden.total?.subtotalCostos || 0,
                        subtotalVentas: orden.total?.subtotalVentas || 0,
                        iva: orden.total?.iva || 0,
                        totalVenta: orden.total?.totalVenta || 0,
                    }
                }));

                // Cargar repuestos
                if (Array.isArray(orden.sparePartMaterials)) {
                    const repuestosData = orden.sparePartMaterials.map((spm, idx) => ({
                        id: idx + 1,
                        idSparePartMaterial: spm.sparePartMaterial?.idSparePartMaterial || '',

                        cantidad: spm.cantidad || 0,
                        proveedor: spm.selectedProvider?.idProvider || '',
                        costoUnitario: spm.unitaryCost || 0,
                        costoTotal: spm.costoTotal || 0,
                        factorVenta: spm.factorVenta || 0,
                        ventaUnitaria: spm.ventaUnitaria || 0,
                        ventaTotal: spm.ventaTotal || 0,
                        stockQuantity: spm.sparePartMaterial?.quantity || 0,
                    }));
                    setRepuestos(repuestosData);
                }

                // Cargar mano de obra
                if (Array.isArray(orden.manpowers)) {
                    const manoObraData = orden.manpowers.map((mp, idx) => ({
                        id: idx + 1,
                        idManpower: mp.manpower?.idManpower || '',
                        descripcion: mp.manpower?.name || '',

                        useDetail: mp.useDetail || '',
                        cantidad: mp.cantidad || 0,
                        unitaryCost: mp.unitaryCost ?? 0,
                        contratista: mp.selectedContractor?.idUser
                            || mp.contractor?.idUser
                            || mp.manpower?.contractor?.idUser
                            || '',
                        totalCost: mp.costoTotal || 0,
                        sellFactor: mp.factorVenta || 0,
                        unitSell: mp.ventaUnitaria || 0,
                        totalSell: mp.ventaTotal || 0,


                        insumos: Array.isArray(mp.supplies)
                            ? mp.supplies.map(sup => ({

                                supply: sup.supply?.idSupply || '',

                                selectedProvider: sup.selectedProvider?.idProvider || '',
                                cantidad: sup.cantidad || '',
                                unitaryCost: sup.unitaryCost || '',
                                costoTotal: sup.costoTotal || (sup.cantidad * sup.unitaryCost),

                            }))
                            : []
                    }));
                    setManoDeObra(manoObraData);
                }

                if (Array.isArray(orden.pricings) && orden.pricings.length) {
                    const p = orden.pricings[0];
                    setFormulario(f => ({
                        ...f,
                        numeroCotizacion: p.pricingNumber || '',
                        fechaCotizacion: toInputDate(p.pricingDate),
                        cotizadoPor: p.pricedBy?.idUser || ''
                    }));
                }

                if (Array.isArray(orden.billings) && orden.billings.length) {
                    const b = orden.billings[0];
                    setFormulario(f => ({
                        ...f,
                        numeroFacturacion: b.billingNumber || '',
                        fechaFacturacion: toInputDate(b.billingDate),
                        facturadoPor: b.billedBy?.idUser || '',
                        numeroActaEntrega: b.actNumber || ''
                    }));
                }
                // Contactos adicionales
                if (orden.client?.idClient) {
                    procesarContactosCliente(orden.client.idClient);
                }

            } catch (error) {
                console.error("Error al cargar datos de orden:", error);
                toast.error(`Error al cargar los datos para editar: ${error.message}`);
            }
        };

        cargarDatosOrden();
    }, [isEdit, id, opcionesCargadas]);


    const toggleSeccion = (seccion) => {
        setSecciones({
            ...Object.keys(secciones).reduce((acc, key) => {
                acc[key] = false;
                return acc;
            }, {}),
            [seccion]: !secciones[seccion]
        });
    };



    const calcularTotales = () => {
        // Repuestos (sin cambiar)
        const subtotalCostosRepuestos = repuestos.reduce((sum, r) => sum + (r.costoTotal || 0), 0);
        const subtotalVentasRepuestos = repuestos.reduce((sum, r) => sum + (r.ventaTotal || 0), 0);

        // Mano de obra + sus insumos
        const subtotalCostosManoObra = manoDeObra.reduce((sum, m) => {
            const costoMano = m.totalCost || 0;
            const costoInsumos = (m.insumos || []).reduce((s, i) => s + (i.costoTotal || 0), 0);
            return sum + costoMano + costoInsumos;
        }, 0);

        const subtotalVentasManoObra = manoDeObra.reduce((sum, m) => {
            const ventaMano = m.totalSell || 0;

            return sum + ventaMano;
        }, 0);

        // Totales generales
        const subtotalCostos = subtotalCostosRepuestos + subtotalCostosManoObra;
        const subtotalVentas = subtotalVentasRepuestos + subtotalVentasManoObra;
        const iva = Math.round(subtotalVentas * 0.19 * 100) / 100;
        const totalVenta = Math.round((subtotalVentas + iva) * 100) / 100;

        return {
            subtotalCostosRepuestos,
            subtotalVentasRepuestos,
            subtotalCostosManoObra,
            subtotalVentasManoObra,
            subtotalCostos,
            subtotalVentas,
            iva,
            totalVenta
        };
    };

    const procesarContactosCliente = (clienteId) => {
        const contactosCliente = contactosData.filter(contacto =>
            contacto.client?.idClient === clienteId && contacto.active
        );

        const contactoPrincipal = contactosCliente.find(contacto => contacto.isPrincipalContact);
        const contactosSecundarios = contactosCliente.filter(contacto => !contacto.isPrincipalContact);

        // Actualizar nombre de solicitud con contacto principal
        if (contactoPrincipal) {
            setFormulario(prev => ({
                ...prev,
                nombreSolicitud: contactoPrincipal.name
            }));
        }

        // Establecer contactos disponibles
        setContactosDisponibles(contactosSecundarios);
        setContactosSeleccionados([]);
    };

    const handleCambioCliente = (e) => {
        const clienteSeleccionado = e.target.value;

        setFormulario(prev => ({
            ...prev,
            cliente: clienteSeleccionado,
            nombreSolicitud: ''
        }));

        if (clienteSeleccionado) {
            procesarContactosCliente(clienteSeleccionado);
        } else {
            setContactosDisponibles([]);
            setContactosSeleccionados([]);
        }
    };

    const handleSeleccionContacto = (contactoId, isSelected) => {
        if (isSelected) {
            setContactosSeleccionados(prev => [...prev, contactoId]);
        } else {
            setContactosSeleccionados(prev => prev.filter(id => id !== contactoId));
        }
    };

    const seleccionarTodosContactos = () => {
        const todosIds = contactosDisponibles.map(contacto => contacto.idContact);
        setContactosSeleccionados(todosIds);
    };

    const deseleccionarTodosContactos = () => {
        setContactosSeleccionados([]);
    };

    const handleGuardar = async () => {

        const crearFechaValida = (fecha, hora = '00:00:00') => {
            if (!fecha) return null;
            try {
                const horaCompleta = hora.length === 5 ? `${hora}:00` : hora;
                const fechaCompleta = `${fecha}T${horaCompleta}`;
                const fechaObj = new Date(fechaCompleta);
                if (isNaN(fechaObj.getTime())) throw new Error('Fecha inválida');
                return fechaObj.toISOString();
            } catch (error) {
                console.error('Error creando fecha:', error);
                return null;
            }
        };

        const totalesCalculados = calcularTotales();

        const serviceTypesValidos = formulario.tipoServicio
            ?.filter(st => st && st !== '' && st !== 'undefined' && st !== 'null')
            .map(st => st?.toString())
            .filter(st => st.length > 0) || null;

        const orderStatusValido = formulario.orderStatusId && formulario.orderStatusId !== ''
            ? formulario.orderStatusId.toString()
            : null;

        const isTrabajoRealizado = formulario.orderStatusId === idTrabajoRealizado;

        // --- NUEVO PAYLOAD ---
        const payloadOrder = {
            // orderNumber si lo necesitas...
            assignTo: formulario.Asignado,             // string[]
            outDate: isTrabajoRealizado
                ? crearFechaValida(formulario.fechaSalida, formulario.horaSalida)
                : null,
            orderStatus: orderStatusValido,            // string
            serviceTypes: serviceTypesValidos,         // string[]
            client: formulario.cliente || null,        // string
            vehicule: formulario.vehicule || null,     // string
            assignedDriver: formulario.conductor || null, // string


            kilometers: formulario.kmSalida ? parseInt(formulario.kmSalida) : null,

            pricings: formulario.numeroCotizacion
                ? [{
                    pricingNumber: formulario.numeroCotizacion,
                    pricingDate: crearFechaValida(formulario.fechaCotizacion),
                    pricedBy: formulario.cotizadoPor|| null,
                }]
                : [],

            billings: formulario.numeroFacturacion
                ? [{
                    billingNumber: formulario.numeroFacturacion,
                    billingDate: crearFechaValida(formulario.fechaFacturacion),
                    actNumber: formulario.numeroActaEntrega,
                    billedBy: formulario.facturadoPor,
                }]
                : [],

            sparePartMaterials: repuestos.map(r => ({
                sparePartMaterial: r.idSparePartMaterial,
               selectedProvider: r.proveedor || null,
                unitaryCost: Number(r.costoUnitario),
                cantidad: Number(r.cantidad),
                costoTotal: Number(r.costoTotal),
                factorVenta: Number(r.factorVenta),
                ventaUnitaria: Number(r.ventaUnitaria),
                ventaTotal: Number(r.ventaTotal),
            })),
            manpowers: manoDeObra.map(m => ({
                manpower: m.idManpower,
                unitaryCost: Number(m.unitaryCost),
                useDetail: m.useDetail || '',
                cantidad: Number(m.cantidad),
                costoTotal: Number(m.totalCost),
                factorVenta: Number(m.sellFactor),
                ventaUnitaria: Number(m.unitSell),
                ventaTotal: Number(m.totalSell),
                selectedContractor: m.contratista || null,
                supplies: (m.insumos || []).map(s => ({
                    supply: s.supply,
                    selectedProvider: s.selectedProvider || null,
                    unitaryCost: Number(s.unitaryCost),
                    cantidad: Number(s.cantidad),
                    costoTotal: Number(s.costoTotal),
                    factorVenta: Number(s.factorInsumo),
                    ventaUnitaria: Number(s.ventaUnitaria),
                    ventaTotal: Number(s.ventaTotal),
                }))
            })),

            totals: totalesCalculados,
        };


        try {
            if (isEdit) {
                await axios.patch(`${API_URL}/order/${id}`, payloadOrder);
                toast.success(`Orden actualizada correctamente.`);
            } else {
                await axios.post(`${API_URL}/order`, payloadOrder);
                toast.success(`Orden creada correctamente.`);
            }
            navigate("/ordenes");
        } catch (err) {
            console.error('Error al guardar:', err);
            toast.error(err.response?.data?.message || err.message || "Error guardando la orden");
        }
    };

    // Añade estos helpers en tu componente (antes del return)

    const agregarInsumo = (manoId) => {
        setManoDeObra(prev =>
            prev.map(m =>
                m.id === manoId
                    ? {
                        ...m,
                        insumos: [
                            ...(m.insumos || []),
                            { supply: '', cantidad: '', selectedProvider: '', unitaryCost: '', costoTotal: 0 }
                        ]
                    }
                    : m
            )
        );
    };

    const actualizarInsumo = (manoId, idx, campo, valor) => {
        setManoDeObra(prev =>
            prev.map(m => {
                if (m.id !== manoId) return m;
                const nuevos = [...(m.insumos || [])];
                const ins = { ...nuevos[idx] };

                if (campo === 'supply') {
                    ins.supply = valor;
                    ins.unitaryCost = supplyOptions.find(s => s.idSupply === valor)?.unitaryCost || 0;
                } else if (campo === 'selectedProvider') {
                    ins.selectedProvider = valor;
                } else if (campo === 'cantidad' || campo === 'unitaryCost') {
                    ins[campo] = Number(valor);
                } else {
                    ins[campo] = valor;
                }

                // Recalcular totales de insumo:
                ins.costoTotal = ins.cantidad * ins.unitaryCost;



                nuevos[idx] = ins;
                return { ...m, insumos: nuevos };
            })
        );
    };

    const eliminarInsumo = (manoId, idx) => {
        setManoDeObra(prev =>
            prev.map(m =>
                m.id === manoId
                    ? { ...m, insumos: (m.insumos || []).filter((_, i) => i !== idx) }
                    : m
            )
        );
    };



    // Resto del código (funciones de repuestos, mano de obra, etc.)
    const agregarRepuesto = () => {
        const nuevoId = repuestos.length
            ? Math.max(...repuestos.map(r => r.id)) + 1
            : 1;

        setRepuestos([
            ...repuestos,
            {
                id: nuevoId,
                idSparePartMaterial: '',
                tipo: '',
                cantidad: '',
                proveedor: '',
                costoUnitario: 0,
                costoTotal: 0,
                factorVenta: 0,
                ventaUnitaria: 0,
                ventaTotal: 0,
                stockQuantity: 0
            }
        ]);
    };

    const eliminarRepuesto = (id) => {
        setRepuestos(repuestos.filter(r => r.id !== id));
    };

    const handleCambioRepuestoSelect = (filaId, selectedId) => {
        const mat = opcRepuestos.find(m => m.idSparePartMaterial === selectedId);
        if (!mat) return;

        setRepuestos(prevRepuestos =>
            prevRepuestos.map(r => {
                if (r.id !== filaId) return r;

                const cantidadActual = "";
                const costoUnitarioBackend = mat.unitaryCost || 0;
                const factorVentaActual = parseFloat(r.factorVenta) || 0;
                const ventaUnitariaCalculada = factorVentaActual
                    ? Math.round(costoUnitarioBackend / factorVentaActual)
                    : 0;

                return {
                    ...r,
                    idSparePartMaterial: selectedId,
                    proveedor: mat.provider?.name || '',
                    costoUnitario: costoUnitarioBackend,
                    cantidad: cantidadActual,
                    costoTotal: 0,
                    ventaUnitaria: ventaUnitariaCalculada,
                    ventaTotal: 0
                };
            })
        );
    };

    const handleCantidadChange = (filaId, valorString) => {
        setRepuestos(prevRepuestos =>
            prevRepuestos.map(r => {
                if (r.id !== filaId) return r;

                let nuevaCantidad = parseInt(valorString, 10);
                if (isNaN(nuevaCantidad)) nuevaCantidad = 0;

                const costoUnitarioActual = parseFloat(r.costoUnitario) || 0;
                const factorVentaActual = parseFloat(r.factorVenta) || 0;

                const nuevoCostoTotal = Math.round(nuevaCantidad * costoUnitarioActual);
                const nuevaVentaUnitaria = factorVentaActual
                    ? Math.round(costoUnitarioActual / factorVentaActual)
                    : 0;
                const nuevaVentaTotal = Math.round(nuevaCantidad * nuevaVentaUnitaria);

                return {
                    ...r,
                    cantidad: nuevaCantidad,
                    costoTotal: nuevoCostoTotal,
                    ventaUnitaria: nuevaVentaUnitaria,
                    ventaTotal: nuevaVentaTotal
                };
            })
        );
    };

    const actualizarRepuesto = (filaId, campo, valor) => {
        setRepuestos(prevRepuestos =>
            prevRepuestos.map(r => {
                if (r.id !== filaId) return r;

                const copia = { ...r, [campo]: valor };

                const cantidadActual = parseFloat(copia.cantidad) || 0;
                const costoUnitarioActual = parseFloat(copia.costoUnitario) || 0;
                const factorVentaActual = parseFloat(copia.factorVenta) || 0;

                copia.costoTotal = Math.round(cantidadActual * costoUnitarioActual);
                copia.ventaUnitaria = factorVentaActual
                    ? Math.round(costoUnitarioActual / factorVentaActual)
                    : 0;
                copia.ventaTotal = Math.round(cantidadActual * copia.ventaUnitaria);

                return copia;
            })
        );
    };

    const agregarManoDeObra = () => {
        const nuevoId = manoDeObra.length
            ? Math.max(...manoDeObra.map(m => m.id)) + 1
            : 1;
        setManoDeObra([
            ...manoDeObra,
            {
                id: nuevoId,
                descripcion: '',
                tipo: '',
                useDetail: '',
                cantidad: '',
                totalCost: 0,
                sellFactor: 0,
                unitSell: 0,
                totalSell: 0,
                idManpower: ''
            }
        ]);
    };

    const eliminarManoDeObra = (id) => {
        setManoDeObra(manoDeObra.filter(m => m.id !== id));
    };

    const actualizarManoDeObra = (id, campo, valor) => {
        setManoDeObra(prev =>
            prev.map(m => {
                if (m.id === id) {
                    let copia = { ...m, [campo]: valor };

                    if (campo === "idManpower") {
                        const manpowerInfo = manpowers.find(mp => mp.idManpower === valor);
                        if (manpowerInfo) {
                            copia = {
                                ...copia,
                                idManpower: manpowerInfo.idManpower,
                                descripcion: manpowerInfo.name,
                                tipo: manpowerInfo.type,
                            };
                        }
                    }

                    const cantidad = parseFloat(copia.cantidad) || 0;
                    const unitaryCost = parseFloat(copia.unitaryCost) || 0;
                    const sellFactor = parseFloat(copia.sellFactor) || 0;

                    copia.totalCost = Math.round(cantidad * unitaryCost);
                    copia.unitSell = sellFactor ? Math.round(unitaryCost / sellFactor) : 0;
                    copia.totalSell = Math.round(cantidad * copia.unitSell);

                    return copia;
                }
                return m;
            })
        );
    };


    const handleVehiculeSelect = e => {
        const vehId = e.target.value;

        const veh = vehiculeOptions.find(v => v.idVehicule === vehId) || {};



        setFormulario(prev => ({
            ...prev,
            vehicule: vehId,
            placaCabezote: veh.placaCabezote || '',
            placaTrailer: veh.placaTrailer || '',
            tipoVehiculo: veh.vehiculeType?.idVehiculeType || ''

        }));
    };



    const handleCambioFormulario = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === "tipoServicio" && type === "checkbox") {
            setFormulario(prev => {
                let actual = prev.tipoServicio || [];

                const valor = value.toString();

                if (checked) {

                    if (!actual.includes(valor)) {
                        return { ...prev, tipoServicio: [...actual, valor] };
                    }
                } else {

                    return { ...prev, tipoServicio: actual.filter(v => v !== valor) };
                }
                return prev;
            });
        } else {

            setFormulario(prev => ({ ...prev, [name]: value }));
        }
    };






    const subtotalCostosRepuestos = repuestos.reduce(
        (acc, r) => acc + (r.costoTotal || 0),
        0
    );

    const subtotalVentasRepuestos = repuestos.reduce(
        (acc, r) => acc + (r.ventaTotal || 0),
        0
    );
    const subtotalCostosManoObra = manoDeObra.reduce((sum, m) => {
        const costoMano = m.totalCost || 0;
        const costoInsumos = (m.insumos || []).reduce((s, i) => s + (i.costoTotal || 0), 0);
        return sum + costoMano + costoInsumos;
    }, 0);

    const subtotalVentasManoObra = manoDeObra.reduce((sum, m) => {
        const ventaMano = m.totalSell || 0;

        return sum + ventaMano;
    }, 0);

    const subtotalCostos = subtotalCostosRepuestos + subtotalCostosManoObra;
    const subtotalVentas = subtotalVentasRepuestos + subtotalVentasManoObra;
    const iva = Math.round(subtotalVentas * 0.19 * 100) / 100;
    const totalVenta = Math.round((subtotalVentas + iva) * 100) / 100;


    const roleOptions = userOptions
        .filter(u => ['Contratista', 'Colaborador', 'Mecánico'].includes(u.role?.name))
        .map(u => ({
            value: u.idUser,
            label: `${u.firstName} ${u.lastName}`
        }))

    return (
        <div className="max-w-7xl w-full mx-auto bg-gray-50 p-6">
            <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Editar Orden de Trabajo' : 'Nueva Orden de Trabajo'}</h1>

            {/* Información de la Orden */}
            <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                <div
                    className="bg-white p-4 flex justify-between items-center cursor-pointer"
                    onClick={() => {
                        if (!soloPuedeEditarRepuestos && !soloPuedeEditarManoObra) toggleSeccion('infoOrden')
                    }}
                >
                    <h2 className="text-lg font-semibold text-blue-800">Información de la Orden</h2>
                    {secciones.infoOrden ? <FaChevronUp /> : <FaChevronDown />}
                </div>

                {secciones.infoOrden && (
                    <div className="bg-white p-4 border-t border-gray-200">
                        {/* Número de orden */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Número de orden</label>
                                <input
                                    value={formulario.numeroOrden}
                                    onChange={handleCambioFormulario}
                                    name="numeroOrden"
                                    type="text"
                                    readOnly
                                    className="w-full p-2 border border-gray-300 rounded text-left bg-gray-100"
                                />
                            </div>
                            <div>
                                <Listbox
                                    value={Array.isArray(formulario.Asignado) ? formulario.Asignado : []}
                                    onChange={vals => setFormulario(prev => ({ ...prev, Asignado: vals }))}
                                    multiple
                                >
                                    <Listbox.Label className="block text-sm font-medium text-gray-700 mb-1">
                                        Asignar a *
                                    </Listbox.Label>
                                    <div className="relative">
                                        <Listbox.Button className="w-full border border-gray-300 rounded-md p-2 flex justify-between items-center bg-white">
                                            <span className="truncate">
                                                {roleOptions
                                                    .filter(o => formulario.Asignado.includes(o.value))
                                                    .map(o => o.label)
                                                    .join(', ') || 'Selecciona colaboradores'}
                                            </span>
                                            <ChevronUpDownIcon className="w-5 h-5 text-gray-400" />
                                        </Listbox.Button>

                                        <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none">
                                            {roleOptions.map(opt => (
                                                <Listbox.Option
                                                    key={opt.value}
                                                    value={opt.value}
                                                    className={({ active }) =>
                                                        `cursor-pointer select-none relative py-2 pl-8 pr-4 ${active ? 'bg-blue-100' : ''
                                                        }`
                                                    }
                                                >
                                                    {({ selected }) => (
                                                        <>
                                                            <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                                {opt.label}
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
                                        Seleccionados: {formulario.Asignado.length}
                                    </p>
                                </Listbox>
                            </div>
                        </div>


                        {/* Solo para editar */}
                        {isEdit && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de creación</label>
                                    <div className="flex">
                                        <input
                                            value={toDisplayDate(formulario.fechaCreacion)}
                                            onChange={handleCambioFormulario}
                                            disabled
                                            name="fechaCreacion"
                                            type="text"
                                            className="w-full p-2 border border-gray-300 rounded text-left bg-gray-100"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora de creación</label>
                                    <input
                                        type="time"
                                        name="horaCreacion"
                                        value={formulario.horaCreacion}
                                        disabled
                                        onChange={handleCambioFormulario}
                                        className="w-full p-2 border border-gray-300 rounded text-left bg-gray-100"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Fecha y hora de salida */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de salida</label>
                                <div className="flex">
                                    <input
                                        name="fechaSalida"
                                        type="date"
                                        value={formulario.fechaSalida}
                                        onChange={handleCambioFormulario}
                                        disabled={formulario.orderStatusId !== idTrabajoRealizado}
                                        className={`w-full p-2 border rounded 
                                        ${formulario.orderStatusId === idTrabajoRealizado
                                                ? 'border-gray-300 bg-white text-gray-900'
                                                : 'border-gray-300 bg-gray-100 text-gray-400'
                                            }`
                                        }
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hora de Salida</label>
                                <input
                                    name="horaSalida"
                                    type="time"
                                    value={formulario.horaSalida}
                                    onChange={handleCambioFormulario}
                                    disabled={formulario.orderStatusId !== idTrabajoRealizado}
                                    className={`w-full p-2 border rounded
                                    ${formulario.orderStatusId === idTrabajoRealizado
                                            ? 'border-gray-300 bg-white text-gray-900'
                                            : 'border-gray-300 bg-gray-100 text-gray-400'
                                        }`
                                    }
                                />
                            </div>
                        </div>

                        {/* Tipo de servicio y Estado */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-md font-medium mb-2">Tipo de Servicio</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {serviceTypeOptions.map(st => (
                                        <label key={st.idServiceType} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                name="tipoServicio"
                                                value={st.idServiceType.toString()}
                                                checked={formulario.tipoServicio.includes(st.idServiceType.toString())}
                                                onChange={handleCambioFormulario}
                                                className="mr-2"
                                            />
                                            <span>{st.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-md font-medium mb-2">Estado de la Orden de Trabajo</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {statusOptions?.map(s => (
                                        <label key={s.idOrderStatus} className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                name="orderStatusId"
                                                value={s.idOrderStatus.toString()}
                                                checked={formulario.orderStatusId === s.idOrderStatus.toString()}
                                                onChange={handleCambioFormulario}
                                                className="mr-2"
                                            />
                                            <span>{s.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Informacion del cliente  */}

            <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                <div
                    className="bg-white p-4 flex justify-between items-center cursor-pointer"
                    onClick={() => {
                        if (!soloPuedeEditarRepuestos && !soloPuedeEditarManoObra) toggleSeccion('infoCliente')
                    }}
                >
                    <h2 className="text-lg font-semibold text-blue-800">Información del cliente</h2>
                    {secciones.infoCliente ? <FaChevronUp /> : <FaChevronDown />}
                </div>

                {secciones.infoCliente && (
                    <div className="bg-white p-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cliente *
                                </label>
                                <select
                                    name="cliente"
                                    value={formulario.cliente}
                                    onChange={handleCambioCliente}
                                    required
                                    className="w-full max-w-xs p-2 border border-gray-300 rounded"

                                >
                                    <option value="">Selecciona el cliente</option>
                                    {clientOptions
                                        .filter(cl => cl.active)
                                        .map(cl => (
                                            <option key={cl.idClient} value={cl.idClient}>
                                                {cl.name}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Contacto principal que hace la solicitud
                                </label>
                                <input
                                    value={formulario.nombreSolicitud}
                                    onChange={handleCambioFormulario}
                                    name="nombreSolicitud"
                                    type="text"
                                    className="w-full p-2 border border-gray-300 rounded bg-gray-50"
                                    readOnly
                                    placeholder={formulario.cliente ? "Se llenará automáticamente" : "Selecciona un cliente primero"}
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-md font-medium">
                                    Contactos adicionales para la autorización

                                </h3>


                            </div>

                            {!formulario.cliente ? (
                                <div className="text-center text-gray-500 py-8 border border-gray-200 rounded">
                                    <p>Selecciona un cliente para ver sus contactos disponibles</p>
                                </div>
                            ) : contactosDisponibles.length === 0 ? (
                                <div className="text-center text-gray-500 py-8 border border-gray-200 rounded">
                                    <p>Este cliente no tiene contactos adicionales disponibles</p>
                                    <p className="text-sm mt-1">Solo tiene el contacto principal</p>
                                </div>
                            ) : (
                                <div className="border border-gray-200 rounded">
                                    <div className="overflow-x-auto">
                                        <table className="w-full table-auto">
                                            <thead>
                                                <tr className="bg-gray-100">
                                                    <th className="p-3 border-b text-left">Nombre</th>
                                                    <th className="p-3 border-b text-left">Email</th>
                                                    <th className="p-3 border-b text-left">Teléfono</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {contactosDisponibles.map(contacto => (
                                                    <tr key={contacto.idContact} className="hover:bg-gray-50">
                                                        <td className="p-3 border-b font-medium">{contacto.name}</td>
                                                        <td className="p-3 border-b text-gray-600">{contacto.email || 'Sin email'}</td>
                                                        <td className="p-3 border-b text-gray-600">{contacto.phoneNumber}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                )}
            </div>


            {/* informacion del vehiculo  */}

            <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                <div
                    className="bg-white p-4 flex justify-between items-center cursor-pointer"
                    onClick={() => {
                        if (!soloPuedeEditarRepuestos && !soloPuedeEditarManoObra) toggleSeccion('infoVehiculo')
                    }}
                >
                    <h2 className="text-lg font-semibold text-blue-800">Información del vehículo</h2>
                    {secciones.infoVehiculo ? <FaChevronUp /> : <FaChevronDown />}
                </div>

                {secciones.infoVehiculo && (
                    <div className="bg-white p-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Placa cabezote</label>
                                <select
                                    name="vehicule"
                                    value={formulario.vehicule}
                                    onChange={handleVehiculeSelect}
                                    className="w-full p-2 border border-gray-300 rounded"
                                >
                                    <option value="">Selecciona una placa</option>
                                    {vehiculeOptions.map(v => (
                                        <option key={v.idVehicule} value={v.idVehicule}>
                                            {v.placaCabezote}
                                        </option>
                                    ))}
                                </select>


                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Placa del trailer</label>
                                <input
                                    value={formulario.placaTrailer}
                                    name='placaTrailer'

                                    type="text" className="w-full p-2 border border-gray-300 rounded text-left bg-gray-100"
                                    readOnly />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de vehículo
                                </label>
                                <input
                                    name="tipoVehiculo"
                                    value={
                                        vehicleTypeOptions.find(vt => vt.idVehiculeType === formulario.tipoVehiculo)
                                            ? vehicleTypeOptions.find(vt => vt.idVehiculeType === formulario.tipoVehiculo).name
                                            : ''
                                    }

                                    className="w-full p-2 border border-gray-300 rounded text-left bg-gray-100"
                                    readOnly
                                />


                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kilometros</label>
                                <input
                                    value={formulario.kmSalida}
                                    name='kmSalida'
                                    onChange={handleCambioFormulario}
                                    type="text" className="w-full p-2 border border-gray-300 rounded text-left "
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Conductor</label>
                                <select
                                    name="conductor"
                                    value={formulario.conductor}
                                    onChange={handleCambioFormulario}
                                    required
                                    className="w-full p-2 border border-gray-300 rounded"
                                >
                                    <option value="">Selecciona conductor</option>
                                    {driverOptions.map(d => (
                                        <option key={d.idDriver} value={d.idDriver}>
                                            {d.firstName} {d.lastName}
                                        </option>
                                    ))}
                                </select>

                            </div>

                        </div>
                    </div>

                )}
            </div>





            {/* Repuestos y Materiales */}
            <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                <div
                    className="bg-white p-4 flex justify-between items-center cursor-pointer"
                    onClick={() => {
                        if (!soloPuedeEditarManoObra) toggleSeccion('repuestosMateriales')
                    }}
                >
                    <h2 className="text-lg font-semibold text-blue-800">
                        Repuestos
                    </h2>
                    {secciones.repuestosMateriales ? <FaChevronUp /> : <FaChevronDown />}
                </div>

                {secciones.repuestosMateriales && (
                    <div className="bg-white p-4 border-t border-gray-200">
                        <div className="flex justify-between mb-4">
                            <h3 className="text-md font-medium">Lista de repuestos</h3>
                            <button
                                className="bg-black text-white px-4 py-1 rounded"
                                onClick={agregarRepuesto}
                            >
                                Agregar
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                                        <th className="px-4 py-2">Repuesto</th>

                                        <th className="px-4 py-2">Cantidad</th>
                                        <th className="px-4 py-2">Proveedor</th>
                                        <th className="px-4 py-2">Costo Unitario</th>
                                        <th className="px-4 py-2">Costo Total</th>
                                        <th className="px-4 py-2">Factor Venta</th>
                                        <th className="px-4 py-2">Venta Unitaria</th>
                                        <th className="px-4 py-2">Venta Total</th>
                                        <th className="px-4 py-2"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {repuestos.map((repuesto) => (
                                        <tr key={repuesto.id} className="border-b border-gray-100">
                                            {/* === REPUESTO === */}
                                            <td className="px-2 py-3">

                                                <select
                                                    className="w-40 p-2 border border-gray-300 rounded"
                                                    value={repuesto.idSparePartMaterial}
                                                    onChange={(e) => handleCambioRepuestoSelect(repuesto.id, e.target.value)}
                                                >
                                                    <option value="">Selecciona un repuesto</option>
                                                    {(Array.isArray(opcRepuestos) ? opcRepuestos : []).map((mat) => (
                                                        <option key={mat.idSparePartMaterial} value={mat.idSparePartMaterial}>
                                                            {mat.name} ({mat.measurementUnit})
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>


                                            {/* === CANTIDAD === */}
                                            <td className="px-2 py-3">

                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={repuesto.stockQuantity}
                                                    className="w-22 p-2 border border-gray-300 rounded text-center"
                                                    value={repuesto.cantidad}
                                                    onChange={(e) =>
                                                        handleCantidadChange(repuesto.id, e.target.value)
                                                    }
                                                />

                                            </td>

                                            {/* === Proveedor === */}
                                            <td className="px-2 py-3">
                                                {(() => {
                                                    const mat = opcRepuestos.find(m => m.idSparePartMaterial === repuesto.idSparePartMaterial);
                                                    const providersForMat = mat?.providers || [];
                                                    return (
                                                        <select
                                                            disabled={!canEditFactor}
                                                            className={`w-30 p-2 border border-gray-300 rounded ${canEditFactor ? 'bg-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                            value={repuesto.proveedor}
                                                            onChange={e => actualizarRepuesto(repuesto.id, "proveedor", e.target.value)}
                                                        >
                                                            <option value="">Selecciona proveedor</option>
                                                            {providersForMat.map(p => (
                                                                <option key={p.idProvider} value={p.idProvider}>
                                                                    {p.name}
                                                                </option>
                                                            ))}
                                                        </select>

                                                    );
                                                })()}
                                            </td>

                                            {/* === Costo Unitario === */}
                                            <td className="px-2 py-3">
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    className={`
                                                    w-24 p-2 border border-gray-300 rounded text-left
                                                   bg-white text-gray-900 border-gray-300`}

                                                    value={
                                                        repuesto.costoUnitario != null
                                                            ? repuesto.costoUnitario.toLocaleString('es-CO')
                                                            : ''
                                                    }
                                                    onChange={e => {

                                                        const raw = e.target.value.replace(/\D/g, '');
                                                        const num = raw ? parseInt(raw, 10) : 0;
                                                        actualizarRepuesto(repuesto.id, "costoUnitario", num);
                                                    }}

                                                />
                                            </td>

                                            {/* === Costo Total === */}
                                            <td className="px-2 py-3">
                                                <input
                                                    type="text"
                                                    className="w-24 p-2 border border-gray-300 rounded text-left bg-gray-100"

                                                    value={(repuesto.costoTotal ?? 0).toLocaleString('es-CO')}
                                                    readOnly
                                                />
                                            </td>

                                            {/* === Factor Venta === */}
                                            <td className="px-2 py-3">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className={`
                                                     w-24 p-2 border border-gray-300 rounded text-left
                                                    ${canEditFactor
                                                            ? 'bg-white text-gray-900 border-gray-300'
                                                            : 'bg-gray-100'}
    `}
                                                    value={repuesto.factorVenta}
                                                    readOnly={!canEditFactor}
                                                    onChange={(e) =>
                                                        actualizarRepuesto(
                                                            repuesto.id,
                                                            "factorVenta",
                                                            parseFloat(e.target.value) || 0
                                                        )
                                                    }
                                                />
                                            </td>

                                            {/* === Venta Unitaria === */}
                                            <td className="px-2 py-3">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    className="w-24 p-2 border border-gray-300 rounded text-left bg-gray-100"
                                                    value={(repuesto.ventaUnitaria ?? 0).toLocaleString('es-CO')}
                                                    onChange={(e) =>
                                                        actualizarRepuesto(
                                                            repuesto.id,
                                                            "ventaUnitaria",
                                                            parseFloat(e.target.value) || 0
                                                        )
                                                    }
                                                />
                                            </td>

                                            {/* === Venta Total === */}
                                            <td className="px-2 py-3">
                                                <input
                                                    type="text"
                                                    className="w-24 p-2 border border-gray-300 rounded text-left bg-gray-100"
                                                    value={(repuesto.ventaTotal ?? 0).toLocaleString('es-CO')}
                                                    readOnly
                                                />
                                            </td>

                                            {/* === Botón Eliminar === */}
                                            <td className="px-2 py-3">
                                                <button
                                                    className="text-red-500"
                                                    onClick={() => eliminarRepuesto(repuesto.id)}
                                                >
                                                    <FaTimes />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                            </table>
                        </div>

                        {/* Subtotales */}
                        <div className="flex justify-end mt-4 space-x-6">
                            <div className="text-right">
                                <p className="font-medium">
                                    Subtotal costos: ${subtotalCostosRepuestos.toLocaleString('es-CO')}
                                </p>
                                <p className="font-medium">
                                    Subtotal venta: ${subtotalVentasRepuestos.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>


            {/* Mano de Obra */}
            <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                <div
                    className="bg-white p-4 flex justify-between items-center cursor-pointer"
                    onClick={() => {
                        if (!soloPuedeEditarManoObra) toggleSeccion('manoObra')
                    }}
                >
                    <h2 className="text-lg font-semibold text-blue-800">Mano de Obra</h2>
                    {secciones.manoObra ? <FaChevronUp /> : <FaChevronDown />}
                </div>

                {secciones.manoObra && (
                    <div className="bg-white p-4 border-t border-gray-200">
                        <div className="flex justify-between mb-4">
                            <h3 className="text-md font-medium">Lista de operaciones</h3>
                            <button
                                className="bg-black text-white px-4 py-1 rounded hover:bg-gray-800"
                                onClick={agregarManoDeObra}
                            >
                                Agregar
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 table-fixed">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="w-48 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                                        <th className="w-32 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Detalle</th>
                                        <th className="w-24 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                                        <th className="w-36 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contratista</th>
                                        <th className="w-28 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Costo Unitario</th>
                                        <th className="w-28 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Costo Total</th>
                                        <th className="w-28 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Factor de Venta</th>
                                        <th className="w-28 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Venta Unitaria</th>
                                        <th className="w-28 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Venta Total</th>
                                        <th className="w-24 px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Insumos</th>
                                        <th className="w-16 px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {manoDeObra.map(item => (
                                        <React.Fragment key={item.id}>

                                            <tr className="hover:bg-gray-50 border-b-2 border-blue-100">
                                                <td className="w-48 px-3 py-3">
                                                    <select
                                                        className="w-100 p-2 border border-gray-300 rounded bg-white"
                                                        value={item.idManpower || ""}
                                                        onChange={e => actualizarManoDeObra(item.id, "idManpower", e.target.value)}
                                                    >
                                                        <option value="">Seleccione mano de obra</option>
                                                        {manpowers.map(mp => (
                                                            <option key={mp.idManpower} value={mp.idManpower}>{mp.name}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="w-32 px-3 py-3">
                                                    <textarea
                                                        type="text"
                                                        className="w-50 p-2 border border-gray-300 rounded bg-white"
                                                        value={item.useDetail}
                                                        onChange={e => actualizarManoDeObra(item.id, 'useDetail', e.target.value)}
                                                        rows={1}
                                                        style={{ whiteSpace: 'pre-wrap' }}
                                                    />
                                                </td>

                                                <td className="w-24 px-3 py-3">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="w-20 p-2 border border-gray-300 rounded bg-white"
                                                        value={item.cantidad}
                                                        onChange={e => actualizarManoDeObra(item.id, 'cantidad', parseInt(e.target.value, 10) || 0)}
                                                    />
                                                </td>
                                                <td className="w-36 px-3 py-3">
                                                    <select
                                                        className="w-40 p-2 border border-gray-300 rounded bg-white"
                                                        value={item.contratista}
                                                        onChange={e => actualizarManoDeObra(item.id, 'contratista', e.target.value)}
                                                    >
                                                        <option value="">Selecciona contratista</option>
                                                        {userOptions.filter(u => ['Contratista', 'Colaborador', 'Mecánico'].includes(u.role?.name)).map(u => (
                                                            <option key={u.idUser} value={u.idUser}>{u.firstName + ' ' + u.lastName}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="w-28 px-3 py-3">
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="\d*"
                                                        className={'w-24 p-2 border border-gray-300 rounded text-left bg-white text-gray-900 border-gray-300'}
                                                        value={item.unitaryCost || ''}
                                                        onChange={e => {
                                                            const val = parseFloat(e.target.value) || 0
                                                            actualizarManoDeObra(item.id, 'unitaryCost', val)
                                                        }}
                                                    />
                                                </td>
                                                <td className="w-28 px-3 py-3">
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        className="w-24 p-2 border border-gray-300 rounded text-right bg-gray-100"
                                                        value={(item.totalCost ?? 0).toLocaleString('es-CO')}
                                                    />
                                                </td>
                                                <td className="w-28 px-3 py-3">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        readOnly={!canEditFactor}
                                                        className={`
                                                        w-24 p-2 border border-gray-300 rounded text-left
                                                        ${canEditFactor
                                                                ? 'bg-white text-gray-900 border-gray-300'
                                                                : 'bg-gray-100 text-gray-500'}
                        `}
                                                        value={item.sellFactor}
                                                        onChange={e => actualizarManoDeObra(item.id, 'sellFactor', parseFloat(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="w-28 px-3 py-3">
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        className="w-24 p-2 border border-gray-300 rounded text-right bg-gray-100"
                                                        value={(item.unitSell ?? 0).toLocaleString('es-CO')}
                                                    />
                                                </td>
                                                <td className="w-28 px-3 py-3">
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        className="w-24 p-2 border border-gray-300 rounded text-right bg-gray-100"
                                                        value={(item.totalSell ?? 0).toLocaleString('es-CO')}
                                                    />
                                                </td>
                                                <td className="w-24 px-3 py-3 text-center">
                                                    <button
                                                        className="bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                                                        onClick={() => agregarInsumo(item.id)}
                                                    >
                                                        Insumo
                                                    </button>
                                                </td>
                                                <td className="w-16 px-3 py-3 text-center">
                                                    <button
                                                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                                        onClick={() => eliminarManoDeObra(item.id)}
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* Subtabla de insumos separada */}
                                            {item.insumos && item.insumos.length > 0 && (
                                                <tr>
                                                    <td colSpan="12" className="px-6 py-4">
                                                        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <h4 className="text-sm font-semibold text-gray-700">
                                                                    Insumos para: {manpowers.find(mp => mp.idManpower === item.idManpower)?.name || 'Mano de obra'}
                                                                </h4>
                                                                <span className="text-xs text-gray-500">{item.insumos.length} insumo(s)</span>
                                                            </div>

                                                            <div className="overflow-x-auto">
                                                                <table className="w-full text-sm">
                                                                    <thead>
                                                                        <tr className="bg-gray-100 border-b">
                                                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase">Insumo</th>
                                                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase">Unidad</th>
                                                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase">Cantidad</th>
                                                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase">Proveedor</th>
                                                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase">Costo Unitario.</th>
                                                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase">Costo Total</th>
                                                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase"></th>
                                                                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase">Eliminar</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {item.insumos.map((ins, idx) => {
                                                                            const provs = supplyOptions.find(s => s.idSupply === ins.supply)?.providers || [];
                                                                            const selectedSupply = supplyOptions.find(s => s.idSupply === ins.supply);

                                                                            return (
                                                                                <tr key={`${item.id}-insumo-${idx}`} className="border-b border-gray-200 hover:bg-gray-100">
                                                                                    <td className="px-3 py-2">
                                                                                        <select
                                                                                            className="w-full p-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-gray-400"
                                                                                            value={ins.supply}
                                                                                            onChange={e => actualizarInsumo(item.id, idx, 'supply', e.target.value)}
                                                                                        >
                                                                                            <option value="">— Selecciona Insumo —</option>
                                                                                            {supplyOptions
                                                                                                .filter(s => s.active)
                                                                                                .map(s => (
                                                                                                    <option key={s.idSupply} value={s.idSupply}>
                                                                                                        {s.name}
                                                                                                    </option>
                                                                                                ))
                                                                                            }
                                                                                        </select>
                                                                                    </td>
                                                                                    <td className="px-3 py-2">
                                                                                        <span className="text-sm text-gray-600">
                                                                                            {selectedSupply?.measurementUnit || '-'}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="px-3 py-2">
                                                                                        <input
                                                                                            type="number"
                                                                                            className="w-20 p-1 border border-gray-300 rounded text-center text-sm focus:ring-1 focus:ring-gray-400"
                                                                                            value={ins.cantidad}
                                                                                            onChange={e => actualizarInsumo(item.id, idx, 'cantidad', e.target.value)}
                                                                                        />
                                                                                    </td>
                                                                                    <td className="px-3 py-2">
                                                                                        <select
                                                                                            disabled={!canEditFactor}
                                                                                            className={`w-30 p-2 border border-gray-300 rounded ${canEditFactor ? 'bg-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                                                            value={ins.selectedProvider}
                                                                                            onChange={e => actualizarInsumo(item.id, idx, 'selectedProvider', e.target.value)}
                                                                                        >
                                                                                            <option value="">— Proveedor —</option>
                                                                                            {provs.map(p => (
                                                                                                <option key={p.idProvider} value={p.idProvider}>{p.name}</option>
                                                                                            ))}
                                                                                        </select>
                                                                                    </td>
                                                                                    <td className="px-3 py-2">
                                                                                        <input
                                                                                            type="text"
                                                                                            inputMode="numeric"
                                                                                            pattern="\d*"
                                                                                            readOnly={!canEditFactor}
                                                                                            className={`
                                                                                            w-24 p-2 border border-gray-300 rounded text-left
                                                                                            ${canEditFactor
                                                                                                    ? 'bg-white text-gray-900 border-gray-300'
                                                                                                    : 'bg-gray-100 text-gray-500'}
                                                                                            `}
                                                                                            value={
                                                                                                ins.unitaryCost != null
                                                                                                    ? ins.unitaryCost.toLocaleString('es-CO')
                                                                                                    : ''
                                                                                            }
                                                                                            onChange={e => {
                                                                                                const raw = e.target.value.replace(/\D/g, '')
                                                                                                const num = raw ? parseInt(raw, 10) : 0
                                                                                                actualizarInsumo(item.id, idx, 'unitaryCost', num)
                                                                                            }}
                                                                                        />
                                                                                    </td>
                                                                                    <td className="px-3 py-2">
                                                                                        <span className="text-sm font-medium text-gray-800">
                                                                                            {ins.costoTotal.toLocaleString()}
                                                                                        </span>
                                                                                    </td>
                                                                                     <td className="px-3 py-2">
                                                                                        <span className="text-sm font-medium text-gray-800">
                                                                                            
                                                                                        </span>
                                                                                     </td>


                                                                                    <td className="px-3 py-2 text-center">
                                                                                        <button
                                                                                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                                                                            onClick={() => eliminarInsumo(item.id, idx)}
                                                                                        >
                                                                                            <FaTimes size={12} />
                                                                                        </button>
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                    <tfoot>
                                                                        <tr className="bg-gray-200 font-semibold">
                                                                            <td colSpan="5" className="px-3 py-2 text-right text-sm">Subtotal Insumos:</td>
                                                                            <td className="px-3 py-2 text-right text-sm">
                                                                                ${item.insumos.reduce((sum, ins) => sum + (parseFloat(ins.costoTotal) || 0), 0).toLocaleString()}
                                                                            </td>
                                                                            <td className="px-3 py-2"></td>
                                                                            
                                                                            <td className="px-3 py-2"></td>
                                                                        </tr>
                                                                    </tfoot>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 border-t pt-4">
                            <div className="flex justify-end">
                                <div className="text-right space-y-2">
                                    <div className="flex justify-between min-w-96">
                                        <span className="text-gray-600">Subtotal costos de mano de obra:</span>
                                        <span className="font-semibold">${subtotalCostosManoObra.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between min-w-96">
                                        <span className="text-gray-600">Subtotal venta mano de obra:</span>
                                        <span className="font-semibold">${subtotalVentasManoObra.toLocaleString()}</span>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* informacion de cotizacion de factura */}

            <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                <div
                    className="bg-white p-4 flex justify-between items-center cursor-pointer"
                    onClick={() => {
                        if (!soloPuedeEditarRepuestos && !soloPuedeEditarManoObra) toggleSeccion('infoCotizacion')
                    }}
                >
                    <h2 className="text-lg font-semibold text-blue-800">Información de cotizacion de factura</h2>
                    {secciones.infoCotizacion ? <FaChevronUp /> : <FaChevronDown />}
                </div>

                {secciones.infoCotizacion && (
                    <div className="bg-white p-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">No. cotización</label>
                                <input
                                    value={formulario.numeroCotizacion}
                                    name="numeroCotizacion"
                                    onChange={handleCambioFormulario}
                                    type="text" className="w-full p-2 border border-gray-300 rounded" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de cotización</label>
                                <input
                                    value={formulario.fechaCotizacion}
                                    name='fechaCotizacion'
                                    onChange={handleCambioFormulario}
                                    type="date" className="w-full p-2 border border-gray-300 rounded" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cotizado por</label>

                                <select
                                    name="cotizadoPor"
                                    value={formulario.cotizadoPor}
                                    onChange={handleCambioFormulario}
                                    className="w-full p-2 border border-gray-300 rounded"
                                >
                                    <option value="">Selecciona usuario</option>
                                    {userOptions.map(u => (
                                        <option key={u.idUser} value={u.idUser}>{`${u.firstName} ${u.lastName}`}</option>
                                    ))}
                                </select>

                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">No. facturación</label>
                                <input
                                    value={formulario.numeroFacturacion}
                                    name='numeroFacturacion'
                                    onChange={handleCambioFormulario}
                                    type="text" className="w-full p-2 border border-gray-300 rounded" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Facturado por</label>
                                <select
                                    name="facturadoPor"
                                    value={formulario.facturadoPor}
                                    onChange={handleCambioFormulario}
                                    className="w-full p-2 border border-gray-300 rounded"
                                >
                                    <option value="">Selecciona usuario</option>
                                    {userOptions.map(u => (
                                        <option key={u.idUser} value={u.idUser}>
                                            {`${u.firstName} ${u.lastName}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Número de acta de entrega</label>
                                <input
                                    value={formulario.numeroActaEntrega}
                                    name='numeroActaEntrega'
                                    onChange={handleCambioFormulario}
                                    type="text" className="w-full p-2 border border-gray-300 rounded" />
                            </div>
                        </div>
                    </div>

                )}
            </div>


            {/* Total */}
            <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-white p-4">
                    <h2 className="text-lg font-semibold text-blue-800 mb-4">Total</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-medium mb-2">Costos</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Subtotal costos de repuestos:</span>
                                    <span className="font-medium">${subtotalCostosRepuestos.toLocaleString('es-CO')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Subtotal costos de mano de obra:</span>
                                    <span className="font-medium">${subtotalCostosManoObra.toLocaleString('es-CO')}</span>
                                </div>

                                <div className="flex justify-between border-t border-gray-200 pt-2">
                                    <span>Subtotal costos:</span>
                                    <span className="font-medium">${subtotalCostos.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>


                        <div>
                            <h3 className="font-medium mb-2">Valores de Venta</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Subtotal venta de repuestos:</span>
                                    <span className="font-medium">${subtotalVentasRepuestos.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Subtotal venta mano de obra:</span>
                                    <span className="font-medium">${subtotalVentasManoObra.toLocaleString()}</span>
                                </div>

                                <div className="flex justify-between border-t border-gray-200 pt-2">
                                    <span>Subtotal venta:</span>
                                    <span className="font-medium">${subtotalVentas.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>IVA:</span>
                                    <span className="font-medium">${iva.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-bold">
                                    <span>Total venta:</span>
                                    <span>${totalVenta.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            <div className="flex justify-end space-x-4">
                <button onClick={() => navigate('/ordenes')} className="px-6 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition">
                    Cancelar
                </button>
                <button
                    className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
                    onClick={handleGuardar}
                >
                    {isEdit ? 'Actualizar' : 'Guardar'}
                </button>

            </div>
        </div>
    );
};

export default NuevaOrdenTrabajo;





