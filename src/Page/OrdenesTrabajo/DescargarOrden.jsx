import logoImg from '/src/assets/Logo sin fondo.png';

export async function descargarOrdenCompletaPDF_pdfmake(orden) {
  const pdfMakeModule = await import("pdfmake/build/pdfmake");
  const pdfFontsModule = await import("pdfmake/build/vfs_fonts");
  pdfMakeModule.default.vfs = pdfFontsModule.default.vfs || pdfFontsModule.vfs;

  const isValidArray = arr => Array.isArray(arr) && arr.length > 0;
  const formatDate = dateString => {
    if (!dateString) return "No definida";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("es-ES") + " " +
        d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    } catch { return "Fecha inválida"; }
  };
  const formatDateOnly = dateString => {
    if (!dateString) return "Sin fecha";
    try { return new Date(dateString).toLocaleDateString("es-ES"); }
    catch { return "Fecha inválida"; }
  };
  const formatCurrency = value => {
    const n = Number(value) || 0;
    return `$${n.toLocaleString("es-ES")}`;
  };

  
  const calcularSubtotalesRepuestos = (sparePartMaterials) => {
    if (!isValidArray(sparePartMaterials)) return { costoTotal: 0, ventaTotal: 0 };
    
    const costoTotal = sparePartMaterials.reduce((sum, item) => sum + (item.costoTotal || 0), 0);
    const ventaTotal = sparePartMaterials.reduce((sum, item) => sum + (item.ventaTotal || 0), 0);
    
    return { costoTotal, ventaTotal };
  };

  
  const calcularSubtotalesManoObra = (manpower) => {
    if (!manpower) return { costoTotal: 0, ventaTotal: 0 };
    
    const costoTotal = manpower.costoTotal || 0;
    const ventaTotal = manpower.ventaTotal || 0;
    
    return { costoTotal, ventaTotal };
  };

  
  const calcularSubtotalesInsumos = (supplies) => {
    if (!isValidArray(supplies)) return { costoTotal: 0 };
    
    const costoTotal = supplies.reduce((sum, item) => sum + (item.costoTotal || 0), 0);
    
    return { costoTotal };
  };

  async function getBase64ImageFromURL(url) {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

 
  const logoBase64 = await getBase64ImageFromURL(logoImg);

  const docDefinition = {
    images: { logo: logoBase64 },
    content: [
     
      { image: 'logo', width: 120, alignment: 'center', margin: [0, 0, 0, 12] },

      { text: "ORDEN DE TRABAJO", style: "header" },
      { text: `N°: ${orden.orderNumber || "Sin número"}`, style: "subheader" },
      "\n",

      // === INFORMACIÓN GENERAL ===
      { text: "INFORMACIÓN GENERAL", style: "section" },
      {
        columns: [
          {
            width: '50%',
            stack: [
              {
                text: [
                  { text: 'N° Orden: ', style: 'label' },
                  { text: orden.orderNumber || '—', style: 'value' }
                ]
              },
              {
                text: [
                  { text: 'Fecha de Creación: ', style: 'label' },
                  { text: formatDate(orden.createdAt), style: 'value' }
                ]
              }

            ]
          },
          {
            width: '50%',
            stack: [
              {
                text: [
                  { text: 'Estado: ', style: 'label' },
                  { text: orden.orderStatus?.name || '—', style: 'value' }
                ]
              },
              {
                text: [
                  { text: 'Fecha de Salida: ', style: 'label' },
                  { text: formatDate(orden.outDate), style: 'value' }
                ]
              },
              {
                text: [
                  { text: 'Tipos de Servicio: ', style: 'label' },
                  { text: (isValidArray(orden.serviceTypes) ? orden.serviceTypes.map(st => st.name).join(", ") : '—'), style: 'value' }
                ]
              }
            ]
          }
        ],
        columnGap: 20,
        margin: [0, 0, 0, 15]
      },

      // === CLIENTE ===
      { text: "INFORMACIÓN DEL CLIENTE", style: "section" },
      {
        stack: [
          { text: orden.client?.name || '—', style: 'clientName' },
          {
            text: [
              { text: 'Documento: ', style: 'label' },
              { text: `${orden.client?.document?.documentType?.name || '—'} ${orden.client?.document?.documentNumber || ''}`, style: 'value' }
            ]
          }
        ],
        margin: [0, 0, 0, 15]
      },

      // === VEHÍCULO Y CONDUCTOR ===
      { text: "INFORMACIÓN DEL VEHÍCULO Y CONDUCTOR", style: "section" },
      {
        columns: [
          {
            width: '50%',
            stack: [
              {
                text: [
                  { text: 'Cabezote: ', style: 'label' },
                  { text: orden.vehicule?.placaCabezote || '—', style: 'value' }
                ]
              },
              {
                text: [
                  { text: 'Trailer: ', style: 'label' },
                  { text: orden.vehicule?.placaTrailer || '—', style: 'value' }
                ]
              },
              {
                text: [
                  { text: 'Tipo de Vehículo: ', style: 'label' },
                  { text: orden.vehicule?.vehiculeType?.name || '—', style: 'value' }
                ]
              },
              {
                text: [
                  { text: 'Km Inicial: ', style: 'label' },
                  { text: String(orden.kilometers ?? '—'), style: 'value' }
                ]
              }
            ]
          },
          {
            width: '50%',
            stack: [
              {
                text: [
                  { text: 'Conductor: ', style: 'label' },
                  {
                    text: orden.assignedDriver
                      ? `${orden.assignedDriver.firstName} ${orden.assignedDriver.lastName}`
                      : '—', style: 'value'
                  }
                ]
              },
              {
                text: [

                  {
                    text:
                      (orden.assignedDriver?.document?.documentType?.name ||
                        '') + ': ',
                    style: 'label'
                  },


                  {
                    text: orden.assignedDriver?.document?.documentNumber || '—',
                    style: 'value'
                  }
                ]
              },
              {
                text: [
                  { text: 'Teléfono: ', style: 'label' },
                  { text: orden.assignedDriver?.phoneNumber || '—', style: 'value' }
                ]
              }
            ]
          }
        ],
        columnGap: 20,
        margin: [0, 0, 0, 15]
      },

      // === REPUESTOS Y MATERIALES ===
      ...(isValidArray(orden.sparePartMaterials) ? [
        { text: "REPUESTOS", style: "section" },
        {
          table: {
            headerRows: 1,
            widths: [70, 35, 20, 55, 45, 45, 45, 45],
            body: [
              [
                { text: 'Material', style: 'tableHeader' },
                { text: 'Unidad', style: 'tableHeader' },
                { text: 'Cant.', style: 'tableHeader' },
                { text: 'Proveedor', style: 'tableHeader' },
                { text: 'Costo U.', style: 'tableHeader' },
                { text: 'Costo T.', style: 'tableHeader' },
                { text: 'Venta U.', style: 'tableHeader' },
                { text: 'Venta T.', style: 'tableHeader' }
              ],
              ...orden.sparePartMaterials.map(spm => [
                { text: spm.sparePartMaterial?.name || '—', style: 'tableCell' },
                { text: spm.sparePartMaterial?.measurementUnit || '—', style: 'tableCell' },
                { text: String(spm.cantidad || 0), style: 'tableCell', alignment: 'center' },
                { text: spm.selectedProvider?.name || '—', style: 'tableCell' },
                { text: formatCurrency(spm.unitaryCost), style: 'tableCell', alignment: 'right' },
                { text: formatCurrency(spm.costoTotal), style: 'tableCell', alignment: 'right' },
                { text: formatCurrency(spm.ventaUnitaria), style: 'tableCell', alignment: 'right' },
                { text: formatCurrency(spm.ventaTotal), style: 'tableCell', alignment: 'right' }
              ]),
              // Fila de subtotales - alineado con las columnas Costo T. y Venta T.
              [
                { text: 'SUBTOTAL REPUESTOS', style: 'subtotalLabel', colSpan: 4 },
                {}, {}, {},
                { text: '', style: 'subtotalValue' },
                { text: formatCurrency(calcularSubtotalesRepuestos(orden.sparePartMaterials).costoTotal), style: 'subtotalValue', alignment: 'right' },
                { text: '', style: 'subtotalValue' },
                { text: formatCurrency(calcularSubtotalesRepuestos(orden.sparePartMaterials).ventaTotal), style: 'subtotalValue', alignment: 'right' }
              ]
            ]
          },
          layout: {
            fillColor: function (rowIndex, node, columnIndex) {
              if (rowIndex === 0) return '#E8EAED';
              if (rowIndex === node.table.body.length - 1) return '#CFD8DC';
              return null;
            },
            hLineWidth: function (i, node) {
              return (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5;
            },
            vLineWidth: function (i, node) {
              return 0.5;
            },
            hLineColor: function (i, node) {
              return '#9E9E9E';
            },
            vLineColor: function (i, node) {
              return '#9E9E9E';
            }
          },
          margin: [0, 0, 0, 15]
        }
      ] : []),

      // === MANO DE OBRA E INSUMOS  ===
      ...(isValidArray(orden.manpowers) ? [
        { text: "MANO DE OBRA E INSUMOS", style: "section" },
        ...orden.manpowers.map((mp, index) => {
          const elements = [];

        
          elements.push({
            text: `${index + 1}. MANO DE OBRA`,
            style: 'manpowerTitle',
            margin: [0, 10, 0, 5]
          });

          
          elements.push({
            table: {
              widths: [70, 20, 55, 45, 45, 45, 45],
              body: [
                [
                  { text: 'Descripción', style: 'manpowerHeader' },
                  { text: 'Cant.', style: 'manpowerHeader' },
                  { text: 'Contratista', style: 'manpowerHeader' },
                  { text: 'Costo U.', style: 'manpowerHeader' },
                  { text: 'Costo T.', style: 'manpowerHeader' },
                  { text: 'Venta U.', style: 'manpowerHeader' },
                  { text: 'Venta T.', style: 'manpowerHeader' }
                ],
                [
                  { text: `${mp.manpower?.name || '—'}${mp.useDetail ? '\n' + mp.useDetail : ''}`, style: 'manpowerCell' },
                  { text: String(mp.cantidad || 0), style: 'manpowerCell', alignment: 'center' },
                  {
                    text: mp.selectedContractor
                      ? `${mp.selectedContractor.firstName} ${mp.selectedContractor.lastName}`
                      : '—', style: 'manpowerCell'
                  },
                  { text: formatCurrency(mp.unitaryCost), style: 'manpowerCell', alignment: 'right' },
                  { text: formatCurrency(mp.costoTotal), style: 'manpowerCell', alignment: 'right' },
                  { text: formatCurrency(mp.ventaUnitaria), style: 'manpowerCell', alignment: 'right' },
                  { text: formatCurrency(mp.ventaTotal), style: 'manpowerCell', alignment: 'right' }
                ],
                
                [
                  { text: 'SUBTOTAL MANO DE OBRA', style: 'subtotalLabel', colSpan: 3 },
                  {}, {},
                  { text: '', style: 'subtotalValue' },
                  { text: formatCurrency(calcularSubtotalesManoObra(mp).costoTotal), style: 'subtotalValue', alignment: 'right' },
                  { text: '', style: 'subtotalValue' },
                  { text: formatCurrency(calcularSubtotalesManoObra(mp).ventaTotal), style: 'subtotalValue', alignment: 'right' }
                ]
              ]
            },
            layout: {
              fillColor: function (rowIndex, node, columnIndex) {
                if (rowIndex === 0) return '#E8EAED';
                if (rowIndex === node.table.body.length - 1) return '#CFD8DC';
                return '#F5F6F7';
              },
              hLineWidth: function (i, node) {
                return 1;
              },
              vLineWidth: function (i, node) {
                return 1;
              },
              hLineColor: function (i, node) {
                return '#9E9E9E';
              },
              vLineColor: function (i, node) {
                return '#9E9E9E';
              }
            },
            margin: [0, 0, 0, 8]
          });

          // Insumos asociados 
          if (isValidArray(mp.supplies)) {
            elements.push({
              text: 'INSUMOS ASOCIADOS',
              style: 'suppliesTitle',
              margin: [15, 5, 0, 3]
            });

            const suppliesSubtotal = calcularSubtotalesInsumos(mp.supplies);

            elements.push({
              table: {
                widths: [70, 35, 20, 55, 45, 45],
                body: [
                  [
                    { text: 'Producto', style: 'suppliesHeader' },
                    { text: 'Unidad', style: 'suppliesHeader' },
                    { text: 'Cant.', style: 'suppliesHeader' },
                    { text: 'Proveedor', style: 'suppliesHeader' },
                    { text: 'Costo U.', style: 'suppliesHeader' },
                    { text: 'Costo T.', style: 'suppliesHeader' }
                  ],
                  ...mp.supplies.map(s => [
                    { text: s.supply?.name || '—', style: 'suppliesCell' },
                    { text: s.supply?.measurementUnit || '—', style: 'suppliesCell' },
                    { text: String(s.cantidad || 0), style: 'suppliesCell', alignment: 'center' },
                    { text: s.selectedProvider?.name || '—', style: 'suppliesCell' },
                    { text: formatCurrency(s.unitaryCost), style: 'suppliesCell', alignment: 'right' },
                    { text: formatCurrency(s.costoTotal), style: 'suppliesCell', alignment: 'right' }
                  ]),
                 
                  [
                    { text: 'SUBTOTAL INSUMOS', style: 'subtotalLabel', colSpan: 4 },
                    {}, {}, {},
                    { text: '', style: 'subtotalValue' },
                    { text: formatCurrency(suppliesSubtotal.costoTotal), style: 'subtotalValue', alignment: 'right' }
                  ]
                ]
              },
              layout: {
                fillColor: function (rowIndex, node, columnIndex) {
                  if (rowIndex === 0) return '#DDE2E8';
                  if (rowIndex === node.table.body.length - 1) return '#CFD8DC';
                  return '#F0F2F5';
                },
                hLineWidth: function (i, node) {
                  return (i === 0 || i === 1) ? 1 : 0.5;
                },
                vLineWidth: function (i, node) {
                  return 0.5;
                },
                hLineColor: function (i, node) {
                  return '#78909C';
                },
                vLineColor: function (i, node) {
                  return '#78909C';
                }
              },
              margin: [15, 0, 0, 15]
            });
          } else {
            elements.push({ text: '', margin: [0, 0, 0, 15] });
          }

          return elements;
        }).flat()
      ] : []),

      // === COTIZACIÓN ===
      ...(isValidArray(orden.pricings) ? [
        { text: "INFORMACIÓN DE COTIZACIÓN", style: "section" },
        {
          stack: [
            {
              text: [
                { text: 'Número de Cotización: ', style: 'label' },
                { text: orden.pricings[0].pricingNumber || 'Sin número', style: 'value' }
              ]
            },
            {
              text: [
                { text: 'Fecha de Cotización: ', style: 'label' },
                { text: formatDateOnly(orden.pricings[0].pricingDate), style: 'value' }
              ]
            },
            {
              text: [
                { text: 'Cotizado por: ', style: 'label' },
                {
                  text: orden.pricings[0].pricedBy
                    ? `${orden.pricings[0].pricedBy.firstName} ${orden.pricings[0].pricedBy.lastName}`
                    : 'Sin especificar', style: 'value'
                }
              ]
            }
          ],
          margin: [0, 0, 0, 15]
        }
      ] : []),

      // === FACTURACIÓN ===
      ...(isValidArray(orden.billings) ? [
        { text: "INFORMACIÓN DE FACTURACIÓN", style: "section" },
        {
          stack: [
            {
              text: [
                { text: 'Número de Factura: ', style: 'label' },
                { text: orden.billings[0].billingNumber || 'Sin número', style: 'value' }
              ]
            },
            {
              text: [
                { text: 'Fecha de Facturación: ', style: 'label' },
                { text: formatDateOnly(orden.billings[0].billingDate), style: 'value' }
              ]
            },
            {
              text: [
                { text: 'Facturado por: ', style: 'label' },
                {
                  text: orden.billings[0].billedBy
                    ? `${orden.billings[0].billedBy.firstName} ${orden.billings[0].billedBy.lastName}`
                    : 'Sin especificar', style: 'value'
                }
              ]
            },
            {
              text: [
                { text: 'Número de Acta: ', style: 'label' },
                { text: orden.billings[0].actNumber || 'Sin número de acta', style: 'value' }
              ]
            }
          ],
          margin: [0, 0, 0, 15]
        }
      ] : []),

      // === RESUMEN FINANCIERO ===
      ...(orden.total ? [
        { text: "RESUMEN FINANCIERO", style: "section" },
        {
          table: {
            headerRows: 1,
            widths: ['*', 80],
            body: [
              [
                { text: 'Concepto', style: 'financialHeader' },
                { text: 'Valor', style: 'financialHeader', alignment: 'right' }
              ],
              [
                { text: 'Subtotal Costos Repuestos', style: 'financialCell' },
                { text: formatCurrency(orden.total.subtotalCostosRepuestos), style: 'financialCell', alignment: 'right' }
              ],
              [
                { text: 'Subtotal Ventas Repuestos', style: 'financialCell' },
                { text: formatCurrency(orden.total.subtotalVentasRepuestos), style: 'financialCell', alignment: 'right' }
              ],
              [
                { text: 'Subtotal Costos Mano de Obra', style: 'financialCell' },
                { text: formatCurrency(orden.total.subtotalCostosManoObra), style: 'financialCell', alignment: 'right' }
              ],
              [
                { text: 'Subtotal Ventas Mano de Obra', style: 'financialCell' },
                { text: formatCurrency(orden.total.subtotalVentasManoObra), style: 'financialCell', alignment: 'right' }
              ],
              [
                { text: 'Subtotal Costos', style: 'financialCellBold' },
                { text: formatCurrency(orden.total.subtotalCostos), style: 'financialCellBold', alignment: 'right' }
              ],
              [
                { text: 'Subtotal Ventas', style: 'financialCellBold' },
                { text: formatCurrency(orden.total.subtotalVentas), style: 'financialCellBold', alignment: 'right' }
              ],
              [
                { text: 'IVA (19%)', style: 'financialCell' },
                { text: formatCurrency(orden.total.iva), style: 'financialCell', alignment: 'right' }
              ],
              [
                { text: 'TOTAL VENTA', style: 'financialTotal' },
                { text: formatCurrency(orden.total.totalVenta), style: 'financialTotal', alignment: 'right' }
              ]
            ]
          },
          layout: {
            fillColor: function (rowIndex, node, columnIndex) {
              if (rowIndex === 0) return '#E8EAED';
              if (rowIndex === node.table.body.length - 1) return '#CFD8DC';
              if (rowIndex === node.table.body.length - 4 || rowIndex === node.table.body.length - 3) return '#F5F6F7';
              return null;
            },
            hLineWidth: function (i, node) {
              return (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5;
            },
            vLineWidth: function (i, node) {
              return 0.5;
            },
            hLineColor: function (i, node) {
              return '#9E9E9E';
            },
            vLineColor: function (i, node) {
              return '#9E9E9E';
            }
          }
        }
      ] : [])
    ],
    styles: {
      header: {
        fontSize: 18, bold: true, color: '#2980b9', margin: [0, 0, 0, 8], alignment: 'center'
      },
      subheader: {
        fontSize: 14, color: '#34495e', margin: [0, 0, 0, 6], alignment: 'center'
      },
      section: {
        fontSize: 12, bold: true, color: '#2980b9', margin: [0, 15, 0, 8],
        decoration: 'underline', decorationStyle: 'solid', decorationColor: '#2980b9'
      },
      label: {
        fontSize: 9, bold: true, color: '#2C3E50'
      },
      value: {
        fontSize: 9, color: '#34495e'
      },
      clientName: {
        fontSize: 11, bold: true, color: '#2C3E50', margin: [0, 0, 0, 3]
      },

      // Estilos para tablas generales
      tableHeader: {
        bold: true, fontSize: 9, color: '#455A64', fillColor: '#E8EAED'
      },
      tableCell: {
        fontSize: 9, color: '#2C3E50'
      },

      // Estilos para subtotales
      subtotalLabel: {
        fontSize: 9, bold: true, color: '#2C3E50', fillColor: '#CFD8DC'
      },
      subtotalValue: {
        fontSize: 9, bold: true, color: '#2C3E50', fillColor: '#CFD8DC'
      },

      // Estilos específicos para mano de obra
      manpowerTitle: {
        fontSize: 11, bold: true, color: '#607D8B',
        decoration: 'underline', decorationStyle: 'solid', decorationColor: '#607D8B'
      },
      manpowerHeader: {
        bold: true, fontSize: 9, color: '#455A64'
      },
      manpowerCell: {
        fontSize: 9, color: '#2C3E50', bold: true
      },

      // Estilos específicos para insumos
      suppliesTitle: {
        fontSize: 10, bold: true, color: '#78909C', italics: true
      },
      suppliesHeader: {
        bold: true, fontSize: 8, color: '#546E7A'
      },
      suppliesCell: {
        fontSize: 8, color: '#37474F', italics: true
      },

      // Estilos para resumen financiero
      financialHeader: {
        bold: true, fontSize: 10, color: '#2C3E50'
      },
      financialCell: {
        fontSize: 9, color: '#2C3E50'
      },
      financialCellBold: {
        fontSize: 9, color: '#2C3E50', bold: true
      },
      financialTotal: {
        fontSize: 11, color: '#2C3E50', bold: true
      }
    },
    defaultStyle: { fontSize: 9 },
    footer: (currentPage, pageCount) => ({
      columns: [
        { text: `Página ${currentPage} de ${pageCount}`, alignment: 'left', fontSize: 8, color: '#7F8C8D' },
        { text: `Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, alignment: 'right', fontSize: 8, color: '#7F8C8D' },
      ],
      margin: [40, 10]
    })
  };

  pdfMakeModule.default.createPdf(docDefinition)
    .download(`Orden_${orden.orderNumber || "SinNumero"}_${new Date().toISOString().slice(0, 10)}.pdf`);
}