import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form } from 'react-bootstrap';
import createPlotlyComponent from 'react-plotly.js/factory';
import PlotlyFull from 'plotly.js-dist-min';
import Papa from 'papaparse';



const INFERNO_SCALE = [
  [0, '#000004'], [0.125, '#1f0948'], [0.25, '#520d6c'], 
  [0.375, '#81256c'], [0.5, '#ad3253'], [0.625, '#d34d32'], 
  [0.75, '#ec7a08'], [0.875, '#f6af12'], [1, '#fcffa4']
];
const MAGMA_SCALE = [
  [0, '#000004'],
  [0.1, '#140e36'],
  [0.2, '#3b0f70'],
  [0.3, '#641a80'],
  [0.4, '#8c2981'],
  [0.5, '#b73779'],
  [0.6, '#de4968'],
  [0.7, '#f76f5c'],
  [0.8, '#fe9f6d'],
  [0.9, '#fec98d'],
  [1, '#fcfdbf']
];

const PLASMA_SCALE = [
  [0, '#0d0887'],
  [0.1, '#41049d'],
  [0.2, '#6a00a8'],
  [0.3, '#8f0da4'],
  [0.4, '#b12a90'],
  [0.5, '#cc4778'],
  [0.6, '#e16462'],
  [0.7, '#f2844b'],
  [0.8, '#fca636'],
  [0.9, '#fccd27'],
  [1, '#f0f921']
];

// Helper function to interpolate color from a colorscale
const getColorFromScale = (value, colorscale) => {
  value = Math.max(0, Math.min(1, value));
  
  for (let i = 0; i < colorscale.length - 1; i++) {
    const [t1, color1] = colorscale[i];
    const [t2, color2] = colorscale[i + 1];
    
    if (value >= t1 && value <= t2) {
      if (t2 === t1) return color1;
      const t = (value - t1) / (t2 - t1);
      return t < 0.5 ? color1 : color2;
    }
  }
  return colorscale[colorscale.length - 1][1];
};

// Create the Plot component using the full distribution
const Plot = createPlotlyComponent(PlotlyFull);

