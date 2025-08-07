import React from "react";
import { Link } from "wouter";
import { ArrowLeft, MapPin, Phone, Mail, Users, Award, Home } from "lucide-react";
import logoPath from "@/assets/global-home-solutions-logo.png";

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header with Back Button */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
            <div className="flex items-center">
              <img 
                src={logoPath} 
                alt="Global Home Solutions"
                className="h-10 w-auto"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            About <span className="text-blue-600">Global Home Solutions</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Your trusted partner in connecting homeowners with quality contractors 
            for all their home improvement needs.
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 mb-12">
          <div className="flex items-center mb-8">
            <Home className="h-8 w-8 text-blue-600 mr-4" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Our Mission</h2>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
            At Global Home Solutions, we're dedicated to simplifying the process of finding 
            reliable, skilled contractors for your home improvement projects. We believe 
            every homeowner deserves access to quality workmanship and professional service.
          </p>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            Our platform connects you with pre-screened, licensed contractors who specialize 
            in everything from roofing and plumbing to kitchen remodeling and landscaping.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-6">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Vetted Contractors
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              All contractors in our network are thoroughly screened, licensed, 
              and insured for your peace of mind.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-6">
              <Award className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Quality Guarantee
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              We stand behind the work of our contractors with satisfaction 
              guarantees and ongoing support.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-6">
              <MapPin className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Local Expertise
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Our contractors know your area, local codes, and building 
              requirements to ensure compliant, quality work.
            </p>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-12 text-white">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Get In Touch</h2>
            <p className="text-xl opacity-90">
              Have questions? We're here to help you find the right contractor.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <Phone className="h-8 w-8 mb-4 opacity-90" />
              <h3 className="text-lg font-semibold mb-2">Call Us</h3>
              <p className="opacity-90">(555) 123-4567</p>
            </div>
            
            <div className="flex flex-col items-center">
              <Mail className="h-8 w-8 mb-4 opacity-90" />
              <h3 className="text-lg font-semibold mb-2">Email Us</h3>
              <p className="opacity-90">info@globalhomesolutions.com</p>
            </div>
            
            <div className="flex flex-col items-center">
              <MapPin className="h-8 w-8 mb-4 opacity-90" />
              <h3 className="text-lg font-semibold mb-2">Visit Us</h3>
              <p className="opacity-90">
                123 Main Street<br />
                Your City, State 12345
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to Start Your Project?
          </h3>
          <Link 
            href="/services"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-full text-lg transition-colors shadow-lg hover:shadow-xl"
          >
            Find a Contractor
          </Link>
        </div>
      </main>
    </div>
  );
}