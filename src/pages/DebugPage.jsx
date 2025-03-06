import React from 'react';

const DebugPage = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#6200ee' }}>Swickr Debug Page</h1>
      <p>If you can see this page, the basic React application is working correctly.</p>
      
      <h2>Environment Variables</h2>
      <pre>
        {JSON.stringify({
          REACT_APP_API_URL: process.env.REACT_APP_API_URL || 'Not set',
          REACT_APP_SOCKET_URL: process.env.REACT_APP_SOCKET_URL || 'Not set',
        }, null, 2)}
      </pre>
      
      <h2>Browser Information</h2>
      <pre>
        {JSON.stringify({
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
        }, null, 2)}
      </pre>
    </div>
  );
};

export default DebugPage;
