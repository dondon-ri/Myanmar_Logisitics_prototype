"use client";

import { MapContainer, TileLayer, Marker, Polyline, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconShadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const truckIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzNiODJmNiIgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIj48cGF0aCBkPSJNMjAgOGgtM1Y0SDNjLTEuMSAwLTIgLjktMiAydjExaDJjMCAxLjY2IDEuMzQgMyAzIDNzMy0xLjM0IDMtM2g2YzAgMS42NiAxLjM0IDMgMyAzczMtMS4zNCAzLTNoMnYtNWwtMy00ek02IDE4LjVjLS44MyAwLTEuNS0uNjctMS41LTEuNXMuNjctMS41IDEuNS0xLjUgMS41LjY3IDEuNSAxLjUtLjY3IDEuNS0xLjUgMS41em0xMy41LTlsMS45NiAyLjVIMTdWOS41aDIuNXptLTEuNSA5Yy0uODMgMC0xLjUtLjY3LTEuNS0xLjVzLjY3LTEuNSAxLjUtMS41IDEuNS42NyAxLjUgMS41LS42NyAxLjUtMS41IDEuNXoiLz48L3N2Zz4=',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface MapProps {
  destinationId: string;
  truckPosition: [number, number]; 
}

export default function RouteMap({ destinationId, truckPosition }: MapProps) {
  const nodes = {
    yangon: [16.8409, 96.1735] as [number, number],
    bago: [17.3395, 96.4856] as [number, number],
    naypyidaw: [19.7633, 96.0785] as [number, number],
    mandalay: [21.9588, 96.0891] as [number, number],
    pyinoolwin: [22.0362, 96.4683] as [number, number],
    muse: [23.9840, 97.8960] as [number, number],
    hpaan: [16.8835, 97.6334] as [number, number],
    myawaddy: [16.6896, 98.5082] as [number, number],
    lashio: [22.9300, 97.7500] as [number, number],
    chinshwehaw: [23.7500, 98.7100] as [number, number],
  };

  const routes = {
    muse: { path: [nodes.yangon, nodes.bago, nodes.naypyidaw, nodes.mandalay, nodes.pyinoolwin, nodes.muse], distance: "1,065 km" },
    myawaddy: { path: [nodes.yangon, nodes.bago, nodes.hpaan, nodes.myawaddy], distance: "425 km" },
    chinshwehaw: { path: [nodes.yangon, nodes.bago, nodes.naypyidaw, nodes.mandalay, nodes.lashio, nodes.chinshwehaw], distance: "950 km" }
  };
  
  const activeRoute = destinationId === 'myawaddy' ? routes.myawaddy : destinationId === 'chinshwehaw' ? routes.chinshwehaw : routes.muse;

  return (
    <div className="w-full h-[400px] rounded-xl overflow-hidden border-2 border-slate-300 z-0 relative">
      <MapContainer center={nodes.naypyidaw} zoom={6} className="w-full h-full" scrollWheelZoom={false}>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Polyline positions={activeRoute.path} color="#3b82f6" weight={4} opacity={0.8} />

        <Marker position={nodes.yangon} icon={customIcon}><Popup>Yangon Hub (Origin)</Popup></Marker>
        <Marker position={activeRoute.path[activeRoute.path.length - 1]} icon={customIcon}><Popup>Destination</Popup></Marker>
        
        <Marker position={truckPosition} icon={truckIcon}>
          <Popup><strong>Live Truck Position</strong></Popup>
        </Marker>

        {/* Hazard Blobs */}
        <Circle center={[18.5, 96.5]} radius={60000} pathOptions={{ color: 'transparent', fillColor: '#f59e0b', fillOpacity: 0.3 }}>
          <Popup>Heavy Rain Advisory</Popup>
        </Circle>
        <Circle center={[22.5, 97.5]} radius={50000} pathOptions={{ color: 'transparent', fillColor: '#ef4444', fillOpacity: 0.2 }}>
          <Popup>Conflict Zone</Popup>
        </Circle>
      </MapContainer>
    </div>
  );
}