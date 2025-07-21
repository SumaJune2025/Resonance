import React from 'react';

export default function Home() {
  try {
    return (
      <div style={{ padding: '24px', fontFamily: 'Arial, sans-serif' }}>
        <h1 style={{ fontSize: '32px', color: '#065f46' }}>🌱 CultureMatch App</h1>
        <p style={{ fontSize: '18px', marginTop: '20px' }}>
          ✅ App loaded successfully. This is a fallback view to confirm your frontend is rendering.
        </p>
        <p style={{ fontSize: '16px', marginTop: '20px', color: '#64748b' }}>
          If you were expecting more UI or functionality, check your component logic step-by-step. This fallback ensures that your React render function is not crashing.
        </p>
      </div>
    );
  } catch (err) {
    console.error('Rendering error:', err);
    return (
      <div style={{ padding: '24px', fontFamily: 'Arial, sans-serif', color: 'red' }}>
        ❌ React crashed while rendering. Open browser DevTools (Console tab) for details.
      </div>
    );
  }
}
