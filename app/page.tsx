'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Plus, Trash2, Calendar, Users, TrendingUp, MessageSquare, Edit3, Save, X, BarChart3, Activity, Lightbulb, Lock, Eye, EyeOff, Download, FileSpreadsheet } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface NPSData {
  scores: number[];
  comentarios: {
    positivos: number;
    neutros: number;
    negativos: number;
    categorias: {
      precio: number;
      entrega: number;
      trato: number;
      inventario: number;
      otros: number;
    };
  };
}

interface MonthData {
  [asesor: string]: NPSData;
}

interface AllData {
  [month: string]: MonthData;
}

const NPSDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentMonth, setCurrentMonth] = useState('2024-01');
  const [data, setData] = useState<AllData>({});
  const [asesores, setAsesores] = useState(['Abidam', 'Diego', 'Angel', 'Leo', 'Lupita', 'Noé']);
  const [newAsesor, setNewAsesor] = useState('');
  const [editingAsesor, setEditingAsesor] = useState<string | null>(null);
  const [tempAsesorName, setTempAsesorName] = useState('');
  const [selectedAsesor, setSelectedAsesor] = useState('');
  const [npsScores, setNpsScores] = useState(Array(11).fill(0));
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [comentarios, setComentarios] = useState({
    positivos: 0,
    neutros: 0,
    negativos: 0,
    categorias: {
      precio: 0,
      entrega: 0,
      trato: 0,
      inventario: 0,
      otros: 0
    }
  });

  const CORRECT_CODE = 'MARIPOSA2025';

  // Cargar datos desde Supabase
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      loadAsesores();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      const { data: npsData, error } = await supabase
        .from('nps_data')
        .select('*');
      
      if (error) throw error;
      
      const formattedData: AllData = {};
      npsData?.forEach((item: any) => {
        if (!formattedData[item.month]) {
          formattedData[item.month] = {};
        }
        formattedData[item.month][item.asesor] = {
          scores: item.scores,
          comentarios: item.comentarios
        };
      });
      
      setData(formattedData);
    } catch (error) {
      console.error('Error loading data:', error);
      // Si no hay datos, inicializar con datos de ejemplo
      initializeExampleData();
    }
  };

  const loadAsesores = async () => {
    try {
      const { data: asesoresData, error } = await supabase
        .from('asesores')
        .select('name')
        .order('name');
      
      if (error) throw error;
      
      if (asesoresData && asesoresData.length > 0) {
        setAsesores(asesoresData.map((a: any) => a.name));
      }
    } catch (error) {
      console.error('Error loading asesores:', error);
    }
  };

  const initializeExampleData = () => {
    const initialData = {
      'Abidam': {
        scores: [2,3,3,0,0,2,1,14,35,47,20],
        comentarios: { positivos: 15, neutros: 8, negativos: 4, categorias: { precio: 3, entrega: 8, trato: 12, inventario: 2, otros: 2 }}
      },
      'Leo': {
        scores: [0,0,2,0,0,0,6,7,20,15,5],
        comentarios: { positivos: 8, neutros: 5, negativos: 7, categorias: { precio: 5, entrega: 4, trato: 6, inventario: 3, otros: 2 }}
      },
      'Lupita': {
        scores: [0,1,0,0,3,0,0,0,0,0,0],
        comentarios: { positivos: 1, neutros: 1, negativos: 2, categorias: { precio: 2, entrega: 1, trato: 1, inventario: 0, otros: 0 }}
      }
    };
    
    setData(prev => ({
      ...prev,
      [currentMonth]: initialData
    }));
  };

  const saveToSupabase = async (month: string, asesor: string, npsData: NPSData) => {
    try {
      const { error } = await supabase
        .from('nps_data')
        .upsert({
          month,
          asesor,
          scores: npsData.scores,
          comentarios: npsData.comentarios,
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      alert('Error guardando datos. Verifica tu conexión.');
    }
  };

  const saveAsesorToSupabase = async (asesorName: string) => {
    try {
      const { error } = await supabase
        .from('asesores')
        .insert({ name: asesorName });
      
      if (error && error.code !== '23505') { // Ignore duplicate key error
        throw error;
      }
    } catch (error) {
      console.error('Error saving asesor:', error);
    }
  };

  const handleLogin = () => {
    if (accessCode === CORRECT_CODE) {
      setIsAuthenticated(true);
    } else {
      alert('Código de acceso incorrecto');
    }
  };

  const calculateNPS = (scores: number[]) => {
    const total = scores.reduce((sum, count) => sum + count, 0);
    if (total === 0) return { nps: 0, promotores: 0, pasivos: 0, detractores: 0 };
    
    const promotores = scores[9] + scores[10];
    const pasivos = scores[7] + scores[8];
    const detractores = scores.slice(0, 7).reduce((sum, count) => sum + count, 0);
    const nps = ((promotores - detractores) / total) * 100;
    
    return { nps: Math.round(nps * 100) / 100, promotores, pasivos, detractores, total };
  };

  const getMonthData = () => {
    return data[currentMonth] || {};
  };

  const saveAsesorData = async () => {
    if (!selectedAsesor) return;
    
    const npsData = {
      scores: [...npsScores],
      comentarios: { ...comentarios }
    };
    
    const monthData = { ...getMonthData() };
    monthData[selectedAsesor] = npsData;
    
    setData(prev => ({
      ...prev,
      [currentMonth]: monthData
    }));
    
    // Guardar en Supabase
    await saveToSupabase(currentMonth, selectedAsesor, npsData);
    
    // Reset form
    setSelectedAsesor('');
    setNpsScores(Array(11).fill(0));
    setComentarios({
      positivos: 0,
      neutros: 0,
      negativos: 0,
      categorias: { precio: 0, entrega: 0, trato: 0, inventario: 0, otros: 0 }
    });
  };

  const addAsesor = async () => {
    if (newAsesor.trim() && !asesores.includes(newAsesor.trim())) {
      const newAsesorName = newAsesor.trim();
      setAsesores([...asesores, newAsesorName]);
      await saveAsesorToSupabase(newAsesorName);
      setNewAsesor('');
    }
  };

  // Funciones de exportación (mismas que antes)
  const exportToCSV = (dataToExport: any[], filename: string) => {
    const csvContent = convertToCSV(dataToExport);
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
  };

  const convertToCSV = (data: any[], separator = ',') => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(separator);
    
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(separator)
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const exportCurrentMonthData = (format = 'csv') => {
    const monthData = getMonthData();
    const exportData: any[] = [];
    
    Object.entries(monthData).forEach(([asesor, data]) => {
      const metrics = calculateNPS(data.scores);
      const totalComentarios = data.comentarios ? 
        data.comentarios.positivos + data.comentarios.neutros + data.comentarios.negativos : 0;
      
      exportData.push({
        'Mes': currentMonth,
        'Asesor': asesor,
        'NPS': metrics.nps,
        'Total_Respuestas': metrics.total,
        'Promotores': metrics.promotores,
        'Pasivos': metrics.pasivos,
        'Detractores': metrics.detractores,
        'Total_Comentarios': totalComentarios,
        'Comentarios_Positivos': data.comentarios?.positivos || 0,
        'Comentarios_Neutros': data.comentarios?.neutros || 0,
        'Comentarios_Negativos': data.comentarios?.negativos || 0,
      });
    });
    
    const filename = `NPS_Mariposa_${currentMonth}.csv`;
    exportToCSV(exportData, filename);
  };

  // Resto de las funciones de lógica (igual que antes)
  const getChartData = () => {
    const monthData = getMonthData();
    return asesores.map(asesor => {
      const asesorData = monthData[asesor];
      if (!asesorData) return null;
      
      const metrics = calculateNPS(asesorData.scores);
      const totalComentarios = asesorData.comentarios ? 
        asesorData.comentarios.positivos + asesorData.comentarios.neutros + asesorData.comentarios.negativos : 0;
      
      return {
        asesor,
        nps: metrics.nps,
        promotores: metrics.promotores,
        pasivos: metrics.pasivos,
        detractores: metrics.detractores,
        totalRespuestas: metrics.total,
        totalComentarios
      };
    }).filter(Boolean);
  };

  const getGeneralNPS = () => {
    const monthData = getMonthData();
    const generalScores = Array(11).fill(0);
    
    Object.values(monthData).forEach(asesorData => {
      if (asesorData.scores) {
        asesorData.scores.forEach((count, index) => {
          generalScores[index] += count;
        });
      }
    });
    
    return calculateNPS(generalScores);
  };

  const getAvailableMonths = () => {
    return Object.keys(data).sort().reverse();
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <Lock className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">NPS Mariposa</h1>
            <p className="text-gray-600 mt-2">Ingresa el código de acceso para continuar</p>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Código de acceso"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:ring-blue-500 focus:border-blue-500 pr-10"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
              </button>
            </div>
            
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors font-semibold"
            >
              Ingresar
            </button>
          </div>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            Dashboard protegido • Acceso autorizado solamente
          </div>
        </div>
      </div>
    );
  }

  const chartData = getChartData();
  const generalNPS = getGeneralNPS();

  return (
    <div className="min-h-screen bg-gray-50" onClick={() => setShowExportMenu(false)}>
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🦋</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">NPS Mariposa</h1>
            </div>
            
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                  activeTab === 'dashboard' 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 size={16} />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('analysis')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                  activeTab === 'analysis' 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Lightbulb size={16} />
                Análisis
              </button>
              <button
                onClick={() => setActiveTab('trends')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                  activeTab === 'trends' 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Activity size={16} />
                Tendencias
              </button>
            </div>

            <button
              onClick={() => setIsAuthenticated(false)}
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Month Selector */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="text-gray-500" size={20} />
              <select 
                value={currentMonth} 
                onChange={(e) => setCurrentMonth(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {getAvailableMonths().map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
                <option value="nuevo">+ Nuevo Mes</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              {/* Botones de Exportación */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowExportMenu(!showExportMenu);
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Download size={16} />
                    Exportar
                  </button>
                  
                  {/* Dropdown menu */}
                  {showExportMenu && (
                    <div className="absolute right-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50" onClick={(e) => e.stopPropagation()}>
                      <div className="py-1">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                          Mes Actual ({currentMonth})
                        </div>
                        <button
                          onClick={() => {
                            exportCurrentMonthData('csv');
                            setShowExportMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <FileSpreadsheet size={14} />
                          Descargar CSV
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-sm text-gray-600">
                Período seleccionado: <span className="font-medium">{currentMonth}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800">NPS General</h3>
                <p className="text-3xl font-bold text-blue-600">{generalNPS.nps}%</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-800">Promotores</h3>
                <p className="text-3xl font-bold text-green-600">{generalNPS.promotores}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-800">Pasivos</h3>
                <p className="text-3xl font-bold text-yellow-600">{generalNPS.pasivos}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-800">Detractores</h3>
                <p className="text-3xl font-bold text-red-600">{generalNPS.detractores}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-800">Total Respuestas</h3>
                <p className="text-3xl font-bold text-purple-600">{generalNPS.total}</p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-indigo-800">Total Comentarios</h3>
                <p className="text-3xl font-bold text-indigo-600">{(() => {
                  const monthData = getMonthData();
                  const totalComentarios = Object.values(monthData).reduce((sum, asesorData) => {
                    if (asesorData.comentarios) {
                      return sum + asesorData.comentarios.positivos + asesorData.comentarios.neutros + asesorData.comentarios.negativos;
                    }
                    return sum;
                  }, 0);
                  return totalComentarios;
                })()}</p>
              </div>
            </div>

            {/* Resto del dashboard... */}
            {/* Por brevedad, incluyo solo las partes principales. El resto sigue igual */}
          </>
        )}
      </div>
    </div>
  );
};

export default NPSDashboard;
