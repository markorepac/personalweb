import React, { useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useParams } from 'react-router-dom';

const PROJECT_GROUPS = [
  {
    key: 'geodynamics',
    label: 'Geodynamics / Numerical Modelling',
    projects: [
      { title: 'Plate Cooling Models', description: `This tool allows to change parameters of the plate coling model and 
        half space cooling model and see how the results change.`,
          link: '/plate_cooling', thumbnail: '/images/Plate_cooling.png' }
    ]
  },
  {
    key: 'geochemistry',
    label: 'Geochemistry / Petrology',
    projects: [
      { title: 'Whole Rock Analysis', description: 'Interactive analysis of whole rock geochemistry data.', link: '/wr', thumbnail: '/images/WRanalysis.png' }
    ]
  },
  {
    key: 'datascience',
    label: 'Data Science',
    projects: [
      { title: 'Machine Learning Exploration', description: 'Machine learning exploration stage tool(not fully implemented).', link: '/mltask', thumbnail: '/images/cro_roads_settlements.png' }
    ]
  },
  {
    key: 'gis',
    label: 'Remote Sensing / GIS',
    projects: [
      { title: 'CroGIS App', description: 'Simple app for calculating inhabitants of settlements within interactive buffer distance from the main roads in Croatia.', link: '/cro_gis_app', thumbnail: '/images/cro_roads_settlements.png' }
    ]
  }
];

const ProjectCard = ({ proj }) => (
  <Col md={6} lg={4} className="mb-4">
    <Card className="h-100 shadow-sm border-0" style={{ backgroundColor: '#1E1E1E' }}>
      {proj.thumbnail && (
        <Card.Img variant="top" src={proj.thumbnail} alt={proj.title + ' thumbnail'} />
      )}
      <Card.Body>
        <Card.Title className="text-info mb-2" style={{ fontWeight: 'bold' }}>{proj.title}</Card.Title>
        <Card.Text className="text-light mb-3">{proj.description}</Card.Text>
        <a href={proj.link} className="btn btn-warning">View Project</a>
      </Card.Body>
    </Card>
  </Col>
);

const Projects = () => {
  const { groupKey } = useParams();

  if (groupKey) {
    const group = PROJECT_GROUPS.find(g => g.key === groupKey);
    if (!group) return <Container className="py-5"><h2 className="text-warning">Group not found</h2></Container>;
    return (
      <Container fluid className="py-5">
        <h2 className="text-center text-warning mb-4">{group.label}</h2>
        <Row className="justify-content-center">
          {group.projects.map((proj, idx) => <ProjectCard key={idx} proj={proj} />)}
        </Row>
      </Container>
    );
  }

  // No groupKey: show all projects grouped
  return (
    <Container fluid className="py-5">
      <h2 className="text-center text-warning mb-4">All Projects</h2>
      {PROJECT_GROUPS.map(group => (
        <div key={group.key} className="mb-5">
          <h4 className="text-info mb-3" style={{ borderBottom: '1px solid #333', paddingBottom: '8px' }}>{group.label}</h4>
          <Row>
            {group.projects.map((proj, idx) => <ProjectCard key={idx} proj={proj} />)}
          </Row>
        </div>
      ))}
    </Container>
  );
};

export default Projects;
