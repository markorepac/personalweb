import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Container, Card, Form, Row, Col, Badge } from 'react-bootstrap';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-dist-min';

const Plot = createPlotlyComponent(Plotly);

// --- 1. MATH HELPERS ---
function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const a1 = 0.254829592; const a2 = -0.284496736; const a3 = 1.421413741;
  const a4 = -1.453152027; const a5 = 1.061405429; const p = 0.3275911;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

const calculateHSCM = (T0, T1, kappa, ageMyr, depthKm) => {
  const ageSec = ageMyr * 3.15576e13;
  const depthM = depthKm * 1000;
  const k = kappa * 1e-6; 
  if (ageSec <= 0) return T1; 
  if (depthM <= 0) return T0; 
  const argument = depthM / (2 * Math.sqrt(k * ageSec));
  return T0 + (T1 - T0) * erf(argument);
};

const calculatePlate = (T0, T1, kappa, h, ageMyr, depthKm) => {
  const ageSec = ageMyr * 3.15576e13;
  const depthM = depthKm * 1000;
  const hM = h * 1000;
  const k = kappa * 1e-6;
  const T_steady = T0 + (T1 - T0) * (depthM / hM);
  let summation = 0;
  for (let n = 1; n <= 80; n++) {
    const decay = Math.exp((-k * n * n * Math.PI * Math.PI * ageSec) / (hM * hM));
    const sine = Math.sin((n * Math.PI * depthM) / hM);
    summation += (2 / (n * Math.PI)) * (T1 - T0) * sine * decay;
  }
  return T_steady + summation;
};

// --- 2. RESPONSIVE HELPER ---
const ResponsivePlot = ({ data, layout, onPointClick, style }) => {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) setSize({ width, height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden', ...style }}>
      {size.width > 0 && (
        <Plot
          data={data}
          layout={{ ...layout, width: size.width, height: size.height, autosize: false }}
          onClick={onPointClick}
          config={{ displayModeBar: true, scrollZoom: true, displaylogo: false }}
          style={{ width: '100%', height: '100%' }}
        />
      )}
    </div>
  );
};

