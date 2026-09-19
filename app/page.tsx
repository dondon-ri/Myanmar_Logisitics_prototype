"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { 
  Truck, MapPin, AlertTriangle, Wifi, WifiOff, 
  CheckCircle2, Radio, Package, Camera, Upload, 
  FileText, Clock, ShieldAlert, ArrowRight, Check
} from 'lucide-react';

// --- DYNAMICALLY IMPORT MAP ---
const RouteMap = dynamic(() => import('../components/Map'), { 
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-slate-200 animate-pulse rounded-xl flex items-center justify-center text-slate-500 font-bold">Loading GPS Map...</div>
});

// --- MASTER ROUTE DATA WITH HAZARDS ---
const ROUTE_NODES = {
  muse: [
    { name: 'Yangon Hub', lat: 16.8409, lng: 96.1735, hazard: null },
    { name: 'Bago Checkpoint', lat: 17.3395, lng: 96.4856, hazard: null },
    { name: 'Naypyidaw Toll', lat: 19.7633, lng: 96.0785, hazard: 'Heavy Rain / Flooding Advisory (Slippery Roads)' },
    { name: 'Mandalay Hub', lat: 21.9588, lng: 96.0891, hazard: null },
    { name: 'Pyin Oo Lwin Checkpoint', lat: 22.0362, lng: 96.4683, hazard: 'Active Conflict Zone / Heavy Customs Delay' },
    { name: 'Muse Border Gate', lat: 23.9840, lng: 97.8960, hazard: null }
  ],
  myawaddy: [
    { name: 'Yangon Hub', lat: 16.8409, lng: 96.1735, hazard: null },
    { name: 'Bago Checkpoint', lat: 17.3395, lng: 96.4856, hazard: 'Heavy Rain / Flooding Advisory (Slippery Roads)' },
    { name: 'Hpa-an Bridge', lat: 16.8835, lng: 97.6334, hazard: null },
    { name: 'Myawaddy Border Gate', lat: 16.6896, lng: 98.5082, hazard: null }
  ],
  chinshwehaw: [
    { name: 'Yangon Hub', lat: 16.8409, lng: 96.1735, hazard: null },
    { name: 'Bago Checkpoint', lat: 17.3395, lng: 96.4856, hazard: null },
    { name: 'Naypyidaw Toll', lat: 19.7633, lng: 96.0785, hazard: 'Heavy Rain / Flooding Advisory (Slippery Roads)' },
    { name: 'Mandalay Hub', lat: 21.9588, lng: 96.0891, hazard: null },
    { name: 'Lashio Checkpoint', lat: 22.9300, lng: 97.7500, hazard: 'Active Conflict Zone / Road Closures' },
    { name: 'Chinshwehaw Gate', lat: 23.7500, lng: 98.7100, hazard: null }
  ]
};

