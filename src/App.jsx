import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';

import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import About from './pages/About';
import CroGisApp from './pages/CroGisApp';
import MLTask from './pages/MLTask';
import PlateCooling from './pages/PlateCooling';
import Portfolio from './pages/Portfolio';
import WR from './pages/WR';
import Projects from './pages/Projects';

function App() {
  return (
    <Router>
      <div className="d-flex">
        <Sidebar />
        <Container fluid className="p-4" style={{ marginLeft: '18rem' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/projects/:groupKey" element={<Projects />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/cro_gis_app" element={<CroGisApp />} />
            <Route path="/mltask" element={<MLTask />} />
            <Route path="/plate_cooling" element={<PlateCooling />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/wr" element={<WR />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Container>
      </div>
    </Router>
  );
}

export default App;