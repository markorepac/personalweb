import React, { useState } from 'react';
import SimulationVideoPlayer from '../components/SimulationVideoPlayer';
import { Container, Row, Col, Card } from 'react-bootstrap';

// simple interactive histogram component
const Histogram = () => {
  const count = 24;
  // Baseline Gaussian distribution for bar heights
  const gaussian = (x, mu, sigma) => {
    return Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
  };
  const mu = (count - 1) / 2;
  const sigma = count / 8; // narrower for lower tails
  // Initial heights: lower amplitude, more random noise
  const initial = Array.from({ length: count }, (_, i) =>
    80 * gaussian(i, mu, sigma) + 10 + (Math.random() - 0.5) * 20
  );
  const [heights, setHeights] = useState(initial);
  const lastIdx = React.useRef(null);

  // Randomize bar heights every 5 seconds: more noise on top of lower baseline
  React.useEffect(() => {
    const interval = setInterval(() => {
      setHeights((hs) =>
        hs.map((_, i) =>
          80 * gaussian(i, mu, sigma) + 10 + (Math.random() - 0.5) * 20
        )
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Gradient function for bar outline (reverse: blue for low, orange for high)
  const getBarOutlineColor = (h) => {
    // h is 0-100
    const norm = Math.min(h / 100, 1);
    // Reverse: from strong blue (#0a2aff) to orange (#cf6c10)
    const r = Math.round(10 + (207 - 10) * norm);
    const g = Math.round(42 + (108 - 42) * norm);
    const b = Math.round(255 + (16 - 255) * norm);
    return `rgb(${r},${g},${b})`;
  };

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const idx = Math.floor((x / rect.width) * count);
    if (idx < 0 || idx >= count) return;

    const percent = 1 - Math.min(Math.max(y / rect.height, 0), 1);
    const newHeight = percent * 100;

    setHeights((hs) =>
      hs.map((h, i) => (i === idx ? newHeight : h))
    );
    lastIdx.current = idx;
  };

  const handleLeave = () => {
    lastIdx.current = null;
  };

  return (
    <div
      className="histogram"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {heights.map((h, idx) => {
        const style = {
          height: `${h}%`,
          borderLeft: `2px solid ${getBarOutlineColor(h)}`,
          borderRight: `2px solid ${getBarOutlineColor(h)}`,
          borderTop: `2px solid ${getBarOutlineColor(h)}`,
        };
        return <div key={idx} className="bar" style={style} />;
      })}
    </div>
  );
};

// CSS scatter plot component
const CssScatter = () => {
  const count = 100;
  const R = 10; // radius in percent units
  const [points, setPoints] = useState(
    Array.from({ length: count }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      id: i,
    }))
  );

  // Generate grid cells for grid lines
  const gridCells = [];
  for (let i = 0; i < 100; i++) {
    gridCells.push(<div key={i} className="grid-cell" />);
  }

  // Randomize points every 5 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setPoints((pts) =>
        pts.map((pt) => ({
          ...pt,
          x: Math.random() * 100,
          y: Math.random() * 100,
        }))
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Mouse interaction: move points within radius R closer to pointer
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
    const mouseY = (1 - (e.clientY - rect.top) / rect.height) * 100;
    setPoints((pts) =>
      pts.map((pt) => {
        const dx = pt.x - mouseX;
        const dy = pt.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < R) {
          // Move closer: interpolate 40% toward mouse
          return {
            ...pt,
            x: pt.x - dx * 0.4,
            y: pt.y - dy * 0.4,
          };
        }
        return pt;
      })
    );
  };

  // Color gradient based on distance from origin (bottom-left)
  const getColor = (x, y) => {
    // Distance from (0,0) in percent units
    const dist = Math.sqrt(x * x + y * y);
    // Normalize to [0,1] (max possible is ~141)
    const norm = Math.min(dist / 141, 1);
    // Gradient: from orange (#cf6c10) to strong blue (#0a2aff)
    const r = Math.round(207 + (10 - 207) * norm);
    const g = Math.round(108 + (42 - 108) * norm);
    const b = Math.round(16 + (255 - 16) * norm);
    return `rgb(${r},${g},${b})`;
  };

  return (
    <div
      className="css-scatter"
      onMouseMove={handleMouseMove}
    >
      <div className="css-scatter-grid">{gridCells}</div>
      {points.map((pt) => (
        <div
          key={pt.id}
          className="scatter-point"
          style={{
            left: `${pt.x}%`,
            bottom: `${pt.y}%`,
            background: getColor(pt.x, pt.y),
            border: `1px solid ${getColor(pt.x, pt.y)}`,
          }}
        />
      ))}
    </div>
  );
};

