import React from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function AboutUsSimple() {
  console.log('AboutUsSimple component rendered successfully!');
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: 'blue', fontSize: '32px', marginBottom: '20px' }}>
        About Global Home Solutions - TEST PAGE
      </h1>
      
      <Link href="/" style={{ 
        color: 'blue', 
        textDecoration: 'underline',
        fontSize: '18px',
        display: 'inline-flex',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <ArrowLeft style={{ marginRight: '8px', width: '20px', height: '20px' }} />
        Back to Home
      </Link>
      
      <p style={{ fontSize: '18px', marginTop: '20px' }}>
        This is a test version of the About Us page to verify routing is working correctly.
      </p>
      
      <p style={{ fontSize: '16px', marginTop: '16px', color: '#666' }}>
        If you can see this page, the routing is working and we can troubleshoot the main About Us page.
      </p>
    </div>
  );
}