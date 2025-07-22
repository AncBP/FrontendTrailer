import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUser, FaClipboardList, FaClipboardCheck, FaClock, FaCog, FaSpinner, FaTools, FaWrench, FaHardHat, FaCar, FaUserTie } from 'react-icons/fa'; // Added FaUserTie icon for drivers

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const API_URL = 'https://api.trailers.trailersdelcaribe.net/api';

const Dashboard = ({ user }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [clientesActivos, setClientesActivos] = useState(0);
  const [ordenesActivas, setOrdenesActivas] = useState(0);
  const [cotPendientes, setCotPendientes] = useState(0);
  const [tiempoPromedio, setTiempoPromedio] = useState(0);

  const [allOrdersData, setAllOrdersData] = useState([]); 
  const [ordenesRecientes, setOrdenesRecientes] = useState([]); 
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(5);

  const [tipoGrafico, setTipoGrafico] = useState('ordenes');
  const [doughnutData, setDoughnutData] = useState({
    labels: [],
    datasets: [{ data: [], backgroundColor: [], borderColor: [], borderWidth: 1 }]
  });
  const [lineChartData, setLineChartData] = useState({ labels: [], datasets: [] });
  const [ventasChartData, setVentasChartData] = useState({ labels: [], datasets: [] });
  const [customerSegmentData, setCustomerSegmentData] = useState({});
  const [clientesSegmentados, setClientesSegmentados] = useState({});

  
  const [mostUsedParts, setMostUsedParts] = useState([]);
  const [mostUsedSupplies, setMostUsedSupplies] = useState([]);
  const [dailyOrderData, setDailyOrderData] = useState({ labels: [], datasets: [] });
  const [contractorOrderCounts, setContractorOrderCounts] = useState([]);
  const [topAssignedDrivers, setTopAssignedDrivers] = useState([]); 
  const [totalUniqueAssignedDrivers, setTotalUniqueAssignedDrivers] = useState(0); 

  
  const today = new Date();
  const [globalSelectedYear, setGlobalSelectedYear] = useState(today.getFullYear());
  const [globalSelectedMonth, setGlobalSelectedMonth] = useState(today.getMonth()); 
  

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
          generateLabels: function (chart) {
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
          label: function (context) {
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

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Cantidad de Órdenes'
        },
        ticks: {
          stepSize: 1
        }
      },
      x: {
        title: {
          display: true,
          text: 'Día del Mes'
        }
      }
    }
  };


 
  const calculateLinearRegression = (data) => {
    const n = data.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    for (let i = 0; i < n; i++) {
      const x = i; 
      const y = data[i];

      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    }

    const denominator = (n * sumX2) - (sumX * sumX);

    if (denominator === 0) {
      return { m: 0, b: sumY / n }; 
    }

    const m = ((n * sumXY) - (sumX * sumY)) / denominator;
    const b = (sumY - (m * sumX)) / n;

    return { m, b };
  };

  
  const filterOrdersByDate = (ordersArray, year, month) => {
    return ordersArray.filter(order => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt);
      return orderDate.getFullYear() === year && orderDate.getMonth() === month;
    });
  };

  
  async function analyzeCustomerSegmentation(allOrders, targetYear) {
    try {
      const clientsResponse = await axios.get(`${API_URL}/client`, {
        params: { filter: 'Activo', limit: 1000, offset: 0 }
      });
      const allActiveClients = clientsResponse.data.data || [];

      const clientOrderCounts = {};

      allActiveClients.forEach(client => {
        clientOrderCounts[client.idClient] = 0;
      });

      const ordersInTargetYear = allOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.getFullYear() === targetYear &&
          allActiveClients.some(client => client.idClient === order.client?.idClient);
      });

      ordersInTargetYear.forEach(order => {
        const clientId = order.client?.idClient;
        if (clientId) { 
          clientOrderCounts[clientId] = (clientOrderCounts[clientId] || 0) + 1;
        }
      });

      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(today.getMonth() - 3);

      let frecuentes = 0;
      let regulares = 0;
      let esporadicos = 0;
      let nuevos = 0;

      allActiveClients.forEach(client => {
        const clientId = client.idClient;
        const orderCount = clientOrderCounts[clientId] || 0;

        if (orderCount >= 6) {
          frecuentes++;
        } else if (orderCount >= 3) {
          regulares++;
        } else if (orderCount >= 1) {
          esporadicos++;
        } else {
          
          if (client.createdAt) {
            const clientCreatedDate = new Date(client.createdAt);
            if (clientCreatedDate >= threeMonthsAgo && clientCreatedDate.getFullYear() === targetYear) {
              nuevos++;
            }
          }
        }
      });

      setClientesSegmentados({
        frecuentes,
        regulares,
        esporadicos,
        nuevos
      });

      const segmentLabels = ['Clientes Frecuentes', 'Clientes Regulares', 'Clientes Esporádicos', 'Clientes Nuevos'];
      const segmentValues = [frecuentes, regulares, esporadicos, nuevos];
      const segmentColors = [
        '#10B981', '#3B82F6', '#F59E0B', '#EF4444'
      ];

      setCustomerSegmentData({
        labels: segmentLabels,
        datasets: [{
          data: segmentValues,
          backgroundColor: segmentColors,
          borderColor: segmentColors.map(color => color + 'CC'),
          borderWidth: 2,
        }]
      });

    } catch (error) {
      console.error('Error analyzing customer segmentation:', error);
    }
  }


 
  useEffect(() => {
    setIsLoading(true);

    async function fetchAllDashboardData() {
      try {
        const [
          { data: clientsResp },
          ordersResp, 
          activeOrdersResp, 
        ] = await Promise.all([
          axios.get(`${API_URL}/client`, {
            params: { filter: 'Activo', limit: 1, offset: 0 }
          }),
          axios.get(`${API_URL}/order/all`), 
          axios.get(`${API_URL}/order/all`, { params: { showActiveOnly: 'true' } }), 
        ]);

        const fetchedAllOrders = Array.isArray(ordersResp.data) ? ordersResp.data : [];
        setAllOrdersData(fetchedAllOrders); // Store all orders

        
        setClientesActivos(clientsResp.total || 0);
        
        const activeOrdersCount = Array.isArray(activeOrdersResp.data) ? activeOrdersResp.data.length : 0;
        setOrdenesActivas(activeOrdersCount);

        setCotPendientes(fetchedAllOrders.filter(
          o => o.orderStatus?.name?.toLowerCase() === 'Pendiente Cotización'
        ).length);

        
        const ordenesConFechasCompletas = fetchedAllOrders.filter(o => o.outDate && o.createdAt);
        if (ordenesConFechasCompletas.length > 0) {
          const tiempos = ordenesConFechasCompletas.map(o => {
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
          
          const ordenesConActualizacion = fetchedAllOrders.filter(o => {
            const hasCreatedDate = o.createdAt;
            const hasUpdatedDate = o.updatedAt;
            
            const isActuallyUpdated = new Date(o.updatedAt) > new Date(o.createdAt);
            return hasCreatedDate && hasUpdatedDate && isActuallyUpdated;
          });

          if (ordenesConActualizacion.length > 0) {
            const tiemposActualizacion = ordenesConActualizacion.map(o => {
              const fechaInicio = new Date(o.createdAt);
              const fechaFin = new Date(o.updatedAt);
              const diffTime = Math.abs(fechaFin - fechaInicio);
              const diasDiferencia = diffTime / (1000 * 60 * 60 * 24);
              return diasDiferencia;
            }).filter(tiempo => tiempo > 0 && tiempo < 365); 

            const promedioActualizacion = tiemposActualizacion.length > 0
              ? tiemposActualizacion.reduce((a, b) => a + b, 0) / tiemposActualizacion.length
              : 0;

            setTiempoPromedio(promedioActualizacion > 0 ? promedioActualizacion.toFixed(1) : '0.0');
          } else {
            setTiempoPromedio('N/A');
          }
        }


        
        if (fetchedAllOrders.length > 0) {
          const estados = {};
          fetchedAllOrders.forEach(o => {
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
        } else {
          setDoughnutData({
            labels: ['Sin Datos'],
            datasets: [{ data: [1], backgroundColor: ['#d1d5db'], borderColor: ['#9ca3af'], borderWidth: 1 }]
          });
        }


        
        const currentYearForLineCharts = globalSelectedYear;

        const allMonthsLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const ordersByMonth = Array(12).fill(0);
        fetchedAllOrders.forEach(o => {
          if (o.createdAt) {
            const fecha = new Date(o.createdAt);
            const mes = fecha.getMonth();
            if (fecha.getFullYear() === currentYearForLineCharts && mes >= 0 && mes <= 11) {
              ordersByMonth[mes]++;
            }
          }
        });

        const isCurrentYear = currentYearForLineCharts === today.getFullYear();
        const dataForPrediction = ordersByMonth.slice(0, today.getMonth() + 1);
        let predictionData = Array(12).fill(null);
        let currentYearLabels = allMonthsLabels;

        if (isCurrentYear && dataForPrediction.length > 1) {
          const { m: mOrders, b: bOrders } = calculateLinearRegression(dataForPrediction);
          const predictedOrders = Math.max(0, Math.round(mOrders * dataForPrediction.length + bOrders));

          predictionData = Array(today.getMonth() + 1).fill(null);
          predictionData[today.getMonth()] = ordersByMonth[today.getMonth()];
          predictionData.push(predictedOrders);
          currentYearLabels = [...allMonthsLabels.slice(0, today.getMonth() + 1), 'Próx. Mes'];
        }

        setLineChartData({
          labels: currentYearLabels,
          datasets: [
            {
              label: `Órdenes por mes (${currentYearForLineCharts})`,
              data: ordersByMonth.slice(0, isCurrentYear ? today.getMonth() + 1 : 12),
              fill: true,
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 2,
              tension: 0.4,
              pointBackgroundColor: 'rgba(54, 162, 235, 1)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 4,
            },
            ...(isCurrentYear && dataForPrediction.length > 1 ? [{
              label: 'Predicción Órdenes',
              data: predictionData,
              fill: false,
              borderColor: 'rgba(54, 162, 235, 0.7)',
              borderWidth: 2,
              borderDash: [5, 5],
              pointRadius: 5,
              pointBackgroundColor: 'rgba(54, 162, 235, 1)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              tension: 0.4,
              spanGaps: true
            }] : [])
          ]
        });

        
        const ventasByMonth = Array(12).fill(0);
        fetchedAllOrders.forEach(o => {
          if (o.createdAt) {
            const fecha = new Date(o.createdAt);
            const mes = fecha.getMonth();
            if (fecha.getFullYear() === currentYearForLineCharts && mes >= 0 && mes <= 11) {
              let total = Number(o.total?.totalVenta || o.totalAmount || o.amount || o.price || 0);
              if (total > 0) {
                ventasByMonth[mes] += total;
              }
            }
          }
        });

        const salesDataForPrediction = ventasByMonth.slice(0, today.getMonth() + 1);
        let salesPredictionData = Array(12).fill(null);

        if (isCurrentYear && salesDataForPrediction.length > 1) {
          const { m: mVentas, b: bVentas } = calculateLinearRegression(salesDataForPrediction);
          const predictedSales = Math.max(0, Math.round(mVentas * salesDataForPrediction.length + bVentas));

          salesPredictionData = Array(today.getMonth() + 1).fill(null);
          salesPredictionData[today.getMonth()] = ventasByMonth[today.getMonth()];
          salesPredictionData.push(predictedSales);
        }

        setVentasChartData({
          labels: currentYearLabels,
          datasets: [
            {
              label: `Ventas por mes (${currentYearForLineCharts})`,
              data: ventasByMonth.slice(0, isCurrentYear ? today.getMonth() + 1 : 12),
              fill: true,
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 2,
              tension: 0.4,
              pointBackgroundColor: 'rgba(255, 99, 132, 1)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 4,
            },
            ...(isCurrentYear && salesDataForPrediction.length > 1 ? [{
              label: 'Predicción Ventas',
              data: salesPredictionData,
              fill: false,
              borderColor: 'rgba(255, 99, 132, 0.7)',
              borderWidth: 2,
              borderDash: [5, 5],
              pointRadius: 5,
              pointBackgroundColor: 'rgba(255, 99, 132, 1)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              tension: 0.4,
              spanGaps: true
            }] : [])
          ]
        });

        
        await analyzeCustomerSegmentation(fetchedAllOrders, today.getFullYear());

        
        const totalPagesCalc = Math.ceil(fetchedAllOrders.length / itemsPerPage);
        setTotalPages(totalPagesCalc);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setOrdenesRecientes(fetchedAllOrders.slice(startIndex, endIndex));


      } catch (e) {
        console.error('Error fetching metrics:', e);
        setTiempoPromedio('Error');
        setAllOrdersData([]); 
        setOrdenesRecientes([]);
        setOrdenesActivas(0); 
      } finally {
        setIsLoading(false);
      }
    }
   
    fetchAllDashboardData();
  }, [currentPage, globalSelectedYear]);


  
  useEffect(() => {
    if (allOrdersData.length === 0) {
      
      setMostUsedParts([]);
      setMostUsedSupplies([]);
      setDailyOrderData({ labels: [], datasets: [] });
      setContractorOrderCounts([]);
      setTopAssignedDrivers([]); 
      setTotalUniqueAssignedDrivers(0); 
      return;
    }

    
    const filteredOrdersByGlobalPeriod = filterOrdersByDate(allOrdersData, globalSelectedYear, globalSelectedMonth);

   
    const partsCount = {};
    filteredOrdersByGlobalPeriod.forEach(order => {
      if (order.sparePartMaterials && Array.isArray(order.sparePartMaterials)) {
        order.sparePartMaterials.forEach(item => {
          
          if (item.sparePartMaterial?.name && item.cantidad) {
            const unit = item.sparePartMaterial.unit || 'uds.'; 
            const key = `${item.sparePartMaterial.name} (${unit})`;
            partsCount[key] = (partsCount[key] || 0) + item.cantidad;
          }
        });
      }
    });
    const sortedParts = Object.entries(partsCount)
      .map(([nameWithUnit, count]) => ({ name: nameWithUnit, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    setMostUsedParts(sortedParts);

    
    const suppliesCount = {};
    filteredOrdersByGlobalPeriod.forEach(order => {
      if (order.manpowers && Array.isArray(order.manpowers)) {
        order.manpowers.forEach(manpower => {
          if (manpower.supplies && Array.isArray(manpower.supplies)) {
            manpower.supplies.forEach(supplyItem => {
             
              if (supplyItem.supply?.name && supplyItem.cantidad) {
                const unit = supplyItem.supply.unit || ''; 
                const key = `${supplyItem.supply.name} (${unit})`;
                suppliesCount[key] = (suppliesCount[key] || 0) + supplyItem.cantidad;
              }
            });
          }
        });
      }
    });
    const sortedSupplies = Object.entries(suppliesCount)
      .map(([nameWithUnit, count]) => ({ name: nameWithUnit, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    setMostUsedSupplies(sortedSupplies);

    
    const contractorCounts = {};
    filteredOrdersByGlobalPeriod.forEach(order => {
      if (order.manpowers && Array.isArray(order.manpowers)) {
        order.manpowers.forEach(manpower => {
          if (manpower.selectedContractor?.firstName && manpower.selectedContractor?.lastName) {
            const contractorName = `${manpower.selectedContractor.firstName} ${manpower.selectedContractor.lastName}`;
            contractorCounts[contractorName] = (contractorCounts[contractorName] || 0) + 1;
          }
        });
      }
    });
    const sortedContractors = Object.entries(contractorCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    setContractorOrderCounts(sortedContractors);

    
    const driverOrderCounts = {};
    const uniqueDriversInMonth = new Set();
    filteredOrdersByGlobalPeriod.forEach(order => {
      if (order.assignedDriver?.firstName && order.assignedDriver?.lastName) {
        const driverFullName = `${order.assignedDriver.firstName} ${order.assignedDriver.lastName}`;
        driverOrderCounts[driverFullName] = (driverOrderCounts[driverFullName] || 0) + 1;
        uniqueDriversInMonth.add(driverFullName); 
      }
    });
    const sortedDrivers = Object.entries(driverOrderCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    setTopAssignedDrivers(sortedDrivers);
    setTotalUniqueAssignedDrivers(uniqueDriversInMonth.size); 

   
    const daysInSelectedMonth = new Date(globalSelectedYear, globalSelectedMonth + 1, 0).getDate();
    const dailyCounts = Array(daysInSelectedMonth).fill(0);
    const dayLabels = Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1);

    filteredOrdersByGlobalPeriod.forEach(order => {
      if (order.createdAt) {
        const orderDate = new Date(order.createdAt);
        const dayOfMonth = orderDate.getDate();
        dailyCounts[dayOfMonth - 1]++;
      }
    });

    let dataToDisplay = dailyCounts;
    let labelsToDisplay = dayLabels;
    
    if (globalSelectedMonth === today.getMonth() && globalSelectedYear === today.getFullYear()) {
      dataToDisplay = dailyCounts.slice(0, today.getDate());
      labelsToDisplay = dayLabels.slice(0, today.getDate());
    }

    setDailyOrderData({
      labels: labelsToDisplay,
      datasets: [
        {
          label: `Órdenes por día (${new Date(globalSelectedYear, globalSelectedMonth).toLocaleString('es-ES', { month: 'long', year: 'numeric' })})`,
          data: dataToDisplay,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    });

  }, [allOrdersData, globalSelectedYear, globalSelectedMonth]); 

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  
  const getMonthName = (monthIndex) => {
    
    const date = new Date(2000, monthIndex, 1);
    return date.toLocaleString('es-ES', { month: 'long' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-gray-500" />
      </div>
    );
  }

 
  const currentYear = today.getFullYear();
  const yearOptions = [];
  for (let y = currentYear - 2; y <= currentYear + 1; y++) {
    yearOptions.push(y);
  }

  return (
    <div className="bg-gray-50 p-6">
     
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow">
        
        <h1 className="text-xl font-bold text-gray-800 text-center md:text-left md:flex-grow">
          Reporte {globalSelectedYear}
        </h1>

       
        <div className="flex flex-wrap items-center gap-4 justify-center md:justify-end"> 
          <div>
            <label htmlFor="year-select" className="block text-sm font-medium text-gray-700">Año</label>
            <select
              id="year-select"
              value={globalSelectedYear}
              onChange={(e) => {
                setGlobalSelectedYear(parseInt(e.target.value));
              }}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="month-select" className="block text-sm font-medium text-gray-700">Mes</label>
            <select
              id="month-select"
              value={globalSelectedMonth}
              onChange={(e) => {
                setGlobalSelectedMonth(parseInt(e.target.value));
              }}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              {[...Array(12).keys()].map(monthIndex => (
                <option key={monthIndex} value={monthIndex}>
                  {getMonthName(monthIndex)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

     
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
              <h2 className="text-lg font-semibold">Pendiente Cotización</h2>
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
              <h2 className="text-lg font-semibold">Tiempo Promedio Órdenes</h2>
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

      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
       
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 flex justify-between items-center border-b">
            <h2 className="text-lg font-semibold">
              {tipoGrafico === 'ordenes' ? `Órdenes por Mes y Predicción (${globalSelectedYear})` : `Ventas por Mes y Predicción (${globalSelectedYear})`}
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

       
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 flex justify-between items-center border-b">
            <h2 className="text-lg font-semibold">Distribución de Órdenes por Estado (General)</h2>
            <FaCog className="cursor-pointer text-gray-500" />
          </div>
          <div className="p-4">
            <div style={{ height: '300px' }}>
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>
        </div>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3 flex items-center">
            <FaTools className="mr-2 text-gray-600" /> Repuestos Más Usados ({getMonthName(globalSelectedMonth)} {globalSelectedYear})
          </h2>
          {mostUsedParts.length > 0 ? (
            <ul className="list-disc pl-5 text-gray-700">
              {mostUsedParts.map((item, index) => (
                <li key={index} className="flex justify-between items-center py-1">
                  <span>{item.name}</span>
                  <span className="font-semibold text-blue-600">{item.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No hay datos de repuestos para este periodo.</p>
          )}
        </div>

        
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3 flex items-center">
            <FaWrench className="mr-2 text-gray-600" /> Insumos Más Usados ({getMonthName(globalSelectedMonth)} {globalSelectedYear})
          </h2>
          {mostUsedSupplies.length > 0 ? (
            <ul className="list-disc pl-5 text-gray-700">
              {mostUsedSupplies.map((item, index) => (
                <li key={index} className="flex justify-between items-center py-1">
                  <span>{item.name}</span>
                  <span className="font-semibold text-blue-600">{item.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No hay datos de insumos para este periodo.</p>
          )}
        </div>

        
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3 flex items-center">
            <FaHardHat className="mr-2 text-gray-600" /> Contratistas con Más Órdenes ({getMonthName(globalSelectedMonth)} {globalSelectedYear})
          </h2>
          {contractorOrderCounts.length > 0 ? (
            <ul className="list-disc pl-5 text-gray-700">
              {contractorOrderCounts.map((contractor, index) => (
                <li key={index} className="flex justify-between items-center py-1">
                  <span>{contractor.name}</span>
                  <span className="font-semibold text-blue-600">{contractor.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No hay datos de contratistas para este periodo.</p>
          )}
        </div>

        
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3 flex items-center">
            <FaUserTie className="mr-2 text-gray-600" />Conductores Asignados ({getMonthName(globalSelectedMonth)} {globalSelectedYear})
          </h2>
          {topAssignedDrivers.length > 0 ? (
            <ul className="list-disc pl-5 text-gray-700">
              {topAssignedDrivers.map((driver, index) => (
                <li key={index} className="flex justify-between items-center py-1">
                  <span>{driver.name}</span>
                  <span className="font-semibold text-blue-600">{driver.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No hay datos de conductores para este periodo.</p>
          )}
          <div className="mt-4 border-t pt-3">
            <p className="text-sm text-gray-600">Total de conductores únicos con órdenes:</p>
            <p className="text-xl font-bold text-blue-700">{totalUniqueAssignedDrivers}</p>
          </div>
        </div>
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 flex justify-between items-center border-b">
            <h2 className="text-lg font-semibold">Órdenes Iniciadas por Día ({getMonthName(globalSelectedMonth)} {globalSelectedYear})</h2>
            <FaCog className="cursor-pointer text-gray-500" />
          </div>
          <div className="p-4">
            <div style={{ height: '300px' }}>
              <Bar data={dailyOrderData} options={barOptions} />
            </div>
          </div>
        </div>

        
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 flex justify-between items-center border-b">
            <h2 className="text-lg font-semibold">Segmentación de Clientes Activos ({today.getFullYear()})</h2>
            <FaCog className="cursor-pointer text-gray-500" />
          </div>
          <div className="p-4">
            <div style={{ height: '300px' }}>
              <Doughnut data={customerSegmentData} options={doughnutOptions} />
            </div>

          </div>
        </div>
      </div>

      
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="text-lg font-semibold">Órdenes Recientes</h2>
          <span className="text-sm text-gray-500">
            Total general: {allOrdersData.length} órdenes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Creación
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ordenesRecientes.map(o => (
                <tr key={o.idOrder}>
                  <td className="px-6 py-4">#{o.orderNumber || o.idOrder}</td>
                  <td className="px-6 py-4">{o.client?.name || 'N/A'}</td>
                  <td className="px-6 py-4">{o.orderStatus?.name || 'N/A'}</td>
                  <td className="px-6 py-4">{new Date(o.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {ordenesRecientes.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    No hay órdenes para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

       
        <div className="flex justify-center items-center mt-6 gap-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className={`p-2 rounded hover:bg-gray-200 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >‹</button>

          <span className="text-sm text-gray-700">
            Página {currentPage} de {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`p-2 rounded hover:bg-gray-200 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >›</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;