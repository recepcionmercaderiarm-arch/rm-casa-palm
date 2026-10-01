import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, Clock, CheckCircle, XCircle, FileText, User, 
  Phone, Building2, MapPin, Package, Search, LogOut,
  Edit2, Trash2, Plus, Settings, AlertTriangle, 
  ArrowRight, UserCircle, ShoppingCart, LayoutDashboard, 
  List, BarChart2, Download, Upload, Calendar, Check, 
  ChevronRight, CalendarCheck, Users, Briefcase,
  MessageCircle, Camera, PenTool, Eye, AlertCircle, Save,
  Star, Activity, PieChart, Timer, AlertOctagon, TrendingUp
} from 'lucide-react';

const MOCK_PROVIDERS_DB = [
  { code: 'P001', name: 'Arcor S.A.' },
  { code: 'P002', name: 'Coca Cola Femsa' },
  { code: 'P003', name: 'Molinos Río de la Plata' },
  { code: 'P004', name: 'Quilmes' },
  { code: 'P005', name: 'Mastellone Hnos (La Serenísima)' },
  { code: 'P006', name: 'Cerámica Cunmalleu' },
  { code: 'P007', name: 'Loma Negra C.I.A.S.A.' },
  { code: 'P008', name: 'Ternium Argentina S.A.' }
];

const MOCK_TRANSPORT_DB = [
  { name: 'Expreso Sur SRL' },
  { name: 'Logística Panamericana' },
  { name: 'Transportes El Rápido' },
  { name: 'Tte Parra' },
  { name: 'Tte Chiche' },
  { name: 'Expreso Oro Blanco' },
  { name: 'Tte Pellegrino' },
  { name: 'Tte Clemente Hnos.' }
];

