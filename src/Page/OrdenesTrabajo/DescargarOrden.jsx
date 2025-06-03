export async function descargarOrdenCompletaPDF_pdfmake(orden) {
    const pdfMakeModule = await import("pdfmake/build/pdfmake");
    const pdfFontsModule = await import("pdfmake/build/vfs_fonts");

    // Fix: Correct way to access vfs from pdfFonts
    pdfMakeModule.default.vfs = pdfFontsModule.default.vfs || pdfFontsModule.vfs;

    const isValidArray = (arr) => Array.isArray(arr) && arr.length > 0;
    const formatDate = (dateString) => {
        if (!dateString) return "No definida";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("es-ES") +
                " " +
                date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
        } catch (error) {
            return "Fecha inválida";
        }
    };
    const formatDateOnly = (dateString) => {
        if (!dateString) return "Sin fecha";
        try {
            return new Date(dateString).toLocaleDateString("es-ES");
        } catch (error) {
            return "Fecha inválida";
        }
    };
    const formatCurrency = (value) => {
        const num = Number(value) || 0;
        return `$${num.toLocaleString("es-ES")}`;
    };

    // --- Ordenar contactos: principal primero ---
    const contactosOrdenados = isValidArray(orden.contacts)
        ? [...orden.contacts].sort((a, b) => b.isPrincipalContact - a.isPrincipalContact)
        : [];

    // --- Definición de documento PDF ---
    const docDefinition = {
        content: [
            { text: "ORDEN DE TRABAJO", style: "header" },
            { text: `N°: ${orden.orderNumber || "Sin número"}`, style: "subheader" },
            "\n",
            { text: "INFORMACIÓN GENERAL", style: "section" },
            {
                ul: [
                    `Estado: ${orden.orderStatus?.name || "Sin estado"}`,
                    `Fecha de Creación: ${formatDate(orden.createdAt)}`,
                    `Fecha de Salida: ${formatDate(orden.outDate)}`,
                    `Tipos de Servicio: ${isValidArray(orden.serviceTypes)
                        ? orden.serviceTypes.map((st) => st?.name || "Sin nombre").join(", ")
                        : "Sin servicios definidos"}`
                ]
            },
            "\n",
            // INFORMACIÓN DEL CLIENTE
            { text: "INFORMACIÓN DEL CLIENTE", style: "section" },
            {
                ul: [
                    `Nombre: ${orden.client?.name || "Sin nombre"}`,
                    `Tipo de Documento: ${orden.client?.document?.documentType?.name || "No especificado"}`,
                    `Número de Documento: ${orden.client?.document?.documentNumber || "Sin número"}`
                ]
            },
            "\n",
            

            "\n",
            { text: "INFORMACIÓN DEL VEHÍCULO", style: "section" },
            {
                ul: [
                    `Placa Cabezote: ${orden.vehicule?.placaCabezote || "Sin placa"}`,
                    `Placa Trailer: ${orden.vehicule?.placaTrailer || "Sin placa trailer"}`,
                    `Tipo de Vehículo: ${orden.vehicule?.vehiculeType?.name || "No especificado"}`,
                    `Kilometraje de Salida: ${orden.vehicule?.kmsSalida || "No registrado"}`,
                    `Conductor: ${orden.vehicule?.driver
                        ? `${orden.vehicule.driver.firstName || ""} ${orden.vehicule.driver.lastName || ""}`.trim()
                        : "Sin conductor"
                    }`,
                    `Teléfono Conductor: ${orden.vehicule?.driver?.phoneNumber || "Sin teléfono"}`
                ]
            },
            "\n",
            ...(isValidArray(orden.sparePartMaterials) ? [
                { text: "REPUESTOS Y MATERIALES", style: "section" },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', '*', '*', '*', '*', '*', '*', '*'],
                        body: [
                            ['Material', 'Tipo', 'Cantidad', 'Proveedor', 'Costo Unit.', 'Costo Total', 'Venta Unit.', 'Venta Total'],
                            ...orden.sparePartMaterials.map(spm => [
                                spm.sparePartMaterial?.name || 'Sin nombre',
                                spm.sparePartMaterial?.type || 'Sin tipo',
                                (spm.cantidad || 0).toString(),
                                spm.sparePartMaterial?.provider?.name || 'Sin proveedor',
                                formatCurrency(spm.sparePartMaterial?.unitaryCost),
                                formatCurrency(spm.costoTotal),
                                formatCurrency(spm.ventaUnitaria),
                                formatCurrency(spm.ventaTotal)
                            ])
                        ]
                    }
                },
                "\n"
            ] : []),
            ...(isValidArray(orden.manpowers) ? [
                { text: "MANO DE OBRA", style: "section" },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', '*', '*', '*', '*', '*', '*', '*'],
                        body: [
                            ['Descripción', 'Tipo', 'Cantidad', 'Contratista', 'Costo Unit.', 'Costo Total', 'Venta Unit.', 'Venta Total'],
                            ...orden.manpowers.map(mp => [
                                mp.manpower?.name || 'Sin descripción',
                                mp.manpower?.type || 'Sin tipo',
                                (mp.cantidad || 0).toString(),
                                mp.manpower?.contractor
                                    ? `${mp.manpower.contractor.firstName || ""} ${mp.manpower.contractor.lastName || ""}`.trim()
                                    : "Sin contratista",
                                formatCurrency(mp.manpower?.unitaryCost),
                                formatCurrency(mp.costoTotal),
                                formatCurrency(mp.ventaUnitaria),
                                formatCurrency(mp.ventaTotal)
                            ])
                        ]
                    }
                },
                "\n"
            ] : []),
            ...(isValidArray(orden.pricings) ? [
                { text: "INFORMACIÓN DE COTIZACIÓN", style: "section" },
                {
                    ul: [
                        `Número de Cotización: ${orden.pricings[0].pricingNumber || 'Sin número'}`,
                        `Fecha de Cotización: ${formatDateOnly(orden.pricings[0].pricingDate)}`,
                        `Cotizado por: ${orden.pricings[0].pricedBy
                            ? `${orden.pricings[0].pricedBy.firstName || ''} ${orden.pricings[0].pricedBy.lastName || ''}`.trim()
                            : 'Sin especificar'}`
                    ]
                },
                "\n"
            ] : []),
            ...(isValidArray(orden.billings) ? [
                { text: "INFORMACIÓN DE FACTURACIÓN", style: "section" },
                {
                    ul: [
                        `Número de Factura: ${orden.billings[0].billingNumber || 'Sin número'}`,
                        `Fecha de Facturación: ${formatDateOnly(orden.billings[0].billingDate)}`,
                        `Facturado por: ${orden.billings[0].billedBy
                            ? `${orden.billings[0].billedBy.firstName || ''} ${orden.billings[0].billedBy.lastName || ''}`.trim()
                            : 'Sin especificar'}`,
                        `Número de Acta: ${orden.billings[0].actNumber || 'Sin número de acta'}`
                    ]
                },
                "\n"
            ] : []),
            
            ...(orden.total ? [
                { text: "RESUMEN FINANCIERO", style: "section" },
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', '*'],
                        body: [
                            ['Concepto', 'Valor'],
                            ['Subtotal Costos Repuestos', formatCurrency(orden.total.subtotalCostosRepuestos)],
                            ['Subtotal Ventas Repuestos', formatCurrency(orden.total.subtotalVentasRepuestos)],
                            ['Subtotal Costos Mano de Obra', formatCurrency(orden.total.subtotalCostosManoObra)],
                            ['Subtotal Ventas Mano de Obra', formatCurrency(orden.total.subtotalVentasManoObra)],
                            ['Subtotal Costos', formatCurrency(orden.total.subtotalCostos)],
                            ['Subtotal Ventas', formatCurrency(orden.total.subtotalVentas)],
                            ['IVA (19%)', formatCurrency(orden.total.iva)],
                            ['TOTAL VENTA', formatCurrency(orden.total.totalVenta)]
                        ]
                    }
                }
            ] : [])
        ],
        styles: {
            header: {
                fontSize: 18,
                bold: true,
                color: '#2980b9',
                margin: [0, 0, 0, 8],
            },
            subheader: {
                fontSize: 14,
                color: '#34495e',
                margin: [0, 0, 0, 8],
            },
            section: {
                fontSize: 12,
                bold: true,
                color: '#2980b9',
                margin: [0, 12, 0, 4]
            }
        },
        defaultStyle: {
            fontSize: 9
        },
        footer: (currentPage, pageCount) => ({
            text: [
                `Página ${currentPage} de ${pageCount}     `,
                `Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`
            ],
            alignment: 'right',
            fontSize: 8,
            color: '#888888',
            margin: [20, 0, 20, 0]
        })
    };

    pdfMakeModule.default.createPdf(docDefinition).download(
        `Orden_${orden.orderNumber || "Sin_Numero"}_${new Date().toISOString().slice(0, 10)}.pdf`
    );
}