// Spider Line Plot component
const SpiderLinePlot = () => {
  // Provided values for three rock suites
  const oib = [23.81,47.24,53.03,47.06,47.62,72.95,72.97,57.1,47.76,21.33,35.43,30.3,32.66,24.63,26.67,14.11,15.6,6.98,5.22,5.15];
  const morb = [0.48,0.94,0.95,1.41,2.38,3.5,3.51,3.86,4.48,2,5.12,5.82,4.52,6.4,7.05,6.31,6.79,6.51,6.8,6.62];
  const arc = [19.05,23.62,30.3,23.53,28.57,3.04,4.05,15.43,13.13,30,12.2,11.16,17.59,10.34,8.57,6.64,8.26,5.81,5.67,5.88];
  const suites = [oib, morb, arc];
  const suiteNames = ['OIB', 'MORB', 'ARC'];
  const numLines = 50;
  const randomSpread = 0.18; // increased randomization

  const [suiteIdx, setSuiteIdx] = useState(0);
  const [lines, setLines] = useState([]);

  // Switch suite every 5 seconds
  React.useEffect(() => {
    const updateLines = () => {
      const base = suites[suiteIdx].map(v => Math.log10(v));
      // 50 lines: each gets a random offset for all values, plus small per-value noise
      const newLines = Array.from({ length: numLines }, () => {
        const offset = (Math.random() - 0.5) * 0.25; // correlated offset
        return base.map(v => v + offset + (Math.random() - 0.5) * 0.08);
      });
      setLines(newLines);
    };
    updateLines();
    const interval = setInterval(() => {
      setSuiteIdx(idx => (idx + 1) % suites.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [suiteIdx]);

  // Update lines when suiteIdx changes
  React.useEffect(() => {
    const base = suites[suiteIdx].map(v => Math.log10(v));
    const newLines = Array.from({ length: numLines }, () => {
      const offset = (Math.random() - 0.5) * 0.2;
      return base.map(v => v + offset + (Math.random() - 0.5) * 0.1);
    });
    setLines(newLines);
  }, [suiteIdx]);

  // SVG line points
  const count = suites[0].length;
  const height = 220;
  const [svgWidth, setSvgWidth] = useState(400);
  const svgHeight = 220;
  const containerRef = React.useRef();

  React.useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setSvgWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Find min/max log10 value for scaling and coloring, only for current group
  const base = suites[suiteIdx].map(v => Math.log10(v));
  // Compute min/max across all possible randomized lines for this group
  const minLog = Math.min(...base) - 0.25;
  const maxLog = Math.max(...base) + 0.25;

  // Compute min/max of first entries for current group for color gradient
  const firstEntries = lines.map(l => l[0]);
  const minFirst = Math.min(...firstEntries);
  const maxFirst = Math.max(...firstEntries);

  // Gridlines
  const gridLines = [];
  for (let i = 0; i <= 6; i++) {
    const y = (svgHeight / 6) * i;
    gridLines.push(
      <line
        key={`h${i}`}
        x1={0}
        x2={svgWidth}
        y1={y}
        y2={y}
        stroke="#cf6c10"
        strokeDasharray="6,4"
        opacity={0.18}
      />
    );
  }
  for (let i = 0; i < count; i += 4) {
    const x = (svgWidth / (count - 1)) * i;
    gridLines.push(
      <line
        key={`v${i}`}
        y1={0}
        y2={svgHeight}
        x1={x}
        x2={x}
        stroke="#cf6c10"
        strokeDasharray="6,4"
        opacity={0.18}
      />
    );
  }

  // Axes (orange)
  const axes = [
    <line key="x" x1={0} x2={svgWidth} y1={svgHeight} y2={svgHeight} stroke="#cf6c10" strokeWidth={2} />,
    <line key="y" x1={0} x2={0} y1={0} y2={svgHeight} stroke="#cf6c10" strokeWidth={2} />,
  ];

  const [mouse, setMouse] = useState({ x: null, y: null });

  // Mouse move handler for SVG
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMouse({ x, y });
    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      setLines((prevLines) => {
        const xIdx = Math.round((x / rect.width) * (count - 1));
        // Compute mean value at x position
        const meanAtX = prevLines.reduce((sum, line) => sum + line[xIdx], 0) / prevLines.length;
        // Convert mouse y to log value
        const logVal = minLog + (maxLog - minLog) * (1 - y / rect.height);
        // Determine spread/collapse direction
        const spread = logVal > meanAtX ? 1 : -1;
        // Gradually spread/collapse lines around mean, preserving mean
        return prevLines.map((line, i) => {
          const delta = line[xIdx] - meanAtX;
          // Move each line a small step (10%) further from/toward mean
          const newDelta = delta + spread * Math.abs(delta) * 0.1;
          const newVal = meanAtX + newDelta;
          return line.map((v, j) => (j === xIdx ? newVal : v));
        });
      });
    }
  };
  const handleMouseLeave = () => setMouse({ x: null, y: null });

  return (
    <div ref={containerRef} style={{ width: '100%', height: `${height}px`, position: 'relative', marginTop: '1.5rem' }}>
      <svg
        width={svgWidth}
        height={svgHeight}
        style={{ width: '100%', height: '100%' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {gridLines}
        {axes}
        {lines.map((values, idx) => {
          // Color by first entry value, scaled to min/max of current group
          const first = values[0];
          const norm = (first - minFirst) / (maxFirst - minFirst || 1);
          const r = Math.round(207 + (10 - 207) * norm);
          const g = Math.round(108 + (42 - 108) * norm);
          const b = Math.round(16 + (255 - 16) * norm);
          const color = `rgb(${r},${g},${b})`;
          const points = values.map((v, i) => [
            (i / (count - 1)) * svgWidth,
            svgHeight - ((v - minLog) / (maxLog - minLog)) * svgHeight
          ]);
          const linePath = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');

          return (
            <path
              key={idx}
              d={linePath}
              stroke={color}
              strokeWidth={1.2}
              fill="none"
              opacity={0.08 + 0.5 * (idx / numLines)}
            />
          );
        })}
      </svg>
    </div>
  );
};

// Ternary Scatter Plot component
const CombinedLowerRightPlot = () => {
  // Generate random points in ternary space (A+B+C=1)
  const numPoints = 50;
  const height = 220;
  const side = height * 2 / Math.sqrt(3);
  const width = side;
  const markerSize = 8; // match .scatter-point width/height
  const genTernaryPoints = () => Array.from({ length: numPoints }, () => {
    let a = Math.random();
    let b = Math.random() * (1 - a);
    let c = 1 - a - b;
    // Shuffle to randomize which axis is which
    const arr = [a, b, c];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });
  const [points, setPoints] = React.useState(genTernaryPoints);

  // Regenerate points every 5 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setPoints(genTernaryPoints());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Mouse effect: move points 40% toward mouse if within radius 10% of triangle bounding box
  const handleTernaryMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Convert mouse position to percent units relative to triangle bounding box
    const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
    const mouseY = (1 - (e.clientY - rect.top) / rect.height) * 100;
    const R = 20; // radius in percent units
    setPoints((pts) =>
      pts.map((abc) => {
        // Convert ternary point to percent units
        const [x, y] = tern2xy(abc);
        const px = (x / width) * 100;
        const py = (1 - y / height) * 100;
        const dx = px - mouseX;
        const dy = py - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < R) {
          // Move closer: interpolate 15% toward mouse (smoother)
          const newPx = px - dx * 0.04;
          const newPy = py - dy * 0.04;
          // Convert back to SVG coordinates
          const newX = (newPx / 100) * width;
          const newY = (1 - newPy / 100) * height;
          // Find barycentric coordinates for (newX, newY)
          const det = (A[0] - C[0]) * (B[1] - C[1]) - (B[0] - C[0]) * (A[1] - C[1]);
          const a = ((newX - C[0]) * (B[1] - C[1]) - (B[0] - C[0]) * (newY - C[1])) / det;
          const b = ((A[0] - C[0]) * (newY - C[1]) - (newX - C[0]) * (A[1] - C[1])) / det;
          let c = 1 - a - b;
          // Clamp to [0,1]
          const arr = [Math.max(0, Math.min(1, a)), Math.max(0, Math.min(1, b)), Math.max(0, Math.min(1, c))];
          // Renormalize
          const sum = arr[0] + arr[1] + arr[2];
          return arr.map((v) => v / sum);
        }
        return abc;
      })
    );
  };

  // SVG triangle vertices (equilateral, base at bottom, top at top center)
  const A = [width / 2, 0]; // top
  const B = [0, height]; // bottom left
  const C = [width, height]; // bottom right

  // Convert ternary (a,b,c) to (x,y) in SVG
  const tern2xy = ([a, b, c]) => {
    // a+b+c=1, barycentric interpolation
    const x = a * A[0] + b * B[0] + c * C[0];
    const y = a * A[1] + b * B[1] + c * C[1];
    return [x, y];
  };

  // Grid lines (10% steps)
  const gridLines = [];
  for (let i = 1; i < 10; i++) {
    const f = i / 10;
    // A grid
    gridLines.push(
      <polyline
        key={`a${i}`}
        points={[
          tern2xy([f, 1 - f, 0]),
          tern2xy([f, 0, 1 - f])
        ].map(p => p.join(",")).join(" ")}
        stroke="#cf6c10"
        strokeDasharray="6,4"
        opacity={0.18}
        fill="none"
      />
    );
    // B grid
    gridLines.push(
      <polyline
        key={`b${i}`}
        points={[
          tern2xy([0, f, 1 - f]),
          tern2xy([1 - f, f, 0])
        ].map(p => p.join(",")).join(" ")}
        stroke="#cf6c10"
        strokeDasharray="6,4"
        opacity={0.18}
        fill="none"
      />
    );
    // C grid
    gridLines.push(
      <polyline
        key={`c${i}`}
        points={[
          tern2xy([0, 1 - f, f]),
          tern2xy([1 - f, 0, f])
        ].map(p => p.join(",")).join(" ")}
        stroke="#cf6c10"
        strokeDasharray="6,4"
        opacity={0.18}
        fill="none"
      />
    );
  }

  // Triangle outline
  const triangle = [A, B, C, A].map(p => p.join(",")).join(" ");

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%', height: `${height}px`, marginTop: '1.5rem',marginLeft: '1.5rem', gap: '1rem' }}>
      <div style={{ width: `${width}px`, height: `${height}px`, position: 'relative' }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%' }}
          onMouseMove={handleTernaryMouseMove}
        >
          <polyline points={triangle} stroke="#cf6c10" strokeWidth={2} fill="none" />
          {gridLines}
          {points.map((abc, i) => {
            const [x, y] = tern2xy(abc);
            const r = Math.round(207 * abc[0] + 10 * abc[1] + 46 * abc[2]);
            const g = Math.round(108 * abc[0] + 42 * abc[1] + 204 * abc[2]);
            const b = Math.round(16 * abc[0] + 255 * abc[1] + 64 * abc[2]);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={markerSize / 2}
                fill={`rgb(${r},${g},${b})`}
                opacity={0.85}
              />
            );
          })}
        </svg>
      </div>
      <div style={{ width: `${width + 80}px`, height: `${height}px`, position: 'relative', marginTop: '-1.5rem' }}>
        <CssScatter />
      </div>
    </div>
  );
};

const Home = () => (
  <Container fluid>
    <Row>
      <Col>
        <h1 className="text-center mb-4">Welcome to My Digital Space</h1>
      </Col>
    </Row>
    <Row>
      <Col md={6}>
        <h3 className="text-center">Hover over the bars below</h3>
        <Histogram />
      </Col>
      <Col md={6} style={{ marginTop: '1.5rem' }}>
        <h3 className="text-center">Simulation Video</h3>
        <SimulationVideoPlayer />
      </Col>
    </Row>
    <Row className="mt-4">
      <Col md={6}>
        <h3 className="text-center">Spider Line Plot</h3>
        <SpiderLinePlot />
      </Col>
      <Col md={6}>
        <h3 className="text-center">Ternary + Scatter Plot</h3>
        <CombinedLowerRightPlot />
      </Col>
    </Row>
  </Container>
);

export default Home;