const MOCK_DRIVERS_DB = [
  { name: 'Juan Pérez', transport: 'Expreso Sur SRL', phone: '1123456789' },
  { name: 'Carlos Gómez', transport: 'Logística Panamericana', phone: '1198765432' },
  { name: 'Miguel Ángel', transport: 'Tte Parra', phone: '1155554444' }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  
  const [trucks, setTrucks] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [sectors, setSectors] = useState(['Alero Reparto', 'Playón 5', 'Puente Grúa', 'Congelados/Refrigerados']);
  const [personnel, setPersonnel] = useState(['Ibarra Gabriel (Maquinista)', 'Juan Welder (Recepción)', 'Carlos López (Auxiliar)']);
  
  const [showForm, setShowForm] = useState(false);
  const [showAgendaForm, setShowAgendaForm] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const initialFormState = {
    entryTime: '', exitTime: '', sector: '', cargoType: 'Carga Completa', tripType: 'Larga Distancia',
    providers: [], transportCompany: '', driverName: '', driverPhone: '',
    hasAppointment: false, purchasingAdvised: false, incidences: ''
  };
  const [formData, setFormData] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);

  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const initialAgendaState = {
    scheduledDate: tomorrowStr, scheduledTime: '08:00', sector: '', cargoType: 'Carga Completa',
    providers: [], transportCompany: '', driverName: '', driverPhone: '',
    hasAppointment: true, purchasingAdvised: true, notes: '', assignedPersonnel: []
  };
  const [agendaData, setAgendaData] = useState(initialAgendaState);
  const [editingAgendaId, setEditingAgendaId] = useState(null);

  const [providerInput, setProviderInput] = useState('');
  const [remitoInput, setRemitoInput] = useState('');
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [showProviderSuggestions, setShowProviderSuggestions] = useState(false);

  const [filteredTransports, setFilteredTransports] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);

  const [exitTruck, setExitTruck] = useState(null);
  const [signatureData, setSignatureData] = useState(null);
  const [exitRating, setExitRating] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const sigCanvasRef = useRef(null);

  useEffect(() => {
    try {
      const savedTrucks = localStorage.getItem('rmcasapalm_trucks');
      const savedAgenda = localStorage.getItem('rmcasapalm_agenda');
      const savedSectors = localStorage.getItem('rmcasapalm_sectors');
      const savedPersonnel = localStorage.getItem('rmcasapalm_personnel');
      
      if (savedTrucks) setTrucks(JSON.parse(savedTrucks));
      if (savedAgenda) setAgenda(JSON.parse(savedAgenda));
      if (savedSectors) setSectors(JSON.parse(savedSectors));
      if (savedPersonnel) setPersonnel(JSON.parse(savedPersonnel));
    } catch (e) {
      console.error("Error leyendo datos guardados", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('rmcasapalm_trucks', JSON.stringify(trucks));
      localStorage.setItem('rmcasapalm_agenda', JSON.stringify(agenda));
      localStorage.setItem('rmcasapalm_sectors', JSON.stringify(sectors));
      localStorage.setItem('rmcasapalm_personnel', JSON.stringify(personnel));
    } catch (e) {
      console.error("Error guardando datos", e);
    }
  }, [trucks, agenda, sectors, personnel]);

  const formatRemito = (rawStr) => {
    if (!rawStr) return 'Sin remito';
    let str = rawStr.trim();
    if (str.toLowerCase() === 'sin remito' || str === '') return 'Sin remito';
    if (str.toUpperCase().startsWith('RT R')) return str.toUpperCase();
    let parts = str.split(/[-\s]/);
    if (parts.length >= 2) {
        let pv = parts[0].replace(/\D/g, '').padStart(5, '0');
        let num = parts[1].replace(/\D/g, '').padStart(8, '0');
        if (pv && num) return `RT R ${pv}-${num}`;
    }
    return `RT R ${str}`;
  };

  const calculateDurationMinutes = (entry, exit) => {
    if (!entry || !exit) return 0;
    const diff = new Date(exit) - new Date(entry);
    return Math.max(0, Math.round(diff / (1000 * 60)));
  };

  const isSLADelayed = (entryTime) => {
    if (!entryTime) return false;
    const diffInMs = new Date() - new Date(entryTime);
    const hours = diffInMs / (1000 * 60 * 60);
    return hours > 2;
  };

  const openWhatsApp = (phone, name, date, time, sector) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    const message = `Hola ${name}, te recordamos que tienes un turno de descarga en RM Casa Palm programado para el ${new Date(date).toLocaleDateString()}, a las ${time} en el sector: ${sector}. ¡Te esperamos!`;
    window.open(`https://wa.me/549${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleProviderSearch = (e) => {
    const val = e.target.value;
    setProviderInput(val);
    if (val.trim()) {
      const lowerVal = val.toLowerCase();
      const matches = MOCK_PROVIDERS_DB.filter(p => p.code.toLowerCase().includes(lowerVal) || p.name.toLowerCase().includes(lowerVal));
      setFilteredProviders(matches);
      setShowProviderSuggestions(true);
    } else {
      setShowProviderSuggestions(false);
    }
  };

  const addProvider = (isAgenda = false) => {
    if (providerInput.trim()) {
      const formattedRemito = formatRemito(remitoInput);
      const newProviderData = { name: providerInput.trim(), remito: formattedRemito };
      
      if (isAgenda) {
        setAgendaData({ ...agendaData, providers: [...(agendaData.providers || []), newProviderData] });
      } else {
        setFormData({ ...formData, providers: [...(formData.providers || []), newProviderData] });
      }
      setProviderInput('');
      setRemitoInput('');
      setShowProviderSuggestions(false);
    }
  };

  const removeProvider = (index, isAgenda = false) => {
    if (isAgenda) {
      setAgendaData({ ...agendaData, providers: (agendaData.providers || []).filter((_, i) => i !== index) });
    } else {
      setFormData({ ...formData, providers: (formData.providers || []).filter((_, i) => i !== index) });
    }
  };

  const handleTransportSearch = (val, isAgenda = false) => {
    if (isAgenda) {
      setAgendaData({...agendaData, transportCompany: val});
    } else {
      setFormData({...formData, transportCompany: val});
    }
    if (val.trim()) {
      setFilteredTransports(MOCK_TRANSPORT_DB.filter(t => t.name.toLowerCase().includes(val.toLowerCase())));
    } else {
      setFilteredTransports([]);
    }
  };

  const handleDriverSearch = (val, isAgenda = false) => {
    if (isAgenda) {
      setAgendaData({...agendaData, driverName: val});
    } else {
      setFormData({...formData, driverName: val});
    }
    if (val.trim()) {
      setFilteredDrivers(MOCK_DRIVERS_DB.filter(d => d.name.toLowerCase().includes(val.toLowerCase())));
    } else {
      setFilteredDrivers([]);
    }
  };

  const selectDriver = (driver, isAgenda = false) => {
    if (isAgenda) {
      setAgendaData({...agendaData, driverName: driver.name, transportCompany: driver.transport, driverPhone: driver.phone});
    } else {
      setFormData({...formData, driverName: driver.name, transportCompany: driver.transport, driverPhone: driver.phone});
    }
    setFilteredDrivers([]);
  };

  const saveForm = (e) => {
    e.preventDefault();
    const dataToSave = { ...formData };
    if (!dataToSave.entryTime) dataToSave.entryTime = new Date().toISOString().slice(0, 16);
    
    if (editingId) {
      setTrucks(trucks.map(t => t.id === editingId ? { ...dataToSave, id: editingId } : t));
    } else {
      setTrucks([...trucks, { ...dataToSave, id: Date.now().toString(), registeredBy: currentUser }]);
    }
    setShowForm(false);
    setFormData(initialFormState);
    setEditingId(null);
  };

  const saveAgendaForm = (e) => {
    e.preventDefault();
    if (editingAgendaId) {
      setAgenda(agenda.map(a => a.id === editingAgendaId ? { ...agendaData, id: editingAgendaId } : a));
      setEditingAgendaId(null);
    } else {
      setAgenda([...agenda, { ...agendaData, id: Date.now().toString(), createdBy: currentUser, status: 'Programado' }]);
    }
    setShowAgendaForm(false);
    setAgendaData(initialAgendaState);
  };

  const convertAgendaToTruck = (agendaItem) => {
    const now = new Date().toISOString().slice(0, 16);
    const newTruck = {
      id: Date.now().toString(),
      entryTime: now,
      exitTime: '',
      sector: agendaItem.sector,
      cargoType: agendaItem.cargoType || 'Carga Completa',
      tripType: 'Reparto',
      providers: agendaItem.providers || [],
      transportCompany: agendaItem.transportCompany || '',
      driverName: agendaItem.driverName || '',
      driverPhone: agendaItem.driverPhone || '',
      hasAppointment: true,
      purchasingAdvised: agendaItem.purchasingAdvised || false,
      incidences: agendaItem.notes || '',
      registeredBy: currentUser
    };
    setTrucks([...trucks, newTruck]);
    setAgenda(agenda.filter(a => a.id !== agendaItem.id));
    setActiveView('list');
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (sigCanvasRef.current) setSignatureData(sigCanvasRef.current.toDataURL());
  };

  const draw = (e) => {
    if (!isDrawing || !sigCanvasRef.current) return;
    e.preventDefault();
    const canvas = sigCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0D0D0D';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const confirmExit = () => {
    if (!exitTruck) return;
    const now = new Date().toISOString().slice(0, 16);
    setTrucks(trucks.map(t => t.id === exitTruck.id ? { 
      ...t, 
      exitTime: now, 
      exitRegisteredBy: currentUser,
      signature: signatureData,
      transportRating: exitRating
    } : t));
    setShowExitModal(false);
    setExitTruck(null);
    setSignatureData(null);
    setExitRating(0);
  };

  const downloadPDF = (truck) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert("Habilita las ventanas emergentes (pop-ups) para generar el PDF.");
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Remito - ${truck.transportCompany}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0D0D0D; padding: 40px; }
            h1 { color: #BF1534; border-bottom: 2px solid #D98494; padding-bottom: 10px; margin-bottom: 30px; }
            .section { margin-bottom: 20px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fafafa; }
            .row { display: flex; margin-bottom: 12px; font-size: 14px; }
            .label { font-weight: bold; width: 220px; color: #4a5568; }
            .evidence { max-height: 120px; border: 1px dashed #D98494; margin-top: 10px; padding: 5px; background: white; }
            .stars { color: #eab308; font-size: 18px; letter-spacing: 2px; }
            .badge { background: #BF1534; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;}
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; font-size: 13px; }
            th { background-color: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>RM Casa Palm - Informe de Ingreso/Descarga</h1>
          
          <div class="section">
            <h3 style="margin-top:0; color:#BF1534;">Datos del Transporte</h3>
            <div class="row"><span class="label">Empresa de Transporte:</span> <strong>${truck.transportCompany || '-'}</strong></div>
            <div class="row"><span class="label">Chofer (Contacto):</span> ${truck.driverName || '-'} (${truck.driverPhone || '-'})</div>
            <div class="row"><span class="label">Tipo de Viaje:</span> ${truck.tripType || '-'}</div>
            <div class="row"><span class="label">Calificación de Servicio:</span> 
               ${truck.transportRating ? `<span class="stars">${'★'.repeat(truck.transportRating)}${'☆'.repeat(5 - truck.transportRating)}</span>` : 'Sin calificar'}
            </div>
          </div>

          <div class="section">
            <h3 style="margin-top:0; color:#BF1534;">Control de Tiempos y Auditoría</h3>
            <div class="row"><span class="label">Fecha y Hora de Entrada:</span> ${new Date(truck.entryTime).toLocaleString()}</div>
            <div class="row"><span class="label">Fecha y Hora de Salida:</span> ${truck.exitTime ? new Date(truck.exitTime).toLocaleString() : '<span class="badge" style="background:#f59e0b;">EN PLANTA</span>'}</div>
            ${truck.exitTime ? `<div class="row"><span class="label">Permanencia Total:</span> ${calculateDurationMinutes(truck.entryTime, truck.exitTime)} minutos</div>` : ''}
          </div>

          <div class="section">
            <h3 style="margin-top:0; color:#BF1534;">Detalle de Carga y Remitos</h3>
            <div class="row"><span class="label">Sector de Descarga:</span> <strong>${truck.sector || '-'}</strong></div>
            <div class="row"><span class="label">Modalidad:</span> ${truck.cargoType || '-'}</div>
            
            ${(truck.providers?.length > 0) ? `
              <table>
                <tr><th>Proveedor</th><th>N° de Remito Asignado</th></tr>
                ${truck.providers.map(p => `<tr><td>${p.name}</td><td><strong>${p.remito}</strong></td></tr>`).join('')}
              </table>
            ` : '<p style="font-size: 13px; color: gray;">No se registraron proveedores/remitos específicos.</p>'}
          </div>
          
          ${(truck.signature) ? `
          <div class="section">
            <h3 style="margin-top:0; color:#BF1534;">Firma de Conformidad</h3>
            <img src="${truck.signature}" class="evidence"/>
          </div>` : ''}
          
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysTrucks = trucks.filter(t => t.entryTime.startsWith(todayStr));
  const finishedToday = todaysTrucks.filter(t => t.exitTime);
  const pendingToday = todaysTrucks.filter(t => !t.exitTime);
  const agendaTomorrow = agenda.filter(a => a.scheduledDate === tomorrowStr);
  
  const totalDescargas = finishedToday.length;
  const uniqueProvidersToday = new Set();
  todaysTrucks.forEach(t => t.providers?.forEach(p => uniqueProvidersToday.add(p.name)));
  const totalProveedores = uniqueProvidersToday.size;
  
  let totalMinutes = 0;
  let slaCompliantCount = 0;
  finishedToday.forEach(t => {
     const duration = calculateDurationMinutes(t.entryTime, t.exitTime);
     totalMinutes += duration;
     if (duration <= 120) slaCompliantCount++;
  });
  const permanenciaPromedio = totalDescargas > 0 ? Math.round(totalMinutes / totalDescargas) : 0;
  const slaPercentage = totalDescargas > 0 ? Math.round((slaCompliantCount / totalDescargas) * 100) : 0;
  
  let totalRemitos = 0;
  todaysTrucks.forEach(t => { if(t.providers) totalRemitos += t.providers.length; });
  
  let largaDistCount = todaysTrucks.filter(t => t.tripType === 'Larga Distancia').length;
  let repartoCount = todaysTrucks.filter(t => t.tripType === 'Reparto').length;

  const sectorCounts = {};
  todaysTrucks.forEach(t => {
      sectorCounts[t.sector] = (sectorCounts[t.sector] || 0) + 1;
  });
  const sectorStats = Object.entries(sectorCounts)
      .map(([sector, count]) => ({ sector, count, percentage: todaysTrucks.length > 0 ? Math.round((count / todaysTrucks.length) * 100) : 0 }))
      .sort((a,b) => b.count - a.count);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-[#D98494]/30 text-center">
          <div className="bg-[#BF1534] w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Truck size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-[#0D0D0D] tracking-tight">RM Casa Palm</h1>
          <p className="text-[#0D0D0D]/60 mt-2 mb-8 font-medium">Sistema Integral Logístico</p>
          <form onSubmit={(e) => { e.preventDefault(); if(currentUser.trim()) setIsLoggedIn(true); }} className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-bold text-[#0D0D0D] mb-1">Identificación del Operador</label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-3 text-[#BF1534]" size={20} />
                <input type="text" autoFocus required value={currentUser} onChange={e => setCurrentUser(e.target.value)} placeholder="Ej: Guardia Carlos" className="w-full pl-10 pr-4 py-3 bg-[#F2F2F2]/50 border-2 border-[#D98494]/30 rounded-xl focus:outline-none focus:border-[#BF1534] font-semibold" />
              </div>
            </div>
            <button type="submit" className="w-full bg-[#BF1534] hover:bg-[#A0102A] text-white font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98] flex justify-center items-center gap-2">Ingresar al Sistema <ArrowRight size={18}/></button>
          </form>
        </div>
      </div>
    );
  }

  const filteredTrucks = trucks.filter(t => 
    t.transportCompany?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.providers?.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => new Date(b.entryTime) - new Date(a.entryTime));

  return (
    <div className="min-h-screen bg-[#F2F2F2] text-[#0D0D0D] font-sans selection:bg-[#D98494] selection:text-white pb-20">
      <header className="bg-white border-b border-[#D98494]/20 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#BF1534] p-2 rounded-xl shadow-sm"><Truck size={24} className="text-white" /></div>
            <div>
              <h1 className="text-xl font-black text-[#0D0D0D] tracking-tight leading-none">RM Casa Palm</h1>
              <p className="text-[10px] font-bold text-[#BF1534] uppercase tracking-wider mt-0.5">Control Logístico</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm font-semibold text-[#0D0D0D]/70 bg-[#F2F2F2] px-3 py-1.5 rounded-lg border border-[#D98494]/20">
              <UserCircle size={16} className="text-[#BF1534]" /> {currentUser}
            </div>
            <button onClick={() => setIsLoggedIn(false)} className="text-[#0D0D0D]/40 hover:text-[#BF1534] transition-colors"><LogOut size={20} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex bg-white rounded-xl p-1 border border-[#D98494]/30 shadow-sm flex-wrap gap-1">
            <button onClick={() => setActiveView('dashboard')} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${activeView === 'dashboard' ? 'bg-[#BF1534] text-white shadow-sm' : 'text-[#0D0D0D]/60 hover:text-[#0D0D0D] hover:bg-gray-50'}`}>
               <Activity size={16} /> Resumen del Día
            </button>
            <button onClick={() => setActiveView('list')} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${activeView === 'list' ? 'bg-[#F2F2F2] text-[#BF1534] shadow-sm' : 'text-[#0D0D0D]/60 hover:text-[#0D0D0D] hover:bg-gray-50'}`}>
               <List size={16} /> Operación en Planta
            </button>
            <button onClick={() => setActiveView('agenda')} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${activeView === 'agenda' ? 'bg-[#F2F2F2] text-[#BF1534] shadow-sm' : 'text-[#0D0D0D]/60 hover:text-[#0D0D0D] hover:bg-gray-50'}`}>
               <CalendarCheck size={16} /> Agenda Mañana {agendaTomorrow.length > 0 && <span className="bg-[#BF1534] text-white text-[10px] px-1.5 py-0.5 rounded-full">{agendaTomorrow.length}</span>}
            </button>
            <button onClick={() => setActiveView('compras')} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${activeView === 'compras' ? 'bg-[#F2F2F2] text-[#BF1534] shadow-sm' : 'text-[#0D0D0D]/60 hover:text-[#0D0D0D] hover:bg-gray-50'}`}>
               <Eye size={16} /> Bandeja Avisos
            </button>
          </div>

          {(activeView === 'list' || activeView === 'dashboard') && (
            <button onClick={() => { setEditingId(null); setFormData(initialFormState); setShowForm(true); }} className="w-full sm:w-auto bg-[#0D0D0D] hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold shadow-md flex items-center justify-center gap-2 transition-all active:scale-95">
              <Plus size={18} /> Nuevo Ingreso a Planta
            </button>
          )}
        </div>

        {}
        {activeView === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             
             <div className="bg-[#BF1534] text-white rounded-t-xl p-4 shadow-md flex justify-between items-center border-b-4 border-[#A0102A]">
                <h2 className="text-xl font-black uppercase tracking-wide">Resumen del Día · {new Date().toLocaleDateString('es-ES', {weekday: 'long', day:'2-digit', month:'2-digit', year:'numeric'})}</h2>
                <button onClick={() => window.print()} className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded text-sm font-bold flex gap-2 items-center transition-colors"><FileText size={16}/> Exportar Informe PDF</button>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-5 gap-0 bg-white border border-[#D98494]/30 shadow-sm overflow-hidden rounded-b-xl -mt-6">
                <div className="p-4 border-r border-b md:border-b-0 border-[#D98494]/20 text-center">
                   <div className="text-[10px] font-black text-[#BF1534] uppercase mb-1">Descargas</div>
                   <div className="text-3xl font-black text-[#0D0D0D]">{totalDescargas}</div>
                </div>
                <div className="p-4 border-r border-b md:border-b-0 border-[#D98494]/20 text-center">
                   <div className="text-[10px] font-black text-[#BF1534] uppercase mb-1">Proveedores</div>
                   <div className="text-3xl font-black text-[#0D0D0D]">{totalProveedores}</div>
                </div>
                <div className="p-4 border-r border-b md:border-b-0 border-[#D98494]/20 text-center bg-gray-50">
                   <div className="text-[10px] font-black text-[#BF1534] uppercase mb-1">Perm. Promedio</div>
                   <div className="text-3xl font-black text-[#0D0D0D]">{permanenciaPromedio} <span className="text-sm text-gray-500 font-bold">min</span></div>
                </div>
                <div className="p-4 border-r border-[#D98494]/20 text-center bg-gray-50">
                   <div className="text-[10px] font-black text-[#BF1534] uppercase mb-1">Dentro del SLA</div>
                   <div className={`text-3xl font-black ${slaPercentage >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{slaPercentage}%</div>
                </div>
                <div className="p-4 text-center">
                   <div className="text-[10px] font-black text-[#BF1534] uppercase mb-1">Remitos Recibidos</div>
                   <div className="text-3xl font-black text-[#0D0D0D]">{totalRemitos}</div>
                </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-0 bg-white border border-[#D98494]/30 shadow-sm overflow-hidden rounded-xl">
                <div className="p-3 border-r border-[#D98494]/20 text-center">
                   <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Larga Dist. / Reparto</div>
                   <div className="text-lg font-black text-[#BF1534]">{largaDistCount} / {repartoCount}</div>
                </div>
                <div className="p-3 border-r border-[#D98494]/20 text-center">
                   <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">En Planta Ahora</div>
                   <div className="text-lg font-black text-amber-600">{pendingToday.length} camiones</div>
                </div>
                <div className="p-3 border-r border-[#D98494]/20 text-center">
                   <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Avisos Compras</div>
                   <div className="text-lg font-black text-blue-600">{todaysTrucks.filter(t => t.purchasingAdvised).length} avisos</div>
                </div>
                <div className="p-3 text-center">
                   <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Incidentes / Novedades</div>
                   <div className="text-lg font-black text-gray-800">{todaysTrucks.filter(t => t.incidences).length} reportes</div>
                </div>
             </div>

             <div className="bg-white rounded-xl border border-[#D98494]/30 shadow-sm overflow-hidden">
                <div className="bg-[#BF1534] text-white p-2.5 px-4 font-bold text-sm tracking-wide">
                   USO DE SECTORES · CAMIONES RECIBIDOS POR SECTOR · {sectorStats.length} sectores
                </div>
                <div className="p-4 space-y-3">
                   {sectorStats.length === 0 ? <p className="text-sm text-gray-400">Sin datos de sectores hoy.</p> : null}
                   {sectorStats.map((stat, i) => (
                      <div key={i} className="flex items-center text-sm">
                         <div className="w-48 font-bold text-gray-700">{stat.sector}</div>
                         <div className="w-16 font-black text-[#BF1534] text-right pr-4">{stat.count}</div>
                         <div className="flex-1 max-w-md bg-gray-100 rounded-full h-4 overflow-hidden relative border border-gray-200">
                            <div className="bg-[#D98494] h-full" style={{width: `${stat.percentage}%`}}></div>
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-[#0D0D0D]/70">{stat.percentage}%</span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
             
             <div className="bg-white rounded-xl border border-[#D98494]/30 shadow-sm overflow-hidden">
                <div className="bg-[#BF1534] text-white p-2.5 px-4 font-bold text-sm tracking-wide">
                   PENDIENTES DE DESCARGA / EN CURSO · {pendingToday.length} camiones
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                     <thead className="text-xs font-bold text-[#BF1534] bg-gray-50 border-b border-[#D98494]/20">
                       <tr>
                         <th className="px-4 py-2">Ingreso</th>
                         <th className="px-4 py-2">Transporte</th>
                         <th className="px-4 py-2">Sector</th>
                         <th className="px-4 py-2">Carga / Viaje</th>
                         <th className="px-4 py-2">Estado</th>
                       </tr>
                     </thead>
                     <tbody>
                        {pendingToday.length === 0 && <tr><td colSpan="5" className="px-4 py-4 text-center text-gray-400 italic font-medium">Sin pendientes: todos los camiones del día fueron descargados.</td></tr>}
                        {pendingToday.map(truck => (
                          <tr key={truck.id} className="border-b border-gray-100 last:border-0 hover:bg-amber-50">
                             <td className="px-4 py-2 font-medium">{new Date(truck.entryTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                             <td className="px-4 py-2 font-bold">{truck.transportCompany}</td>
                             <td className="px-4 py-2 text-gray-600">{truck.sector}</td>
                             <td className="px-4 py-2 text-xs">{truck.cargoType} · {truck.tripType}</td>
                             <td className="px-4 py-2"><span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-1 rounded font-bold">En Planta</span></td>
                          </tr>
                        ))}
                     </tbody>
                   </table>
                </div>
             </div>

          </div>
        )}

        {}
        {activeView === 'list' && (
          <div className="bg-white rounded-2xl border border-[#D98494]/25 shadow-sm overflow-hidden animate-in fade-in">
            <div className="p-4 border-b border-[#D98494]/20 bg-[#F2F2F2]/40 flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#BF1534]" size={18} />
                <input type="text" placeholder="Buscar camión, chofer o proveedor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-[#D98494]/30 rounded-xl focus:outline-none focus:border-[#BF1534] text-sm shadow-sm" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] font-bold uppercase text-[#0D0D0D]/60 bg-white border-b border-[#D98494]/20">
                  <tr>
                    <th className="px-6 py-4">Estado / Tiempos</th>
                    <th className="px-6 py-4">Transporte & Chofer</th>
                    <th className="px-6 py-4">Sector & Carga</th>
                    <th className="px-6 py-4">Proveedores y Remitos</th>
                    <th className="px-6 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D98494]/10 bg-white">
                  {filteredTrucks.map((truck) => (
                    <tr key={truck.id} className="hover:bg-[#F2F2F2]/30 group transition-colors">
                      <td className="px-6 py-4 align-top w-48">
                        {!truck.exitTime ? (
                           isSLADelayed(truck.entryTime) ? 
                            <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-800 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-red-300 animate-pulse w-full justify-center"><AlertCircle size={13}/> SLA Demorado {'>'}2h</span>
                            : <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-amber-200 w-full justify-center"><Clock size={13}/> En Planta</span>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-emerald-200 mb-1 w-full justify-center"><CheckCircle size={13}/> Finalizado</span>
                            {truck.transportRating > 0 && (
                               <div className="flex text-amber-400 mt-0.5" title={`${truck.transportRating} Estrellas`}>
                                 {[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < truck.transportRating ? "currentColor" : "none"} strokeWidth={i < truck.transportRating ? 0 : 2} className={i >= truck.transportRating ? "text-gray-300" : ""} />)}
                               </div>
                            )}
                          </div>
                        )}
                        <div className="text-[11px] space-y-0.5 mt-2 text-gray-500 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                           <div className="flex justify-between"><span>Ent:</span> <strong className="text-gray-800">{new Date(truck.entryTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong></div>
                           {truck.exitTime && <div className="flex justify-between text-emerald-700"><span>Sal:</span> <strong>{new Date(truck.exitTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong></div>}
                           {truck.exitTime && <div className="flex justify-between pt-1 mt-1 border-t border-gray-200 text-gray-600"><span>Perm:</span> <strong>{calculateDurationMinutes(truck.entryTime, truck.exitTime)} min</strong></div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="font-bold text-[#0D0D0D] text-base leading-tight">{truck.transportCompany || '-'}</div>
                        <div className="text-[10px] font-bold uppercase text-[#BF1534] bg-[#BF1534]/10 inline-block px-1.5 rounded mt-1 mb-2">{truck.tripType}</div>
                        <div className="text-xs text-[#0D0D0D]/70 mt-1 flex items-center gap-1"><User size={12}/> {truck.driverName || '-'}</div>
                        <div className="text-xs text-[#0D0D0D]/70 flex items-center gap-1"><Phone size={12}/> {truck.driverPhone || '-'}</div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="text-xs font-bold bg-white inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#D98494]/40 text-[#BF1534] shadow-sm"><MapPin size={12}/> {truck.sector || '-'}</div>
                        <div className="text-[11px] font-semibold text-gray-500 mt-2 uppercase tracking-wide">{truck.cargoType || '-'}</div>
                        {truck.purchasingAdvised && <div className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded mt-2 font-bold inline-block">Aviso Compras: SÍ</div>}
                      </td>
                      <td className="px-6 py-4 align-top w-72">
                        {(truck.providers?.length > 0) ? (
                          <div className="space-y-1.5">
                            {truck.providers.map((p, i) => (
                              <div key={i} className="text-[11px] bg-gray-50 border border-gray-200 rounded-md px-2 py-1 flex justify-between items-center group-hover:bg-white transition-colors">
                                <span className="font-semibold text-gray-700 truncate mr-2" title={p.name}>{p.name}</span> 
                                <span className="text-blue-700 font-bold bg-blue-50/50 px-1 rounded border border-blue-100/50 whitespace-nowrap">{p.remito}</span>
                              </div>
                            ))}
                          </div>
                        ) : <span className="text-xs text-gray-400 italic">Sin remitos</span>}
                      </td>
                      <td className="px-6 py-4 align-top text-right">
                        {!truck.exitTime && (
                           <button onClick={() => {setExitTruck(truck); setShowExitModal(true);}} className="mb-2 text-xs font-bold text-white bg-[#BF1534] hover:bg-[#A0102A] px-3 py-2 rounded-lg w-full flex justify-center gap-1 shadow-md transition-all active:scale-95"><CheckCircle size={14}/> Dar Salida</button>
                        )}
                        <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button onClick={() => downloadPDF(truck)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md shadow-sm border border-transparent hover:border-blue-200 transition-all" title="Descargar PDF"><FileText size={16} /></button>
                          <button onClick={() => { setFormData({...initialFormState, ...truck, providers: truck.providers || []}); setEditingId(truck.id); setShowForm(true); }} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md shadow-sm border border-transparent hover:border-amber-200 transition-all" title="Editar Registro"><Edit2 size={16} /></button>
                          <button onClick={() => setTrucks(trucks.filter(t => t.id !== truck.id))} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md shadow-sm border border-transparent hover:border-red-200 transition-all" title="Eliminar Registro"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTrucks.length === 0 && (
                    <tr><td colSpan="5" className="px-6 py-12 text-center text-[#0D0D0D]/40 font-medium bg-[#F2F2F2]/20">No hay camiones registrados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {}
        {activeView === 'agenda' && (
          <div className="space-y-6 animate-in fade-in">
             <div className="bg-white text-[#0D0D0D] rounded-t-xl p-4 shadow-sm border-t-4 border-gray-800 flex justify-between items-center">
                <h2 className="text-xl font-black uppercase tracking-wide">Agenda del Día Siguiente · {new Date(tomorrowStr).toLocaleDateString('es-ES', {weekday: 'long', day:'2-digit', month:'2-digit', year:'numeric'})}</h2>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingAgendaId(null); setAgendaData(initialAgendaState); setShowAgendaForm(true); }} className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex gap-2 items-center transition-colors shadow-md"><Plus size={16}/> Programar Turno</button>
                </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-0 bg-white border border-gray-200 shadow-sm overflow-hidden rounded-b-xl -mt-6">
                <div className="p-4 border-r border-b md:border-b-0 border-gray-200 text-center bg-[#BF1534] text-white">
                   <div className="text-[10px] font-black text-white/80 uppercase mb-1">Camiones Agendados</div>
                   <div className="text-3xl font-black">{agendaTomorrow.length}</div>
                </div>
                <div className="p-4 border-r border-b md:border-b-0 border-gray-200 text-center">
                   <div className="text-[10px] font-black text-[#BF1534] uppercase mb-1">Proveedores (Aprox)</div>
                   <div className="text-3xl font-black text-[#0D0D0D]">{new Set(agendaTomorrow.flatMap(a => a.providers?.map(p => p.name) || [])).size}</div>
                </div>
                <div className="p-4 border-r border-gray-200 text-center">
                   <div className="text-[10px] font-black text-[#BF1534] uppercase mb-1">Primer Turno</div>
                   <div className="text-3xl font-black text-[#0D0D0D]">{agendaTomorrow.sort((a,b)=>a.scheduledTime.localeCompare(b.scheduledTime))[0]?.scheduledTime || '--:--'}</div>
                </div>
                <div className="p-4 text-center">
                   <div className="text-[10px] font-black text-[#BF1534] uppercase mb-1">Completa / Consol.</div>
                   <div className="text-3xl font-black text-[#0D0D0D]">{agendaTomorrow.filter(a=>a.cargoType === 'Carga Completa').length} / {agendaTomorrow.filter(a=>a.cargoType === 'Carga Consolidada').length}</div>
                </div>
             </div>

             <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                     <thead className="text-[11px] font-bold text-gray-500 bg-gray-50 border-b border-gray-200 uppercase">
                       <tr>
                         <th className="px-4 py-3">Hora</th>
                         <th className="px-4 py-3">Transporte</th>
                         <th className="px-4 py-3">Proveedor/es</th>
                         <th className="px-4 py-3">Sector</th>
                         <th className="px-4 py-3">Carga</th>
                         <th className="px-4 py-3">Personal Afectado</th>
                         <th className="px-4 py-3 text-center">Gestión</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {agendaTomorrow.length === 0 && <tr><td colSpan="7" className="px-4 py-12 text-center text-gray-400 italic font-medium bg-gray-50/50">No hay turnos programados para mañana.</td></tr>}
                        {agendaTomorrow.sort((a,b)=>a.scheduledTime.localeCompare(b.scheduledTime)).map(item => (
                          <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                             <td className="px-4 py-3 font-black text-gray-800">{item.scheduledTime}</td>
                             <td className="px-4 py-3 font-bold text-[#BF1534]">
                                {item.transportCompany}
                                <span className="block text-[10px] font-normal text-gray-500">{item.driverName || 'Sin chofer'}</span>
                             </td>
                             <td className="px-4 py-3 text-xs">
                                {(item.providers?.length > 0) ? item.providers.map(p=>`${p.name} (${p.remito})`).join(', ') : <span className="text-gray-400 italic">No especificado</span>}
                             </td>
                             <td className="px-4 py-3 font-medium text-gray-700">{item.sector}</td>
                             <td className="px-4 py-3 text-xs">{item.cargoType}</td>
                             <td className="px-4 py-3 text-xs font-semibold text-gray-600">
                                {item.assignedPersonnel?.length > 0 ? item.assignedPersonnel.join(', ') : <span className="text-gray-400 italic">Sin asignar</span>}
                             </td>
                             <td className="px-4 py-3 flex justify-center items-center gap-1.5">
                                <button onClick={() => openWhatsApp(item.driverPhone, item.driverName, item.scheduledDate, item.scheduledTime, item.sector)} className={`p-1.5 rounded-lg border shadow-sm transition-colors ${item.driverPhone ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'}`} title="WhatsApp al chofer"><MessageCircle size={16}/></button>
                                <button onClick={() => { setAgendaData({...item}); setEditingAgendaId(item.id); setShowAgendaForm(true); }} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg border border-transparent hover:border-amber-200 transition-all" title="Editar Turno"><Edit2 size={16}/></button>
                                <button onClick={() => setAgenda(agenda.filter(a => a.id !== item.id))} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-all" title="Eliminar Turno"><Trash2 size={16}/></button>
                                <button onClick={() => convertAgendaToTruck(item)} className="bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-black transition-colors ml-1">Pasar a Planta</button>
                             </td>
                          </tr>
                        ))}
                     </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {}
        {activeView === 'compras' && (
          <div className="space-y-6 animate-in fade-in">
             <div className="bg-blue-900 text-white rounded-xl p-4 shadow-sm flex justify-between items-center">
                <div>
                   <h2 className="text-xl font-black uppercase tracking-wide">Bandeja Exclusiva de Compras</h2>
                   <p className="text-xs text-blue-200 mt-0.5">Vista de solo lectura para seguimiento de ingresos y cargas esperadas.</p>
                </div>
                <ShoppingCart size={28} className="text-blue-300"/>
             </div>

             <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
                <div className="bg-blue-50 text-blue-900 p-3 px-4 font-bold text-sm border-b border-blue-100">
                   Camiones Esperados (Agenda / En Camino)
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                     <thead className="text-xs font-bold text-blue-900 bg-blue-50/50 border-b border-blue-100">
                       <tr>
                         <th className="px-4 py-3">Fecha / Hora</th>
                         <th className="px-4 py-3">Transporte</th>
                         <th className="px-4 py-3">Proveedores / Remitos</th>
                         <th className="px-4 py-3">Sector Destino</th>
                       </tr>
                     </thead>
                     <tbody>
                        {agenda.length === 0 && <tr><td colSpan="4" className="px-4 py-6 text-center text-gray-400 italic">No hay camiones agendados actualmente.</td></tr>}
                        {agenda.map(item => (
                          <tr key={item.id} className="border-b border-gray-100 hover:bg-blue-50/20">
                             <td className="px-4 py-3 font-medium">{item.scheduledDate} · {item.scheduledTime}</td>
                             <td className="px-4 py-3 font-bold text-blue-900">{item.transportCompany}</td>
                             <td className="px-4 py-3 text-xs">
                                {(item.providers?.length > 0) ? item.providers.map(p => `${p.name} (${p.remito})`).join(', ') : 'Sin especificar'}
                             </td>
                             <td className="px-4 py-3 font-medium text-gray-700">{item.sector}</td>
                          </tr>
                        ))}
                     </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

      </main>

      {}
      {showForm && (
        <div className="fixed inset-0 bg-[#0D0D0D]/70 backdrop-blur-sm z-[100] overflow-y-auto p-4 sm:p-6 flex justify-center items-start">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden mt-4 mb-20 border border-[#D98494]/30">
            <div className="p-6 border-b border-[#D98494]/20 bg-[#F2F2F2]/60 flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-2xl font-black text-[#0D0D0D] flex items-center gap-2"><Truck className="text-[#BF1534]"/> {editingId ? 'Editar Registro en Planta' : 'Nuevo Ingreso a Planta'}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-[#0D0D0D]/40 hover:text-[#BF1534] transition-colors"><XCircle size={28} /></button>
            </div>
            
            <form onSubmit={saveForm} className="p-6 space-y-8">
              <div>
                <h3 className="text-sm font-black text-[#BF1534] uppercase tracking-wider mb-4 border-b border-[#D98494]/20 pb-2">1. Datos del Transporte</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                  <div className="space-y-1.5 relative">
                    <label className="text-sm font-bold text-[#0D0D0D]">Empresa de Transporte</label>
                    <input type="text" required value={formData.transportCompany} onChange={(e) => handleTransportSearch(e.target.value)} placeholder="Ej: Expreso Sur" className="w-full px-4 py-3 bg-[#F2F2F2]/50 border border-[#D98494]/40 rounded-xl focus:border-[#BF1534] outline-none shadow-sm" />
                    {filteredTransports.length > 0 && (
                      <ul className="absolute z-10 w-full bg-white border border-[#D98494]/30 rounded-xl shadow-xl mt-1 max-h-40 overflow-auto">
                        {filteredTransports.map((t, i) => <li key={i} onClick={() => {setFormData({...formData, transportCompany: t.name}); setFilteredTransports([]);}} className="px-4 py-3 hover:bg-[#F2F2F2] cursor-pointer text-sm font-medium border-b border-gray-100 last:border-0">{t.name}</li>)}
                      </ul>
                    )}
                  </div>
                  <div className="space-y-1.5 relative">
                    <label className="text-sm font-bold text-[#0D0D0D]">Nombre del Chofer</label>
                    <input type="text" required value={formData.driverName} onChange={(e) => handleDriverSearch(e.target.value)} placeholder="Ej: Juan Pérez" className="w-full px-4 py-3 bg-[#F2F2F2]/50 border border-[#D98494]/40 rounded-xl focus:border-[#BF1534] outline-none shadow-sm" />
                    {filteredDrivers.length > 0 && (
                      <ul className="absolute z-10 w-full bg-white border border-[#D98494]/30 rounded-xl shadow-xl mt-1 max-h-40 overflow-auto">
                        {filteredDrivers.map((d, i) => <li key={i} onClick={() => selectDriver(d)} className="px-4 py-3 hover:bg-[#F2F2F2] cursor-pointer text-sm font-medium border-b border-gray-100 last:border-0">{d.name} <span className="text-xs text-gray-500 block">{d.transport}</span></li>)}
                      </ul>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-[#0D0D0D]">Teléfono (WhatsApp)</label>
                    <input type="text" value={formData.driverPhone} onChange={e=>setFormData({...formData, driverPhone: e.target.value})} placeholder="Ej: 1123456789" className="w-full px-4 py-3 bg-[#F2F2F2]/50 border border-[#D98494]/40 rounded-xl focus:border-[#BF1534] outline-none shadow-sm" />
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                   <label className="text-sm font-bold text-[#0D0D0D] block mb-3">Clasificación del Viaje</label>
                   <div className="flex gap-4">
                      <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.tripType === 'Larga Distancia' ? 'border-[#BF1534] bg-[#BF1534]/5 text-[#BF1534] font-bold' : 'border-gray-200 bg-white text-gray-500'}`}>
                         <input type="radio" name="tripType" className="hidden" checked={formData.tripType === 'Larga Distancia'} onChange={() => setFormData({...formData, tripType: 'Larga Distancia'})}/>
                         <Truck size={18}/> Larga Distancia
                      </label>
                      <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.tripType === 'Reparto' ? 'border-[#BF1534] bg-[#BF1534]/5 text-[#BF1534] font-bold' : 'border-gray-200 bg-white text-gray-500'}`}>
                         <input type="radio" name="tripType" className="hidden" checked={formData.tripType === 'Reparto'} onChange={() => setFormData({...formData, tripType: 'Reparto'})}/>
                         <Package size={18}/> Reparto Local
                      </label>
                   </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black text-[#BF1534] uppercase tracking-wider mb-4 border-b border-[#D98494]/20 pb-2">2. Operación Logística</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                   <div className="space-y-1.5">
                     <label className="text-sm font-bold text-[#0D0D0D]">Sector de Descarga</label>
                     <select required value={formData.sector} onChange={e=>setFormData({...formData, sector: e.target.value})} className="w-full px-4 py-3 bg-[#F2F2F2]/50 border border-[#D98494]/40 rounded-xl focus:border-[#BF1534] outline-none shadow-sm">
                       <option value="">Seleccionar sector...</option>
                       {sectors.map(s=><option key={s} value={s}>{s}</option>)}
                     </select>
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-sm font-bold text-[#0D0D0D]">Modalidad de Carga</label>
                     <select value={formData.cargoType} onChange={e=>setFormData({...formData, cargoType: e.target.value})} className="w-full px-4 py-3 bg-[#F2F2F2]/50 border border-[#D98494]/40 rounded-xl focus:border-[#BF1534] outline-none shadow-sm">
                       <option value="Carga Completa">Carga Completa</option>
                       <option value="Carga Consolidada">Carga Consolidada</option>
                     </select>
                   </div>
                </div>

                <div className="flex items-center gap-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <input type="checkbox" id="avisocompras" checked={formData.purchasingAdvised} onChange={e => setFormData({...formData, purchasingAdvised: e.target.checked})} className="w-5 h-5 accent-blue-600 rounded cursor-pointer" />
                    <label htmlFor="avisocompras" className="text-sm font-bold text-blue-900 cursor-pointer select-none">¿Compras o Transporte avisó sobre la llegada de este camión? (Avisos CAC/CAT)</label>
                </div>
                
                <div className="mt-5 bg-gray-100 p-5 rounded-2xl border border-gray-300 shadow-inner">
                  <label className="text-sm font-black text-[#0D0D0D] flex items-center gap-2 mb-3"><Package size={18} className="text-[#BF1534]"/> Cargar Proveedores y Remitos</label>
                  <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm relative">
                     <div className="flex-1 border-r sm:border-r-gray-200 sm:pr-3 relative">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Buscar Proveedor</label>
                        <input id="providerSearchInput" type="text" placeholder="Ej: P001, Arcor..." value={providerInput} onChange={handleProviderSearch} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), document.getElementById('remitoInput').focus())} className="w-full py-2 outline-none text-sm font-medium" />
                        {showProviderSuggestions && (
                          <ul className="absolute z-20 w-full bg-white border border-[#D98494]/50 rounded-xl shadow-2xl mt-1 max-h-40 overflow-auto">
                             {filteredProviders.map(p => <li key={p.code} onClick={() => {setProviderInput(`${p.code} - ${p.name}`); setShowProviderSuggestions(false); document.getElementById('remitoInput').focus();}} className="px-4 py-3 hover:bg-[#F2F2F2] cursor-pointer text-sm font-medium border-b border-gray-100 last:border-0">{p.code} - {p.name}</li>)}
                          </ul>
                        )}
                     </div>
                     <div className="w-full sm:w-48">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">N° de Remito</label>
                        <input id="remitoInput" type="text" placeholder="Ej: 1-62" value={remitoInput} onChange={e => setRemitoInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addProvider())} className="w-full py-2 outline-none text-sm font-bold text-blue-800" />
                     </div>
                     <button type="button" onClick={() => addProvider()} className="bg-gray-800 hover:bg-black text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md transition-all active:scale-95 flex-shrink-0">Agregar</button>
                  </div>
                  
                  {formData.providers?.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-4 mt-3 border-t border-gray-200">
                      {formData.providers.map((p, idx) => (
                        <div key={idx} className="bg-white border border-gray-300 pl-3 pr-1 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm">
                          <span className="text-gray-700">{p.name} <span className="text-blue-700 font-black ml-1 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">R: {p.remito}</span></span>
                          <button type="button" onClick={() => removeProvider(idx)} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-md transition-colors"><XCircle size={14}/></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-[#D98494]/20 sticky bottom-0 bg-white pb-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 font-bold text-[#0D0D0D]/60 hover:bg-[#F2F2F2] hover:text-[#0D0D0D] rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="px-8 py-3 bg-[#BF1534] text-white font-black rounded-xl shadow-lg hover:bg-[#A0102A] transition-all active:scale-95 flex items-center gap-2"><Save size={18}/> {editingId ? 'Guardar Cambios' : 'Registrar Ingreso'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {showAgendaForm && (
        <div className="fixed inset-0 bg-[#0D0D0D]/70 backdrop-blur-sm z-[100] overflow-y-auto p-4 sm:p-6 flex justify-center items-start">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden mt-4 mb-20 border border-gray-300">
            <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2"><Calendar className="text-[#BF1534]"/> {editingAgendaId ? 'Editar Turno Programado' : 'Programar Turno / Agenda'}</h2>
              <button type="button" onClick={() => setShowAgendaForm(false)} className="text-gray-400 hover:text-gray-700 transition-colors"><XCircle size={28} /></button>
            </div>
            
            <form onSubmit={saveAgendaForm} className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Fecha Programada</label>
                   <input type="date" required value={agendaData.scheduledDate} onChange={e=>setAgendaData({...agendaData, scheduledDate: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl outline-none font-medium" />
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Hora Programada</label>
                   <input type="time" required value={agendaData.scheduledTime} onChange={e=>setAgendaData({...agendaData, scheduledTime: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl outline-none font-medium" />
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="relative">
                   <label className="block text-sm font-bold text-gray-700 mb-1">Empresa de Transporte</label>
                   <input type="text" required value={agendaData.transportCompany} onChange={e=>handleTransportSearch(e.target.value, true)} placeholder="Ej: Expreso Sur" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl outline-none font-medium" />
                   {filteredTransports.length > 0 && (
                      <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-xl shadow-xl mt-1 max-h-40 overflow-auto">
                        {filteredTransports.map((t, i) => <li key={i} onClick={() => {setAgendaData({...agendaData, transportCompany: t.name}); setFilteredTransports([]);}} className="px-4 py-2.5 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100">{t.name}</li>)}
                      </ul>
                   )}
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Sector de Descarga</label>
                   <select required value={agendaData.sector} onChange={e=>setAgendaData({...agendaData, sector: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl outline-none font-medium">
                     <option value="">Seleccionar sector...</option>
                     {sectors.map(s=><option key={s} value={s}>{s}</option>)}
                   </select>
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="relative">
                   <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del Chofer</label>
                   <input type="text" value={agendaData.driverName} onChange={e=>handleDriverSearch(e.target.value, true)} placeholder="Ej: Juan Pérez" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl outline-none font-medium" />
                   {filteredDrivers.length > 0 && (
                      <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-xl shadow-xl mt-1 max-h-40 overflow-auto">
                        {filteredDrivers.map((d, i) => <li key={i} onClick={() => selectDriver(d, true)} className="px-4 py-2.5 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100">{d.name} <span className="text-xs text-gray-500 block">{d.transport}</span></li>)}
                      </ul>
                   )}
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono Chofer</label>
                   <input type="text" value={agendaData.driverPhone} onChange={e=>setAgendaData({...agendaData, driverPhone: e.target.value})} placeholder="Ej: 1123456789" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl outline-none font-medium" />
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Modalidad de Carga</label>
                   <select value={agendaData.cargoType} onChange={e=>setAgendaData({...agendaData, cargoType: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl outline-none font-medium">
                     <option value="Carga Completa">Carga Completa</option>
                     <option value="Carga Consolidada">Carga Consolidada</option>
                   </select>
                 </div>
                 <div className="flex items-center pt-6">
                   <input type="checkbox" id="agendaAviso" checked={agendaData.purchasingAdvised} onChange={e=>setAgendaData({...agendaData, purchasingAdvised: e.target.checked})} className="w-5 h-5 accent-blue-600 rounded cursor-pointer" />
                   <label htmlFor="agendaAviso" className="ml-2 text-sm font-bold text-gray-800 cursor-pointer">¿Tiene Aviso de Compras (CAC/CAT)?</label>
                 </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Personal Afectado (Operarios / Auxiliares)</label>
                <div className="flex flex-wrap gap-2 bg-gray-50 p-3 rounded-xl border border-gray-300">
                  {personnel.map((p, idx) => {
                    const isSelected = agendaData.assignedPersonnel?.includes(p);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const current = agendaData.assignedPersonnel || [];
                          const updated = isSelected ? current.filter(x => x !== p) : [...current, p];
                          setAgendaData({...agendaData, assignedPersonnel: updated});
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-all ${isSelected ? 'bg-[#BF1534] text-white border-[#BF1534] shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                      >
                        {p} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-gray-100 p-4 rounded-xl border border-gray-300">
                <label className="text-xs font-black uppercase text-gray-700 block mb-2">Proveedores y Remitos Previstos</label>
                <div className="flex gap-2 relative">
                   <div className="flex-1 relative">
                     <input type="text" placeholder="Buscar Proveedor..." value={providerInput} onChange={handleProviderSearch} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm" />
                     {showProviderSuggestions && (
                       <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg shadow-xl mt-1 max-h-32 overflow-auto">
                         {filteredProviders.map(p => <li key={p.code} onClick={() => {setProviderInput(`${p.code} - ${p.name}`); setShowProviderSuggestions(false);}} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-xs border-b border-gray-100">{p.code} - {p.name}</li>)}
                       </ul>
                     )}
                   </div>
                   <input type="text" placeholder="Remito..." value={remitoInput} onChange={e=>setRemitoInput(e.target.value)} className="w-32 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-blue-800" />
                   <button type="button" onClick={() => addProvider(true)} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold">Añadir</button>
                </div>
                {agendaData.providers?.length > 0 && (
                   <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-200">
                      {agendaData.providers.map((p, i) => (
                         <span key={i} className="bg-white px-2 py-1 rounded border border-gray-300 text-xs font-bold text-gray-700 flex items-center gap-1">
                           {p.name} (R: {p.remito}) <button type="button" onClick={() => removeProvider(i, true)} className="text-red-500 font-bold ml-1">×</button>
                         </span>
                      ))}
                   </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowAgendaForm(false)} className="px-6 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 bg-[#BF1534] text-white font-black rounded-xl shadow-md hover:bg-[#A0102A]">{editingAgendaId ? 'Actualizar Turno' : 'Guardar Turno'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {}
      {showExitModal && (
        <div className="fixed inset-0 bg-[#0D0D0D]/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#D98494]/20 flex justify-between items-center bg-[#F2F2F2]/50">
              <h3 className="font-black text-xl flex items-center gap-2 text-[#0D0D0D]"><CheckCircle size={24} className="text-emerald-600"/> Validar Salida</h3>
              <button onClick={() => setShowExitModal(false)} className="text-[#0D0D0D]/40 hover:text-[#0D0D0D] transition-colors"><XCircle size={28}/></button>
            </div>
            <div className="p-6 space-y-6">
               <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                 <p className="text-sm text-gray-500 mb-1">Dando salida a:</p>
                 <p className="font-bold text-lg text-[#BF1534]">{exitTruck?.transportCompany || 'Transporte'}</p>
                 <p className="text-sm font-medium">{exitTruck?.driverName}</p>
                 <p className="text-xs text-gray-400 mt-2">Tiempo en planta: {calculateDurationMinutes(exitTruck?.entryTime, new Date())} min</p>
               </div>

               <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 flex flex-col items-center">
                  <p className="text-sm font-bold text-[#0D0D0D] mb-3">Nivel de Servicio (Calificar Transporte):</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setExitRating(star)} className={`transition-all hover:scale-110 p-1 ${exitRating >= star ? 'text-amber-400' : 'text-gray-300'}`} title={`${star} Estrellas`}>
                        <Star size={36} fill="currentColor" strokeWidth={exitRating >= star ? 0 : 1} />
                      </button>
                    ))}
                  </div>
               </div>

               <div>
                 <div className="text-sm font-bold text-[#0D0D0D] flex justify-between mb-2"><span>Firma del Chofer (Conformidad)</span> {signatureData && <button onClick={() => {const c = sigCanvasRef.current; c.getContext('2d').clearRect(0,0,c.width,c.height); setSignatureData(null);}} className="text-xs text-[#BF1534] font-bold bg-[#BF1534]/10 px-2 py-1 rounded">Limpiar Firma</button>}</div>
                 <div className="border-2 border-dashed border-[#D98494]/60 rounded-xl bg-white relative overflow-hidden shadow-inner">
                    <canvas ref={sigCanvasRef} onMouseDown={startDrawing} onMouseUp={stopDrawing} onMouseOut={stopDrawing} onMouseMove={draw} onTouchStart={startDrawing} onTouchEnd={stopDrawing} onTouchMove={draw} width={380} height={140} className="w-full cursor-crosshair touch-none bg-gray-50" />
                    {!isDrawing && !signatureData && <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-[#0D0D0D]/30"><PenTool size={32} className="mb-2 opacity-30"/> <span className="text-sm font-medium opacity-50">Firmar en este recuadro</span></div>}
                 </div>
               </div>
               
               <button onClick={confirmExit} disabled={exitRating === 0} className={`w-full py-4 font-black rounded-xl mt-4 shadow-lg transition-all flex justify-center items-center gap-2 text-lg ${exitRating > 0 ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                  <CheckCircle size={20}/> Confirmar Salida del Predio
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}