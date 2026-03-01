import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as maptilersdk from '@maptiler/sdk';
import { createRequest } from '../api/requestService';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import RequestsTabs from '../components/RequestsTabs';
import Modal from '../components/Modal';

maptilersdk.config.apiKey = import.meta.env.VITE_MAPTILER_API_KEY || '';

const DEFAULT_CENTER = { lat: 25.2048, lng: 55.2708 };

export default function CreateRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [note, setNote] = useState('');
  const [coords, setCoords] = useState(DEFAULT_CENTER);
  const [pickupAddress, setPickupAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [detecting, setDetecting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMapMoving, setIsMapMoving] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);

  // Stable refs — never change, never trigger re-renders
  const containerRef = useRef(null);   // attached to the map <div>
  const mapRef = useRef(null);         // MapTiler instance
  const mapLoadedRef = useRef(false);
  const coordsRef = useRef(coords);
  const moveEndTimerRef = useRef(null);
  const isProgrammaticRef = useRef(false);

  // Keep coordsRef in sync (no re-render needed for the map init)
  useEffect(() => { coordsRef.current = coords; }, [coords]);

  // ─── Map lifecycle: create when modal opens, destroy when it closes ───────
  useEffect(() => {
    if (!isModalOpen) return;         // nothing to do while closed

    // Wait one tick so the modal DOM is mounted before we attach the map
    const timer = setTimeout(() => {
      const node = containerRef.current;
      if (!node || mapRef.current) return;   // already initialised

      const { lat, lng } = coordsRef.current;
      const instance = new maptilersdk.Map({
        container: node,
        style: maptilersdk.MapStyle.STREETS,
        center: [lng, lat],
        zoom: 12,
      });

      instance.on('movestart', () => setIsMapMoving(true));

      instance.on('move', () => {
        if (isProgrammaticRef.current) return;   // ignore during flyTo
        const c = instance.getCenter();
        setCoords({ lat: c.lat, lng: c.lng });
      });

      instance.on('moveend', () => {
        setIsMapMoving(false);
        const c = instance.getCenter();

        if (moveEndTimerRef.current) clearTimeout(moveEndTimerRef.current);

        if (isProgrammaticRef.current) {
          // programmatic move finished — sync once and stop suppressing
          isProgrammaticRef.current = false;
          setCoords({ lat: c.lat, lng: c.lng });
          moveEndTimerRef.current = setTimeout(() => fetchAddress(c.lat, c.lng), 300);
        } else {
          // user drag — debounce address fetch
          moveEndTimerRef.current = setTimeout(() => fetchAddress(c.lat, c.lng), 500);
        }
      });

      instance.on('load', () => {
        mapLoadedRef.current = true;
      });

      mapRef.current = instance;
    }, 50);  // short tick so Modal DOM is painted

    return () => {
      clearTimeout(timer);
      if (moveEndTimerRef.current) clearTimeout(moveEndTimerRef.current);
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch (_) { /* already removed */ }
        mapRef.current = null;
      }
      mapLoadedRef.current = false;
      isProgrammaticRef.current = false;
    };
  }, [isModalOpen]);   // only depends on modal open/close — NOTHING ELSE
  // ─────────────────────────────────────────────────────────────────────────

  const fetchAddress = async (lat, lng) => {
    const key = import.meta.env.VITE_MAPTILER_API_KEY;
    if (!key) return;
    try {
      const res = await fetch(`https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${key}`);
      const data = await res.json();
      const label = data?.features?.[0]?.place_name || data?.features?.[0]?.place_name_en || '';
      if (label) setPickupAddress(label);
    } catch {
      // ignore address errors
    }
  };

  const detectLocation = () => {
    setDetecting(true);
    setError('');
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setDetecting(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        // Update state immediately so the address field reflects the real location
        setCoords({ lat: latitude, lng: longitude });
        fetchAddress(latitude, longitude);

        const m = mapRef.current;
        if (m) {
          const fly = () => {
            isProgrammaticRef.current = true;
            m.flyTo({
              center: [longitude, latitude],
              zoom: 15,
              essential: true,
              duration: 1500,
            });
          };

          if (mapLoadedRef.current) {
            fly();
          } else {
            // Map style not yet loaded — wait for it then fly
            m.once('load', fly);
          }
        }

        setDetecting(false);
      },
      (err) => {
        const msgs = {
          1: 'Location permission denied. Please allow location access in your browser.',
          2: 'Location unavailable. Please try again.',
          3: 'Location request timed out. Please try again.',
        };
        setError(msgs[err.code] || 'Could not get location.');
        setDetecting(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!customerName.trim()) errors.name = 'Please enter your name';
    if (!pickupAddress || !coords.lat) errors.address = 'Please select a pickup location';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setError('');
    setLoading(true);
    try {
      await createRequest({
        customer_name: customerName,
        location: {
          lat: coords.lat,
          lng: coords.lng,
          address: pickupAddress || undefined,
        },
        note: note || undefined,
      });
      navigate('/requests');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX);

  const handleTouchEnd = (e) => {
    if (touchStartX == null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (deltaX < -60) navigate('/requests');
    setTouchStartX(null);
  };

  return (
    <div className="space-y-4" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <RequestsTabs active="new" />
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Request Tow</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              label="Your Name"
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
              }}
              placeholder="John Doe"
              className={formErrors.name ? 'border-red-500' : ''}
            />
            {formErrors.name && <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.name}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>Pickup Location</label>
            <div
              className={`input-field flex items-center justify-between cursor-pointer hover:border-primary transition-colors ${formErrors.address ? 'border-red-500' : ''}`}
              onClick={() => {
                setIsModalOpen(true);
                if (formErrors.address) setFormErrors(prev => ({ ...prev, address: '' }));
              }}
              style={{ minHeight: '3rem' }}
            >
              <span className={pickupAddress ? 'text-sm' : 'text-sm text-muted'}>
                {pickupAddress || 'Select pickup location...'}
              </span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: formErrors.address ? '#ef4444' : 'var(--color-primary)' }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            {formErrors.address && <p className="text-xs text-red-500 mt-0.5 font-medium">{formErrors.address}</p>}
          </div>

          <Input as="textarea" label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Vehicle model, special instructions..." />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" disabled={loading || !coords.lat}>
            {loading ? (
              <div className="flex items-center">
                <div className="spinner spinner-sm btn-spinner" />
                <span>Creating...</span>
              </div>
            ) : 'Create Request'}
          </Button>
        </form>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Select Pickup Location"
      >
        <div className="space-y-4">
          <div className="relative">
            {/* Stable div — ref never changes, React never remounts this element */}
            <div ref={containerRef} className="map-container-compact" />
            <div className={`map-pin-overlay ${isMapMoving ? 'moving' : ''}`}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)', fill: 'rgba(139, 92, 246, 0.2)' }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <div className="map-pin-shadow"></div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={detectLocation}
              disabled={detecting}
              className="w-full"
            >
              <div className="flex items-center gap-2">
                {detecting ? (
                  <div className="flex items-center">
                    <div className="spinner spinner-sm btn-spinner" />
                    <span>Detecting...</span>
                  </div>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <circle cx="12" cy="12" r="3"></circle>
                      <line x1="12" y1="1" x2="12" y2="3"></line>
                      <line x1="12" y1="21" x2="12" y2="23"></line>
                      <line x1="1" y1="12" x2="3" y2="12"></line>
                      <line x1="21" y1="12" x2="23" y2="12"></line>
                    </svg>
                    <span>Detect my location</span>
                  </>
                )}
              </div>
            </Button>
            <div className="p-3 bg-soft rounded-xl text-xs flex items-start gap-2" style={{ backgroundColor: 'var(--color-bg-soft)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <div className="flex-1">
                <p className="font-semibold mb-0.5">Selection Method</p>
                <p className="opacity-80">Drag the map to place the pin at your pickup spot.</p>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="w-full"
            >
              Confirm Location
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
