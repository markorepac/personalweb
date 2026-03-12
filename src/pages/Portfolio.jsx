import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';

// sample project data; update links/descriptions/thumbs as needed
const base = process.env.PUBLIC_URL || '';

// temporary: all projects use the provided gisapp.png thumbnail
// you can replace each entry with its own image later
const projects = [
  {
    title: 'CRO GIS App',
    description: 'Interactive dashboard with GIS tools built in Dash.',
    link: '/cro_gis_app',
    thumbnail: base + '/images/gisapp.png',
    internal: true,
  },
  {
    title: 'ML Task',
    description: 'Machine learning model demonstration with Plotly charts.',
    link: '/mltask',
    thumbnail: base + '/images/gisapp.png',
    internal: true,
  },
  {
    title: 'Plate Cooling',
    description: 'Visualisations of cooling models for geology.',
    link: '/plate_cooling',
    thumbnail: base + '/images/gisapp.png',
    internal: true,
  },
  {
    title: 'WR',
    description: 'Wave rheology / rock mechanics dashboard.',
    link: '/wr',
    thumbnail: base + '/images/gisapp.png',
    internal: true,
  },
];

const Portfolio = () => (
  <Container fluid>
    <h1 className="text-center mb-4">My Portfolio</h1>
    <Row>
      {projects.map((proj, idx) => (
        <Col md={6} lg={4} className="mb-4" key={idx}>
          <Card className="h-100 shadow-sm bg-dark text-light">
            {proj.thumbnail && (
              <Card.Img
                variant="top"
                src={proj.thumbnail}
                alt={`${proj.title} thumbnail`}
              />
            )}
            <Card.Body className="d-flex flex-column">
              <Card.Title>{proj.title}</Card.Title>
              <Card.Text className="flex-grow-1">
                {proj.description}
              </Card.Text>
              <Button
                variant="primary"
                href={proj.link}
                {...(proj.internal ? { as: 'a' } : { target: '_blank' })}
              >
                View Project
              </Button>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  </Container>
);

export default Portfolio;