import logoImg from '/src/assets/Logo sin fondo.png';

export async function descargarOrdenCompletaPDFClinete_pdfmake(orden) {
  const pdfMakeModule = await import("pdfmake/build/pdfmake");
  const pdfFontsModule = await import("pdfmake/build/vfs_fonts");
  pdfMakeModule.default.vfs = pdfFontsModule.default.vfs || pdfFontsModule.vfs;

  const isValidArray = arr => Array.isArray(arr) && arr.length > 0;
  const formatDate = dateString => {
    if (!dateString) return "No definida";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("es-ES") + " " +
             d.toLocaleTimeString("es-ES", { hour:"2-digit", minute:"2-digit" });
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

  // Helper para convertir URL de imagen a Base64
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

  // convierte el logo a base64
  const logoBase64 = await getBase64ImageFromURL(logoImg);

  const docDefinition = {
    images: { logo: logoBase64 },
    content: [
      // logo centrado
      { image: 'logo', width: 120, alignment: 'center', margin: [0,0,0,12] },

      { text: "ORDEN DE TRABAJO", style: "header" },
      { text: `N°: ${orden.orderNumber || "Sin número"}`, style: "subheader" },
      "\n",

      // === INFORMACIÓN GENERAL (sin tabla) ===
      { text: "INFORMACIÓN GENERAL", style: "section" },
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: [
                { text: 'N° Orden: ', style: 'label' },
                { text: orden.orderNumber || '—', style: 'value' }
              ]},
              { text: [
                { text: 'Fecha de Creación: ', style: 'label' },
                { text: formatDate(orden.createdAt), style: 'value' }
              ]}
             
            ]
          },
          {
            width: '50%',
            stack: [
              { text: [
                { text: 'Estado: ', style: 'label' },
                { text: orden.orderStatus?.name || '—', style: 'value' }
              ]},
              { text: [
                { text: 'Fecha de Salida: ', style: 'label' },
                { text: formatDate(orden.outDate), style: 'value' }
              ]},
              { text: [
                { text: 'Tipos de Servicio: ', style: 'label' },
                { text: (isValidArray(orden.serviceTypes) ? orden.serviceTypes.map(st=>st.name).join(", ") : '—'), style: 'value' }
              ]}
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
          { text: [
            { text: 'Documento: ', style: 'label' },
            { text: `${orden.client?.document?.documentType?.name || '—'} ${orden.client?.document?.documentNumber || ''}`, style: 'value' }
          ]}
        ],
        margin: [0,0,0,15]
      },

      // === VEHÍCULO Y CONDUCTOR ===
      { text: "INFORMACIÓN DEL VEHÍCULO Y CONDUCTOR", style: "section" },
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: [
                { text: 'Cabezote: ', style: 'label' },
                { text: orden.vehicule?.placaCabezote || '—', style: 'value' }
              ]},
              { text: [
                { text: 'Trailer: ', style: 'label' },
                { text: orden.vehicule?.placaTrailer || '—', style: 'value' }
              ]},
              { text: [
                { text: 'Tipo de Vehículo: ', style: 'label' },
                { text: orden.vehicule?.vehiculeType?.name || '—', style: 'value' }
              ]},
               { text: [
                { text: 'Km Inicial: ', style: 'label' },
                { text: String(orden.kilometers ?? '—'), style: 'value' }
              ]}
            ]
          },
          {
            width: '50%',
            stack: [
              { text: [
                { text: 'Conductor: ', style: 'label' },
                { text: orden.assignedDriver
                  ? `${orden.assignedDriver.firstName} ${orden.assignedDriver.lastName}`
                  : '—', style: 'value' }
              ]},
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
              { text: [
                { text: 'Teléfono: ', style: 'label' },
                { text: orden.assignedDriver?.phoneNumber || '—', style: 'value' }
              ]}
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
      widths: ['40%','10%','10%','20%','20%'],
      body: [
        [
          { text: 'Material', style: 'tableHeader' },
          { text: 'Unidad',   style: 'tableHeader' },
          { text: 'Cant.',    style: 'tableHeader', alignment:'center' },
          { text: 'Venta U.', style: 'tableHeader', alignment:'right'  },
          { text: 'Venta T.', style: 'tableHeader', alignment:'right'  }
        ],
        ...orden.sparePartMaterials.map(spm => [
          { text: spm.sparePartMaterial?.name||'—',     style:'tableCell' },
          { text: spm.sparePartMaterial?.measurementUnit||'—', style:'tableCell', alignment:'center' },
          { text: String(spm.cantidad||0),              style:'tableCell', alignment:'center' },
          { text: formatCurrency(spm.ventaUnitaria),    style:'tableCell', alignment:'right' },
          { text: formatCurrency(spm.ventaTotal),       style:'tableCell', alignment:'right' }
        ]),
        [
          { text: 'SUBTOTAL', colSpan: 4, style:'subtotalCell', alignment:'right' },
          {},{},{},
          { text: formatCurrency(orden.total?.subtotalVentasRepuestos||0),
            style:'subtotalCell', alignment:'right' }
        ]
      ]
    },
    margin: [0,0,0,15]
  }
] : []),

