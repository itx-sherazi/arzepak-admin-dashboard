"use client";
import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any;
    initGoogleMap?: () => void;
  }
}

interface Props {
  lat?: number;
  lng?: number;
  onChange: (lat: number, lng: number) => void;
}

export default function MapPicker({ lat, lng, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef    = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);

  const DEFAULT_LAT = lat || 31.5204;
  const DEFAULT_LNG = lng || 74.3587;

  useEffect(() => {
    if (window.google?.maps?.Map) {
      setLoaded(true);
      return;
    }

    const scriptId = "gmap-script";
    if (!document.getElementById(scriptId)) {
      window.initGoogleMap = () => {
        setLoaded(true);
      };
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=initGoogleMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.google?.maps?.Map) {
          clearInterval(interval);
          setLoaded(true);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loaded) initMap();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  function initMap() {
    if (!containerRef.current || mapRef.current || !window.google?.maps?.Map) return;
    
    const G = window.google.maps;
    const center = { lat: DEFAULT_LAT, lng: DEFAULT_LNG };
    
    const map = new G.Map(containerRef.current, {
      center,
      zoom: lat && lng ? 16 : 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
      ],
    });

    const marker = new G.Marker({
      position: center,
      map,
      draggable: true,
      animation: G.Animation.DROP,
      icon: {
        path: G.SymbolPath.CIRCLE,
        fillColor: "#16a34a",
        fillOpacity: 1,
        strokeColor: "#fff",
        strokeWeight: 3,
        scale: 10,
      },
    });

    marker.addListener("dragend", () => {
      const pos = marker.getPosition();
      if (pos) {
        onChange(+pos.lat().toFixed(6), +pos.lng().toFixed(6));
      }
    });

    map.addListener("click", (e: any) => {
      if (e.latLng) {
        marker.setPosition(e.latLng);
        marker.setAnimation(G.Animation.BOUNCE);
        setTimeout(() => marker.setAnimation(null), 400);
        onChange(+e.latLng.lat().toFixed(6), +e.latLng.lng().toFixed(6));
      }
    });

    mapRef.current    = map;
    markerRef.current = marker;
  }

  // Sync marker when lat/lng props change externally
  useEffect(() => {
    if (!markerRef.current || !mapRef.current || !lat || !lng) return;
    const pos = { lat, lng };
    markerRef.current.setPosition(pos);
    mapRef.current.panTo(pos);
  }, [lat, lng]);

  useEffect(() => () => { 
    mapRef.current = null; 
    markerRef.current = null; 
  }, []);

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 focus-within:border-green-400 transition-colors">
        {!window.google?.maps && !loaded && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50">
            <Loader2 className="h-7 w-7 animate-spin text-green-600" />
          </div>
        )}
        <div ref={containerRef} className="w-full h-72" />
      </div>
      {lat && lng ? (
        <p className="text-xs text-green-600 flex items-center gap-1.5 font-medium">
          <MapPin size={12} /> Location set: {lat}, {lng}
        </p>
      ) : (
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <MapPin size={12} /> Click on map to set exact location
        </p>
      )}
    </div>
  );
}
