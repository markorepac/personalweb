import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, Form, Spinner } from 'react-bootstrap';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-dist-min';

const Plot = createPlotlyComponent(Plotly);

// --- HELPER: ResponsivePlot ---
const ResponsivePlot = ({ data, layout, config, style }) => {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setSize({ width, height });
        }
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden', ...style }}>
      {size.width > 0 && (
        <Plot
          data={data}
          layout={{
            ...layout,
            width: size.width,
            height: size.height,
            autosize: false
          }}
          config={config}
          style={{ width: '100%', height: '100%' }}
        />
      )}
    </div>
  );
};

const CroGisApp = () => {
  const [roadDist, setRoadDist] = useState(500);
  const [roadData, setRoadData] = useState(null);
  const [roadLoading, setRoadLoading] = useState(true);

  const [portDist, setPortDist] = useState(20000);
  const [portData, setPortData] = useState(null);
  const [portLoading, setPortLoading] = useState(true);

  const [baseRoads, setBaseRoads] = useState(null);
  const [baseSettlements, setBaseSettlements] = useState(null);
  const [basePorts, setBasePorts] = useState(null);

  const mapCenter = { lat: 44.5, lon: 16.0 };
  const defaultZoom = 6;

  // --- Fetch Static Data ---
  useEffect(() => {
    fetch('/cro_gis_data/static/roads_base.json').then(r=>r.json()).then(setBaseRoads).catch(console.warn);
    fetch('/cro_gis_data/static/settlements_base.json').then(r=>r.json()).then(setBaseSettlements).catch(console.warn);
    fetch('/cro_gis_data/static/ports_base.json').then(r=>r.json()).then(setBasePorts).catch(console.warn);
  }, []);

  // --- Fetch Dynamic Data ---
  useEffect(() => {
    setRoadLoading(true);
    fetch(`/cro_gis_data/roads/roads_${roadDist}.json`)
      .then(r=>r.json()).then(d => { setRoadData(d); setRoadLoading(false); })
      .catch(e => { console.error(e); setRoadLoading(false); });
  }, [roadDist]);

  useEffect(() => {
    setPortLoading(true);
    fetch(`/cro_gis_data/ports/ports_${portDist}.json`)
      .then(r=>r.json()).then(d => { setPortData(d); setPortLoading(false); })
      .catch(e => { console.error(e); setPortLoading(false); });
  }, [portDist]);

  // --- Plot Configuration ---
  const commonLayout = {
    template: 'plotly_dark',
    paper_bgcolor: '#1E1E1E',
    plot_bgcolor: '#1E1E1E',
    font: { color: '#ffffff' },
    margin: { l: 0, r: 0, t: 0, b: 0 },
    showlegend: true,
    legend: { x: 0.02, y: 0.98, bgcolor: 'rgba(0,0,0,0.5)' },
    mapbox: {
      style: "carto-darkmatter",
      center: mapCenter,
      zoom: defaultZoom,
    },
    uirevision: 'donotreset',
  };

  const mapConfig = { 
    displayModeBar: true, // Enables the toolbar
    scrollZoom: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['select2d', 'lasso2d'] // Optional clean up
  };

  const chartConfig = { displayModeBar: false };
  const chartLayout = { ...commonLayout, margin: {l:40, r:20, t:40, b:30}, mapbox: undefined, showlegend: false };

  return (
    <Container fluid style={{ backgroundColor: '#060510', minHeight: '100vh', padding: '20px' }}>

      {/* --- ROADS SECTION --- */}
      <Card className="mb-5" style={{ backgroundColor: '#1E1E1E', borderColor: '#333' }}>
        <Card.Body>
          <h2 className="text-light">Settlement Population Near Major Roads</h2>
          <p style={{ color: '#f5ad42', fontWeight: 600 }}>Use the slider to change the buffer distance (in meters) around the roads.</p>
          <p style={{ color: '#fff', fontWeight: 500 }}>Buffer distance: <strong>{roadDist} m</strong></p>
          <Form.Range 
            min={0} 
            max={10000} 
            step={100} 
            value={roadDist} 
            onChange={(e) => setRoadDist(Number(e.target.value))} 
            className="mb-4" 
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '-8px', marginBottom: '16px', fontWeight: 600, color: '#f5ad42', fontSize: '1rem' }}>
          </div>
          

          {/* LAYOUT FIX: Flex container handles gap automatically */}
          <div style={{ display: 'flex', flexDirection: 'row', height: '70vh', gap: '15px', overflow: 'hidden' }}>
            
            {/* MAP: flex: 2 (Takes 2/3 of available space) */}
            <div style={{ flex: 2, minWidth: 0, position: 'relative', borderRight: '1px solid #333' }}>
              {roadLoading ? <Spinner animation="border" variant="primary" className="m-5" /> : (
                <ResponsivePlot
                  config={mapConfig}
                  data={[
                    ...(baseRoads ? [{ type: "scattermapbox", mode: "lines", lat: [], name: "Base Roads", hoverinfo: "skip" }] : []),
                    ...(baseSettlements ? [{ 
                        type: 'scattermapbox', mode: 'markers', 
                        lat: baseSettlements.lat, lon: baseSettlements.lon, 
                        marker: { size: 3, color: '#7f7f7f', opacity: 0.5 }, 
                        name: 'All Settlements', hoverinfo: 'none' 
                    }] : []),
                    
                    // Selected Settlements (Green)
                    ...(roadData?.selected_points ? [{
                      type: 'scattermapbox',
                      mode: 'markers',
                      lat: roadData.selected_points.lat,
                      lon: roadData.selected_points.lon,
                      text: roadData.selected_points.names, // Name on hover
                      marker: { size: 5, color: '#cf6c10', opacity: 1 }, 
                      name: 'Selected',
                      hoverinfo: 'text'
                    }] : []),

                    { type: 'choroplethmapbox', geojson: roadData?.geojson, locations: [0], z: [1], colorscale: [[0, 'rgba(10,42,255,0.3)'], [1, 'rgba(10,42,255,0.3)']], showscale: false, marker: { line: { width: 2, color: '#0a2aff' } }, name: 'Buffer', hoverinfo: 'skip' },
                  ]}
                  layout={{
                    ...commonLayout,
                    title: 'Road Buffer Zone',
                    mapbox: { ...commonLayout.mapbox, layers: baseRoads ? [{ source: baseRoads, type: "line", color: "#444", opacity: 0.5 }] : [] }
                  }}
                />
              )}
            </div>

            {/* CHARTS: flex: 1 (Takes 1/3 of available space) */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ flex: 1, minHeight: 0 }}>
                {roadData && roadData.stats && <ResponsivePlot config={chartConfig} data={[{ x: ['Inside', 'Outside'], y: [roadData.stats.pop_in_buffer, roadData.stats.pop_total - roadData.stats.pop_in_buffer], type: 'bar', marker: { color: ['#cf6c10', '#0a2aff'] }, name: 'Population' }]} layout={{
                  ...chartLayout,
                  title: 'Data Summary',
                  xaxis: { title: 'Location', tickvals: ['Inside', 'Outside'], ticktext: ['Inside', 'Outside'], color: '#fff' },
                  yaxis: { title: 'Population', color: '#fff' },
                  paper_bgcolor: '#060510',
                  plot_bgcolor: '#060510',
                  showlegend: false,
                  annotations: [{
                    text: 'Population',
                    x: 0.5,
                    y: 1.08,
                    xref: 'paper',
                    yref: 'paper',
                    showarrow: false,
                    font: { color: '#fff', size: 16 }
                  }]
                }} />}
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                {roadData && roadData.stats && <ResponsivePlot config={chartConfig} data={[{ x: ['Inside', 'Outside'], y: [roadData.stats.settlements_in_buffer, roadData.stats.settlements_total - roadData.stats.settlements_in_buffer], type: 'bar', marker: { color: ['#cf6c10', '#0a2aff'] }, name: 'Settlements' }]} layout={{
                  ...chartLayout,
                  title: 'Data Summary',
                  xaxis: { title: 'Location', tickvals: ['Inside', 'Outside'], ticktext: ['Inside', 'Outside'], color: '#fff' },
                  yaxis: { title: 'Number of Settlements', color: '#fff' },
                  paper_bgcolor: '#060510',
                  plot_bgcolor: '#060510',
                  showlegend: false,
                  annotations: [{
                    text: 'Number of Settlements',
                    x: 0.5,
                    y: 1.08,
                    xref: 'paper',
                    yref: 'paper',
                    showarrow: false,
                    font: { color: '#fff', size: 16 }
                  }]
                }} />}
              </div>
            </div>
          </div>
          <div className="mt-2 text-center text-light">{roadData && roadData.stats && <span>Pop: {roadData.stats.pop_in_buffer.toLocaleString()}</span>}</div>
        </Card.Body>
      </Card>

      {/* --- PORTS SECTION --- */}
      <Card className="mb-5" style={{ backgroundColor: '#1E1E1E', borderColor: '#333' }}>
        <Card.Body>
          <h2 className="text-light">Ports Near Large Settlements</h2>
          <p style={{ color: '#f5ad42', fontWeight: 600 }}>Use the slider to change the buffer distance (in meters) from settlements with &gt;10,000 inhabitants.</p>
          <p style={{ color: '#fff', fontWeight: 500 }}>Buffer distance: <strong>{(portDist/1000).toFixed(1)} km</strong></p>
          <Form.Range 
            min={0} 
            max={50000} 
            step={1000} 
            value={portDist} 
            onChange={(e) => setPortDist(Number(e.target.value))} 
            className="mb-4" 
            marks={{0: '0', 10000: '10,000', 20000: '20,000', 30000: '30,000', 40000: '40,000', 50000: '50,000'}} 
            tooltip={{ placement: 'bottom', alwaysVisible: true }} 
          />

          {/* LAYOUT FIX */}
          <div style={{ display: 'flex', flexDirection: 'row', height: '70vh', gap: '15px', overflow: 'hidden' }}>
            <div style={{ flex: 2, minWidth: 0, position: 'relative', borderRight: '1px solid #333' }}>
              {portLoading ? <Spinner animation="border" variant="danger" className="m-5" /> : (
                <ResponsivePlot
                  config={mapConfig}
                  data={[
                    ...(basePorts ? [{ type: 'scattermapbox', mode: 'markers', lat: basePorts.lat, lon: basePorts.lon, marker: { size: 4, color: '#555', opacity: 0.5 }, name: 'All Ports', hoverinfo: 'none' }] : []),
                    
                    // Selected Ports
                    ...(portData?.selected_points ? [{
                      type: 'scattermapbox', mode: 'markers',
                      lat: portData.selected_points.lat,
                      lon: portData.selected_points.lon,
                      text: portData.selected_points.names, // Name on hover
                      marker: { size: 7, color: '#0a2aff', opacity: 1 }, 
                      name: 'Selected Ports', hoverinfo: 'text'
                    }] : []),

                    { type: 'choroplethmapbox', geojson: portData?.geojson, locations: [0], z: [1], colorscale: [[0, 'rgba(255, 0, 100, 0.4)'], [1, 'rgba(255, 0, 100, 0.4)']], showscale: false, marker: { line: { width: 1, color: 'magenta' } }, name: 'Buffer', hoverinfo: 'skip' },
                                      { type: 'choroplethmapbox', geojson: portData?.geojson, locations: [0], z: [1], colorscale: [[0, 'rgba(255,220,40,0.3)'], [1, 'rgba(255,220,40,0.3)']], showscale: false, marker: { line: { width: 1, color: '#ffd828' } }, name: 'Buffer', hoverinfo: 'skip' },
                  ]}
                  layout={{ ...commonLayout, title: 'Settlement Buffer Zone' }}
                />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                {portData && portData.stats && <ResponsivePlot config={chartConfig} data={[{ x: ['Inside', 'Outside'], y: [portData.stats.ports_in_buffer, portData.stats.ports_total - portData.stats.ports_in_buffer], type: 'bar', marker: { color: ['#cf6c10', '#0a2aff'] }, name: 'Ports' }]} layout={{
                  ...chartLayout,
                  title: 'Ports Summary',
                  xaxis: { title: 'Location', tickvals: ['Inside', 'Outside'], ticktext: ['Inside', 'Outside'], color: '#fff' },
                  yaxis: { title: 'Ports Count', color: '#fff' },
                  paper_bgcolor: '#060510',
                  plot_bgcolor: '#060510',
                  showlegend: false,
                  annotations: [{
                    text: 'Ports Count',
                    x: 0.5,
                    y: 1.08,
                    xref: 'paper',
                    yref: 'paper',
                    showarrow: false,
                    font: { color: '#fff', size: 16 }
                  }]
                }} />}
            </div>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CroGisApp;