const WR = () => {
  const [data, setData] = useState({
    major: [],
    trace: [],
    minerals: {},
  });
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState('Whole Rock');
  const [selectedX, setSelectedX] = useState('SiO2');
  const [selectedY, setSelectedY] = useState('MgO');
  const [selectedColor, setSelectedColor] = useState('Location');
  const [selectedSize, setSelectedSize] = useState('Mg#');
  const [selectedZ, setSelectedZ] = useState('Mg#');
  const [hoveredSample, setHoveredSample] = useState(null);
  const [availableColumns, setAvailableColumns] = useState([]);
  const [is3D, setIs3D] = useState(false);

  // TAS boundary coordinates
  const tas_x = [41, 41, 52.5, 47.4, 52.5, 57.6, 61, 53, 48.4, 53, 49.4, 45, 49.4, 45, 45, 41, 45, 45, 45, 52, 49.4, 52, 52, 52, 63, 57.6, 53, 57, 57, 57, 63, 63, 63, 69, 69, 69, 77.5];
  const tas_y = [0, 7, 14, 16.3, 14, 11.7, 13.5, 9.3, 11.5, 9.3, 7.3, 9.4, 7.3, 5, 3, 3, 3, 0, 5, 5, 7.3, 5, 0, 5, 7, 11.7, 9.3, 5.9, 0, 5.9, 7, 0, 7, 8, 13, 8, 0];

  const mineralFiles = {
    'Olivine': 'olivines.csv',
    'CPX': 'cpxs.csv',
    'OPX': 'opx.csv',
    'Apatite': 'apatites.csv',
    'Amphibole': 'amphiboles.csv',
    'Phlogopite': 'phlogos.csv',
    'Oxides': 'oxides.csv',
    'Plag': 'plag.csv',
    'Leucite': 'leucites.csv'
  };

  // Load all CSV files
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load major elements
        const majorRes = await fetch('/wr_data/Major_elements.csv');
        const majorText = await majorRes.text();
        const majorParsed = Papa.parse(majorText, { header: true, dynamicTyping: true });

        // Load trace elements
        const traceRes = await fetch('/wr_data/Trace_elements.csv');
        const traceText = await traceRes.text();
        const traceParsed = Papa.parse(traceText, { header: true, dynamicTyping: true });

        // Load mineral files
        const mineralsData = {};
        for (const [name, file] of Object.entries(mineralFiles)) {
          try {
            const res = await fetch(`/wr_data/${file}`);
            const text = await res.text();
            const parsed = Papa.parse(text, { header: true, dynamicTyping: true });
            if (parsed.data && parsed.data.length > 0) {
              mineralsData[name] = parsed.data;
            }
          } catch (e) {
            console.warn(`Failed to load ${file}:`, e);
          }
        }

        setData({
          major: majorParsed.data.filter(row => row.Sample),
          trace: traceParsed.data.filter(row => row.Sample),
          minerals: mineralsData,
        });

        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Update available columns when source changes
  useEffect(() => {
    if (data.major.length === 0) return;
    const currentData = data.major;
    if (currentData.length > 0) {
      const cols = Object.keys(currentData[0]).filter(col => col && col !== '');
      setAvailableColumns(cols);
      const defaultX = cols.includes('SiO2') ? 'SiO2' : cols[0];
      const defaultY = cols.includes('MgO') ? 'MgO' : cols[1];
      const defaultColor = cols.includes('Location') ? 'Location' : cols[0];
      const defaultSize = cols.includes('Mg#') ? 'Mg#' : cols[0];
      setSelectedX(defaultX);
      setSelectedY(defaultY);
      setSelectedColor(defaultColor);
      setSelectedSize(defaultSize);
    }
  }, [data]);

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <h3>Loading geochemical data...</h3>
      </Container>
    );
  }

  const currentDataset = data.major;

  const traceT = {};
  data.trace.forEach(row => {
    const sample = row.Sample;
    const rowCopy = { ...row };
    delete rowCopy.Sample;
    traceT[sample] = rowCopy;
  });

  // Create mapping for Location to colors
  const uniqueLocations = [...new Set(data.major.map(d => d.Location).filter(Boolean))];
  const colorMap = {
    ...Object.fromEntries(
      uniqueLocations.map((loc, i) => [
        loc,
        ['#636EFA', '#EF553B', '#00CC96', '#AB63FA', '#FFA15A', '#19D3F3', '#FF6692', '#B6E880'][i % 8]
      ])
    )
  };

  // TAS Figure
  const tasData = [
    ...uniqueLocations.map(location => ({
      x: data.major.filter(d => d.Location === location).map(d => d.SiO2),
      y: data.major.filter(d => d.Location === location).map(d => d['Na+K']),
      mode: 'markers',
      type: 'scatter',
      marker: {
        size: 12,
        opacity: 0.8,
        line: { width: 1, color: 'white' },
        color: colorMap[location],
      },
      text: data.major.filter(d => d.Location === location).map(d => d.Sample),
      hovertemplate: '<b>%{text}</b><br>SiO2: %{x:.2f}<br>Na+K: %{y:.2f}<br>Location: ' + location + '<extra></extra>',
      name: location,
    })),
    {
      x: tas_x,
      y: tas_y,
      mode: 'lines',
      line: { color: 'rgba(255,255,255,0.4)', width: 1.5 },
      hoverinfo: 'skip',
      showlegend: false,
      name: 'TAS Boundary',
    }
  ];

  // Spider Figure
  // Get consistent element order from the first sample
  const firstSampleElements = Object.keys(traceT[Object.keys(traceT)[0]] || {}).filter(el => 
    el && el !== 'Sample' && el !== 'Location' && el !== 'type'
  );
  
  const spiderTraces = [];

  Object.keys(traceT).forEach(sample => {
    const rawValues = firstSampleElements.map(el => {
      const val = traceT[sample][el];
      return typeof val === 'number' ? val : null;
    });
    const normalizedValues = firstSampleElements.map(el => {
      const val = traceT[sample][el];
      return typeof val === 'number' ? Math.max(val, 0.001) : 0.001;
    });

    spiderTraces.push({
      x: firstSampleElements,
      y: normalizedValues,
      customdata: rawValues,
      mode: 'lines',
      line: { color: 'rgba(150, 150, 150, 0.2)', width: 1.5 },
      hovertemplate: '<b>' + sample + '</b><br>Element: %{x}<br>Raw: %{customdata:.4e}<br>Normalized: %{y:.2e}<extra></extra>',
      showlegend: false,
      name: sample,
    });
  });

  if (hoveredSample && traceT[hoveredSample]) {
    // Get Rb values for all samples to calculate min/max
    const allRbValues = Object.keys(traceT).map(sample => {
      const rbVal = traceT[sample]['Rb'];
      return typeof rbVal === 'number' ? rbVal : 0;
    }).filter(v => v > 0);
    
    const minRb = Math.min(...allRbValues);
    const maxRb = Math.max(...allRbValues);
    const rbRange = maxRb - minRb || 1;
    
    const rbValue = traceT[hoveredSample]['Rb'];
    const normalizedRb = typeof rbValue === 'number'
      ? (rbValue - minRb) / rbRange
      : 0;
    
    const rbColor = getColorFromScale(normalizedRb, PLASMA_SCALE);
    
    const rawValues = firstSampleElements.map(el => {
      const val = traceT[hoveredSample][el];
      return val;
    });
    const normalizedValues = firstSampleElements.map(el => {
      const val = traceT[hoveredSample][el];
      return typeof val === 'number' ? Math.max(val, 0.001) : 0.001;
    });

    spiderTraces.push({
      x: firstSampleElements,
      y: normalizedValues,
      customdata: rawValues,
      mode: 'lines',
      line: { color: rbColor, width: 3.5 },
      name: hoveredSample,
      hovertemplate: '<b>' + hoveredSample + '</b><br>Element: %{x}<br>Raw: %{customdata:.4e}<br>Normalized: %{y:.2e}<extra></extra>',
    });
  }

  // Determine if color variable is categorical or numeric
  const safeSelectedX = availableColumns.includes(selectedX) ? selectedX : availableColumns[0];
  const safeSelectedY = availableColumns.includes(selectedY) ? selectedY : (availableColumns[1] || availableColumns[0]);
  const safeSelectedColor = availableColumns.includes(selectedColor) ? selectedColor : availableColumns[0];
  const safeSelectedSize = availableColumns.includes(selectedSize) ? selectedSize : availableColumns[0];
  const safeSelectedZ = availableColumns.includes(selectedZ) ? selectedZ : availableColumns[0];

  // Normalize size values for better marker sizing
  const sizeValues = currentDataset.map(d => {
    const val = d[safeSelectedSize];
    return typeof val === 'number' ? val : 0;
  }).filter(v => v !== 0 && !isNaN(v));
  
  const minSize = Math.min(...sizeValues);
  const maxSize = Math.max(...sizeValues);
  const sizeRange = maxSize - minSize || 1;

  const getSizeForValue = (val) => {
    if (typeof val !== 'number' || isNaN(val)) return 8;
    const normalized = (val - minSize) / sizeRange;
    return 5 + normalized * 20; // Scale between 5 and 25
  };

  const colorColumn = currentDataset.map(d => d[safeSelectedColor]);
  const isColorCategorical = colorColumn.some(v => typeof v === 'string');

  // Variation Figure
  const variationData = is3D
    ? isColorCategorical
      ? Array.from(new Set(colorColumn.filter(Boolean))).map((category, idx) => {
          const filteredData = currentDataset.filter(d => d[safeSelectedColor] === category);
          return {
            x: filteredData.map(d => d[safeSelectedX]),
            y: filteredData.map(d => d[safeSelectedY]),
            z: filteredData.map(d => d[safeSelectedZ]),
            customdata: filteredData.map(d => [d[safeSelectedColor], d[safeSelectedSize]]),
            mode: 'markers',
            type: 'scatter3d',
            marker: {
              size: filteredData.map(d => getSizeForValue(d[safeSelectedSize])/2),
              opacity: 0.8,
              color: ['#636EFA', '#EF553B', '#00CC96', '#AB63FA', '#FFA15A', '#19D3F3', '#FF6692', '#B6E880'][idx % 8],
              line: { width: 0 },
            },
            text: filteredData.map(d => d.Sample),
            hovertemplate: '<b>%{text}</b><br>' + safeSelectedX + ': %{x:.2f}<br>' + safeSelectedY + ': %{y:.2f}<br>' + safeSelectedZ + ': %{z:.2f}<br>' + safeSelectedColor + ': %{customdata[0]}<br>' + safeSelectedSize + ': %{customdata[1]:.2f}<extra></extra>',
            name: String(category),
          };
        })
      : [{
          x: currentDataset.map(d => d[safeSelectedX]),
          y: currentDataset.map(d => d[safeSelectedY]),
          z: currentDataset.map(d => d[safeSelectedZ]),
          customdata: currentDataset.map(d => [d[safeSelectedColor], d[safeSelectedSize]]),
          mode: 'markers',
          type: 'scatter3d',
          marker: {
            size: currentDataset.map(d => getSizeForValue(d[safeSelectedSize])),
            opacity: 0.8,
            color: colorColumn.map(Number),
            colorscale: PLASMA_SCALE,
            showscale: true,
            colorbar: {
              title: safeSelectedColor,
              thickness: 15,
              len: 0.7,
            },
            line: { width: 0 },
          },
          text: currentDataset.map(d => d.Sample),
          hovertemplate: '<b>%{text}</b><br>' + safeSelectedX + ': %{x:.2f}<br>' + safeSelectedY + ': %{y:.2f}<br>' + safeSelectedZ + ': %{z:.2f}<br>' + safeSelectedColor + ': %{customdata[0]:.2f}<br>' + safeSelectedSize + ': %{customdata[1]:.2f}<extra></extra>',
          name: 'Data',
        }]
    : isColorCategorical
      ? [
          // Categorical coloring - create separate traces for each category
          ...Array.from(new Set(colorColumn.filter(Boolean))).map((category, idx) => {
            const filteredData = currentDataset.filter(d => d[safeSelectedColor] === category);
            return {
              x: filteredData.map(d => d[safeSelectedX]),
              y: filteredData.map(d => d[safeSelectedY]),
              customdata: filteredData.map(d => [d[safeSelectedColor], d[safeSelectedSize]]),
              mode: 'markers',
              type: 'scatter',
              marker: {
                size: filteredData.map(d => getSizeForValue(d[safeSelectedSize])),
                opacity: 0.7,
                color: ['#636EFA', '#EF553B', '#00CC96', '#AB63FA', '#FFA15A', '#19D3F3', '#FF6692', '#B6E880'][idx % 8],
                line: { width: 0 },
              },
              text: filteredData.map(d => d.Sample),
              hovertemplate: '<b>%{text}</b><br>' + safeSelectedX + ': %{x:.2f}<br>' + safeSelectedY + ': %{y:.2f}<br>' + safeSelectedColor + ': %{customdata[0]}<br>' + safeSelectedSize + ': %{customdata[1]:.2f}<extra></extra>',
              name: String(category),
            };
          })
        ]
    : [
        // Numeric coloring - use colorscale
        {
          x: currentDataset.map(d => d[safeSelectedX]),
          y: currentDataset.map(d => d[safeSelectedY]),
          customdata: currentDataset.map(d => [d[safeSelectedColor], d[safeSelectedSize]]),
          mode: 'markers',
          type: 'scatter',
          marker: {
            size: currentDataset.map(d => getSizeForValue(d[safeSelectedSize])),
            opacity: 0.7,
            color: colorColumn.map(Number),
            autocolorscale: false,
            colorscale: PLASMA_SCALE,
            showscale: true,
            colorbar: {
              title: safeSelectedColor,
              thickness: 15,
              len: 0.7,
            },
            line: { width: 0 },
          },
          text: currentDataset.map(d => d.Sample),
          hovertemplate: '<b>%{text}</b><br>' + safeSelectedX + ': %{x:.2f}<br>' + safeSelectedY + ': %{y:.2f}<br>' + safeSelectedColor + ': %{customdata[0]:.2f}<br>' + safeSelectedSize + ': %{customdata[1]:.2f}<extra></extra>',
          name: 'Data',
        }
      ];

  const commonLayout = {
    template: 'plotly_dark',
    paper_bgcolor: '#0a0810',
    plot_bgcolor: '#0a0810',
    font: { color: '#fff' },
    margin: { l: 60, r: 40, t: 40, b: 60 },
    hovermode: 'closest',
  };

  return (
    <Container fluid className="py-4">
      <Row>
        <Col xs={12}>
          <h2 className="text-center mb-4">Geochemical Research Suite</h2>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={6}>
          <Card className="h-100" style={{ backgroundColor: '#1a1a1a', borderColor: '#cf6c10' }}>
            <Card.Header style={{ backgroundColor: '#0a0810', borderColor: '#cf6c10', color: '#f5ad42', fontWeight: '600' }}>
              Total Alkali vs Silica (TAS)
            </Card.Header>
            <Card.Body>
              <Plot
                data={tasData}
                layout={{
                  ...commonLayout,
                  xaxis: { title: { text: 'SiO2 (wt%)', font: { color: '#ffffff', size: 14 } } },
                  yaxis: { title: { text: 'Na2O + K2O (wt%)', font: { color: '#ffffff', size: 14 } } },
                  height: 430,
                }}
                onHover={(data) => {
                  if (data.points && data.points[0]) {
                    setHoveredSample(data.points[0].text);
                  }
                }}
                onUnhover={() => setHoveredSample(null)}
                style={{ width: '100%' }}
              />
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="h-100" style={{ backgroundColor: '#1a1a1a', borderColor: '#cf6c10' }}>
            <Card.Header style={{ backgroundColor: '#0a0810', borderColor: '#cf6c10', color: '#f5ad42', fontWeight: '600' }}>
              Trace Elements
            </Card.Header>
            <Card.Body>
              <Plot
                data={spiderTraces}
                layout={{
                  ...commonLayout,
                  yaxis: { type: 'log', title: { text: 'Normalized PM', font: { color: '#ffffff', size: 14 } } },
                  xaxis: { type: 'category', title: { text: 'Element', font: { color: '#ffffff', size: 14 } } },
                  height: 430,
                  showlegend: false,
                }}
                onHover={(data) => {
                  if (data.points && data.points[0] && data.points[0].fullData) {
                    const traceName = data.points[0].fullData.name;
                    setHoveredSample(traceName);
                  }
                }}
                onUnhover={() => setHoveredSample(null)}
                style={{ width: '100%' }}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={3}>
          <Card className="h-100" style={{ backgroundColor: '#1a1a1a', borderColor: '#cf6c10' }}>
            <Card.Header style={{ backgroundColor: '#0a0810', borderColor: '#cf6c10', color: '#f5ad42', fontWeight: '600' }}>
              Variation Settings
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label style={{ color: '#ccc' }}>Data Source</Form.Label>
                <Form.Select
                  value={selectedSource}
                  disabled
                  style={{ backgroundColor: '#222', color: '#fff', borderColor: '#cf6c10' }}
                >
                  <option>Whole Rock</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label style={{ color: '#ccc' }}>X Axis</Form.Label>
                <Form.Select
                  value={selectedX}
                  onChange={(e) => setSelectedX(e.target.value)}
                  style={{ backgroundColor: '#222', color: '#fff', borderColor: '#cf6c10' }}
                >
                  {availableColumns.map(col => (
                    <option key={col}>{col}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label style={{ color: '#ccc' }}>Y Axis</Form.Label>
                <Form.Select
                  value={selectedY}
                  onChange={(e) => setSelectedY(e.target.value)}
                  style={{ backgroundColor: '#222', color: '#fff', borderColor: '#cf6c10' }}
                >
                  {availableColumns.map(col => (
                    <option key={col}>{col}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label style={{ color: '#ccc' }}>Color Variable</Form.Label>
                <Form.Select
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  style={{ backgroundColor: '#222', color: '#fff', borderColor: '#cf6c10' }}
                >
                  {availableColumns.map(col => (
                    <option key={col}>{col}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label style={{ color: '#ccc' }}>Size Variable</Form.Label>
                <Form.Select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  style={{ backgroundColor: '#222', color: '#fff', borderColor: '#cf6c10' }}
                >
                  {availableColumns.map(col => (
                    <option key={col}>{col}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mt-3">
                <Form.Check
                  type="switch"
                  label="3D"
                  checked={is3D}
                  onChange={(e) => setIs3D(e.target.checked)}
                  style={{ color: '#fff' }}
                />
              </Form.Group>

              {is3D && (
                <Form.Group className="mt-3">
                  <Form.Label style={{ color: '#ccc' }}>Z Axis</Form.Label>
                  <Form.Select
                    value={selectedZ}
                    onChange={(e) => setSelectedZ(e.target.value)}
                    style={{ backgroundColor: '#222', color: '#fff', borderColor: '#cf6c10' }}
                  >
                    {availableColumns.map(col => (
                      <option key={col}>{col}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={9}>
          <Card className="h-100" style={{ backgroundColor: '#1a1a1a', borderColor: '#cf6c10' }}>
            <Card.Header style={{ backgroundColor: '#0a0810', borderColor: '#cf6c10', color: '#f5ad42', fontWeight: '600' }}>
              Variation Diagram
            </Card.Header>
            <Card.Body>
              <Plot
                data={variationData}
                layout={is3D ? {
                  ...commonLayout,
                  scene: {
                    xaxis: { title: { text: safeSelectedX, font: { color: '#ffffff', size: 12 } } },
                    yaxis: { title: { text: safeSelectedY, font: { color: '#ffffff', size: 12 } } },
                    zaxis: { title: { text: safeSelectedZ, font: { color: '#ffffff', size: 12 } } },
                  },
                  height: 430,
                } : {
                  ...commonLayout,
                  xaxis: { title: { text: safeSelectedX, font: { color: '#ffffff', size: 14 } } },
                  yaxis: { title: { text: safeSelectedY, font: { color: '#ffffff', size: 14 } } },
                  height: 430,
                }}
                style={{ width: '100%' }}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default WR;