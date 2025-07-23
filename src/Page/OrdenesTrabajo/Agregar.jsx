import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { FaChevronUp, FaChevronDown, FaTimes } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Listbox } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/solid'



function usePrevious(value) {
    const ref = useRef();
    useEffect(() => {
        ref.current = value;
    }, [value]);
    return ref.current;
}



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
        cedulaConductor: '',
        numeroCotizacion: '',
        fechaCotizacion: '',
        fechaFacturacion: '',
        cotizadoPor: '',
        numeroFacturacion: '',
        facturadoPor: '',
        numeroActaEntrega: '',
        nombreSolicitud: '',
        hoursUntilBilling: null,

       
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
    const [allContacts, setAllContacts] = useState([]);
    const [contactosData, setContactosData] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [contactosDisponibles, setContactosDisponibles] = useState([]);
    const [supplyOptions, setSupplyOptions] = useState([])
    const [contactosSeleccionados, setContactosSeleccionados] = useState([]);
    const roundToHundred = (value) => Math.ceil(value / 100) * 100;

    const [userOffset, setUserOffset] = useState(0);
    const [hasMoreUsers, setHasMoreUsers] = useState(true);
    const LIMIT_USERS = 50;

    const [clientOffset, setClientOffset] = useState(0);
    const [hasMoreClients, setHasMoreClients] = useState(true);
    const LIMIT_CLIENTS = 50;

    const [driverOffset, setDriverOffset] = useState(0);
    const [hasMoreDrivers, setHasMoreDrivers] = useState(true);
    const LIMIT_DRIVERS = 50;

    const [vehiculeOffset, setVehiculeOffset] = useState(0);
    const [hasMoreVehicules, setHasMoreVehicules] = useState(true);
    const LIMIT_VEHICULES = 50;

    const [opcOffset, setOpcOffset] = useState(0);
    const [hasMoreOpc, setHasMoreOpc] = useState(true);
    const LIMIT_OPC = 50;

    const PAG_LIMIT = 50;
    const prevStatus = usePrevious(formulario.orderStatusId);
    const didMount = useRef(false);


    const fetchMoreOpcRepuestos = async () => {
        if (!hasMoreOpc) return

        const resp = await axios.get(`${API_URL}/spare-part-material`, {
            params: { filter: 'Activo', limit: LIMIT_OPC, offset: opcOffset }
        })

        const nuevos = resp.data?.data || []
        const total = resp.data?.total || nuevos.length

        setOpcRepuestos(prev => {

            const combinado = [...prev, ...nuevos]
            const unico = combinado.filter((m, i, a) =>
                a.findIndex(x => x.idSparePartMaterial === m.idSparePartMaterial) === i
            )
            if (unico.length >= total) setHasMoreOpc(false)
            return unico
        })

        setOpcOffset(o => o + LIMIT_OPC)
    }


    const fetchMoreVehicules = async () => {
        if (!hasMoreVehicules) return;

        const resp = await axios.get(`${API_URL}/vehicule`, {
            params: { limit: LIMIT_VEHICULES, offset: vehiculeOffset, filter: 'Activo' }
        });
        const nuevos = resp.data?.data || [];
        const total = resp.data?.total || nuevos.length;

        setVehiculeOptions(prev => {

            const combinado = [...prev, ...nuevos];

            const unique = combinado.filter((v, i, arr) =>
                arr.findIndex(x => x.idVehicule === v.idVehicule) === i
            );

            if (unique.length >= total) setHasMoreVehicules(false);
            return unique;
        });

        setVehiculeOffset(o => o + LIMIT_VEHICULES);
    };


    const fetchMoreDrivers = useCallback(async () => {
        if (!hasMoreDrivers) return;
        try {
            const resp = await axios.get(`${API_URL}/driver`, {
                params: {
                    limit: LIMIT_DRIVERS,
                    offset: driverOffset,
                    filter: 'Activo'
                }
            });
            const nuevos = resp.data?.data || resp.data || [];
            const total = resp.data?.total || nuevos.length;

            setDriverOptions(prev => {
                
                const seen = new Set(prev.map(d => d.idDriver));
                const unidos = [...prev, ...nuevos.filter(d => !seen.has(d.idDriver))];
                if (unidos.length >= total) setHasMoreDrivers(false);
                return unidos;
            });

            setDriverOffset(off => off + LIMIT_DRIVERS);
        } catch (e) {
            console.error('Error cargando más conductores:', e);
        }
    }, [driverOffset, hasMoreDrivers]);


    const fetchMoreUsers = async () => {
        if (!hasMoreUsers) return;

        const resp = await axios.get(`${API_URL}/user`, {
            params: { limit: LIMIT_USERS, offset: userOffset }
        });

        const nuevos = resp.data?.data || [];
        const total = resp.data?.total || nuevos.length;

        setUserOptions(prev => {
            const ids = new Set();
            const combinados = [...prev, ...nuevos];
            const unicos = combinados.filter(u => {
                if (ids.has(u.idUser)) return false;
                ids.add(u.idUser);
                return true;
            });

           
            if (unicos.length >= total) {
                setHasMoreUsers(false);
            }

            return unicos;
        });

        setUserOffset(prev => prev + LIMIT_USERS);
    };


    const fetchMoreClients = async () => {
        if (!hasMoreClients) return;

        const resp = await axios.get(`${API_URL}/client`, {
            params: { limit: LIMIT_CLIENTS, offset: clientOffset }
        });

        const nuevos = resp.data?.data || [];
        const total = resp.data?.total || nuevos.length;

        setClientOptions(prev => [...prev, ...nuevos]);

        if (clientOptions.length + nuevos.length >= total) {
            setHasMoreClients(false);
        } else {
            setClientOffset(prev => prev + LIMIT_CLIENTS);
        }
    };


    useEffect(() => {

        fetchMoreDrivers();
        fetchMoreVehicules();
        fetchMoreOpcRepuestos();
    }, []);

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
            
            if (isNaN(fecha.getTime())) return '';

          
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
        
        const horas = String(fecha.getHours()).padStart(2, '0');
        const minutos = String(fecha.getMinutes()).padStart(2, '0');
        return `${horas}:${minutos}`;
    }
    
    useEffect(() => {
        const cargarDatosIniciales = async () => {
            try {
               
                const requests = [
                    axios.get(`${API_URL}/order-status`).catch(() => ({ data: [] })),
                    axios.get(`${API_URL}/spare-part-material`, { params: { filter: 'Activo', limit: PAG_LIMIT, offset: 0 } }),
                    axios.get(`${API_URL}/service-type`).catch(() => ({ data: [] })),
                    axios.get(`${API_URL}/vehicule-type`, { params: { limit: PAG_LIMIT, offset: 0 } }),
                    axios.get(`${API_URL}/user`, { params: { limit: PAG_LIMIT, offset: 0, filter: 'Activo' } }),
                    
                    axios.get(`${API_URL}/provider`, { params: { limit: PAG_LIMIT, offset: 0, filter: 'Activo' } }),
                    axios.get(`${API_URL}/client`, { params: { limit: PAG_LIMIT, offset: 0, filter: 'Activo' } }),
                    axios.get(`${API_URL}/manpower`, { params: { filter: 'Activo', limit: PAG_LIMIT, offset: 0 } }),
                    axios.get(`${API_URL}/vehicule`, { params: { limit: PAG_LIMIT, offset: 0, filter: 'Activo' } }),
                    axios.get(`${API_URL}/contacts`, { params: { limit: PAG_LIMIT, offset: 0, filter: 'Activo' } }),
                    axios.get(`${API_URL}/supply`, { params: { filter: 'Activo', limit: PAG_LIMIT, offset: 0 } }),
                ];

                const [
                    statusResp,
                    repuestosResp,
                    serviceResp,
                    vehicleTypeResp,
                    userResp,
                   
                    proveedoresResp,
                    clientResp,
                    manpowerResp,
                    vehiculeResp,
                    contactsResp,
                    supplyResp
                ] = await Promise.all(requests);

               
                const contactosArray = Array.isArray(contactsResp.data.data)
                    ? contactsResp.data.data
                    : Array.isArray(contactsResp.data)
                        ? contactsResp.data
                        : [];

                setAllContacts(contactosArray);
                setContactosData(contactosArray);

              
                const rawProv = proveedoresResp.data;
                const listaProveedores = Array.isArray(rawProv)
                    ? rawProv
                    : Array.isArray(rawProv.data)
                        ? rawProv.data
                        : [];
                setProveedores(listaProveedores);

              
                const rawSupply = supplyResp.data;
                const listaSupply = Array.isArray(rawSupply)
                    ? rawSupply
                    : Array.isArray(rawSupply.data)
                        ? rawSupply.data
                        : [];
                setSupplyOptions(listaSupply);

               
                setStatusOptions(statusResp.data || []);
                setOpcRepuestos(
                    Array.isArray(repuestosResp.data)
                        ? repuestosResp.data
                        : repuestosResp.data?.data || []
                );
                setServiceTypeOptions(serviceResp.data || []);
                setVehicleTypeOptions(vehicleTypeResp.data || []);
                setUserOptions(userResp.data?.data || userResp.data || []);
                setClientOptions(clientResp.data?.data || clientResp.data || []);
                const rawManpowers = Array.isArray(manpowerResp.data)
                    ? manpowerResp.data
                    : Array.isArray(manpowerResp.data?.data)
                        ? manpowerResp.data.data
                        : [];
                const activeManpowers = rawManpowers.filter(mp => mp.active === true);
                setManpowers(activeManpowers);
                setVehiculeOptions(
                    vehiculeResp.data?.data || vehiculeResp.data || []
                );

                setOpcionesCargadas(true);
            } catch (error) {
                toast.error("Error al cargar las opciones iniciales");
                setOpcionesCargadas(true);
            }
        };

        cargarDatosIniciales();
    }, []);



    useEffect(() => {
        
        if (!didMount.current) {
            didMount.current = true;
            return;
        }

        const estado = statusOptions.find(s => s.idOrderStatus === formulario.orderStatusId);

       
        if (
            prevStatus !== formulario.orderStatusId &&
            estado?.name === 'Cotización Elaborada' &&
            formulario.fechaCreacion &&
            formulario.hoursUntilBilling == null
        ) {
            const diffH = Math.floor(
                (Date.now() - new Date(formulario.fechaCreacion).getTime())
                / (1000 * 60 * 60)
            );
            setFormulario(f => ({ ...f, hoursUntilBilling: diffH }));
        }
    }, [formulario.orderStatusId, formulario.fechaCreacion, statusOptions]);




    useEffect(() => {
        if (!isEdit || !id || !opcionesCargadas) return;

        const cargarDatosOrden = async () => {
            try {
                const resp = await axios.get(`${API_URL}/order/${id}`);


              
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



                const usuariosFaltantes = asignadosBackend.filter(
                    id => !userOptions.some(u => u.idUser === id)
                );

                for (const id of usuariosFaltantes) {
                    const respUser = await axios.get(`${API_URL}/user/${id}`);
                    setUserOptions(prev => [...prev, respUser.data]);
                }

                const pricedById = orden.pricings?.[0]?.pricedBy?.idUser;
                const billedById = orden.billings?.[0]?.billedBy?.idUser;

               
                const faltantes = [];
                if (pricedById && !userOptions.some(u => u.idUser === pricedById)) {
                    faltantes.push(pricedById);
                }
                if (billedById && !userOptions.some(u => u.idUser === billedById)) {
                    faltantes.push(billedById);
                }

                
                if (faltantes.length) {
                    const respuestas = await Promise.all(
                        faltantes.map(uid => axios.get(`${API_URL}/user/${uid}`))
                    );
                    setUserOptions(prev => [
                        ...prev,
                        ...respuestas.map(r => r.data.data || r.data)
                    ]);
                }

                setFormulario(prev => ({
                    ...prev,
                    numeroOrden: orden.orderNumber || '',
                    fechaCreacion: orden.createdAt,
                    horaCreacion: formatearHoraLocal(orden.createdAt),
                    hoursUntilBilling: orden.hoursUntilBilling ?? null,
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
                    cedulaConductor: orden.assignedDriver?.document?.documentNumber || '',
                    nombreSolicitud: orden.contacts?.find(c => c.isPrincipalContact)?.name || '',
                    numeroCotizacion: orden.pricings?.[0]?.pricingNumber || '',
                    fechaCotizacion: toInputDate(orden.pricings?.[0]?.pricingDate),
                    cotizadoPor: pricedById || '',
                    
                    numeroFacturacion: orden.billings?.[0]?.billingNumber || '',
                    fechaFacturacion: toInputDate(orden.billings?.[0]?.billingDate),
                    facturadoPor: billedById || '',
                    numeroActaEntrega: orden.billings?.[0]?.actNumber || '',
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

                
                if (Array.isArray(orden.sparePartMaterials)) {
                    const repuestosData = orden.sparePartMaterials.map((spm, idx) => ({
                        id: idx + 1,
                        idSparePartMaterial: spm.sparePartMaterial?.idSparePartMaterial || '',
                        useDetail: spm.useDetail || '',
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

                if (Array.isArray(orden.manpowers)) {
                    const manoObraData = orden.manpowers.map((mp, idx) => {
                        const cantidad = Number(mp.cantidad) || 0;
                        const costoManoUnit = Number(mp.unitaryCost) || 0;
                        const factorVenta = Number(mp.factorVenta) || 1;


                       
                        const insumos = Array.isArray(mp.supplies)
                            ? mp.supplies.map(sup => {
                                const qty = Number(sup.cantidad) || 0;
                                const cu = Number(sup.unitaryCost) || 0;
                                const ct = Number(sup.costoTotal) || qty * cu;
                                return {
                                    supply: sup.supply?.idSupply || '',
                                    useDetail: sup.useDetail || '',
                                    selectedProvider: sup.selectedProvider?.idProvider || '',
                                    cantidad: qty,
                                    unitaryCost: cu,
                                    costoTotal: ct
                                };
                            })
                            : [];

                        
                        const totalInsumos = insumos.reduce((s, i) => s + i.costoTotal, 0);
                        const unitInsumo = cantidad > 0 ? totalInsumos / cantidad : 0;
                        const unitConInsumos = costoManoUnit + unitInsumo;

                       
                        const unitSell = roundToHundred(unitConInsumos / factorVenta);
                        const totalSell = roundToHundred(unitSell * cantidad);

                        return {
                            id: idx + 1,
                            idManpower: mp.manpower?.idManpower || '',
                            descripcion: mp.manpower?.name || '',
                            useDetail: mp.useDetail || '',
                            cantidad,
                            unitaryCost: costoManoUnit,
                            contratista:
                                mp.selectedContractor?.idUser ||
                                mp.contractor?.idUser ||
                                '',
                            totalCost: Number((costoManoUnit * cantidad).toFixed(2)),
                            unitaryCostInsumo: Number(unitInsumo.toFixed(2)),
                            totalCostInsumos: Number(totalInsumos.toFixed(2)),
                            unitCostWithSupplies: Number(unitConInsumos.toFixed(2)),
                            totalCostWithSupplies: Number((unitConInsumos * cantidad).toFixed(2)),
                            sellFactor: factorVenta,
                            unitSell,
                            totalSell,
                            insumos
                        };
                    });
                    setManoDeObra(manoObraData);
                }

                /*  if (Array.isArray(orden.pricings) && orden.pricings.length) {
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
                  }*/
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
        
        const rawSubRep = repuestos.reduce((sum, r) => sum + (r.ventaTotal || 0), 0);
        const subtotalVentasRepuestos = roundToHundred(rawSubRep);

       
        const rawSubMan = manoDeObra.reduce((sum, m) => sum + (m.totalSell || 0), 0);
        const subtotalVentasManoObra = roundToHundred(rawSubMan);

      
        const subtotalVentas = subtotalVentasRepuestos + subtotalVentasManoObra;

      
        const iva = subtotalVentas * 0.19;
        

      
        const totalVenta = roundToHundred(subtotalVentas + iva);

        return {
            subtotalCostosRepuestos: roundToHundred(
                repuestos.reduce((sum, r) => sum + (r.costoTotal || 0), 0)
            ),
            subtotalVentasRepuestos,
            subtotalCostosManoObra: roundToHundred(
                manoDeObra.reduce((sum, m) => {
                    const costoMano = m.totalCost || 0;
                    const costoInsumos = (m.insumos || []).reduce((s, i) => s + (i.costoTotal || 0), 0);
                    return sum + costoMano + costoInsumos;
                }, 0)
            ),
            subtotalVentasManoObra,
            subtotalCostos: roundToHundred(
             
                repuestos.reduce((sum, r) => sum + (r.costoTotal || 0), 0) +
                manoDeObra.reduce((sum, m) => {
                    const costoMano = m.totalCost || 0;
                    const costoInsumos = (m.insumos || []).reduce((s, i) => s + (i.costoTotal || 0), 0);
                    return sum + costoMano + costoInsumos;
                }, 0)
            ),
            subtotalVentas: roundToHundred(subtotalVentas),
            iva,
            totalVenta
        };
    };

    const procesarContactosCliente = (clienteId) => {
        const contactosCliente = allContacts.filter(contacto =>
            contacto.client?.idClient === clienteId && contacto.active
        );

        const contactoPrincipal = contactosCliente.find(contacto => contacto.isPrincipalContact);
        const contactosSecundarios = contactosCliente.filter(contacto => !contacto.isPrincipalContact);

       
        if (contactoPrincipal) {
            setFormulario(prev => ({
                ...prev,
                nombreSolicitud: contactoPrincipal.name
            }));
        }

        
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

       if (user?.role?.name === 'Coordinador de Operaciones') {
            const invalidRepuestos = repuestos.some(r =>
                Number(r.costoUnitario) <= 0 || Number(r.ventaUnitaria) <= 0
            );
            const invalidMano = manoDeObra.some(m =>
                Number(m.unitaryCost) <= 0 || Number(m.unitSell) <= 0
            );
            const invalidInsumos = manoDeObra.some(m =>
                (m.insumos || []).some(i => Number(i.unitaryCost) <= 0)
            );
            if (invalidRepuestos || invalidMano || invalidInsumos) {
                toast.info('Ningún costo o precio unitario puede ser 0 en repuestos, mano de obra o insumos.');
            
            }
        }
        
        if (
            !formulario.Asignado.length ||
            !formulario.orderStatusId ||
            formulario.tipoServicio.length === 0
        ) {
            toast.error('Debes completar la sección "Información de la Orden"');
            setSecciones(s => ({ ...s, infoOrden: true }));
            return;
        }

       
        if (
            !formulario.vehicule ||
           
            !formulario.conductor
        ) {
            toast.error('Debes completar la sección "Información del Vehículo"');
            setSecciones(s => ({ ...s, infoVehiculo: true }));
            return;
        }

        
        if (
            !formulario.cliente
        ) {
            toast.error('Debes completar la sección "Información del Cliente"');
            setSecciones(s => ({ ...s, infoCliente: true }));
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
            ?.filter(st => st && st !== '' && st !== 'undefined' && st !== 'null')
            .map(st => st?.toString())
            .filter(st => st.length > 0) || null;

        const orderStatusValido = formulario.orderStatusId && formulario.orderStatusId !== ''
            ? formulario.orderStatusId.toString()
            : null;

        const isTrabajoRealizado = formulario.orderStatusId === idTrabajoRealizado;

        
        const payloadOrder = {
           
            assignTo: formulario.Asignado,            
            outDate: isTrabajoRealizado
                ? crearFechaValida(formulario.fechaSalida, formulario.horaSalida)
                : null,
            orderStatus: orderStatusValido,            
            serviceTypes: serviceTypesValidos,         
            client: formulario.cliente || null,        
            vehicule: formulario.vehicule || null,     
            assignedDriver: formulario.conductor || null, 


            kilometers: formulario.kmSalida ? parseInt(formulario.kmSalida) : null,

            pricings: formulario.numeroCotizacion
                ? [{
                    pricingNumber: formulario.numeroCotizacion,
                    pricingDate: crearFechaValida(formulario.fechaCotizacion),
                    pricedBy: formulario.cotizadoPor || null,
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
                useDetail: r.useDetail || null,
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
                    useDetail: s.useDetail || null,
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
            ...(formulario.hoursUntilBilling != null && {
                hoursUntilBilling: formulario.hoursUntilBilling
            })
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



    const agregarInsumo = (manoId) => {
        setManoDeObra(prev =>
            prev.map(m =>
                m.id === manoId
                    ? {
                        ...m,
                        insumos: [
                            ...(m.insumos || []),
                            { supply: '', useDetail: '', cantidad: '', selectedProvider: '', unitaryCost: '', costoTotal: 0 }
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

                
                const nuevosInsumos = [...(m.insumos || [])];
                const ins = { ...nuevosInsumos[idx], [campo]: valor };

               
                if (campo === 'cantidad' || campo === 'unitaryCost') {
                    const qty = parseFloat(ins.cantidad) || 0;
                    const cost = parseFloat(ins.unitaryCost) || 0;
                    ins.costoTotal = parseFloat((qty * cost).toFixed(2));
                }
                nuevosInsumos[idx] = ins;

             
                const cantidad = parseFloat(ins.cantidad) || 0;
                const costoUnitMano = parseFloat(m.unitaryCost) || 0;
                const factorVenta = parseFloat(m.sellFactor) || 1;

                
                const totalInsumos = nuevosInsumos.reduce((sum, i) => sum + (parseFloat(i.costoTotal) || 0), 0);
                const unitInsumo = cantidad > 0 ? totalInsumos / cantidad : 0;

                
                const totalMano = costoUnitMano * cantidad;

              
                const unitManoMasIns = costoUnitMano + unitInsumo;
                const totalManoMasIns = unitManoMasIns * cantidad;

              
                const unitSellRaw = unitManoMasIns / factorVenta;
                const unitSell = roundToHundred(unitSellRaw);
                const totalSell = roundToHundred(unitSell * cantidad);

                return {
                    ...m,
                    insumos: nuevosInsumos,
                   
                    totalCost: parseFloat(totalMano.toFixed(2)),
                    unitaryCostInsumo: parseFloat(unitInsumo.toFixed(2)),
                    totalCostInsumos: parseFloat(totalInsumos.toFixed(2)),
                    unitCostWithSupplies: parseFloat(unitManoMasIns.toFixed(2)),
                    totalCostWithSupplies: parseFloat(totalManoMasIns.toFixed(2)),
                    
                    unitSell,
                    totalSell,
                };
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



    
    const agregarRepuesto = () => {
        const nuevoId = repuestos.length
            ? Math.max(...repuestos.map(r => r.id)) + 1
            : 1;

        setRepuestos([
            ...repuestos,
            {
                id: nuevoId,
                idSparePartMaterial: '',
                useDetail: '',
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

    const handleDetalleChange = (idFila, nuevoTexto) => {
        actualizarRepuesto(idFila, 'useDetail', nuevoTexto);
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

                let nuevaCantidad = parseFloat(valorString);
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


                const cantidad = parseFloat(copia.cantidad) || 0;
                const costoUnit = parseFloat(copia.costoUnitario) || 0;
                const factor = parseFloat(copia.factorVenta) || 1;


                const costoTotal = parseFloat((cantidad * costoUnit).toFixed(2));
                const ventaUnitaria = factor
                    ? parseFloat((costoUnit / factor).toFixed(2))
                    : 0;
                const ventaTotal = parseFloat((cantidad * ventaUnitaria).toFixed(2));

                return {
                    ...copia,
                    costoTotal,
                    ventaUnitaria,
                    ventaTotal
                };
            })
        );
    };

    const isContractor = ['Contratista', 'Colaborador', 'Mecánico'].includes(
        user?.role?.name
    );
    const userId = user?.idUser;

    const manoDeObraVisibles = isContractor
        ? manoDeObra.filter(m => m.contratista === userId)
        : manoDeObra;

    const agregarManoDeObra = () => {
        const nuevoId = manoDeObra.length
            ? Math.max(...manoDeObra.map(m => m.id)) + 1
            : 1;

        setManoDeObra([
            ...manoDeObra,
            {
                id: nuevoId,
                idManpower: '',
                useDetail: '',
                cantidad: '',
                unitaryCost: '',
                totalCost: '',
                unitaryCostInsumo: '',
                totalCostInsumos: '',
                unitCostWithSupplies: '',
                totalCostWithSupplies: '',
                sellFactor: '',
                unitSell: '',
                totalSell: '',
                insumos: [],
                contratista: isContractor ? userId : '',


            }
        ]);
    };


    const eliminarManoDeObra = (id) => {
        setManoDeObra(prev =>
            prev.filter(m =>
                isContractor ? !(m.id === id && m.contratista === userId) : m.id !== id
            )
        );
    };

    const actualizarManoDeObra = (id, campo, valor) => {
        setManoDeObra(prev =>
            prev.map(m => {
                if (m.id !== id) return m;

               
                const copia = { ...m, [campo]: valor };

              
                const cantidad = Number(copia.cantidad) || 0;
                const costMano = Number(copia.unitaryCost) || 0;
                const factor = Number(copia.sellFactor) || 1;
                const totalInsumos = (copia.insumos || [])
                    .reduce((s, i) => s + (Number(i.costoTotal) || 0), 0);
                const unitInsumo = cantidad > 0 ? totalInsumos / cantidad : 0;
                const unitConIns = costMano + unitInsumo;

                
                const unitSell = roundToHundred(unitConIns / factor);
                const totalSell = roundToHundred(unitSell * cantidad);

                return {
                    ...copia,
                    totalCost: Number((costMano * cantidad).toFixed(2)),
                    unitaryCostInsumo: Number(unitInsumo.toFixed(2)),
                    totalCostInsumos: Number(totalInsumos.toFixed(2)),
                    unitCostWithSupplies: Number(unitConIns.toFixed(2)),
                    totalCostWithSupplies: Number((unitConIns * cantidad).toFixed(2)),
                    unitSell,
                    totalSell,
                };
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


    const handleSelectDriver = async (driverId) => {

        setFormulario(f => ({ ...f, conductor: driverId }));


        let docNumber =
            driverOptions.find(d => d.idDriver === driverId)?.document?.documentNumber;


        if (!docNumber) {
            try {
                const { data } = await axios.get(`${API_URL}/driver/${driverId}`);
                docNumber = data.document?.documentNumber || '';

                setDriverOptions(prev => [...prev, data]);
            } catch (e) {
                console.error('No se pudo traer la cédula del conductor', e);
            }
        }


        setFormulario(f => ({ ...f, cedulaConductor: docNumber }));
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





   
    const subtotalCostosRepuestosRaw = repuestos
        .reduce((acc, r) => acc + (r.costoTotal || 0), 0);
    const subtotalCostosRepuestos = roundToHundred(subtotalCostosRepuestosRaw);

    const subtotalVentasRepuestosRaw = repuestos
        .reduce((acc, r) => acc + (r.ventaTotal || 0), 0);
    const subtotalVentasRepuestos = roundToHundred(subtotalVentasRepuestosRaw);

 
    const subtotalCostosManoObraRaw = manoDeObra
        .reduce((sum, m) => sum + (m.totalCostWithSupplies || 0), 0);
    const subtotalCostosManoObra = roundToHundred(subtotalCostosManoObraRaw);

    const subtotalVentasManoObraRaw = manoDeObra
        .reduce((sum, m) => sum + (m.totalSell || 0), 0);
    const subtotalVentasManoObra = roundToHundred(subtotalVentasManoObraRaw);

  
    const subtotalCostos = subtotalCostosRepuestos + subtotalCostosManoObra;

    const subtotalVentasRaw = subtotalVentasRepuestos + subtotalVentasManoObra;
    const subtotalVentas = roundToHundred(subtotalVentasRaw);

    const iva = subtotalVentas * 0.19;
    

    const totalVentaRaw = subtotalVentas + iva;
    const totalVenta = roundToHundred(totalVentaRaw);


    const roleOptions = userOptions
        .filter(u =>
            ['Contratista', 'Colaborador', 'Mecánico'].includes(u.role?.name) &&
            u.active === true &&
            u.userStatus?.name === 'Activo'
        )
        .map(u => ({
            value: u.idUser,
            label: `${u.firstName} ${u.lastName}`
        }));


    const uniqueRoleOptions = roleOptions.filter((opt, i, arr) =>
        arr.findIndex(o => o.value === opt.value) === i
    );

    const visiblesRepuestos = opcRepuestos.filter(mat => mat.active)

    const uniqueUserOptions = React.useMemo(() => {
        return userOptions

            .filter(u => u.active && u.userStatus?.name === 'Activo')

            .reduce((acc, u) => {
                if (!acc.some(x => x.idUser === u.idUser)) acc.push(u);
                return acc;
            }, []);
    }, [userOptions]);

    const observerUsers = useRef();
    const lastUserRef = useCallback(node => {
        if (!hasMoreUsers) return;
        if (observerUsers.current) observerUsers.current.disconnect();
        observerUsers.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                fetchMoreUsers();
            }
        });
        if (node) observerUsers.current.observe(node);
    }, [hasMoreUsers, userOffset]);

    const observerClients = useRef();
    const lastClientRef = useCallback(node => {
        if (!hasMoreClients) return;
        if (observerClients.current) observerClients.current.disconnect();
        observerClients.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                fetchMoreClients();
            }
        });
        if (node) observerClients.current.observe(node);
    }, [hasMoreClients, clientOffset]);


    const observerDrivers = useRef();
    const lastDriverRef = useCallback(node => {
        if (!hasMoreDrivers) return;
        if (observerDrivers.current) observerDrivers.current.disconnect();
        observerDrivers.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) fetchMoreDrivers();
        });
        if (node) observerDrivers.current.observe(node);
    }, [hasMoreDrivers, fetchMoreDrivers]);

    const observerVehicules = useRef();
    const lastVehiculeRef = useCallback(node => {
        if (!hasMoreVehicules) return;
        if (observerVehicules.current) observerVehicules.current.disconnect();
        observerVehicules.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) fetchMoreVehicules();
        });
        if (node) observerVehicules.current.observe(node);
    }, [hasMoreVehicules, vehiculeOffset]);

    const observerOpc = useRef();
    const lastOpcRef = useCallback(node => {
        if (!hasMoreOpc) return;
        if (observerOpc.current) observerOpc.current.disconnect();
        observerOpc.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) fetchMoreOpcRepuestos();
        });
        if (node) observerOpc.current.observe(node);
    }, [hasMoreOpc, opcOffset]);


    const alfabeticamente = (a, b) =>
        a.name?.localeCompare(b.name, 'es', { sensitivity: 'base' });

    const ROLES = ['Administrador', 'Coordinador de Operaciones'];

    const RolFacturacion = uniqueUserOptions.filter(
        u => ROLES.includes(u.role?.name)
    );

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
                                                {uniqueRoleOptions
                                                    .filter(o => formulario.Asignado.includes(o.value))
                                                    .map(o => o.label)
                                                    .join(', ') || 'Selecciona colaboradores'}
                                            </span>
                                            <ChevronUpDownIcon className="w-5 h-5 text-gray-400" />
                                        </Listbox.Button>

                                        <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none">
                                            {uniqueRoleOptions.map((opt, idx) => {
                                                const isLast = idx === uniqueRoleOptions.length - 1;
                                                return (
                                                    <Listbox.Option
                                                        key={opt.value}               // ahora único
                                                        value={opt.value}
                                                        ref={isLast ? lastUserRef : null}
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
                                                                    {opt.label}
                                                                </span>
                                                                {selected && (
                                                                    <CheckIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-600" />
                                                                )}
                                                            </>
                                                        )}
                                                    </Listbox.Option>
                                                );
                                            })}
                                        </Listbox.Options>
                                    </div>
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


            {/* informacion del vehiculo  */}

            <div className="mb-4 border border-gray-200 rounded-lg overflow-visible">
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
                                <Listbox
                                    value={formulario.vehicule}
                                    onChange={val => handleVehiculeSelect({ target: { name: 'vehicule', value: val } })}
                                >
                                    <Listbox.Label className="block text-sm font-medium text-gray-700 mb-1">
                                        Placa cabezote
                                    </Listbox.Label>
                                    <div className="relative">
                                        <Listbox.Button className="w-full p-2 border border-gray-300 rounded bg-white flex justify-between items-center">
                                            <span className="truncate">
                                                {vehiculeOptions.find(v => v.idVehicule === formulario.vehicule)
                                                    ? vehiculeOptions.find(v => v.idVehicule === formulario.vehicule).placaCabezote
                                                    : 'Selecciona una placa'}
                                            </span>
                                            <ChevronUpDownIcon className="w-5 h-5 text-gray-400" />
                                        </Listbox.Button>
                                        <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 overflow-auto">
                                            {vehiculeOptions.map((v, idx) => {
                                                const isLast = idx === vehiculeOptions.length - 1;
                                                return (
                                                    <Listbox.Option
                                                        key={v.idVehicule}
                                                        value={v.idVehicule}
                                                        ref={isLast ? lastVehiculeRef : null}
                                                        className={({ active }) =>
                                                            `cursor-pointer select-none relative py-2 pl-8 pr-4 ${active ? 'bg-blue-100' : ''}`
                                                        }
                                                    >
                                                        {({ selected }) => (
                                                            <>
                                                                <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                                    {v.placaCabezote}
                                                                </span>
                                                                {selected && (
                                                                    <CheckIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-600" />
                                                                )}
                                                            </>
                                                        )}
                                                    </Listbox.Option>
                                                );
                                            })}
                                        </Listbox.Options>
                                    </div>
                                </Listbox>


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
                                <Listbox
                                    value={formulario.conductor}
                                    onChange={handleSelectDriver}
                                >
                                    <Listbox.Label className="block text-sm font-medium text-gray-700 mb-1">
                                        Conductor *
                                    </Listbox.Label>
                                    <div className="relative">
                                        <Listbox.Button className="w-full border border-gray-300 rounded-md p-2 flex justify-between items-center bg-white">
                                            <span className="truncate">
                                                {driverOptions.find(d => d.idDriver === formulario.conductor)
                                                    ? `${driverOptions.find(d => d.idDriver === formulario.conductor).firstName} ${driverOptions.find(d => d.idDriver === formulario.conductor).lastName}`
                                                    : 'Selecciona conductor'}
                                            </span>
                                            <ChevronUpDownIcon className="w-5 h-5 text-gray-400" />
                                        </Listbox.Button>

                                        <Listbox.Options
                                            className="absolute z-10 mt-1 w-full max-h-60 overflow-auto bg-white shadow-lg rounded-md py-1 text-base focus:outline-none"

                                            onScroll={e => {
                                                const tgt = e.target;
                                                if (tgt.scrollTop + tgt.clientHeight >= tgt.scrollHeight - 5) {
                                                    fetchMoreDrivers();
                                                }
                                            }}
                                        >
                                            {driverOptions.map((d, idx) => {
                                                const isLast = idx === driverOptions.length - 1;
                                                return (
                                                    <Listbox.Option
                                                        key={d.idDriver}
                                                        value={d.idDriver}
                                                        ref={isLast ? lastDriverRef : null}
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
                                                                    {d.firstName} {d.lastName}
                                                                </span>
                                                                {selected && (
                                                                    <CheckIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-600" />
                                                                )}
                                                            </>
                                                        )}
                                                    </Listbox.Option>
                                                );
                                            })}
                                        </Listbox.Options>
                                    </div>
                                </Listbox>


                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cédula conductor
                                </label>
                                <input
                                    type="text"
                                    readOnly
                                    value={formulario.cedulaConductor}
                                    className="w-full p-2 border border-gray-300 rounded bg-gray-100"
                                />
                            </div>

                        </div>
                    </div>

                )}
            </div>

            {/* Informacion del cliente  */}

            <div className="mb-4 border border-gray-200 rounded-lg overflow-visible">
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
                                <Listbox
                                    disabled={isEdit}
                                    value={formulario.cliente}
                                    onChange={val => {
                                        setFormulario(prev => ({ ...prev, cliente: val }));
                                        procesarContactosCliente(val);
                                    }}
                                >
                                    <Listbox.Label className="block text-sm font-medium text-gray-700 mb-1">
                                        Cliente *
                                    </Listbox.Label>
                                    <div className="relative">
                                        <Listbox.Button className="w-full border border-gray-300 rounded-md p-2 flex justify-between items-center bg-white">
                                            <span className="truncate">
                                                {clientOptions.find(c => c.idClient === formulario.cliente)?.name || 'Selecciona cliente'}
                                            </span>
                                            <ChevronUpDownIcon className="w-5 h-5 text-gray-400" />
                                        </Listbox.Button>

                                        <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none">
                                            {clientOptions
                                                .filter(c => c.active)
                                                .map((client, idx) => {
                                                    const isLast = idx === clientOptions.length - 1;
                                                    return (
                                                        <Listbox.Option
                                                            key={client.idClient}
                                                            value={client.idClient}
                                                            ref={isLast ? lastClientRef : null}
                                                            className={({ active }) =>
                                                                `cursor-pointer select-none relative py-2 pl-8 pr-4 ${active ? 'bg-blue-100' : ''}`
                                                            }
                                                        >
                                                            {({ selected }) => (
                                                                <>
                                                                    <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                                        {client.name}
                                                                    </span>
                                                                    {selected && (
                                                                        <CheckIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-600" />
                                                                    )}
                                                                </>
                                                            )}
                                                        </Listbox.Option>
                                                    );
                                                })}
                                        </Listbox.Options>
                                    </div>
                                </Listbox>

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







            {/* Repuestos y Materiales */}
            <div className="mb-4 border border-gray-200 rounded-lg overflow-visible">
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
                                        <th className="px-4 py-2 ">Detalle</th>
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
                                    {[...repuestos]
                                        .sort((a, b) => {
                                            // nombre visible de cada repuesto
                                            const nombreA = (opcRepuestos.find(m => m.idSparePartMaterial === a.idSparePartMaterial)?.name || '').toLowerCase();
                                            const nombreB = (opcRepuestos.find(m => m.idSparePartMaterial === b.idSparePartMaterial)?.name || '').toLowerCase();

                                            return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
                                        })
                                        .map(repuesto => (
                                            <tr key={repuesto.id} className="border-b border-gray-100">
                                                {/* === REPUESTO === */}
                                                <td className="px-2 py-3">
                                                    <select
                                                        className="w-40 p-2 border border-gray-300 rounded"
                                                        value={repuesto.idSparePartMaterial}
                                                        onChange={e => handleCambioRepuestoSelect(repuesto.id, e.target.value)}
                                                    >
                                                        <option value="">Selecciona un repuesto</option>
                                                        {(Array.isArray(opcRepuestos)
                                                            ? [...opcRepuestos]
                                                                .filter(mat => mat.active)
                                                                .sort((a, b) =>
                                                                    a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
                                                                )
                                                            : []
                                                        ).map(mat => (
                                                            <option
                                                                key={mat.idSparePartMaterial}
                                                                value={mat.idSparePartMaterial}
                                                            >
                                                                {mat.name} ({mat.measurementUnit})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="w-32 px-3 py-3">
                                                    <textarea
                                                        type="text"
                                                        className="w-50 p-2 border border-gray-300 rounded bg-white"
                                                        value={repuesto.useDetail ?? ''}
                                                        onChange={e => handleDetalleChange(repuesto.id, e.target.value)}
                                                        rows={1}
                                                        style={{ whiteSpace: 'pre-wrap' }}
                                                    />
                                                </td>


                                                {/* === CANTIDAD === */}
                                                <td className="w-32 px-3 py-3">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="w-22 p-2 border border-gray-300 rounded text-center"
                                                        value={repuesto.cantidad}
                                                        onChange={e =>
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
                                                        className={`w-30 p-2 border border-gray-300 rounded ${canEditFactor ? 'bg-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                                        disabled={!canEditFactor}
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

                                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                                        <th className="w-48 px-3 py-2 text-left font-medium">Descripción</th>
                                        <th className="w-32 px-3 py-2 text-left font-medium">Detalle</th>
                                        <th className="w-20 px-3 py-2 text-left font-medium">Cant.</th>
                                        <th className="w-40 px-3 py-2 text-left font-medium">Contratista</th>
                                        <th className="w-28 px-3 py-2 text-left font-medium">Costo U. Mano</th>
                                        <th className="w-32 px-3 py-2 text-left font-medium">Costo T. Mano</th>
                                        <th className="w-32 px-3 py-2 text-left font-medium">Costo U. Insumo</th>
                                        <th className="w-32 px-3 py-2 text-left font-medium">Costo T. Insumos</th>
                                        <th className="w-32 px-3 py-2 text-left font-medium">Costo U. Mano + Ins</th>
                                        <th className="w-32 px-3 py-2 text-left font-medium">Costo T. Mano + Ins</th>
                                        <th className="w-24 px-3 py-2 text-left font-medium">Factor</th>
                                        <th className="w-28 px-3 py-2 text-left font-medium">Venta U. + Ins</th>
                                        <th className="w-32 px-3 py-2 text-left font-medium">Venta T. + Ins</th>
                                        <th className="w-24 px-3 py-2 text-center font-medium">Insumos</th>
                                        <th className="w-16 px-3 py-2 text-center font-medium">Acción</th>
                                    </tr>
                                </thead>

                                <tbody className="bg-white divide-y divide-gray-200">
                                    {[...manoDeObraVisibles]
                                        .sort((a, b) => {

                                            const nombreA = (
                                                manpowers.find(mp => mp.idManpower === a.idManpower)?.name || ''
                                            ).toLowerCase();

                                            const nombreB = (
                                                manpowers.find(mp => mp.idManpower === b.idManpower)?.name || ''
                                            ).toLowerCase();

                                            return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
                                        })
                                        .map(item => (
                                            <React.Fragment key={item.id}>

                                                <tr className="hover:bg-gray-50 border-b-2 border-blue-100">
                                                    {/* ── Descripción ───────────────────────────────────────────── */}
                                                    <td className="w-48 px-3 py-3">
                                                        <select
                                                            className="w-100 p-2 border border-gray-300 rounded bg-white"
                                                            value={item.idManpower || ''}
                                                            onChange={e =>
                                                                actualizarManoDeObra(item.id, 'idManpower', e.target.value)
                                                            }
                                                        >
                                                            <option value="">Seleccione mano de obra</option>
                                                            {manpowers.map(mp => (
                                                                <option key={mp.idManpower} value={mp.idManpower}>
                                                                    {mp.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>

                                                    {/* ── Detalle ──────────────────────────────────────────────── */}
                                                    <td className="w-32 px-3 py-3">
                                                        <textarea
                                                            className="w-50 p-2 border border-gray-300 rounded bg-white"
                                                            value={item.useDetail}
                                                            onChange={e =>
                                                                actualizarManoDeObra(item.id, 'useDetail', e.target.value)
                                                            }
                                                            rows={1}
                                                            style={{ whiteSpace: 'pre-wrap' }}
                                                        />
                                                    </td>

                                                    {/* ── Cantidad ─────────────────────────────────────────────── */}
                                                    <td className="w-24 px-3 py-3">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="1"
                                                            className="w-20 p-2 border border-gray-300 rounded bg-white"
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

                                                    {/* ── Contratista ──────────────────────────────────────────── */}
                                                    <td className="w-36 px-3 py-3">
                                                        <select
                                                            className="w-40 p-2 border border-gray-300 rounded bg-white"
                                                            value={item.contratista}
                                                            onChange={e =>
                                                                actualizarManoDeObra(item.id, 'contratista', e.target.value)
                                                            }
                                                        >
                                                            <option value="">Selecciona contratista</option>
                                                            {userOptions
                                                                .filter(
                                                                    u =>
                                                                        ['Contratista', 'Colaborador', 'Mecánico'].includes(u.role?.name) &&
                                                                        u.active === true &&
                                                                        u.userStatus?.name === 'Activo'
                                                                )
                                                                .map(u => (
                                                                    <option key={u.idUser} value={u.idUser}>
                                                                        {u.firstName} {u.lastName}
                                                                    </option>
                                                                ))}
                                                        </select>
                                                    </td>

                                                    {/* ── Costo Unitario ──────────────────────────────────────── */}
                                                    <td className="w-28 px-3 py-3">
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            pattern="\d*"
                                                            className="w-24 p-2 border border-gray-300 rounded text-left bg-white"
                                                            value={item.unitaryCost !== ''
                                                                ? Number(item.unitaryCost).toLocaleString('es-CO')
                                                                : ''}
                                                            onChange={e => {
                                                                const raw = e.target.value.replace(/\D/g, '');
                                                                const val = raw === '' ? '' : parseFloat(raw);
                                                                actualizarManoDeObra(item.id, 'unitaryCost', val);
                                                            }}
                                                        />
                                                    </td>


                                                    {/* ── Costo Total ─────────────────────────────────────────── */}
                                                    <td className="w-28 px-3 py-3">
                                                        <input
                                                            type="text"
                                                            readOnly
                                                            className="w-24 p-2 border border-gray-300 rounded text-right bg-gray-100"
                                                            value={item.totalCost.toLocaleString()}
                                                        />
                                                    </td>

                                                    <td className="w-28 px-3 py-3" >

                                                        <input
                                                            className="w-24 p-2 border border-gray-300 rounded text-right bg-gray-100"
                                                            type="text"
                                                            readOnly
                                                            value={item.unitaryCostInsumo?.toLocaleString('es-CO')}
                                                        >

                                                        </input>

                                                    </td>
                                                    <td className="w-28 px-3 py-3">
                                                        <input
                                                            className="w-24 p-2 border border-gray-300 rounded text-right bg-gray-100"
                                                            type="text"
                                                            readOnly
                                                            value={item.totalCostInsumos?.toLocaleString('es-CO')}
                                                        >

                                                        </input>

                                                    </td>

                                                    <td className="w-32 px-3 py-3">
                                                        <input
                                                            type="text"
                                                            readOnly
                                                            className="w-28 p-2 border border-gray-300 rounded text-right bg-gray-100"
                                                            value={((item.unitCostWithSupplies ?? 0).toLocaleString('es-CO'))}
                                                        />
                                                    </td>

                                                    <td className="w-32 px-3 py-3">
                                                        <input
                                                            type="text"
                                                            readOnly
                                                            className="w-28 p-2 border border-gray-300 rounded text-right bg-gray-100"
                                                            value={((item.totalCostWithSupplies ?? 0).toLocaleString('es-CO'))}
                                                        />
                                                    </td>


                                                    {/* ── Factor de Venta ─────────────────────────────────────── */}
                                                    <td className="w-28 px-3 py-3">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            readOnly={!canEditFactor}
                                                            className={`w-24 p-2 border rounded text-left ${canEditFactor
                                                                ? 'bg-white text-gray-900 border-gray-300'
                                                                : 'bg-gray-100 text-gray-500'
                                                                }`}
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

                                                    <td className="w-28 px-3 py-3">
                                                        <input
                                                            type="number"
                                                            readOnly
                                                            className="w-24 p-2 border border-gray-300 rounded text-left bg-white"
                                                            value={item.unitSell}

                                                        />
                                                    </td>

                                                    {/* Venta total */}
                                                    <td className="w-28 px-3 py-3">
                                                        <input
                                                            type="number"
                                                            readOnly
                                                            className="w-24 p-2 border border-gray-300 rounded text-left bg-white"
                                                            value={item.totalSell}

                                                        />
                                                    </td>

                                                    {/* ── Acciones (solo su propio contratista o roles superiores) ─ */}
                                                    {(!isContractor || item.contratista === userId) && (
                                                        <>
                                                            {/* Botón Insumo */}
                                                            <td className="w-24 px-3 py-3 text-center">
                                                                <button
                                                                    className="bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                                                                    onClick={() => agregarInsumo(item.id)}
                                                                >
                                                                    Insumo
                                                                </button>
                                                            </td>

                                                            {/* Botón Eliminar */}
                                                            <td className="w-16 px-3 py-3 text-center">
                                                                <button
                                                                    className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                                                    onClick={() => eliminarManoDeObra(item.id)}
                                                                >
                                                                    <FaTimes />
                                                                </button>
                                                            </td>
                                                        </>
                                                    )}
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
                                                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase">Detalle</th>
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
                                                                                        <td className="w-32 px-3 py-3">
                                                                                            <textarea
                                                                                                type="text"
                                                                                                className="w-50 p-2 border border-gray-300 rounded bg-white"
                                                                                                value={ins.useDetail}
                                                                                                onChange={e => actualizarInsumo(item.id, idx, 'useDetail', e.target.value)}
                                                                                                rows={1}
                                                                                                style={{ whiteSpace: 'pre-wrap' }}
                                                                                            />
                                                                                        </td>
                                                                                        <td className="px-3 py-2">
                                                                                            <span className="text-sm text-gray-600">
                                                                                                {selectedSupply?.measurementUnit || '-'}
                                                                                            </span>
                                                                                        </td>


                                                                                        <td className="px-3 py-2">
                                                                                            <input
                                                                                                type="number"
                                                                                                min="0"
                                                                                                step="0.01"
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
                                                                                                {provs.map((p, i) => (
                                                                                                    <option key={`${p.idProvider}-${i}`} value={p.idProvider}>
                                                                                                        {p.name}
                                                                                                    </option>
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

            {/* Información de cotización de factura */}
            <div className="mb-4 border border-gray-200 rounded-lg overflow-visible">
                <div
                    className="bg-white p-4 flex justify-between items-center cursor-pointer"
                    onClick={() => {
                        if (!soloPuedeEditarRepuestos && !soloPuedeEditarManoObra)
                            toggleSeccion('infoCotizacion');
                    }}
                >
                    <h2 className="text-lg font-semibold text-blue-800">
                        Información de cotización de factura
                    </h2>
                    {secciones.infoCotizacion ? <FaChevronUp /> : <FaChevronDown />}
                </div>

                {secciones.infoCotizacion && (
                    <div className="bg-white p-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            {/* No. cotización */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    No. cotización
                                </label>
                                <input
                                    type="text"
                                    name="numeroCotizacion"
                                    value={formulario.numeroCotizacion}
                                    onChange={handleCambioFormulario}
                                    className="w-full p-2 border border-gray-300 rounded"
                                />
                            </div>

                            {/* Fecha de cotización */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fecha de cotización
                                </label>
                                <input
                                    type="date"
                                    name="fechaCotizacion"
                                    value={formulario.fechaCotizacion}
                                    onChange={handleCambioFormulario}
                                    className="w-full p-2 border border-gray-300 rounded"
                                />
                            </div>

                            {/* Cotizado por */}
                            <div>
                                <Listbox
                                    value={formulario.cotizadoPor}
                                    onChange={val => setFormulario(f => ({ ...f, cotizadoPor: val }))}
                                >
                                    <Listbox.Label className="block text-sm font-medium text-gray-700 mb-1">
                                        Cotizado por
                                    </Listbox.Label>
                                    <div className="relative">
                                        <Listbox.Button className="w-full border border-gray-300 rounded-md p-2 flex justify-between items-center bg-white">
                                            <span className="truncate">
                                                {RolFacturacion.find(u => u.idUser === formulario.cotizadoPor)
                                                    ? `${RolFacturacion.find(u => u.idUser === formulario.cotizadoPor).firstName}
                                                     ${RolFacturacion.find(u => u.idUser === formulario.cotizadoPor).lastName}`
                                                    : 'Selecciona usuario'}
                                            </span>
                                            <ChevronUpDownIcon className="w-5 h-5 text-gray-400" />
                                        </Listbox.Button>

                                        <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 overflow-auto focus:outline-none">
                                            {RolFacturacion.map((u, idx) => (
                                                <Listbox.Option
                                                    key={u.idUser}
                                                    value={u.idUser}
                                                    ref={idx === RolFacturacion.length - 1 ? lastUserRef : null}
                                                    className={({ active }) =>
                                                        `cursor-pointer select-none relative py-2 pl-8 pr-4
                                                      ${active ? 'bg-blue-100' : ''}`
                                                    }>
                                                    {({ selected }) => (
                                                        <>
                                                            <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                                {u.firstName} {u.lastName}
                                                            </span>
                                                            {selected && (
                                                                <CheckIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600" />
                                                            )}
                                                        </>
                                                    )}
                                                </Listbox.Option>
                                            ))}
                                        </Listbox.Options>

                                    </div>
                                </Listbox>
                            </div>

                            {/* No. facturación */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    No. facturación
                                </label>
                                <input
                                    type="text"
                                    name="numeroFacturacion"
                                    value={formulario.numeroFacturacion}
                                    onChange={handleCambioFormulario}
                                    className="w-full p-2 border border-gray-300 rounded"
                                />
                            </div>

                            {/* Facturado por */}
                            <div>
                                <Listbox
                                    value={formulario.facturadoPor}
                                    onChange={val => setFormulario(f => ({ ...f, facturadoPor: val }))}
                                >
                                    <Listbox.Label className="block text-sm font-medium text-gray-700 mb-1">
                                        Facturado por
                                    </Listbox.Label>
                                    <div className="relative">
                                        <Listbox.Button className="w-full border border-gray-300 rounded-md p-2 flex justify-between items-center bg-white">
                                            <span className="truncate">
                                                {RolFacturacion.find(u => u.idUser === formulario.facturadoPor)
                                                    ? `${RolFacturacion.find(u => u.idUser === formulario.facturadoPor).firstName}
                                                    ${RolFacturacion.find(u => u.idUser === formulario.facturadoPor).lastName}`
                                                    : 'Selecciona usuario'}
                                            </span>
                                            <ChevronUpDownIcon className="w-5 h-5 text-gray-400" />
                                        </Listbox.Button>

                                        <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 overflow-auto focus:outline-none">
                                            {RolFacturacion.map((u, idx) => (
                                                <Listbox.Option
                                                    key={u.idUser}
                                                    value={u.idUser}
                                                    ref={idx === RolFacturacion.length - 1 ? lastUserRef : null}
                                                    className={({ active }) =>
                                                        `cursor-pointer select-none relative py-2 pl-8 pr-4
                                                    ${active ? 'bg-blue-100' : ''}`
                                                    }>
                                                    {({ selected }) => (
                                                        <>
                                                            <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                                                {u.firstName} {u.lastName}
                                                            </span>
                                                            {selected && (
                                                                <CheckIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600" />
                                                            )}
                                                        </>
                                                    )}
                                                </Listbox.Option>
                                            ))}
                                        </Listbox.Options>

                                    </div>
                                </Listbox>
                            </div>

                            {/* Número de acta de entrega */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Número de acta de entrega
                                </label>
                                <input
                                    type="text"
                                    name="numeroActaEntrega"
                                    value={formulario.numeroActaEntrega}
                                    onChange={handleCambioFormulario}
                                    className="w-full p-2 border border-gray-300 rounded"
                                />
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





