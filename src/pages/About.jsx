import React from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';

const About = () => {
  return (
    <Container fluid style={{ backgroundColor: '#060510', minHeight: '100vh', padding: '60px 20px' }}>
      <Row className="justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Col lg={10} xl={8}>
          <Card className="shadow-lg border-0" style={{ backgroundColor: '#1E1E1E', borderRadius: '20px', overflow: 'hidden' }}>
            <Row className="g-0">
              
              {/* --- LEFT COLUMN: IMAGE / AVATAR --- */}
              <Col md={4} style={{ backgroundColor: '#151515', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px' }}>
                <img 
                  src="/images/my_photo.jpeg"
                  alt="My Photo"
                  style={{ 
                    width: '220px', 
                    height: '220px', 
                    borderRadius: '50%', 
                    objectFit: 'cover', 
                    objectPosition: 'center 0%', // Lower the crop
                    border: '4px solid #cf6c10', /* Matches your Plotly orange */
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                  }}
                />
              </Col>

              {/* --- RIGHT COLUMN: NARRATIVE --- */}
              <Col md={8}>
                <Card.Body style={{ padding: '50px' }}>
                  <h2 className="text-warning mb-4" style={{ fontWeight: 'bold' }}>
                    A bit about me.
                  </h2>
                  
                  <p className="text-light" style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#e0e0e0' }}>
                    I am a computational geoscientist with a broad passion for uncovering the physical and chemical processes that 
                    shape our planet. 
                    Currently, I am a postdoctoral researcher at the <span style={{ color: '#00CCFF', fontWeight: 'bold' }}>University of Oxford</span>, 
                    specializing in numerical modeling in geodynamics.
                  </p>
                  
                  <p className="text-light" style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#e0e0e0' }}>
                    My academic journey is rooted in understanding the Earth's deep interior. I completed my PhD at the
                     <span style={{ color: '#00CCFF', fontWeight: 'bold' }}>University of Lausanne</span>, where I focused on the dynamics of 
                     melt transport through the lithosphere, specifically investigating the Leucite Hills intraplate volcanism.
                      While my core expertise lies in geodynamics, geochemistry, and igneous petrology, my approach is heavily 
                      driven by my love for physics, mathematics, and statistics.
                  </p>
                  
                  <p className="text-light" style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#e0e0e0' }}>
                    I strongly believe in the power of modern technology to advance the geosciences. To that end, 
                    I actively incorporate data science, machine learning, and advanced data visualization into 
                    my workflow to present science beautifully and effectively. Recently, I have been expanding my 
                    toolkit into remote sensing, with the exciting goal of bridging the gap between observational 
                    satellite data and rigorous numerical modeling.
                  </p>

                  {/* --- SKILLS BADGES --- */}
                  <div className="mt-5">
                    <h6 className="text-secondary mb-3 text-uppercase" style={{ letterSpacing: '1px' }}>Core Expertise & Interests</h6>
                    <Badge bg="warning" text="dark" className="me-2 mb-2 px-3 py-2" style={{ fontSize: '0.9rem' }}>Geodynamics</Badge>
                    <Badge bg="info" text="dark" className="me-2 mb-2 px-3 py-2" style={{ fontSize: '0.9rem' }}>Numerical Modeling</Badge>
                    <Badge bg="danger" className="me-2 mb-2 px-3 py-2" style={{ fontSize: '0.9rem' }}>Igneous Petrology</Badge>
                    <Badge bg="success" className="me-2 mb-2 px-3 py-2" style={{ fontSize: '0.9rem' }}>Geochemistry</Badge>
                    <Badge bg="primary" className="me-2 mb-2 px-3 py-2" style={{ fontSize: '0.9rem' }}>Data Science</Badge>
                    <Badge bg="secondary" className="me-2 mb-2 px-3 py-2" style={{ fontSize: '0.9rem' }}>Remote Sensing</Badge>
                  </div>

                </Card.Body>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default About;