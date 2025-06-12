import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaChevronUp, FaChevronDown, FaTimes } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';


const NuevaOrdenTrabajo = () => {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const API_URL = 'https://api.trailers.trailersdelcaribe.net/api';
    const navigate = useNavigate();

    const [secciones, setSecciones] = useState({
        infoOrden: true,
        infoCliente: false,
        infoCotizacion: false,
        infoVehiculo: false,
        repuestosMateriales: false,
        manoObra: false
    });

    const [formulario, setFormulario] = useState({
        numeroOrden: '',
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
    const [opcRepuestos, setOpcRepuestos] = useState([]);
    const [serviceTypeOptions, setServiceTypeOptions] = useState([]);
    const [vehicleTypeOptions, setVehicleTypeOptions] = useState([]);
    const [userOptions, setUserOptions] = useState([]);
    const [driverOptions, setDriverOptions] = useState([]);
    const [clientOptions, setClientOptions] = useState([]);
    const [opcionesCargadas, setOpcionesCargadas] = useState(false);
    const [manpowers, setManpowers] = useState([]);
    const [vehiculeOptions, setVehiculeOptions] = useState([]);

    const [repuestos, setRepuestos] = useState([]);
    const [manoDeObra, setManoDeObra] = useState([]);
    const [contactos, setContactos] = useState([]);
    const [contactosData, setContactosData] = useState([]);
    const [contactosDisponibles, setContactosDisponibles] = useState([]);
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
                    axios.get(`${API_URL}/client`).catch(() => ({ data: { data: [] } })),
                    axios.get(`${API_URL}/manpower`, { params: { filter: 'Activo' } }).catch(() => ({ data: [] })),
                    axios.get(`${API_URL}/vehicule`).catch(() => ({ data: { data: [] } })),
                    axios.get(`${API_URL}/contacts`).catch(() => ({ data: [] }))
                ];

                const [
                    statusResp,
                    repuestosResp,
                    serviceResp,
                    vehicleTypeResp,
                    userResp,
                    driverResp,
                    clientResp,
                    manpowerResp,
                    vehiculeResp,
                    contactsResp
                ] = await Promise.all(requests);


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

                setOpcionesCargadas(true);

            } catch (error) {
                console.error('Error cargando opciones:', error);
                toast.error("Error al cargar las opciones iniciales");
                setOpcionesCargadas(true);
            }
        };

        cargarDatosIniciales();
    }, []);


    useEffect(() => {
        if (!isEdit || !id || !opcionesCargadas) {
            return;
        }

        const cargarDatosOrden = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/order/${id}`);

                if (!data) {
                    throw new Error('No se recibieron datos de la orden');
                }

                const isTrabajoRealizado = data.orderStatus?.idOrderStatus === 'c8cc358e-3a33-408c-bb35-41aaf0ed2853';

                setFormulario(prev => ({
                    ...prev,
                    numeroOrden: data.orderNumber || '',
                    fechaCreacion: data.createdAt,
                    horaCreacion: formatearHoraLocal(data.createdAt),


                    fechaSalida: isTrabajoRealizado ? toInputDate(data.outDate) : '',
                    horaSalida: isTrabajoRealizado ? formatearHoraLocal(data.outDate) : '',


                    tipoServicio: data.serviceTypes?.map(st => st.idServiceType.toString()) || [],
                    orderStatusId: data.orderStatus?.idOrderStatus?.toString() || '',


                    cliente: data.client?.idClient || '',
                    vehicule: data.vehicule?.idVehicule || '',


                    nombreCliente: data.client?.name || '',
                    tipoDocCliente: data.client?.document?.documentType?.idDocumentType || '',
                    numeroIdCliente: data.client?.document?.documentNumber || '',
                    placaCabezote: data.vehicule?.placaCabezote || '',
                    placaTrailer: data.vehicule?.placaTrailer || '',
                    tipoVehiculo: data.vehicule?.vehiculeType?.idVehiculeType || '',
                    kmSalida: data.vehicule?.kmsSalida?.toString() || '',
                    conductor: data.vehicule?.driver?.idDriver || '',
                    nombreConductor: data.vehicule?.driver?.firstName || '',
                    apellidoConductor: data.vehicule?.driver?.lastName || '',
                    telefonoConductor: data.vehicule?.driver?.phoneNumber || '',


                    numeroCotizacion: data.pricings?.[0]?.pricingNumber || '',
                    fechaCotizacion: toInputDate(data.pricings?.[0]?.pricingDate),
                    cotizadoPor: data.pricings?.[0]?.pricedBy?.idUser || '',

                    numeroFacturacion: data.billings?.[0]?.billingNumber || '',
                    fechaFacturacion: toInputDate(data.billings?.[0]?.billingDate),
                    facturadoPor: data.billings?.[0]?.billedBy?.idUser || '',
                    numeroActaEntrega: data.billings?.[0]?.actNumber || '',

                    // Contacto principal
                    nombreSolicitud: data.contacts?.find(c => c.isPrincipalContact)?.name || '',

                    // Totales
                    totals: {
                        subtotalCostosRepuestos: data.total?.subtotalCostosRepuestos || 0,
                        subtotalVentasRepuestos: data.total?.subtotalVentasRepuestos || 0,
                        subtotalCostosManoObra: data.total?.subtotalCostosManoObra || 0,
                        subtotalVentasManoObra: data.total?.subtotalVentasManoObra || 0,
                        subtotalCostos: data.total?.subtotalCostos || 0,
                        subtotalVentas: data.total?.subtotalVentas || 0,
                        iva: data.total?.iva || 0,
                        totalVenta: data.total?.totalVenta || 0,
                    }
                }));


                // Cargar repuestos
                if (data.sparePartMaterials && Array.isArray(data.sparePartMaterials)) {
                    const repuestosData = data.sparePartMaterials.map((spm, idx) => ({
                        id: idx + 1,
                        idSparePartMaterial: spm.sparePartMaterial?.idSparePartMaterial || '',
                        tipo: spm.sparePartMaterial?.type || '',
                        cantidad: spm.cantidad || 0,
                        proveedor: spm.sparePartMaterial?.provider?.name || 'Sin proveedor',
                        costoUnitario: spm.sparePartMaterial?.unitaryCost || 0,
                        costoTotal: spm.costoTotal || 0,
                        factorVenta: spm.factorVenta || 0,
                        ventaUnitaria: spm.ventaUnitaria || 0,
                        ventaTotal: spm.ventaTotal || 0,
                        stockQuantity: spm.sparePartMaterial?.quantity || 0,
                    }));
                    setRepuestos(repuestosData);
                }

                // Cargar mano de obra
                if (data.manpowers && Array.isArray(data.manpowers)) {
                    const manoObraData = data.manpowers.map((mp, idx) => ({
                        id: idx + 1,
                        idManpower: mp.manpower?.idManpower || '',
                        descripcion: mp.manpower?.name || '',
                        tipo: mp.manpower?.type || '',
                        cantidad: mp.cantidad || 0,
                        contratista: mp.manpower?.contractor?.idUser || '',
                        unitaryCost: mp.manpower?.unitaryCost || 0,
                        totalCost: mp.costoTotal || 0,
                        sellFactor: mp.factorVenta || 0,
                        unitSell: mp.ventaUnitaria || 0,
                        totalSell: mp.ventaTotal || 0,
                    }));
                    setManoDeObra(manoObraData);
                }

                // Procesar contactos del cliente
                if (data.client?.idClient) {
                    procesarContactosCliente(data.client.idClient);
                }

            } catch (error) {
                console.error("Error al cargar datos de orden:", error);
                toast.error(`Error al cargar los datos para editar: ${error.response?.data?.message || error.message}`);
            }
        };

        cargarDatosOrden();
    }, [isEdit, id, opcionesCargadas]); // Dependencias correctas

    const toggleSeccion = (seccion) => {
        setSecciones({
            ...Object.keys(secciones).reduce((acc, key) => {
                acc[key] = false;
                return acc;
            }, {}),
            [seccion]: !secciones[seccion]
        });
    };

    const validarFormularioCompleto = () => {
        const errores = [];

        if (!formulario.numeroOrden) errores.push('Número de orden es requerido');
        if (!formulario.orderStatusId) errores.push('Estado de la orden es requerido');
        if (!formulario.tipoVehiculo) errores.push('Tipo de vehículo es requerido');
        if (!formulario.placaCabezote) errores.push('Placa del cabezote es requerida');
        if (!formulario.kmSalida) errores.push('Kilometraje de salida es requerido');

        if (formulario.fechaSalida && formulario.horaSalida) {
            const fechaSalida = new Date(`${formulario.fechaSalida}T${formulario.horaSalida}:00`);
            if (isNaN(fechaSalida.getTime())) {
                errores.push('Fecha y hora de salida no son válidas');
            }
        }

        // Validar fechas opcionales si se proporcionan
        if (formulario.fechaCotizacion) {
            const fechaCot = new Date(`${formulario.fechaCotizacion}T00:00:00`);
            if (isNaN(fechaCot.getTime())) {
                errores.push('Fecha de cotización no es válida');
            }
        }

        if (formulario.fechaFacturacion) {
            const fechaFact = new Date(`${formulario.fechaFacturacion}T00:00:00`);
            if (isNaN(fechaFact.getTime())) {
                errores.push('Fecha de facturación no es válida');
            }
        }
        repuestos.forEach((r, i) => {
            if (!r.idSparePartMaterial) errores.push(`Repuesto ${i + 1}: selecciona un material`);
            if (!r.cantidad || r.cantidad <= 0) errores.push(`Repuesto ${i + 1}: cantidad inválida`);
        });

        manoDeObra.forEach((m, i) => {
            if (!m.cantidad || m.cantidad <= 0) errores.push(`Mano de obra ${i + 1}: cantidad inválida`);
            if (!m.contratista) errores.push(`Mano de obra ${i + 1}: contratista es requerido`);
        });

        return errores;
    };

    const calcularTotales = () => {
        const subtotalCostosRepuestos = repuestos.reduce(
            (acc, r) => acc + (r.costoTotal || 0),
            0
        );
        const subtotalVentasRepuestos = repuestos.reduce(
            (acc, r) => acc + (r.ventaTotal || 0),
            0
        );
        const subtotalCostosManoObra = manoDeObra.reduce(
            (sum, m) => sum + (m.totalCost || 0),
            0
        );
        const subtotalVentasManoObra = manoDeObra.reduce(
            (sum, m) => sum + (m.totalSell || 0),
            0
        );

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
        const errores = validarFormularioCompleto();
        if (errores.length) {
            errores.forEach((e) => toast.error(e));
            return;
        }


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
            .filter(st => st && st !== '' && st !== 'undefined' && st !== 'null')
            .map(st => st.toString())
            .filter(st => st.length > 0);


        const orderStatusValido = formulario.orderStatusId && formulario.orderStatusId !== ''
            ? formulario.orderStatusId.toString()
            : null;



        const isTrabajoRealizado = formulario.orderStatusId === 'c8cc358e-3a33-408c-bb35-41aaf0ed2853';

        const payloadOrder = {
            orderNumber: formulario.numeroOrden,
            outDate: isTrabajoRealizado
                ? crearFechaValida(formulario.fechaSalida, formulario.horaSalida)
                : null,
            orderStatus: orderStatusValido,
            serviceTypes: serviceTypesValidos,
            client: formulario.cliente,
            vehicule: formulario.vehicule,
            billings: formulario.numeroFacturacion
                ? [{
                    billingNumber: formulario.numeroFacturacion,
                    billingDate: crearFechaValida(formulario.fechaFacturacion),
                    actNumber: formulario.numeroActaEntrega,
                    billedBy: formulario.facturadoPor,
                }]
                : [],
            pricings: formulario.numeroCotizacion
                ? [{
                    pricingNumber: formulario.numeroCotizacion,
                    pricingDate: crearFechaValida(formulario.fechaCotizacion),
                    pricedBy: formulario.cotizadoPor,
                }]
                : [],
            sparePartMaterials: repuestos.map(r => ({
                sparePartMaterial: r.idSparePartMaterial,
                costoTotal: Number(r.costoTotal) || 0,
                factorVenta: Number(r.factorVenta) || 0,
                cantidad: Number(r.cantidad) || 0,
                ventaUnitaria: Number(r.ventaUnitaria) || 0,
                ventaTotal: Number(r.ventaTotal) || 0,
            })),
            manpowers: manoDeObra.map(m => ({
                manpower: m.idManpower,
                cantidad: Number(m.cantidad) || 0,
                costoTotal: Number(m.totalCost) || 0,
                factorVenta: Number(m.sellFactor) || 0,
                ventaUnitaria: Number(m.unitSell) || 0,
                ventaTotal: Number(m.totalSell) || 0,
            })),
            totals: totalesCalculados,
        };

        // Limpiar campos null/undefined/vacíos antes de enviar
        if (!payloadOrder.orderStatus) delete payloadOrder.orderStatus;
        if (!payloadOrder.serviceTypes || payloadOrder.serviceTypes.length === 0) delete payloadOrder.serviceTypes;
        if (!payloadOrder.billings || payloadOrder.billings.length === 0) delete payloadOrder.billings;
        if (!payloadOrder.pricings || payloadOrder.pricings.length === 0) delete payloadOrder.pricings;



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
                    proveedor: mat.provider?.name || 'Sin proveedor',
                    costoUnitario: costoUnitarioBackend,
                    tipo: mat.type || '',
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
                cantidad: '',
                contratista: '',
                unitaryCost: '',
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
                                unitaryCost: manpowerInfo.unitaryCost,
                                contratista: manpowerInfo.contractor?.idUser || "",
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



    const handleCambioFormulario = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === "tipoServicio" && type === "checkbox") {
            setFormulario(prev => {
                let actual = prev.tipoServicio || [];
                // Convertir value a string para comparación consistente
                const valor = value.toString();

                if (checked) {
                    // Si no está, agregar
                    if (!actual.includes(valor)) {
                        return { ...prev, tipoServicio: [...actual, valor] };
                    }
                } else {
                    // Remover si está
                    return { ...prev, tipoServicio: actual.filter(v => v !== valor) };
                }
                return prev;
            });
        } else {
            // Para otros campos, incluyendo orderStatusId
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
    const subtotalCostosManoObra = manoDeObra.reduce(
        (sum, m) => sum + (m.totalCost || 0),
        0
    );
    const subtotalVentasManoObra = manoDeObra.reduce(
        (sum, m) => sum + (m.totalSell || 0),
        0
    );

    const subtotalCostos = subtotalCostosRepuestos + subtotalCostosManoObra;
    const subtotalVentas = subtotalVentasRepuestos + subtotalVentasManoObra;
    const iva = Math.round(subtotalVentas * 0.19 * 100) / 100;
    const totalVenta = Math.round((subtotalVentas + iva) * 100) / 100;
    return (
        <div className="max-w-6xl mx-auto bg-gray-50 p-6">
            <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Editar Orden de Trabajo' : 'Nueva Orden de Trabajo'}</h1>

            {/* Información de la Orden */}
            <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                <div
                    className="bg-white p-4 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSeccion('infoOrden')}
                >
                    <h2 className="text-lg font-semibold text-blue-800">Información de la Orden</h2>
                    {secciones.infoOrden ? <FaChevronUp /> : <FaChevronDown />}
                </div>

                {secciones.infoOrden && (
                    <div className="bg-white p-4 border-t border-gray-200">
                        {/* Número de orden */}
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Número de orden</label>
                                <input
                                    value={formulario.numeroOrden}
                                    onChange={handleCambioFormulario}
                                    name="numeroOrden"
                                    type="text"
                                    className="w-full p-2 border border-gray-300 rounded"
                                />
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
                                        value={formulario.fechaSalida}
                                        onChange={handleCambioFormulario}
                                        name="fechaSalida"
                                        type="date"
                                        disabled={formulario.orderStatusId !== 'c8cc358e-3a33-408c-bb35-41aaf0ed2853'}
                                        className={`w-full p-2 border rounded 
                                         ${formulario.orderStatusId === 'c8cc358e-3a33-408c-bb35-41aaf0ed2853'
                                                ? 'border-gray-300 bg-white' 
                                                : 'border-gray-300 bg-gray-100 text-gray-400' 
                                            }`
                                        }
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hora de Salida</label>
                                <input
                                    type="time"
                                    name="horaSalida"
                                    value={formulario.horaSalida}
                                    onChange={handleCambioFormulario}
                                    disabled={formulario.orderStatusId !== 'c8cc358e-3a33-408c-bb35-41aaf0ed2853'}
                                    className={`w-full p-2 border rounded
                                     ${formulario.orderStatusId === 'c8cc358e-3a33-408c-bb35-41aaf0ed2853'
                                            ? 'border-gray-300 bg-white'
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
                    onClick={() => toggleSeccion('infoCliente')}
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

            {/* informacion de cotizacion de factura */}

            <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                <div
                    className="bg-white p-4 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSeccion('infoCotizacion')}
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

            {/* informacion del vehiculo  */}

            <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                <div
                    className="bg-white p-4 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSeccion('infoVehiculo')}
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
                                    onChange={e => {
                                        // Obtén el vehículo seleccionado por ID
                                        const veh = vehiculeOptions.find(v => v.idVehicule === e.target.value);
                                        if (veh) {
                                            setFormulario(prev => ({
                                                ...prev,
                                                vehicule: veh.idVehicule,                   // Para el backend
                                                placaCabezote: veh.placaCabezote || '',
                                                placaTrailer: veh.placaTrailer || '',
                                                kmSalida: veh.kmsSalida || '',
                                                tipoVehiculo: veh.vehiculeType?.idVehiculeType || '',
                                                conductor: veh.driver?.idDriver || '',
                                            }));
                                        } else {
                                            setFormulario(prev => ({
                                                ...prev,
                                                vehicule: '',
                                                placaCabezote: '',
                                                placaTrailer: '',
                                                kmSalida: '',
                                                tipoVehiculo: '',
                                                conductor: '',
                                            }));
                                        }
                                    }}
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kms de salida</label>
                                <input
                                    value={formulario.kmSalida}
                                    name='kmSalida'

                                    type="text" className="w-full p-2 border border-gray-300 rounded text-left bg-gray-100"
                                    readOnly />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Conductor
                                </label>
                                <input
                                    name="conductor"
                                    value={
                                        driverOptions.find(dr => dr.idDriver === formulario.conductor)
                                            ? `${driverOptions.find(dr => dr.idDriver === formulario.conductor).firstName} ${driverOptions.find(dr => dr.idDriver === formulario.conductor).lastName}`
                                            : ''
                                    }

                                    className="w-full p-2 border border-gray-300 rounded text-left bg-gray-100"
                                    readOnly
                                />


                            </div>

                        </div>
                    </div>

                )}
            </div>





            {/* Repuestos y Materiales */}
            <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                <div
                    className="bg-white p-4 flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSeccion('repuestosMateriales')}
                >
                    <h2 className="text-lg font-semibold text-blue-800">
                        Repuestos y Materiales
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
                                        <th className="px-4 py-2">Tipo</th>
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

                                            {/* === TIPO === */}
                                            <td className="px-2 py-3">

                                                <input
                                                    type='text'
                                                    className="w-24 p-2 border border-gray-300 rounded text-left bg-gray-100"
                                                    value={repuesto.tipo}
                                                    readOnly
                                                >

                                                </input>
                                            </td>

                                            {/* === CANTIDAD === */}
                                            <td className="px-2 py-3">
                                                {/* w-20 (5rem ≈ 80px) suele ser suficiente para un número */}
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
                                                <input
                                                    type="text"

                                                    className="w-30 p-2 border border-gray-300 rounded text-left bg-gray-100"
                                                    value={repuesto.proveedor}
                                                    readOnly
                                                />
                                            </td>

                                            {/* === Costo Unitario === */}
                                            <td className="px-2 py-3">
                                                <input
                                                    type="number"

                                                    className="w-24 p-2 border border-gray-300 rounded text-left bg-gray-100"
                                                    value={repuesto.costoUnitario}
                                                    readOnly
                                                />
                                            </td>

                                            {/* === Costo Total === */}
                                            <td className="px-2 py-3">
                                                <input
                                                    type="number"
                                                    className="w-24 p-2 border border-gray-300 rounded text-left bg-gray-100"

                                                    value={repuesto.costoTotal}
                                                    readOnly
                                                />
                                            </td>

                                            {/* === Factor Venta === */}
                                            <td className="px-2 py-3">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="w-20 p-2 border border-gray-300 rounded text-center"
                                                    value={repuesto.factorVenta}
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
                                                    type="number"
                                                    readOnly
                                                    className="w-24 p-2 border border-gray-300 rounded text-left bg-gray-100"
                                                    value={repuesto.ventaUnitaria}
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
                                                    type="number"
                                                    className="w-24 p-2 border border-gray-300 rounded text-left bg-gray-100"
                                                    value={repuesto.ventaTotal}
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
                                    Subtotal costos: ${subtotalCostosRepuestos.toLocaleString()}
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
                    onClick={() => toggleSeccion('manoObra')}
                >
                    <h2 className="text-lg font-semibold text-blue-800">Mano de Obra</h2>
                    {secciones.manoObra ? <FaChevronUp /> : <FaChevronDown />}
                </div>

                {secciones.manoObra && (
                    <div className="bg-white p-4 border-t border-gray-200">
                        <div className="flex justify-between mb-4">
                            <h3 className="text-md font-medium">Lista de operaciones</h3>
                            <button
                                className="bg-black text-white px-4 py-1 rounded"
                                onClick={agregarManoDeObra}
                            >
                                Agregar
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Descripción
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Tipo
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Cantidad
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Contratista
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Costo Unitario
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Costo Total
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Factor de Venta
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Venta Unitaria
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            Venta Total
                                        </th>
                                        <th className="px-4 py-2"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {manoDeObra.map(item => (
                                        <tr key={item.id} className="border-b border-gray-100">

                                            <td className="px-2 py-3">
                                                <select
                                                    className="w-50 p-2 border border-gray-300 rounded"
                                                    value={item.idManpower || ""}
                                                    onChange={e => actualizarManoDeObra(item.id, "idManpower", e.target.value)}
                                                >
                                                    <option value="">Seleccione mano de obra</option>
                                                    {manpowers.map(mp => (
                                                        <option key={mp.idManpower} value={mp.idManpower}>
                                                            {mp.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>


                                            <td className="px-2 py-3">
                                                <input
                                                    className="w-23 p-2 border border-gray-300 rounded text-left bg-gray-100"
                                                    value={item.tipo}
                                                    readOnly
                                                >
                                                </input>
                                            </td>


                                            <td className="px-2 py-3">
                                                <input

                                                    type="number"
                                                    min="1"
                                                    className="w-20 p-2 border border-gray-300 rounded text-center"
                                                    value={item.cantidad}
                                                    onChange={e =>
                                                        actualizarManoDeObra(
                                                            item.id,
                                                            'cantidad',
                                                            parseInt(e.target.value, 10) || 0
                                                        )
                                                    }
                                                />
                                            </td>


                                            <td className="px-2 py-3">
                                                <select

                                                    className="w-34 p-2 border border-gray-300 rounded text-left bg-gray-100"
                                                    value={item.contratista}

                                                    onChange={e =>
                                                        actualizarManoDeObra(
                                                            item.id,
                                                            'contratista',
                                                            e.target.value
                                                        )
                                                    }
                                                >
                                                    <option value="">Selecciona contratista</option>
                                                    {userOptions
                                                        .filter(u => u.role?.name === 'Contratista')
                                                        .map(u => (
                                                            <option key={u.idUser} value={u.idUser}>
                                                                {u.firstName + ' ' + u.lastName}
                                                            </option>
                                                        ))}
                                                </select>
                                            </td>


                                            <td className="px-2 py-3">
                                                <input
                                                    type="number"
                                                    className="w-24 p-2 border border-gray-300 rounded text-left bg-gray-100"
                                                    readOnly
                                                    value={item.unitaryCost}
                                                    onChange={e =>
                                                        actualizarManoDeObra(
                                                            item.id,
                                                            'unitaryCost',
                                                            parseFloat(e.target.value) || 0
                                                        )
                                                    }
                                                />
                                            </td>


                                            <td className="px-2 py-3">
                                                <input
                                                    type="number"
                                                    className="w-24 p-2 border border-gray-300 rounded text-left bg-gray-100"
                                                    value={item.totalCost}
                                                    readOnly
                                                />
                                            </td>


                                            <td className="px-2 py-3">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="w-20 p-2 border border-gray-300 rounded text-center"
                                                    value={item.sellFactor}
                                                    onChange={e =>
                                                        actualizarManoDeObra(
                                                            item.id,
                                                            'sellFactor',
                                                            parseFloat(e.target.value) || 0
                                                        )
                                                    }
                                                />
                                            </td>


                                            <td className="px-2 py-3">
                                                <input
                                                    type="number"
                                                    className="w-24 p-2 border border-gray-300 rounded text-left bg-gray-100"
                                                    value={item.unitSell}
                                                    readOnly
                                                />
                                            </td>


                                            <td className="px-2 py-3">
                                                <input
                                                    type="number"
                                                    className="w-24 p-2 border border-gray-300 rounded text-left bg-gray-100"
                                                    value={item.totalSell}
                                                    readOnly
                                                />
                                            </td>


                                            <td className="px-2 py-3 text-center">
                                                <button
                                                    className="text-red-500"
                                                    onClick={() => eliminarManoDeObra(item.id)}
                                                >
                                                    <FaTimes />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end mt-4 space-x-6">
                            <div className="text-right">
                                <p className="font-medium">Subtotal costos de mano de obra: ${subtotalCostosManoObra.toLocaleString()}</p>
                                <p className="font-medium">Subtotal venta mano de obra: ${subtotalVentasManoObra.toLocaleString()}</p>
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
                                    <span className="font-medium">${subtotalCostosRepuestos.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Subtotal costos de mano de obra:</span>
                                    <span className="font-medium">${subtotalCostosManoObra.toLocaleString()}</span>
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





