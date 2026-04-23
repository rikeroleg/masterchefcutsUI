import React from "react";

export default function AccessDenied({ message }) {
  return (
    <div className="access-denied-page" style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      background: 'rgba(20,20,20,0.85)',
      borderRadius: 16,
      margin: '40px auto',
      maxWidth: 480,
      boxShadow: '0 4px 32px rgba(0,0,0,0.25)',
      padding: 32,
      textAlign: 'center',
      textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 4px 20px rgba(0,0,0,0.85)'
    }}>
      <h1 style={{ fontSize: 32, marginBottom: 16 }}>Access Denied</h1>
      <p style={{ fontSize: 18, marginBottom: 24 }}>{message || "You do not have permission to view this page."}</p>
      <a href="/login?redirect=/admin" style={{
        color: '#fff',
        background: '#c03000',
        borderRadius: 8,
        padding: '10px 28px',
        fontWeight: 600,
        fontSize: 18,
        textDecoration: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        marginTop: 8
      }}>Sign in as Admin</a>
    </div>
  );
}