export default function MyanmarLogisticsApp() {
  // Global Shared State
  const [role, setRole] = useState<'admin' | 'trader' | 'driver'>('trader');
  
  // Border Routes
  const [routes, setRoutes] = useState([
    { id: 'muse', name: 'Muse Border Gate', corridor: 'Yangon-Mandalay-Muse', status: 'Open', lastUpdated: '10 mins ago' },
    { id: 'myawaddy', name: 'Myawaddy Border Gate', corridor: 'Yangon-Hpa-an-Myawaddy', status: 'Delayed', lastUpdated: '25 mins ago' },
    { id: 'chinshwehaw', name: 'Chinshwehaw Gate', corridor: 'Northern Shan State Corridor', status: 'Closed', lastUpdated: '1 hr ago' },
  ]);

  // Admin Broadcast Alert
  const [broadcastAlert, setBroadcastAlert] = useState<string>('');
  const [inputAlert, setInputAlert] = useState<string>('');
  const [alertVisible, setAlertVisible] = useState<boolean>(false);

  // Transport Request State
  const [showRequestForm, setShowRequestForm] = useState<boolean>(false);
  const [formPickup, setFormPickup] = useState<string>('Yangon Hlaing Tharyar Hub');
  const [formDest, setFormDest] = useState<string>('');
  const [formCargo, setFormCargo] = useState<string>('');
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  
  // Active Tracked Shipment State
  const [activeShipment, setActiveShipment] = useState({
    id: 'MM-YGN-MS-8842',
    cargo: '24.0 MT Green Mung Beans',
    destinationId: 'muse',
    destinationName: 'Muse Border Gate',
    driver: 'Ko Zaw Win',
    plate: 'YGN 3K-8821'
  });

  const [currentStage, setCurrentStage] = useState<number>(2); 
  const [currentLocationIndex, setCurrentLocationIndex] = useState<number>(0); 
  const [transitLogs, setTransitLogs] = useState([
    { time: '06:30 AM', location: 'Yangon Hlaing Tharyar Hub', message: 'Container loaded & sealed. Waybill signed.' }
  ]);

  // Driver Offline / Upload State
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);

  // --- Derived State for Map & Hazards ---
  const activeNodes = ROUTE_NODES[activeShipment.destinationId as keyof typeof ROUTE_NODES] || ROUTE_NODES.muse;
  // If truck arrives at final destination (Stage 4), lock index to the last node
  const displayIndex = currentStage === 4 ? activeNodes.length - 1 : currentLocationIndex;
  const currentTruckPos: [number, number] = [activeNodes[displayIndex].lat, activeNodes[displayIndex].lng];
  const activeHazard = activeNodes[displayIndex].hazard;

  // --- Actions ---

  const handleStatusChange = (id: string, newStatus: string) => {
    setRoutes(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, lastUpdated: 'Just now' } : r));
  };

  const handlePublishBroadcast = () => {
    if (!inputAlert.trim()) return;
    setBroadcastAlert(inputAlert);
    setAlertVisible(true);
    setInputAlert('');
  };

  const handleSubmitRequest = () => {
    if (!formDest || !formCargo || !formPickup) return alert("Please fill all fields!");
    setPendingRequests(prev => [...prev, { id: 'TRK-' + Math.floor(1000 + Math.random() * 9000), pickup: formPickup, destinationId: formDest, cargo: formCargo }]);
    setShowRequestForm(false);
    setFormDest('');
    setFormCargo('');
    alert("Request Submitted! Switch to Admin HQ to approve it.");
  };

  const handleApproveRequest = (req: any) => {
    setPendingRequests(prev => prev.filter(p => p.id !== req.id)); 
    const destName = routes.find(r => r.id === req.destinationId)?.name || 'Unknown Route';
    
    setActiveShipment({
      id: req.id, cargo: req.cargo, destinationId: req.destinationId, destinationName: destName, driver: 'U Ba (Newly Assigned)', plate: 'MDY 5F-1122'
    });
    
    setCurrentStage(1);
    setCurrentLocationIndex(0);
    setTransitLogs([{ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), location: 'HQ Dispatch', message: 'Transport approved. Driver dispatched for pickup.' }]);
    setUploadedPhotoUrl(null);
  };

  const handleDriverAction = (message: string, stageAdvance?: number, moveIndex?: number) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isOffline) {
      setOfflineQueue(prev => [...prev, { message, stage: stageAdvance, locIndex: moveIndex }]);
    } else {
      if (stageAdvance) setCurrentStage(stageAdvance);
      if (moveIndex !== undefined) setCurrentLocationIndex(moveIndex);
      setTransitLogs(prev => [{ time: now, location: 'Updated', message }, ...prev]);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    if (isOffline) {
      setOfflineQueue(prev => [...prev, { message: `Waybill Photo Uploaded (${file.name})` }]);
      setUploadedPhotoUrl(previewUrl); 
    } else {
      setUploadedPhotoUrl(previewUrl);
      setTransitLogs(prev => [{ time: 'Just now', location: 'Current Checkpoint', message: `Waybill uploaded (${file.name}).` }, ...prev]);
    }
  };

  const toggleOffline = () => {
    if (isOffline) {
      setIsOffline(false);
      if (offlineQueue.length > 0) {
        let hStage = currentStage;
        let hLoc = currentLocationIndex;
        
        offlineQueue.forEach(item => {
          if (item.stage) hStage = item.stage;
          if (item.locIndex !== undefined) hLoc = item.locIndex;
        });

        setCurrentStage(hStage);
        setCurrentLocationIndex(hLoc);

        setSyncNotice(`Synced ${offlineQueue.length} queued events to Cloud.`);
        setTransitLogs(prev => [
          ...offlineQueue.reverse().map(item => ({ time: 'Synced Just Now', location: 'Local Cache', message: `[OFFLINE SYNC] ${item.message}` })),
          ...prev
        ]);
        setOfflineQueue([]);
        setTimeout(() => setSyncNotice(null), 5000);
      }
    } else setIsOffline(true);
  };

  const activeRouteStatus = routes.find(r => r.id === activeShipment.destinationId)?.status || 'Open';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans pb-10">
      
      {/* HEADER */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white"><Truck className="w-5 h-5" /></div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">Myanmar TradeTrack</h1>
              <p className="text-xs text-slate-400">Cross-Border Logistics Monitoring Network</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <span className="text-xs text-slate-400 px-2 font-medium">Switch View:</span>
            {(['admin', 'trader', 'driver'] as const).map(r => (
              <button 
                key={r} onClick={() => setRole(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${role === r ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
              >
                {r === 'admin' ? 'Admin HQ' : r === 'trader' ? 'Trader' : 'Driver Phone'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* GLOBAL HAZARD PROXIMITY ALERT */}
      {activeHazard && currentStage > 1 && currentStage < 4 && (
        <div className="bg-rose-600 text-white px-4 py-3 font-bold text-sm flex items-center justify-center gap-3 shadow-md animate-in slide-in-from-top">
          <AlertTriangle className="w-5 h-5 animate-pulse" />
          <span>PROXIMITY WARNING: Truck has entered a hazard zone ({activeHazard})</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-1">

        {/* ==================== VIEW 1: ADMIN HQ ==================== */}
        {role === 'admin' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Admin: Pending Requests */}
            {pendingRequests.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-amber-900">Pending Transport Requests ({pendingRequests.length})</h3>
                </div>
                <div className="space-y-3">
                  {pendingRequests.map(req => (
                    <div key={req.id} className="bg-white p-4 rounded-xl shadow-sm border border-amber-100 flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded mb-2 inline-block">ID: {req.id}</span>
                        <p className="text-sm font-semibold">Cargo: {req.cargo}</p>
                        <p className="text-xs text-slate-500">Route: {req.pickup} → {routes.find(r => r.id === req.destinationId)?.name}</p>
                      </div>
                      <button 
                        onClick={() => handleApproveRequest(req)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow transition"
                      >
                        Approve & Dispatch
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin: Gate Status Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">HQ Border Gate Controller</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm mt-4">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
                    <tr><th className="p-3">Gate Corridor</th><th className="p-3">Status</th><th className="p-3">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {routes.map(r => (
                      <tr key={r.id}>
                        <td className="p-3 font-semibold">{r.name}</td>
                        <td className="p-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${r.status === 'Open' ? 'bg-emerald-100 text-emerald-800' : r.status === 'Delayed' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>● {r.status}</span></td>
                        <td className="p-3">
                          <div className="inline-flex rounded-lg border bg-white p-0.5">
                            {(['Open', 'Delayed', 'Closed'] as const).map(s => (
                              <button key={s} onClick={() => handleStatusChange(r.id, s)} className={`px-2 py-1 text-xs font-medium rounded-md ${r.status === s ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}>{s}</button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Admin: Broadcast */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h3 className="font-bold flex items-center gap-2 mb-3"><Radio className="w-5 h-5 text-blue-600" /> Emergency Broadcast</h3>
              <div className="flex gap-3">
                <input type="text" value={inputAlert} onChange={(e) => setInputAlert(e.target.value)} placeholder="Type alert here..." className="flex-1 border rounded-xl px-4 py-2" />
                <button onClick={handlePublishBroadcast} className="bg-blue-600 text-white font-bold px-6 py-2 rounded-xl">Broadcast Alert</button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== VIEW 2: TRADER DASHBOARD ==================== */}
        {role === 'trader' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Trader: Live Broadcast Banner */}
            {alertVisible && broadcastAlert && (
              <div className="bg-amber-500 text-white px-4 py-3 rounded-2xl shadow-md flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <div className="text-sm font-medium flex-1"><span className="font-bold uppercase text-xs mr-2 bg-amber-600 px-2 py-0.5 rounded">HQ Notice</span>{broadcastAlert}</div>
              </div>
            )}

            {/* Trader: Request Form */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              {!showRequestForm ? (
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-900">Need to move new cargo?</h3>
                  <button onClick={() => setShowRequestForm(true)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"><Package className="w-4 h-4" /> Book Transport</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Pickup Location</label>
                      <input type="text" value={formPickup} onChange={(e) => setFormPickup(e.target.value)} className="w-full text-sm border p-2 rounded-lg" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Destination Gate</label>
                      <select value={formDest} onChange={(e) => setFormDest(e.target.value)} className="w-full text-sm border p-2 rounded-lg">
                        <option value="" disabled>Select destination...</option>
                        {routes.map(r => <option key={r.id} value={r.id} disabled={r.status === 'Closed'}>{r.name} {r.status === 'Closed' ? ' ⛔' : ''}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Cargo Details (Metric Tons)</label>
                      <input type="text" value={formCargo} onChange={(e) => setFormCargo(e.target.value)} className="w-full text-sm border p-2 rounded-lg" />
                    </div>
                  </div>
                  <button onClick={handleSubmitRequest} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold w-full">Submit Request to HQ</button>
                </div>
              )}
            </div>

            {/* Trader: Route Alert */}
            {activeRouteStatus === 'Closed' && (
              <div className="bg-rose-50 border-2 border-rose-400 p-5 rounded-2xl flex gap-4">
                <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-rose-900">Route Closed: {activeShipment.destinationName}</h4>
                  <p className="text-xs text-rose-700 mt-1">This gate has been closed by Admin. Driver {activeShipment.driver} is holding position.</p>
                </div>
              </div>
            )}

            {/* Trader: Tracking Dashboard */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Tracking: {activeShipment.id}</span>
                  <p className="text-lg font-bold mt-2">Cargo: {activeShipment.cargo}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-emerald-600 font-bold block">Driver: {activeShipment.driver}</span>
                  <span className="text-xs text-slate-500 block">Plate: {activeShipment.plate}</span>
                </div>
              </div>

              {/* 4-Stage Tracker */}
              <div className="py-8 grid grid-cols-4 gap-2 text-center relative border-b border-slate-100 mb-6">
                <div className="absolute top-4 left-[12%] right-[12%] h-1 bg-slate-200 -z-10">
                   <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${((currentStage - 1) / 3) * 100}%` }}></div>
                </div>
                {['Picked Up', 'In Transit', 'Border Customs', 'Delivered'].map((label, idx) => {
                  const step = idx + 1;
                  const isPassed = currentStage >= step, isCurrent = currentStage === step;
                  return (
                    <div key={step} className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-md' : isPassed ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        {isPassed ? <Check className="w-4 h-4" /> : step}
                      </div>
                      <span className={`text-xs mt-2 font-bold ${isCurrent ? 'text-blue-600' : 'text-slate-500'}`}>{label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Grid: Map & Logs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* --- REAL INTERACTIVE MAP --- */}
                <div className="w-full">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-sm text-slate-700">Live GPS Telemetry</h4>
                    <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Signal Active</span>
                  </div>
                  {/* Passes dynamic destination and truck coordinates to Map.tsx */}
                  <RouteMap destinationId={activeShipment.destinationId} truckPosition={currentTruckPos} />
                </div>

                {/* Transit Logs & Uploaded Photos */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col max-h-[440px]">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" /> Live Transit History
                  </h4>
                  <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                    {transitLogs.map((log, idx) => (
                      <div key={idx} className="text-xs border-l-2 border-blue-500 pl-3 py-1">
                        <span className="text-slate-400 block font-medium">{log.time}</span>
                        <p className="font-bold text-slate-700">{log.message}</p>
                      </div>
                    ))}
                  </div>

                  {uploadedPhotoUrl && (
                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-2">
                        <FileText className="w-3 h-3" /> Latest Waybill Document
                      </span>
                      <div className="flex items-center gap-2 bg-white p-2 rounded-lg border">
                        <img src={uploadedPhotoUrl} className="w-10 h-10 object-cover rounded" alt="Waybill" />
                        <div className="text-xs"><span className="block font-bold">Waybill.jpg</span><span className="text-emerald-600 font-medium">Verified</span></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== VIEW 3: DRIVER MOBILE ==================== */}
        {role === 'driver' && (
          <div className="flex justify-center py-2 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl border-[6px] border-slate-800 flex flex-col overflow-hidden h-[800px]">
              
              <div className="bg-slate-900 text-white px-5 py-2 flex justify-between items-center text-xs">
                <span className="font-semibold">09:41</span>
                {isOffline ? <span className="text-rose-400 flex items-center gap-1"><WifiOff className="w-3 h-3" /> No Signal</span> : <span className="text-emerald-400 flex items-center gap-1"><Wifi className="w-3 h-3" /> 4G LTE</span>}
              </div>

              <div className="bg-slate-800 px-4 py-3 flex justify-between items-center text-white border-b border-slate-700">
                <div><span className="text-xs font-bold block">Blackout Mode</span></div>
                <button onClick={toggleOffline} className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-inner ${isOffline ? 'bg-rose-600' : 'bg-emerald-600'}`}>
                  {isOffline ? 'Offline Active' : 'Go Offline'}
                </button>
              </div>

              {alertVisible && broadcastAlert && (
                <div className="bg-amber-500 text-white p-3 text-xs flex items-start gap-2 shadow-inner">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div><strong className="block text-[10px] uppercase">Dispatcher Warning</strong><span className="font-medium">{broadcastAlert}</span></div>
                </div>
              )}

              {syncNotice && <div className="bg-emerald-600 text-white p-2 text-xs text-center font-bold animate-pulse">✓ {syncNotice}</div>}

              <div className="p-4 space-y-4 bg-slate-50 flex-1 overflow-y-auto">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-blue-600">Current Assignment</span>
                  <h3 className="font-bold text-sm mt-1">{activeShipment.driver}</h3>
                  <p className="text-xs font-medium text-slate-600">{activeShipment.cargo}</p>
                </div>

                {isOffline && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800">
                    <div className="flex items-center gap-1.5 font-bold mb-1"><WifiOff className="w-4 h-4" /> Local Cache Active</div>
                    <p className="text-[11px] text-rose-700">Updates are queued. Offline actions: {offlineQueue.length}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Log Event Actions</label>
                  
                  {currentStage < 2 && (
                    <button onClick={() => handleDriverAction('Departed Hub / In Transit Started', 2, 1)} className="w-full bg-blue-600 text-white border border-blue-700 p-3 rounded-xl text-xs font-bold text-left shadow-md active:scale-95 transition flex justify-between">
                      <span className="flex items-center gap-2"><Truck className="w-4 h-4" /> Start Transit / Depart Hub</span>
                      <ArrowRight className="w-4 h-4 opacity-50" />
                    </button>
                  )}

                  {/* DYNAMIC CHECKPOINT LIST */}
                  {currentStage === 2 && (
                    <div className="bg-white border rounded-xl p-3 shadow-sm mb-4">
                      <span className="text-[10px] font-bold text-blue-600 uppercase mb-2 block">Route Checkpoints</span>
                      <div className="space-y-2">
                        {activeNodes.map((node, idx) => {
                          if (idx === 0 || idx === activeNodes.length - 1) return null; // Hide Start/End
                          const isPassed = currentLocationIndex >= idx;
                          const isCurrent = currentLocationIndex === idx;
                          return (
                            <button
                              key={idx} disabled={isPassed && !isCurrent}
                              onClick={() => handleDriverAction(`Arrived at ${node.name}`, undefined, idx)}
                              className={`w-full p-2.5 rounded-lg text-xs font-bold flex justify-between items-center transition border ${isCurrent ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : isPassed ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                            >
                              <span>{node.name}</span>
                              {isPassed ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <MapPin className="w-4 h-4" />}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {currentStage === 2 && (
                    <button onClick={() => handleDriverAction('Customs Inspection Started', 3, activeNodes.length - 1)} className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold text-slate-700 text-left shadow-sm active:scale-95 transition flex justify-between">
                      <span className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-amber-500" /> Enter Customs Stage</span>
                      <ArrowRight className="w-4 h-4 text-slate-300" />
                    </button>
                  )}
                  {currentStage === 3 && (
                    <button onClick={() => handleDriverAction('Cargo Marked as Delivered', 4)} className="w-full bg-emerald-600 text-white p-3 rounded-xl text-xs font-bold text-left shadow-md active:scale-95 transition flex justify-between">
                      <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Mark Cargo Delivered</span>
                      <Check className="w-4 h-4 text-emerald-200" />
                    </button>
                  )}
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm mt-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5"><Camera className="w-4 h-4 text-blue-600" /> Upload Waybill</span>
                  </div>
                  <label className="border-2 border-dashed border-slate-300 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-blue-50 transition">
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-xs font-medium text-slate-600">Take Photo</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                  
                  {uploadedPhotoUrl && (
                    <div className="mt-2 flex items-center gap-2 bg-slate-100 p-2 rounded-lg border border-slate-200">
                      <img src={uploadedPhotoUrl} alt="Preview" className="w-10 h-10 object-cover rounded border" />
                      <div className="text-[11px] leading-tight">
                        <span className="font-bold text-slate-800 block">Document Captured</span>
                        {isOffline ? <span className="text-amber-600">Queued for Sync</span> : <span className="text-emerald-600">Synced to Cloud</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}