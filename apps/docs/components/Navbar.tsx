'use client';

import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="navbar">
      <Link href="/" className="logo">
        <div className="logo-mark">S</div>
        Synapse<strong>JS</strong>
      </Link>
      
      <div className="nav-center">
        <Link href="/docs" className="nav-link">Documentation</Link>
        <Link href="#features" className="nav-link">Features</Link>
        <Link href="https://github.com/ziuus/SynapseJS" className="nav-link">GitHub</Link>
      </div>

      <div className="nav-end">
        <Link href="/docs" className="btn btn-primary">Get Started</Link>
      </div>
    </nav>
  );
}
