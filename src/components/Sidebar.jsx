import React, { useState } from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

const PROJECT_GROUPS = [
  { key: 'geodynamics', label: 'Geodynamics / Numerical Modelling' },
  { key: 'geochemistry', label: 'Geochemistry / Petrology' },
  { key: 'datascience', label: 'Data Science' },
  { key: 'gis', label: 'Remote Sensing / GIS' }
];

const Sidebar = () => {
  const location = useLocation();
  const [projectsOpen, setProjectsOpen] = useState(false);

  return (
    <div
      className="text-light position-fixed h-100"
      style={{ width: '18rem', padding: '2rem 1rem', backgroundColor: '#1a1a1a' }}
    >
      <h2 className="display-6" style={{ color: '#CA7915FF' }}>
        Marko Repac
      </h2>
      <hr style={{ color: '#6351C9FF', height: '6px' }} />
      <p className="lead">My personal website with various side projects.</p>
      <Nav className="flex-column" variant="pills">
        <Nav.Link as={Link} to="/" active={location.pathname === '/'}>
          Home
        </Nav.Link>
        <Nav.Link as={Link} to="/about" active={location.pathname === '/about'}>
          About
        </Nav.Link>
        <Nav.Link
          as={Link}
          to="/projects"
          active={location.pathname.startsWith('/projects')}
          onClick={e => { setProjectsOpen(o => !o); }}
        >
          Projects
        </Nav.Link>
        {projectsOpen && (
          <Nav className="flex-column ms-3">
            {PROJECT_GROUPS.map(g => (
              <Nav.Link
                key={g.key}
                as={Link}
                to={`/projects/${g.key}`}
                active={location.pathname === `/projects/${g.key}`}
              >
                {g.label}
              </Nav.Link>
            ))}
          </Nav>
        )}
      </Nav>
    </div>
  );
};

export default Sidebar;