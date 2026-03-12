import React, { useState, useEffect, useRef } from 'react';
import { Container, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import parseGeoraster from 'georaster';
import GeoRasterLayer from 'georaster-layer-for-leaflet';
import 'leaflet/dist/leaflet.css';

// ─────────────────────────────────────────────────────────────────────────────
// Continuous depth → colour mapping (linear interpolation between stops)
// ─────────────────────────────────────────────────────────────────────────────
const DEPTH_STOPS = [
  [10,   [190, 240, 255]],  // 0 m   – pale cyan (just submerged)
  [50,  [80,  190, 230]],  // 10 m  – sky blue
  [100,  [30,  130, 200]],  // 40 m  – medium blue
  [200, [10,  70,  160]],  // 100 m – cobalt
  [500, [5,   30,  100]],  // 250 m – dark navy
  [1000, [2,   8,   35 ]],  // 500 m – near black
];

function depthToColor(depth) {
  const last = DEPTH_STOPS.length - 1;
  if (depth <= DEPTH_STOPS[0][0])    { const [r,g,b] = DEPTH_STOPS[0][1];    return `rgb(${r},${g},${b})`; }
  if (depth >= DEPTH_STOPS[last][0]) { const [r,g,b] = DEPTH_STOPS[last][1]; return `rgb(${r},${g},${b})`; }
  for (let i = 0; i < last; i++) {
    const [d0, c0] = DEPTH_STOPS[i];
    const [d1, c1] = DEPTH_STOPS[i + 1];
    if (depth >= d0 && depth <= d1) {
      const t = (depth - d0) / (d1 - d0);
      const r = Math.round(c0[0] + t * (c1[0] - c0[0]));
      const g = Math.round(c0[1] + t * (c1[1] - c0[1]));
      const b = Math.round(c0[2] + t * (c1[2] - c0[2]));
      return `rgb(${r},${g},${b})`;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Flood overlay layer (re-renders whenever waterLevel or georaster changes)
// ─────────────────────────────────────────────────────────────────────────────
function FloodLayer({ waterLevel, georaster }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!georaster) return;

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    const layer = new GeoRasterLayer({
      georaster,
      opacity: 0.95,
      resolution: 128,
      pixelValuesToColorFn: values => {
        const elevation = values[0];
        if (elevation === georaster.noDataValue || elevation > waterLevel) return null;
        return depthToColor(waterLevel - elevation);
      },
    });

    layer.addTo(map);
    layerRef.current = layer;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [waterLevel, georaster, map]);

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page component
// ─────────────────────────────────────────────────────────────────────────────
export default function FloodSimulator() {
  const [waterLevel, setWaterLevel] = useState(0);
  const [georaster, setGeoraster]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  useEffect(() => {
    fetch('/Croatia_DEM.tif')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status} – make sure Croatia_DEM.tif is in the public/ folder`);
        return r.arrayBuffer();
      })
      .then(buf => parseGeoraster(buf))
      .then(gr => {
        setGeoraster(gr);
        setLoading(false);
      })
      .catch(err => {
        console.error('FloodSimulator: failed to load DEM', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // CSS gradient string built from the same stops used in depthToColor
  const gradientStops = DEPTH_STOPS.map(([, [r, g, b]], i) => {
    const pct = Math.round((i / (DEPTH_STOPS.length - 1)) * 100);
    return `rgb(${r},${g},${b}) ${pct}%`;
  }).join(', ');
  const depthGradient = `linear-gradient(to right, ${gradientStops})`;

  return (
    <Container fluid className="py-4 px-0">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="px-4 mb-3">
        <h2 style={{ color: '#CA7915FF' }}>Croatia Flood Simulator</h2>
        <p className="text-secondary mb-0">
          Drag the slider to raise the sea level and watch Croatia flood in real time.
          The simulation uses a Digital Elevation Model (DEM) raster to compute which
          land areas fall below the chosen water level.
        </p>
      </div>

      {/* ── Control panel ────────────────────────────────────────────── */}
      <div
        className="px-4 py-3 mb-3"
        style={{ background: '#1a1a1a', borderTop: '2px solid #6351C9', borderBottom: '2px solid #6351C9' }}
      >
        <div className="d-flex align-items-center flex-wrap gap-3">
          <div style={{ minWidth: '380px', flexGrow: 1, maxWidth: '700px' }}>
            <Form.Label className="text-light mb-1">
              Water Level&nbsp;
              <span style={{ color: '#CA7915FF', fontWeight: 'bold', fontSize: '1.15rem' }}>
                {waterLevel} m
              </span>
            </Form.Label>
            <Form.Range
              min={0}
              max={1000}
              step={2}
              value={waterLevel}
              onChange={e => setWaterLevel(Number(e.target.value))}
              style={{ accentColor: '#6351C9' }}
            />
            <div className="d-flex justify-content-between" style={{ fontSize: '0.75rem', color: '#666' }}>
              <span>0 m</span><span>500 m</span><span>1000 m</span>
            </div>
          </div>

          {/* Legend – continuous gradient bar */}
          <div className="ms-auto" style={{ minWidth: '220px' }}>
            <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: 3 }}>Depth</div>
            <div style={{ height: 14, borderRadius: 4, background: depthGradient, border: '1px solid #444' }} />
            <div className="d-flex justify-content-between" style={{ fontSize: '0.7rem', color: '#888', marginTop: 2 }}>
              <span>0 m</span><span>50 m</span><span>100 m</span><span>200 m</span><span>500 m</span><span>1000 m</span>
            </div>
          </div>

          {/* Status badge */}
          <div>
            {loading && (
              <span className="text-info d-flex align-items-center gap-2">
                <Spinner animation="border" size="sm" variant="info" />
                Loading DEM…
              </span>
            )}
            {!loading && !error && (
              <Badge bg="success">DEM loaded</Badge>
            )}
          </div>
        </div>
      </div>

      {/* ── Error banner ─────────────────────────────────────────────── */}
      {error && (
        <div className="px-4 mb-3">
          <Alert variant="danger">
            <Alert.Heading>Could not load elevation data</Alert.Heading>
            <p className="mb-0">{error}</p>
            <hr />
            <p className="mb-0 small">
              Place a GeoTIFF file named <code>Croatia_DEM.tif</code> in the{' '}
              <code>public/</code> folder and restart the dev server.
            </p>
          </Alert>
        </div>
      )}

      {/* ── Map ──────────────────────────────────────────────────────── */}
      <div style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}>
        <MapContainer
          center={[45.1, 15.2]}
          zoom={7}
          minZoom={7}
          maxZoom={13}
          maxBounds={[[42, 12.5], [47, 21]]}
          maxBoundsViscosity={0.05}
          style={{ height: '100%', width: '100%' }}
        >
          {/* Google Hybrid basemap */}
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            attribution="&copy; Google"
          />

          {/* Flood overlay */}
          {georaster && <FloodLayer waterLevel={waterLevel} georaster={georaster} />}
        </MapContainer>
      </div>

      
    </Container>
  );
}
