import React from "react";
import { Link } from "wouter";
import { ArrowLeft, MapPin, Phone, Mail, Users, Award, Home, Building2, Star, Clock, Shield, Target, TrendingUp, CheckCircle } from "lucide-react";
import logoPath from "@/assets/global-home-solutions-logo.png";

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header with Back Button */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors font-medium">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
            <div className="flex items-center">
              <img 
                src={logoPath} 
                alt="Global Home Solutions"
                className="h-12 w-auto"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full mb-8">
            <Building2 className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            About <span className="text-blue-600">Global Home Solutions</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
            [Add your company tagline and brief description here]
          </p>
        </div>

        {/* Company Overview Section */}
        <section className="mb-20">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-0">
              {/* Content Side */}
              <div className="p-8 lg:p-12">
                <div className="flex items-center mb-8">
                  <Home className="h-8 w-8 text-blue-600 mr-4" />
                  <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">Our Story</h2>
                </div>
                <div className="space-y-6">
                  <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                    [Add your company founding story, mission, and core values here. Explain how Global Home Solutions started and what drives your business.]
                  </p>
                  <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                    [Include information about your experience in the industry, your commitment to quality, and what sets you apart from competitors.]
                  </p>
                  <div className="grid grid-cols-2 gap-6 pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">[#]+</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Years Experience</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">[#]+</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Projects Completed</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Image Placeholder Side */}
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-8 lg:p-12 flex items-center justify-center">
                <div className="text-center text-white">
                  <Building2 className="h-24 w-24 mx-auto mb-6 opacity-80" />
                  <p className="text-lg opacity-90">[Add company photo, team photo, or office image here]</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values & Differentiators */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Why Choose Us</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              [Add a brief description of what makes your company unique]
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