import React from "react";
import { Link } from "wouter";
import { ArrowLeft, MapPin, Phone, Mail, Users, Award, Home, Building2, Star, Clock, Shield, Target, TrendingUp, CheckCircle } from "lucide-react";
import logoPath from "@/assets/global-home-solutions-logo.png";

export default function AboutUs() {
  console.log('AboutUs main component rendered - checking for overlay issues');

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#ffffff',
      padding: '0',
      margin: '0',
      position: 'relative'
    }}>
      {/* Fixed Back Arrow */}
      <Link href="/" style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 1000,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '50px',
        height: '50px',
        backgroundColor: '#ffffff',
        borderRadius: '50%',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        color: '#3b82f6',
        textDecoration: 'none',
        transition: 'all 0.2s ease'
      }}>
        <ArrowLeft style={{ width: '24px', height: '24px' }} />
      </Link>

      {/* Main Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '60px 20px 40px 20px',
        backgroundColor: '#ffffff'
      }}>
        
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{
            width: '160px',
            height: '160px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '30px'
          }}>
            <img 
              src={logoPath} 
              alt="Global Home Solutions Logo" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain'
              }} 
            />
          </div>
          <h1 style={{
            fontSize: '56px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '24px',
            lineHeight: '1.1'
          }}>
            About <span style={{ color: '#2563eb' }}>Global Home Solutions</span>
          </h1>
          <p style={{
            fontSize: '24px',
            color: '#6b7280',
            maxWidth: '900px',
            margin: '0 auto',
            lineHeight: '1.5'
          }}>
            Your premier platform connecting homeowners with trusted contractors through innovative sales solutions
          </p>
        </div>

        {/* Company Overview Section */}
        <section style={{ marginBottom: '60px' }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
              {/* Content Side */}
              <div style={{ padding: '48px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
                  <Home style={{ width: '32px', height: '32px', color: '#2563eb', marginRight: '16px' }} />
                  <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1f2937' }}>Our Story</h2>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <p style={{ fontSize: '18px', color: '#374151', lineHeight: '1.7', marginBottom: '24px' }}>
                    Global Home Solutions revolutionizes the home improvement industry by connecting homeowners with trusted contractors through innovative door-to-door sales solutions.
                  </p>
                  <p style={{ fontSize: '18px', color: '#374151', lineHeight: '1.7', marginBottom: '32px' }}>
                    Our platform streamlines the bidding process, ensures quality work, and provides transparent pricing for all your home improvement needs.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2563eb', marginBottom: '8px' }}>5+</div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>Years Experience</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2563eb', marginBottom: '8px' }}>1000+</div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>Projects Completed</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Image Placeholder Side */}
              <div style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                padding: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ textAlign: 'center', color: '#ffffff' }}>
                  <Building2 style={{ width: '96px', height: '96px', margin: '0 auto 24px auto', opacity: '0.8' }} />
                  <p style={{ fontSize: '18px', opacity: '0.9' }}>Professional home services platform</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values & Differentiators */}
        <section style={{ marginBottom: '60px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>Why Choose Us</h2>
            <p style={{ fontSize: '20px', color: '#6b7280', maxWidth: '800px', margin: '0 auto' }}>
              We deliver exceptional results through innovation, quality, and customer-first approach
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-2xl flex items-center justify-center mb-6">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Expert Network
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                [Describe your contractor vetting process and network quality]
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Quality Assurance
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                [Explain your quality control measures and guarantees]
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-2xl flex items-center justify-center mb-6">
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Fast Response
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                [Highlight your response times and service efficiency]
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-2xl flex items-center justify-center mb-6">
                <Star className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Customer First
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                [Describe your customer service philosophy and approach]
              </p>
            </div>
          </div>
        </section>

        {/* Services Overview */}
        <section className="mb-20">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl p-8 lg:p-12">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Our Services</h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                [Brief overview of your service categories and specialties]
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Service categories will be populated */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <CheckCircle className="h-8 w-8 text-green-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  [Service Category 1]
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  [Brief description of services in this category]
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <CheckCircle className="h-8 w-8 text-green-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  [Service Category 2]
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  [Brief description of services in this category]
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <CheckCircle className="h-8 w-8 text-green-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  [Service Category 3]
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  [Brief description of services in this category]
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Leadership/Team Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              [Introduction to your leadership team or key personnel]
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Team member cards - populate with actual team members */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Users className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                [Name]
              </h3>
              <p className="text-blue-600 dark:text-blue-400 font-medium mb-4">
                [Title]
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                [Brief bio or description of role]
              </p>
            </div>
            
            {/* Add more team member cards as needed */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Users className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                [Name]
              </h3>
              <p className="text-green-600 dark:text-green-400 font-medium mb-4">
                [Title]
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                [Brief bio or description of role]
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Users className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                [Name]
              </h3>
              <p className="text-purple-600 dark:text-purple-400 font-medium mb-4">
                [Title]
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                [Brief bio or description of role]
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="mb-20">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 lg:p-12 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(circle_at_1px_1px,_white_1px,_transparent_0)] bg-[length:20px_20px]"></div>
            
            <div className="relative z-10">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">Get In Touch</h2>
                <p className="text-xl opacity-90 max-w-2xl mx-auto">
                  [Add your contact message and availability information]
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Phone className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Phone</h3>
                  <p className="opacity-90">[Your Phone Number]</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Email</h3>
                  <p className="opacity-90">[Your Email Address]</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Address</h3>
                  <p className="opacity-90 text-sm">
                    [Your Business Address]
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Hours</h3>
                  <p className="opacity-90 text-sm">
                    [Your Business Hours]
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 lg:p-12">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Ready to Start Your Project?
              </h3>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                [Add compelling call-to-action message about getting started]
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/services"
                  className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-full text-lg transition-all shadow-xl hover:shadow-2xl hover:scale-105"
                >
                  Find a Contractor
                </Link>
                <Link 
                  href="/portals"
                  className="inline-flex items-center justify-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-bold px-8 py-4 rounded-full text-lg transition-all shadow-lg hover:shadow-xl"
                >
                  Contractor Portal
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}