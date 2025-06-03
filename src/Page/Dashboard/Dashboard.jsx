import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUser, FaClipboardList, FaClipboardCheck, FaClock, FaCog } from 'react-icons/fa';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

const API_URL = 'https://api.trailers.trailersdelcaribe.net/api';

const Dashboard = () => {
  const [clientesActivos, setClientesActivos] = useState(0);
  const [ordenesActivas, setOrdenesActivas] = useState(0);
  const [tiposServicioCount, setTiposServicioCount] = useState(0);
  const [estadosCount, setEstadosCount] = useState(0);
  const [ordenesRecientes, setOrdenesRecientes] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(5);

  const [cotPendientes, setCotPendientes] = useState(0);
  const [tiempoPromedio, setTiempoPromedio] = useState(0);

  const [tipoGrafico, setTipoGrafico] = useState('ordenes');
  const [doughnutData, setDoughnutData] = useState({
    labels: [],
    datasets: [{ data: [], backgroundColor: [], borderColor: [], borderWidth: 1 }]
  });
  const [lineChartData, setLineChartData] = useState({ labels: [], datasets: [] });
  const [ventasChartData, setVentasChartData] = useState({ labels: [], datasets: [] });

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: true },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: { 
      y: { 
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      },
      x: {
        display: true
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true, 
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          },
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              const dataset = data.datasets[0];
              const total = dataset.data.reduce((a, b) => a + b, 0);
              
              return data.labels.map((label, i) => {
                const value = dataset.data[i];
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                
                return {
                  text: `${label}: ${value} (${percentage}%)`,
                  fillStyle: dataset.backgroundColor[i],
                  strokeStyle: dataset.borderColor[i],
                  lineWidth: dataset.borderWidth,
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%',
  };

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const [
          { data: clients },
          { data: ordersResp },
          { data: svcTypes },
          { data: statuses }
        ] = await Promise.all([
          axios.get(`${API_URL}/client`),
          axios.get(`${API_URL}/order`),
          axios.get(`${API_URL}/service-type`),
          axios.get(`${API_URL}/order-status`),
        ]);

        setClientesActivos(clients.total || 0);
        setOrdenesActivas(ordersResp.total || 0);
        setTiposServicioCount(svcTypes.length || 0);
        setEstadosCount(statuses.length || 0);

        
        const allOrders = Array.isArray(ordersResp.data) ? ordersResp.data : [];
        setOrdenes(allOrders);


       
        const totalPagesCalc = Math.ceil(allOrders.length / itemsPerPage);
        setTotalPages(totalPagesCalc);
        
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setOrdenesRecientes(allOrders.slice(startIndex, endIndex));

        
        const cotPend = allOrders.filter(
          o => o.orderStatus?.name?.toLowerCase().includes('pendiente') ||
               o.orderStatus?.name?.toLowerCase().includes('cotizacion') ||
               o.orderStatus?.name?.toLowerCase().includes('cotización')
        ).length;
        setCotPendientes(cotPend);

       
        const ordenesConFechas = allOrders.filter(o => {
          const hasOutDate = o.outDate;
          const hasCreatedDate = o.createdAt;
          return hasOutDate && hasCreatedDate;
        });

      

        if (ordenesConFechas.length > 0) {
          const tiempos = ordenesConFechas.map(o => {
            const fechaInicio = new Date(o.createdAt);
            const fechaFin = new Date(o.outDate);
            const diffTime = Math.abs(fechaFin - fechaInicio);
            const diasDiferencia = diffTime / (1000 * 60 * 60 * 24);
            
            
            
            return diasDiferencia;
          }).filter(tiempo => tiempo >= 0 && tiempo < 365); 

          const promedioDias = tiempos.length > 0 
            ? tiempos.reduce((a, b) => a + b, 0) / tiempos.length 
            : 0;
          
         
          setTiempoPromedio(promedioDias > 0 ? promedioDias.toFixed(1) : '0.0');
        } else {
          
         
          
          const ordenesConActualizacion = allOrders.filter(o => {
            const hasCreatedDate = o.createdAt;
            const hasUpdatedDate = o.updatedAt;
            const sonDiferentes = o.createdAt !== o.updatedAt;
            return hasCreatedDate && hasUpdatedDate && sonDiferentes;
          });

          console.log('Órdenes con updatedAt diferente:', ordenesConActualizacion.length);

          if (ordenesConActualizacion.length > 0) {
            const tiemposActualizacion = ordenesConActualizacion.map(o => {
              const fechaInicio = new Date(o.createdAt);
              const fechaFin = new Date(o.updatedAt);
              const diffTime = Math.abs(fechaFin - fechaInicio);
              const diasDiferencia = diffTime / (1000 * 60 * 60 * 24);
              
              console.log(`Orden ${o.orderNumber || o.idOrder}: Procesamiento = ${diasDiferencia.toFixed(1)} días`);
              
              return diasDiferencia;
            }).filter(tiempo => tiempo > 0 && tiempo < 365);

            const promedioActualizacion = tiemposActualizacion.length > 0 
              ? tiemposActualizacion.reduce((a, b) => a + b, 0) / tiemposActualizacion.length 
              : 0;
            
            console.log('Tiempo promedio de procesamiento:', promedioActualizacion);
            setTiempoPromedio(promedioActualizacion > 0 ? promedioActualizacion.toFixed(1) : '0.0');
          } else {
            console.log('No se encontraron órdenes para calcular tiempo promedio');
            setTiempoPromedio('N/A');
          }
        }

        // Doughnut (Distribución de órdenes por estado) - CORREGIDO
        if (allOrders.length > 0) {
          const estados = {};
          allOrders.forEach(o => {
            const estado = o.orderStatus?.name || 'Sin estado';
            estados[estado] = (estados[estado] || 0) + 1;
          });

          const estadoLabels = Object.keys(estados);
          const estadoVals = Object.values(estados);
          const doughColors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
          ];

          setDoughnutData({
            labels: estadoLabels,
            datasets: [{
              data: estadoVals,
              backgroundColor: doughColors.slice(0, estadoLabels.length),
              borderColor: doughColors.slice(0, estadoLabels.length).map(color => color + '80'),
              borderWidth: 2,
            }]
          });
        }

       
        const currentYear = new Date().getFullYear();
        const ordersByMonth = Array(12).fill(0);
        
        allOrders.forEach(o => {
          if (o.createdAt) {
            const fecha = new Date(o.createdAt);
            const mes = fecha.getMonth();
            if (mes >= 0 && mes <= 11) {
              ordersByMonth[mes]++;
            }
          }
        });

        setLineChartData({
          labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
          datasets: [{
            label: `Órdenes por mes`,
            data: ordersByMonth,
            fill: true,
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            tension: 0.4,
            pointBackgroundColor: 'rgba(54, 162, 235, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
          }]
        });

        // Gráfico de ventas por mes
        const ventasByMonth = Array(12).fill(0);
        
        allOrders.forEach(o => {
          if (o.createdAt) {
            const fecha = new Date(o.createdAt);
            const mes = fecha.getMonth();
            if (mes >= 0 && mes <= 11) {
              // Diferentes formas de obtener el total
              let total = 0;
              if (o.total?.totalVenta) {
                total = Number(o.total.totalVenta);
              } else if (o.totalAmount) {
                total = Number(o.totalAmount);
              } else if (o.amount) {
                total = Number(o.amount);
              } else if (o.price) {
                total = Number(o.price);
              }
              
              if (total > 0) {
                ventasByMonth[mes] += total;
              }
            }
          }
        });

        setVentasChartData({
          labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
          datasets: [{
            label: `Ventas por mes`,
            data: ventasByMonth,
            fill: true,
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2,
            tension: 0.4,
            pointBackgroundColor: 'rgba(255, 99, 132, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
          }]
        });

      } catch (e) {
       
        setTiempoPromedio('Error');
      }
    }
    fetchMetrics();
  }, [currentPage]); 

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="bg-gray-50 p-6">
      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-500 text-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Clientes Activos</h2>
              <p className="text-3xl font-bold mt-2">{clientesActivos}</p>
            </div>
            <FaUser className="text-2xl opacity-80" />
          </div>
        </div>
        <div className="bg-white text-gray-800 rounded-lg shadow p-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Cotizaciones Pendientes</h2>
              <p className="text-3xl font-bold mt-2">{cotPendientes}</p>
            </div>
            <FaClipboardList className="text-2xl opacity-80" />
          </div>
        </div>
        <div className="bg-white text-gray-800 rounded-lg shadow p-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Órdenes Activas</h2>
              <p className="text-3xl font-bold mt-2">{ordenesActivas}</p>
            </div>
            <FaClipboardCheck className="text-2xl opacity-80" />
          </div>
        </div>
        <div className="bg-white text-gray-800 rounded-lg shadow p-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Tiempo Promedio</h2>
              <p className="text-3xl font-bold mt-2">
                {tiempoPromedio === 'N/A' || tiempoPromedio === 'Error' 
                  ? tiempoPromedio 
                  : `${tiempoPromedio} días`
                }
              </p>
            </div>
            <FaClock className="text-2xl opacity-80" />
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Línea o Ventas */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 flex justify-between items-center border-b">
            <h2 className="text-lg font-semibold">
              {tipoGrafico === 'ordenes' ? 'Órdenes por mes' : 'Ventas por mes'}
            </h2>
            <FaCog className="cursor-pointer text-gray-500" />
          </div>
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">
                {tipoGrafico === 'ordenes' ? 'Órdenes' : 'Ventas'}
              </h3>
              <select
                value={tipoGrafico}
                onChange={e => setTipoGrafico(e.target.value)}
                className="border px-2 py-1 rounded text-sm"
              >
                <option value="ordenes">Órdenes</option>
                <option value="ventas">Ventas</option>
              </select>
            </div>
            <div style={{ height: '300px' }}>
              <Line
                data={tipoGrafico === 'ordenes' ? lineChartData : ventasChartData}
                options={lineOptions}
              />
            </div>
          </div>
        </div>

        {/* Doughnut */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 flex justify-between items-center border-b">
            <h2 className="text-lg font-semibold">Distribución de órdenes</h2>
            <FaCog className="cursor-pointer text-gray-500" />
          </div>
          <div className="p-4">
            <div style={{ height: '300px' }}>
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Órdenes recientes */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="text-lg font-semibold">Órdenes recientes</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              Página {currentPage} de {totalPages} ({ordenes.length} total)
            </span>
            <FaCog className="text-gray-500 cursor-pointer" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creación</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ordenesRecientes.length > 0 ? (
                ordenesRecientes.map(o => (
                  <tr key={o.idOrder}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-yellow-500">
                      #{o.orderNumber || o.idOrder}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {o.client?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-blue-500">
                      {o.orderStatus?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {o.serviceTypes?.map(st => st.name).join(', ') || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {new Date(o.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No hay órdenes para mostrar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Controles de paginación */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded text-sm ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                Anterior
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 rounded text-sm ${
                        pageNum === currentPage
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded text-sm ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                Siguiente
              </button>
            </div>
            
            <div className="text-sm text-gray-500">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, ordenes.length)} de {ordenes.length}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;