const PlateCooling = () => {
  const [modelType, setModelType] = useState('Both'); 
  const [T0, setT0] = useState(0);       
  const [T1, setT1] = useState(1350);    
  const [kappa, setKappa] = useState(1.0); 
  const [h, setH] = useState(125);       
  const [age, setAge] = useState(60);    
  const [probeAge, setProbeAge] = useState(120);
  const [probeDepth, setProbeDepth] = useState(80);

  const maxPlotDepth = h + 25; 

  // --- Calculations ---
  const fieldData = useMemo(() => {
    const xAge = [], yDepth = [], zPlate = [], zHSCM = [];
    const maxAge = 256, ageStep = 1, depthStep = 1; 
    for (let a = 0; a <= maxAge; a += ageStep) xAge.push(a);
    for (let d = 0; d <= maxPlotDepth; d += depthStep) yDepth.push(d);
    for (let d = 0; d <= maxPlotDepth; d += depthStep) {
      const rowPlate = [], rowHSCM = [];
      for (let a = 0; a <= maxAge; a += ageStep) {
        rowPlate.push(d > h ? T1 : calculatePlate(T0, T1, kappa, h, a, d));
        rowHSCM.push(calculateHSCM(T0, T1, kappa, a, d));
      }
      zPlate.push(rowPlate); zHSCM.push(rowHSCM);
    }
    return { x: xAge, y: yDepth, zPlate, zHSCM };
  }, [T0, T1, kappa, h, maxPlotDepth]);

  const profileData = useMemo(() => {
    const depths = [], tempsPlate = [], tempsHSCM = [];
    for (let d = 0; d <= maxPlotDepth; d += 1) {
      depths.push(d);
      tempsPlate.push(d > h ? T1 : calculatePlate(T0, T1, kappa, h, age, d));
      tempsHSCM.push(calculateHSCM(T0, T1, kappa, age, d));
    }
    return { depths, tempsPlate, tempsHSCM };
  }, [T0, T1, kappa, h, age, maxPlotDepth]);

  const probeAnalysis = useMemo(() => {
    const xS = [], yS = [], zS = [];
    for (let a = 0; a <= 256; a += 8) xS.push(a);
    for (let d = 0; d <= maxPlotDepth; d += 4) yS.push(d);
    for (let d = 0; d <= maxPlotDepth; d += 4) {
      const row = [];
      for (let a = 0; a <= 256; a += 8) {
        row.push(calculatePlate(T0, T1, kappa, h, a, d));
      }
      zS.push(row);
    }
    const ageX = [], ageY = [];
    for (let a = 0; a <= 256; a += 2) {
      ageX.push(a); ageY.push(calculatePlate(T0, T1, kappa, h, a, probeDepth));
    }
    const depthY = [], depthX = [];
    for (let d = 0; d <= maxPlotDepth; d += 1) {
      depthY.push(d); depthX.push(calculatePlate(T0, T1, kappa, h, probeAge, d));
    }
    return { xS, yS, zS, ageX, ageY, depthX, depthY };
  }, [T0, T1, kappa, h, probeAge, probeDepth, maxPlotDepth]);

  const handleProbeClick = (data) => {
    if (data.points && data.points[0]) {
      const p = data.points[0];
      setProbeAge(Math.round(p.x));
      setProbeDepth(Math.round(p.y));
    }
  };

  // --- GLOBAL LAYOUT SETTINGS ---
  const commonLayout = {
    template: 'plotly_dark',
    paper_bgcolor: '#1E1E1E', plot_bgcolor: '#1E1E1E',
    font: { color: '#ffffff', size: 12 },
    margin: { l: 50, r: 40, t: 50, b: 40 },
    xaxis: { showgrid: true, gridcolor: '#666' }, // BRIGHTER GRID
    yaxis: { showgrid: true, gridcolor: '#666' }  // BRIGHTER GRID
  };

  return (
    <Container fluid style={{ backgroundColor: '#060510', minHeight: '100vh', padding: '20px' }}>
      <h1 className="text-center text-light mb-4">Lithosphere Cooling Models</h1>
      
      <Row className="mb-5">
        <Col md={3} className="mb-4">
          <Card className="shadow-sm h-100" style={{ backgroundColor: '#1E1E1E', borderColor: '#333' }}>
            <Card.Header className="text-warning font-weight-bold">Parameters</Card.Header>
            <Card.Body className="text-light">
              <Form.Group className="mb-3">
                <Form.Label>Model Display</Form.Label>
                <Form.Select value={modelType} onChange={e => setModelType(e.target.value)} style={{ backgroundColor: '#2b2b2b', color: 'white', border: '1px solid #444' }}>
                  <option value="Plate">Plate Model Only</option>
                  <option value="HSCM">HSCM Only</option>
                  <option value="Both">Compare Both (Plate Color + HSCM Lines)</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Age Slice: <strong>{age} Ma</strong></Form.Label>
                <Form.Range min={0} max={256} step={1} value={age} onChange={e => setAge(Number(e.target.value))} />
              </Form.Group>
              <hr className="border-secondary" />
              <Form.Group className="mb-3">
                <Form.Label>Surface (T0): {T0}°C</Form.Label>
                <Form.Range min={0} max={500} step={10} value={T0} onChange={e => setT0(Number(e.target.value))} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Mantle (T1): {T1}°C</Form.Label>
                <Form.Range min={800} max={1600} step={10} value={T1} onChange={e => setT1(Number(e.target.value))} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Diffusivity (κ): {kappa}</Form.Label>
                <Form.Range min={0.5} max={2.0} step={0.1} value={kappa} onChange={e => setKappa(Number(e.target.value))} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Thickness (h): {h} km</Form.Label>
                <Form.Range min={50} max={200} step={5} value={h} onChange={e => setH(Number(e.target.value))} disabled={modelType === 'HSCM'} />
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>

        <Col md={9}>
          <Row>
            <Col md={9} style={{ height: '620px', paddingRight: '5px' }}>
              <ResponsivePlot
                data={[
                  {
                    z: (modelType === 'HSCM' ? fieldData.zHSCM : fieldData.zPlate),
                    x: fieldData.x, y: fieldData.y,
                    type: 'contour', opacity: 0.9, colorscale: [[0, '#0a2aff'], [1, '#cf6c10']], showscale: false,
                    contours: { start: 100, end: T1 + 50, size: 200, showlabels: true, labelfont: { color: 'black' } }
                  },
                  ...(modelType === 'Both' ? [{
                    z: fieldData.zHSCM, x: fieldData.x, y: fieldData.y,
                    type: 'contour', showscale: false,
                    contours: { coloring: 'none', start: 100, end: T1, size: 200, showlabels: true, labelfont: { color: '#ffffff' } },
                    line: { color: '#ffffff', width: 1.5, dash: 'dot' }
                  }] : [])
                ]}
                layout={{
                  ...commonLayout,
                  title: { text: `Temperature Field`, font: { size: 16 } },
                  xaxis: { ...commonLayout.xaxis, title: { text: 'Age (Ma)' }, dtick: 20 },
                  yaxis: { ...commonLayout.yaxis, title: { text: 'Depth (km)' }, autorange: 'reversed', range: [maxPlotDepth, 0], dtick: 20 },
                  shapes: [{ type: 'line', x0: age, x1: age, y0: 0, y1: maxPlotDepth, line: { color: 'white', width: 2, dash: 'dash' } }]
                }}
              />
            </Col>

            <Col md={3} style={{ height: '620px', paddingLeft: '5px' }}>
              <ResponsivePlot 
                 data={[
                   ...(modelType !== 'HSCM' ? [{ x: profileData.tempsPlate, y: profileData.depths, type: 'scatter', mode: 'lines', line: { color: '#cf6c10', width: 3 }, name: 'Plate' }] : []),
                   ...(modelType !== 'Plate' ? [{ x: profileData.tempsHSCM, y: profileData.depths, type: 'scatter', mode: 'lines', line: { color: '#d8daeb', width: 3, dash: 'dash' }, name: 'HSCM' }] : [])
                 ]}
                 layout={{
                   ...commonLayout,
                   title: { text: `Geotherm`, font: { size: 16 } },
                   xaxis: { ...commonLayout.xaxis, title: { text: 'Temp (°C)' }, side: 'bottom', range: [0, T1 + 100], dtick: 400 },
                   yaxis: { ...commonLayout.yaxis, autorange: 'reversed', range: [maxPlotDepth, 0], dtick: 20 },
                   margin: { l: 30, r: 10, t: 100, b: 60 },
                   showlegend: modelType === 'Both',
                   legend: { x: 0.5, y: -0.1, xanchor: 'center', orientation: 'h' }
                 }}
              />
            </Col>
          </Row>
        </Col>
      </Row>

      <hr className="border-secondary my-5" />

      <h2 className="text-light text-center mb-4">Volumetric Probing Analysis</h2>
      <Row>
        <Col md={4} style={{ height: '450px' }}>
          <ResponsivePlot
            onPointClick={handleProbeClick}
            data={[{
              z: probeAnalysis.zS, x: probeAnalysis.xS, y: probeAnalysis.yS,
              type: 'surface', colorscale: [[0, '#0a2aff'], [1, '#cf6c10']], showscale: false,
              opacity: 0.7,
              contours: { x: { show: false }, y: { show: false }, z: { show: false } },
              hoverinfo: 'x+y+z'
            }]}
            layout={{
              ...commonLayout,
              title: { text: '3D Probing (Click Surface)', font: { size: 14 } },
              margin: { l: 0, r: 0, t: 30, b: 0 },
              scene: {
                xaxis: { title: 'Age (Ma)', gridcolor: '#666' }, 
                yaxis: { title: 'Depth (km)', gridcolor: '#666' }, 
                zaxis: { title: 'Temp (°C)', gridcolor: '#666' },
                camera: { eye: { x: 2, y: -2, z: 1.2 } }, 
                uirevision: 'true' 
              }
            }}
          />
        </Col>

        <Col md={4} style={{ height: '450px' }}>
          <ResponsivePlot
            data={[{ x: probeAnalysis.ageX, y: probeAnalysis.ageY, mode: 'lines', line: { color: '#cf6c10', width: 3 } }]}
            layout={{
              ...commonLayout,
              title: { text: `T Evolution @ ${probeDepth} km`, font: { size: 14 } },
              xaxis: { ...commonLayout.xaxis, title: { text: 'Age (Ma)' } },
              yaxis: { ...commonLayout.yaxis, title: { text: 'Temperature (°C)' } }
            }}
          />
        </Col>

        <Col md={4} style={{ height: '450px' }}>
          <ResponsivePlot
            data={[{ x: probeAnalysis.depthX, y: probeAnalysis.depthY, mode: 'lines', line: { color: '#0a2aff', width: 3 } }]}
            layout={{
              ...commonLayout,
              title: { text: `Geotherm @ ${probeAge} Ma`, font: { size: 14 } },
              xaxis: { ...commonLayout.xaxis, title: { text: 'Temperature (°C)' }, side: 'top' },
              yaxis: { ...commonLayout.yaxis, title: { text: 'Depth (km)' }, autorange: 'reversed' }
            }}
          />
        </Col>
      </Row>
      <div className="text-center mt-3">
        <Badge bg="secondary" style={{ fontSize: '1rem' }}>
          Probing Context: Age={probeAge} Ma | Depth={probeDepth} km
        </Badge>
      </div>
    </Container>
  );
};

export default PlateCooling;