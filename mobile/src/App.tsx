import React from 'react'
import { Router, Route } from 'wouter'
import MobileHome from './pages/MobileHome'
import MobileServices from './pages/MobileServices'
import MobileContractorProfile from './pages/MobileContractorProfile'
import MobileLogin from './pages/MobileLogin'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 safe-top safe-bottom">
        <Route path="/" component={MobileHome} />
        <Route path="/services" component={MobileServices} />
        <Route path="/contractor/:id" component={MobileContractorProfile} />
        <Route path="/login" component={MobileLogin} />
      </div>
    </Router>
  )
}

export default App