// === MANO DE OBRA ===
...(isValidArray(orden.manpowers) ? [
  { text: "MANO DE OBRA", style: "section" },
  {
    table: {
      headerRows: 1,
      widths: ['60%','10%','15%','15%'],
      body: [
        [
          { text: 'Descripción', style:'tableHeader' },
          { text: 'Cant.',       style:'tableHeader', alignment:'center' },
          { text: 'Venta U.',    style:'tableHeader', alignment:'right' },
          { text: 'Venta T.',    style:'tableHeader', alignment:'right' }
        ],
        ...orden.manpowers.map(mp=>[
          { text: `${mp.manpower?.name||'—'}${mp.useDetail?'\n'+mp.useDetail:''}`, style:'tableCell' },
          { text: String(mp.cantidad||0),              style:'tableCell', alignment:'center' },
          { text: formatCurrency(mp.ventaUnitaria),    style:'tableCell', alignment:'right' },
          { text: formatCurrency(mp.ventaTotal),       style:'tableCell', alignment:'right' }
        ]),
        [
          { text: 'SUBTOTAL', colSpan: 3, style:'subtotalCell', alignment:'right' },
          {},{},
          { text: formatCurrency(orden.total?.subtotalVentasManoObra||0),
            style:'subtotalCell', alignment:'right' }
        ]
      ]
    },
    margin: [0,0,0,15]
  }
] : []),

// === RESUMEN FINANCIERO ===
...(orden.total ? [
  { text: "RESUMEN FINANCIERO", style: "section" },
  {
    table: {
      headerRows: 1,
      widths: ['60%','40%'],
      body: [
        [
          { text: 'Concepto', style:'financialHeader' },
          { text: 'Valor',    style:'financialHeader', alignment:'right' }
        ],
        [
          { text: 'Subtotal Ventas Repuestos', style:'financialCell' },
          { text: formatCurrency(orden.total.subtotalVentasRepuestos), style:'financialCell', alignment:'right' }
        ],
        [
          { text: 'Subtotal Ventas Mano de Obra', style:'financialCell' },
          { text: formatCurrency(orden.total.subtotalVentasManoObra), style:'financialCell', alignment:'right' }
        ],
        [
          { text: 'Subtotal Ventas', style:'financialCellBold' },
          { text: formatCurrency(orden.total.subtotalVentas), style:'financialCellBold', alignment:'right' }
        ],
        [
          { text: 'IVA (19%)', style:'financialCell' },
          { text: formatCurrency(orden.total.iva), style:'financialCell', alignment:'right' }
        ],
        [
          { text: 'TOTAL VENTA', style:'financialTotal' },
          { text: formatCurrency(orden.total.totalVenta), style:'financialTotal', alignment:'right' }
        ]
      ]
    },
    margin: [0,0,0,15]
  }
] : []),


    ],
    styles: {
      header: {
        fontSize: 18, bold: true, color: '#2980b9', margin: [0,0,0,8], alignment: 'center'
      },
      subheader: {
        fontSize: 14, color: '#34495e', margin: [0,0,0,6], alignment: 'center'
      },
      section: {
        fontSize: 12, bold: true, color: '#2980b9', margin: [0,15,0,8], 
        decoration: 'underline', decorationStyle: 'solid', decorationColor: '#2980b9'
      },
      label: {
        fontSize: 9, bold: true, color: '#2C3E50'
      },
      value: {
        fontSize: 9, color: '#34495e'
      },
      clientName: {
        fontSize: 11, bold: true, color: '#2C3E50', margin: [0,0,0,3]
      },
      
      // Estilos para tablas generales
      tableHeader: {
        bold: true, fontSize: 9, color: '#455A64', fillColor: '#E8EAED'
      },
      tableCell: {
        fontSize: 9, color: '#2C3E50'
      },
      subtotalCell: {
        fontSize: 9, color: '#2C3E50', bold: true
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
    .download(`Orden_${orden.orderNumber || "SinNumero"}_${new Date().toISOString().slice(0,10)}.pdf`);
}