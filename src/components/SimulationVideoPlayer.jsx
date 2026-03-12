import React, { useRef, useState } from "react";



const SimulationVideoPlayer = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '220px', width: '100%' }}>
      <video
        width="100%"
        height="220"
        autoPlay
        loop
        muted
        playsInline
        style={{ maxWidth: '100%', height: '220px', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.15)', background: '#060510', objectFit: 'contain' }}
      >
        <source src="/images/simulation.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default SimulationVideoPlayer;