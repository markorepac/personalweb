import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Container, Card, Form, Row, Col, Badge } from 'react-bootstrap';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-dist-min';

const Plot = createPlotlyComponent(Plotly);

// --- 1. RESPONSIVE HELPER ---
const ResponsivePlot = ({ data, layout, style }) => {
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
          config={{ displayModeBar: true, scrollZoom: true, displaylogo: false }}
          style={{ width: '100%', height: '100%' }}
        />
      )}
    </div>
  );
};

// --- 2. MAIN COMPONENT ---
const MLTask = () => {
  // Exploration State
  const [xAxis, setXAxis] = useState('GammaRay');
  const [yAxis, setYAxis] = useState('Density');
  const [zAxis, setZAxis] = useState('Resistivity');
  const [dataRange, setDataRange] = useState(1000);

  // ML State (KNN)
  const [knnNeighbors, setKnnNeighbors] = useState(5);
  const [knnWeights, setKnnWeights] = useState('uniform');
  const [knnPValue, setKnnPValue] = useState(2);

  // ML State (Decision Tree)
  const [dtreeDepth, setDtreeDepth] = useState(5);
  const [dtreeCrit, setDtreeCrit] = useState('gini');

  // History for the Metric Curves (Scatter lines+markers in your Dash code)
  const [history, setHistory] = useState([]);

  // Generate Synthetic Data for Exploration
  const explorationData = useMemo(() => {
    const data = [];
    const classes = ['Shale', 'Sandstone', 'Limestone', 'Coal'];
    const colors = ['#BEBEBE', '#FFFF00', '#0000FF', '#000000'];
    
    classes.forEach((label, i) => {
      for (let j = 0; j < 50; j++) {
        data.push({
          x: Math.random() * 150 + (i * 20),
          y: Math.random() * 1.5 + 1.2,
          z: Math.random() * 100,
          class: label,
          color: colors[i]
        });
      }
    });
    return data;
  }, []);

  // Update History when parameters change (Simulating update_ini3 from Dash)
  useEffect(() => {
    const newScore = {
      accuracy: 0.95 + (Math.random() * 0.04),
      precision: 0.93 + (Math.random() * 0.05),
      recall: 0.94 + (Math.random() * 0.04),
      params: `K:${knnNeighbors}, W:${knnWeights}`
    };
    setHistory(prev => [...prev.slice(-19), newScore]);
  }, [knnNeighbors, knnWeights, knnPValue]);

  const commonLayout = {
    template: 'plotly_dark',
    paper_bgcolor: '#1E1E1E', plot_bgcolor: '#1E1E1E',
    font: { color: '#ffffff', size: 11 },
    margin: { l: 40, r: 20, t: 40, b: 40 },
    xaxis: { gridcolor: '#444' }, yaxis: { gridcolor: '#444' }
  };

  return (
    <Container fluid style={{ backgroundColor: '#060510', minHeight: '100vh', padding: '20px' }}>
      <h2 className="text-center text-light mb-4">Machine Learning Task</h2>

      {/* SECTION 1: DATA EXPLORATION */}
      <h4 className="text-warning mb-3">Input Data Exploration</h4>
      <Row className="mb-5">
        <Col md={3}>
          <Card className="h-100" style={{ backgroundColor: '#1E1E1E', borderColor: '#333' }}>
            <Card.Body className="text-light">
              <h6>Exploration Parameters</h6>
              <Form.Label className="small">X Axis</Form.Label>
              <Form.Select className="mb-2 bg-secondary text-white border-0" value={xAxis} onChange={e => setXAxis(e.target.value)}>
                <option>GammaRay</option><option>Density</option><option>Resistivity</option>
              </Form.Select>
              <Form.Label className="small">Y Axis</Form.Label>
              <Form.Select className="mb-2 bg-secondary text-white border-0" value={yAxis} onChange={e => setYAxis(e.target.value)}>
                <option>GammaRay</option><option>Density</option><option>Resistivity</option>
              </Form.Select>
              <Form.Label className="small">Z Axis</Form.Label>
              <Form.Select className="mb-2 bg-secondary text-white border-0" value={zAxis} onChange={e => setZAxis(e.target.value)}>
                <option>GammaRay</option><option>Density</option><option>Resistivity</option>
              </Form.Select>
              <Form.Label className="small mt-2">Data Range: {dataRange}</Form.Label>
              <Form.Range min={100} max={10000} step={100} value={dataRange} onChange={e => setDataRange(e.target.value)} />
            </Card.Body>
          </Card>
        </Col>
        <Col md={5} style={{ height: '400px' }}>
          <ResponsivePlot 
            data={[{
              x: explorationData.map(d => d.x), y: explorationData.map(d => d.y),
              mode: 'markers', type: 'scatter', marker: { color: explorationData.map(d => d.color), size: 6, opacity: 0.7 }
            }]}
            layout={{ ...commonLayout, title: 'Data Points 2D', xaxis: { title: xAxis }, yaxis: { title: yAxis } }}
          />
        </Col>
        <Col md={4} style={{ height: '400px' }}>
          <ResponsivePlot 
            data={[{
              x: explorationData.map(d => d.x), y: explorationData.map(d => d.y), z: explorationData.map(d => d.z),
              mode: 'markers', type: 'scatter3d', marker: { color: explorationData.map(d => d.color), size: 3, opacity: 0.8 }
            }]}
            layout={{ ...commonLayout, title: 'Data Points 3D', scene: { xaxis: { title: xAxis }, yaxis: { title: yAxis }, zaxis: { title: zAxis } } }}
          />
        </Col>
      </Row>

      <hr className="border-secondary mb-5" />

      {/* SECTION 2: KNN EXPLORATION */}
      <h4 className="text-info mb-3">Preliminary Model Exploration: K-Nearest Neighbors</h4>
      <Row className="mb-5">
        <Col md={3}>
          <Card className="h-100" style={{ backgroundColor: '#1E1E1E', borderColor: '#333' }}>
            <Card.Body className="text-light">
              <Form.Label className="small">Weights</Form.Label>
              <Form.Select className="mb-3 bg-secondary text-white border-0" value={knnWeights} onChange={e => setKnnWeights(e.target.value)}>
                <option value="uniform">Uniform</option><option value="distance">Distance</option>
              </Form.Select>
              <Form.Label className="small">n_neighbors: {knnNeighbors}</Form.Label>
              <Form.Range min={1} max={50} value={knnNeighbors} onChange={e => setKnnNeighbors(e.target.value)} />
              <Form.Label className="small mt-2">p value: {knnPValue}</Form.Label>
              <Form.Range min={1} max={10} step={0.1} value={knnPValue} onChange={e => setKnnPValue(e.target.value)} />
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} style={{ height: '350px' }}>
          <ResponsivePlot 
            data={[{
              z: [[45, 2, 0, 0], [3, 38, 1, 0], [0, 1, 42, 2], [0, 0, 1, 50]],
              x: ['Shale', 'Sand', 'Lime', 'Coal'], y: ['Shale', 'Sand', 'Lime', 'Coal'],
              type: 'heatmap', colorscale: 'Viridis', showscale: false
            }]}
            layout={{ ...commonLayout, title: 'Confusion Matrix (KNN)', yaxis: { autorange: 'reversed' } }}
          />
        </Col>
        <Col md={2} style={{ height: '350px' }}>
          <ResponsivePlot 
            data={[{
              x: ['Acc', 'Prec', 'Rec', 'F1'], y: [0.005, 0.008, 0.004, 0.006], type: 'bar', marker: { color: 'cyan' }
            }]}
            layout={{ ...commonLayout, title: '1 - Score (Error)', yaxis: { range: [0, 0.01] } }}
          />
        </Col>
        <Col md={4} style={{ height: '350px' }}>
          <ResponsivePlot 
            data={[
              { x: history.map((_, i) => i), y: history.map(h => h.accuracy), name: 'Acc', mode: 'lines+markers' },
              { x: history.map((_, i) => i), y: history.map(h => h.precision), name: 'Prec', mode: 'lines+markers' }
            ]}
            layout={{ ...commonLayout, title: 'Historical Metric Scores', legend: { orientation: 'h', y: -0.2 } }}
          />
        </Col>
      </Row>

      {/* SECTION 3: DECISION TREE */}
      <h4 className="text-success mb-3">Preliminary Model Exploration: Decision Tree</h4>
      <Row>
        <Col md={3}>
          <Card className="h-100" style={{ backgroundColor: '#1E1E1E', borderColor: '#333' }}>
            <Card.Body className="text-light">
              <Form.Label className="small">Criterion</Form.Label>
              <Form.Select className="mb-3 bg-secondary text-white border-0" value={dtreeCrit} onChange={e => setDtreeCrit(e.target.value)}>
                <option value="gini">Gini</option><option value="entropy">Entropy</option>
              </Form.Select>
              <Form.Label className="small">max_depth: {dtreeDepth}</Form.Label>
              <Form.Range min={1} max={25} value={dtreeDepth} onChange={e => setDtreeDepth(e.target.value)} />
            </Card.Body>
          </Card>
        </Col>
        <Col md={9} style={{ height: '350px' }}>
          <ResponsivePlot 
            data={[{
              z: [[40, 5, 0, 0], [7, 34, 4, 0], [0, 2, 40, 3], [0, 0, 2, 48]],
              type: 'heatmap', colorscale: 'Electric'
            }]}
            layout={{ ...commonLayout, title: 'Decision Tree Performance Map' }}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default MLTask;