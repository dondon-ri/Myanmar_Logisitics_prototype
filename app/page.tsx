"use client";

import React, { useState } from 'react';
import { 
  Truck, MapPin, AlertTriangle, Wifi, WifiOff, 
  CheckCircle2, Radio, Package, Camera, Upload, 
  FileText, Clock, ShieldAlert, ArrowRight, Check
} from 'lucide-react';

interface RouteStatus {
  id: string;
  name: string;
  corridor: string;
  status: 'Open' | 'Delayed' | 'Closed';
  lastUpdated: string;
}

interface ShipmentLog {
  time: string;
  location: string;
  message: string;
}

interface TransportRequest {
  id: string;
  pickup: string;
  destinationId: string;
  cargo: string;
}

interface OfflineAction {
  message: string;
  stage?: number;
  photoUrl?: string;
}

export default function MyanmarLogisticsApp() {
  // Global Shared State
  const [role, setRole] = useState<'admin' | 'trader' | 'driver'>('trader');
  
  // Border Routes
  const [routes, setRoutes] = useState<RouteStatus[]>([
    { id: 'muse', name: 'Muse Border Gate', corridor: 'Yangon-Mandalay-Muse (China Trade)', status: 'Open', lastUpdated: '10 mins ago' },
    { id: 'myawaddy', name: 'Myawaddy Border Gate', corridor: 'Yangon-Hpa-an-Myawaddy (Thai Trade)', status: 'Delayed', lastUpdated: '25 mins ago' },
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
  const [pendingRequests, setPendingRequests] = useState<TransportRequest[]>([]);
  
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
  const [transitLogs, setTransitLogs] = useState<ShipmentLog[]>([
    { time: '06:30 AM', location: 'Yangon Hlaing Tharyar Hub', message: 'Container loaded & sealed. Waybill signed.' },
    { time: '11:15 AM', location: 'Naypyidaw Toll Gate', message: 'Weight check cleared (24.2 Metric Tons).' },
    { time: '03:40 PM', location: 'Mandalay Kyaukse Junction', message: 'Driver rest-stop completed, refueled.' }
  ]);

  // Driver Offline / Upload State
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineAction[]>([]);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);

  // Admin: Toggle Route Status
  const handleStatusChange = (id: string, newStatus: 'Open' | 'Delayed' | 'Closed') => {
    setRoutes(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, lastUpdated: 'Just now' } : r));
  };

  // Admin: Broadcast Alert
  const handlePublishBroadcast = () => {
    if (!inputAlert.trim()) return;
    setBroadcastAlert(inputAlert);
    setAlertVisible(true);
    setInputAlert('');
  };

  // Trader: Submit Request
  const handleSubmitRequest = () => {
    if (!formDest || !formCargo || !formPickup) return alert("Please fill all fields!");
    const newReq: TransportRequest = {
      id: 'TRK-' + Math.floor(1000 + Math.random() * 9000),
      pickup: formPickup,
      destinationId: formDest,
      cargo: formCargo
    };
    setPendingRequests(prev => [...prev, newReq]);
    setShowRequestForm(false);
    setFormDest('');
    setFormCargo('');
    alert("Request Submitted! Switch to Admin HQ to approve it.");
  };

  // Admin: Approve Request
  const handleApproveRequest = (req: TransportRequest) => {
    setPendingRequests(prev => prev.filter(p => p.id !== req.id)); 
    const destName = routes.find(r => r.id === req.destinationId)?.name || 'Unknown Route';
    
    setActiveShipment({
      id: req.id,
      cargo: req.cargo,
      destinationId: req.destinationId,
      destinationName: destName,
      driver: 'U Ba (Newly Assigned)',
      plate: 'MDY 5F-1122'
    });
    
    setCurrentStage(1);
    setTransitLogs([
      { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), location: 'HQ Dispatch', message: 'Transport approved. Driver dispatched for pickup.' }
    ]);
    setUploadedPhotoUrl(null);
  };

  // Driver: Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);

    if (isOffline) {
      setOfflineQueue(prev => [...prev, { message: `Waybill Photo Uploaded (${file.name})`, photoUrl: previewUrl }]);
      setUploadedPhotoUrl(previewUrl); // Show preview locally for driver
    } else {
      setUploadedPhotoUrl(previewUrl);
      setTransitLogs(prev => [{ time: 'Just now', location: 'Current Checkpoint', message: `Waybill uploaded (${file.name}).` }, ...prev]);
    }
  };

  // Driver: Status Update Action
  const handleDriverAction = (actionText: string, advanceStage?: number) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isOffline) {
      setOfflineQueue(prev => [...prev, { message: actionText, stage: advanceStage }]);
    } else {
      if (advanceStage && advanceStage > currentStage) setCurrentStage(advanceStage);
      setTransitLogs(prev => [{ time: now, location: 'Current Location', message: actionText }, ...prev]);
    }
  };

  // Driver: Toggle Offline Sync
  const toggleOffline = () => {
    if (isOffline) {
      setIsOffline(false);
      if (offlineQueue.length > 0) {
        const queuedItems = [...offlineQueue];
        let highestStage = currentStage;
        
        queuedItems.forEach(item => {
          if (item.stage && item.stage > highestStage) highestStage = item.stage;
        });

        // Apply advanced stage if queued
        if (highestStage > currentStage) setCurrentStage(highestStage);

        setSyncNotice(`Synced ${queuedItems.length} queued events to Cloud.`);
        setTransitLogs(prev => [
          ...queuedItems.reverse().map(item => ({ 
            time: 'Synced Just Now', 
            location: 'Local Cache', 
            message: `[OFFLINE SYNC] ${item.message}` 
          })),
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
                        Approve & Dispatch Driver
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin: Gate Status Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">HQ Border Gate & Route Controller</h2>
              <p className="text-sm text-slate-500 mb-4">Manage border gate permissions across major trade corridors.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
                    <tr>
                      <th className="p-3">Gate Corridor</th>
                      <th className="p-3">Current Status</th>
                      <th className="p-3">Toggle Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {routes.map(r => (
                      <tr key={r.id}>
                        <td className="p-3 font-semibold">{r.name}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${r.status === 'Open' ? 'bg-emerald-100 text-emerald-800' : r.status === 'Delayed' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                            ● {r.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="inline-flex rounded-lg border bg-white p-0.5">
                            {(['Open', 'Delayed', 'Closed'] as const).map(s => (
                              <button key={s} onClick={() => handleStatusChange(r.id, s)} className={`px-2 py-1 text-xs font-medium rounded-md transition ${r.status === s ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}>{s}</button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Admin: Broadcast Alert Dispatcher */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Radio className="w-5 h-5 text-blue-600 animate-pulse" />
                <h3 className="font-bold text-slate-900">Emergency Broadcast Dispatcher</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">Pushes instant alerts to all driver mobile interfaces and trader dashboards active along Myanmar routes.</p>
              
              <div className="flex gap-3">
                <input 
                  type="text"
                  placeholder="e.g., Muse 105-Mile border halted. Drivers divert."
                  value={inputAlert}
                  onChange={(e) => setInputAlert(e.target.value)}
                  className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  onClick={handlePublishBroadcast}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition shadow-sm flex items-center gap-2"
                >
                  <Radio className="w-4 h-4" /> Broadcast Alert
                </button>
              </div>

              {broadcastAlert && alertVisible && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-900 text-xs">
                    <span className="font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">Active Broadcast</span>
                    <span>{broadcastAlert}</span>
                  </div>
                  <button onClick={() => setAlertVisible(false)} className="text-xs text-blue-600 underline">Hide Banner</button>
                </div>
              )}
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
                <div className="text-sm font-medium flex-1">
                  <span className="font-bold uppercase text-xs mr-2 bg-amber-600 px-2 py-0.5 rounded">HQ Dispatch Notice</span>
                  {broadcastAlert}
                </div>
              </div>
            )}

            {/* Trader: Request Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              {!showRequestForm ? (
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-900">Need to move new cargo?</h3>
                  </div>
                  <button onClick={() => setShowRequestForm(true)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-800 transition flex items-center gap-2">
                    <Package className="w-4 h-4" /> Book New Transport
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-900">New Transport Request</h3>
                    <button onClick={() => setShowRequestForm(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Pickup Location</label>
                      <input type="text" value={formPickup} onChange={(e) => setFormPickup(e.target.value)} className="w-full text-sm border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Destination Gate</label>
                      <select value={formDest} onChange={(e) => setFormDest(e.target.value)} className="w-full text-sm border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="" disabled>Select destination...</option>
                        {routes.map(r => <option key={r.id} value={r.id} disabled={r.status === 'Closed'}>{r.name} {r.status === 'Closed' ? ' ⛔' : ''}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Cargo Details (Metric Tons)</label>
                      <input type="text" value={formCargo} onChange={(e) => setFormCargo(e.target.value)} placeholder="e.g. 15MT Rice" className="w-full text-sm border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                  <button onClick={handleSubmitRequest} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold w-full hover:bg-blue-700 transition">Submit Request to HQ</button>
                </div>
              )}
            </div>

            {/* Trader: Dynamic Route Alert if assigned route is closed */}
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
                  <p className="text-sm text-slate-500">Destination: {activeShipment.destinationName}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-emerald-600 font-bold block">Driver: {activeShipment.driver}</span>
                  <span className="text-xs text-slate-500 block">Truck Plate: {activeShipment.plate}</span>
                </div>
              </div>

              {/* 4-Stage Tracker */}
              <div className="py-8 grid grid-cols-4 gap-2 text-center relative">
                <div className="absolute top-4 left-[12%] right-[12%] h-1 bg-slate-200 -z-10">
                   <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${((currentStage - 1) / 3) * 100}%` }}></div>
                </div>
                {[
                  { step: 1, label: 'Picked Up' },
                  { step: 2, label: 'In Transit' },
                  { step: 3, label: 'Border Customs' },
                  { step: 4, label: 'Delivered' }
                ].map(s => {
                  const isPassed = currentStage >= s.step, isCurrent = currentStage === s.step;
                  return (
                    <div key={s.step} className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-md' : isPassed ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        {isPassed ? <Check className="w-4 h-4" /> : s.step}
                      </div>
                      <span className={`text-xs mt-2 font-bold ${isCurrent ? 'text-blue-600' : 'text-slate-500'}`}>{s.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Grid: Map & Logs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                
                {/* Simulated Map */}
                <div className="bg-slate-900 rounded-xl p-5 text-white flex flex-col justify-center min-h-[200px] text-center border-2 border-slate-800">
                   <MapPin className="w-8 h-8 text-blue-400 mx-auto mb-2 opacity-50" />
                   <h4 className="font-bold text-sm text-slate-300">Live GPS Telemetry</h4>
                   <p className="text-xs text-slate-500 mt-1">Route tracking simulated for {activeShipment.destinationName}</p>
                   {currentStage === 4 ? (
                     <div className="mt-4 inline-block bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold">Arrived at Destination</div>
                   ) : (
                     <div className="mt-4 flex items-center justify-center gap-2 text-xs text-blue-300">
                       <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span> Signal Active
                     </div>
                   )}
                </div>

                {/* Transit Logs & Uploaded Photos */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col max-h-[300px]">
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

                  {/* Show Uploaded Document in Trader view if exists */}
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
            <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl border-[6px] border-slate-800 flex flex-col overflow-hidden">
              
              {/* Phone Status Bar */}
              <div className="bg-slate-900 text-white px-5 py-2 flex justify-between items-center text-xs">
                <span className="font-semibold">09:41</span>
                {isOffline ? <span className="text-rose-400 flex items-center gap-1"><WifiOff className="w-3 h-3" /> No Signal</span> : <span className="text-emerald-400 flex items-center gap-1"><Wifi className="w-3 h-3" /> 4G LTE</span>}
              </div>

              {/* Blackout Mode Toggle */}
              <div className="bg-slate-800 px-4 py-3 flex justify-between items-center text-white border-b border-slate-700">
                <div>
                  <span className="text-xs font-bold block">Blackout Mode</span>
                  <span className="text-[10px] text-slate-400">Simulate offline connection</span>
                </div>
                <button onClick={toggleOffline} className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-inner ${isOffline ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
                  {isOffline ? 'Offline Active' : 'Go Offline'}
                </button>
              </div>

              {/* Driver: Admin Broadcast Notice */}
              {alertVisible && broadcastAlert && (
                <div className="bg-amber-500 text-white p-3 text-xs flex items-start gap-2 shadow-inner">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[10px] uppercase tracking-wider text-amber-900">Dispatcher Warning</strong>
                    <span className="font-medium leading-tight">{broadcastAlert}</span>
                  </div>
                </div>
              )}

              {/* Driver: Sync Success Notice */}
              {syncNotice && (
                <div className="bg-emerald-600 text-white p-2 text-xs text-center font-bold animate-pulse">
                  ✓ {syncNotice}
                </div>
              )}

              {/* Main App Area */}
              <div className="p-4 space-y-4 bg-slate-50 flex-1">
                
                {/* Active Assignment Card */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Current Assignment</span>
                  <h3 className="font-bold text-sm text-slate-900 mt-1">{activeShipment.driver}</h3>
                  <p className="text-xs font-medium text-slate-600">{activeShipment.cargo}</p>
                  <div className="mt-2 pt-2 border-t border-slate-100">
                     <span className="text-xs font-bold text-slate-800 flex items-center gap-1"><MapPin className="w-3 h-3 text-rose-500" /> Route: {activeShipment.destinationName}</span>
                  </div>
                </div>

                {/* Offline Warning & Queue Details */}
                {isOffline && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800">
                    <div className="flex items-center gap-1.5 font-bold mb-1"><WifiOff className="w-4 h-4 text-rose-600" /> Local Cache Active</div>
                    <p className="text-[11px] text-rose-700">Updates are stored locally and will push to Tracker Dashboard when reconnected.</p>
                    {offlineQueue.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-rose-200">
                        <span className="font-bold text-[10px] uppercase">Queued Events ({offlineQueue.length}):</span>
                        <ul className="list-disc pl-4 mt-1 text-[11px]">
                          {offlineQueue.map((item, i) => <li key={i}>{item.message}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Driver: Log Checkpoint Events */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Log Event Actions</label>
                  
                  {/* NEW: Explicitly triggers Stage 2 (In Transit) */}
                  <button onClick={() => handleDriverAction('Departed Hub / In Transit Started', 2)} className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold text-slate-700 text-left shadow-sm hover:bg-slate-50 active:scale-95 transition flex justify-between">
                    <span className="flex items-center gap-2"><Truck className="w-4 h-4 text-blue-500" /> Start Transit / Depart Hub</span>
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </button>

                  {/* Standard Checkpoint Log (Does not advance major stages) */}
                  <button onClick={() => handleDriverAction('Driver Arrived at Checkpoint')} className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold text-slate-700 text-left shadow-sm hover:bg-slate-50 active:scale-95 transition flex justify-between">
                    <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-500" /> Log Highway Checkpoint</span>
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </button>

                  {/* Triggers Stage 3 */}
                  <button onClick={() => handleDriverAction('Customs Inspection Started', 3)} className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold text-slate-700 text-left shadow-sm hover:bg-slate-50 active:scale-95 transition flex justify-between">
                    <span className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-amber-500" /> Enter Customs Stage</span>
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </button>

                  {/* Triggers Stage 4 */}
                  <button onClick={() => handleDriverAction('Cargo Marked as Delivered', 4)} className="w-full bg-emerald-600 text-white p-3 rounded-xl text-xs font-bold text-left shadow-md active:scale-95 transition flex justify-between">
                    <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-white" /> Mark Cargo Delivered</span>
                    <Check className="w-4 h-4 text-emerald-200" />
                  </button>
                </div>

                {/* Driver: Camera Upload */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm mt-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5"><Camera className="w-4 h-4 text-blue-600" /> Upload Waybill</span>
                  </div>
                  <label className="border-2 border-dashed border-slate-300 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-blue-50 transition">
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-xs font-medium text-slate-600">Take Photo or Select File</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                  
                  {/* Photo Preview in Driver App */}
                  {uploadedPhotoUrl && (
                    <div className="mt-2 flex items-center gap-2 bg-slate-100 p-2 rounded-lg border border-slate-200">
                      <img src={uploadedPhotoUrl} alt="Document Preview" className="w-10 h-10 object-cover rounded border" />
                      <div className="text-[11px] leading-tight">
                        <span className="font-bold text-slate-800 block">Document Captured</span>
                        {isOffline ? <span className="text-amber-600">Queued for Sync</span> : <span className="text-emerald-600">Synced to Cloud</span>}
                      </div>
                    </div>
                  )}
                </div>

              </div>
              
              {/* Phone Bottom Home Bar indicator */}
              <div className="bg-white pt-2 pb-3 flex justify-center">
                 <div className="w-1/3 h-1 bg-slate-300 rounded-full"></div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}