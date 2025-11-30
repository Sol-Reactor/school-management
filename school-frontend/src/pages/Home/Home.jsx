import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaSchool, 
  FaGraduationCap, 
  FaChalkboardTeacher, 
  FaUsers, 
  FaBook,
  FaTrophy,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaArrowRight
} from 'react-icons/fa';

const Home = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Navigation */}
      <nav className="shadow-sm" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-primary)' }}>
                <FaSchool className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                Haya School
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg font-medium transition-colors"
                style={{ color: 'var(--color-text)' }}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-6 py-2 rounded-lg font-medium text-white transition-all"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
                Welcome to <span style={{ color: 'var(--color-primary)' }}>Haya School</span>
              </h1>
              <p className="text-xl mb-8" style={{ color: 'var(--color-textSecondary)' }}>
                Empowering minds, shaping futures. Join our community of learners and educators 
                dedicated to excellence in education.
              </p>
              <div className="flex space-x-4">
                <Link
                  to="/register"
                  className="px-8 py-4 rounded-lg font-semibold text-white text-lg flex items-center space-x-2 transition-all hover:shadow-lg"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <span>Enroll Now</span>
                  <FaArrowRight />
                </Link>
                <a
                  href="#contact"
                  className="px-8 py-4 rounded-lg font-semibold text-lg border-2 transition-all"
                  style={{ 
                    borderColor: 'var(--color-primary)',
                    color: 'var(--color-primary)'
                  }}
                >
                  Contact Us
                </a>
              </div>
            </div>
            <div className="relative">
              <div 
                className="rounded-2xl overflow-hidden shadow-2xl"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <img
                  src="https://plus.unsplash.com/premium_photo-1663090073232-a7e475ef1f38?q=80&w=1157&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Students learning"
                  className="w-full h-96 object-cover opacity-90"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              Why Choose Haya School?
            </h2>
            <p className="text-xl" style={{ color: 'var(--color-textSecondary)' }}>
              Excellence in education through innovation and dedication
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: FaGraduationCap,
                title: 'Quality Education',
                description: 'Comprehensive curriculum designed to nurture academic excellence and critical thinking.'
              },
              {
                icon: FaChalkboardTeacher,
                title: 'Expert Teachers',
                description: 'Dedicated and experienced educators committed to student success and growth.'
              },
              {
                icon: FaUsers,
                title: 'Community',
                description: 'A supportive learning environment that fosters collaboration and friendship.'
              },
              {
                icon: FaBook,
                title: 'Modern Resources',
                description: 'State-of-the-art facilities and digital tools for enhanced learning experiences.'
              },
              {
                icon: FaTrophy,
                title: 'Achievement',
                description: 'Track record of academic excellence and student accomplishments.'
              },
              {
                icon: FaSchool,
                title: 'Safe Environment',
                description: 'Secure and nurturing campus where students can thrive and excel.'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl transition-all hover:shadow-lg"
                style={{ backgroundColor: 'var(--color-background)' }}
              >
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'var(--color-primary)' + '20' }}
                >
                  <feature.icon className="text-3xl" style={{ color: 'var(--color-primary)' }} />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                  {feature.title}
                </h3>
                <p style={{ color: 'var(--color-textSecondary)' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              Our Campus Life
            </h2>
            <p className="text-xl" style={{ color: 'var(--color-textSecondary)' }}>
              Experience the vibrant community at Haya School
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=600&h=400&fit=crop',
              'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=400&fit=crop',
              'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&h=400&fit=crop',
              'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=400&fit=crop',
              'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&h=400&fit=crop',
              'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop'
            ].map((image, index) => (
              <div
                key={index}
                className="rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
              >
                <img
                  src={image}
                  alt={`Campus ${index + 1}`}
                  className="w-full h-64 object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-4xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
                Get in Touch
              </h2>
              <p className="text-lg mb-8" style={{ color: 'var(--color-textSecondary)' }}>
                Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
              </p>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div 
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--color-primary)' + '20' }}
                  >
                    <FaMapMarkerAlt className="text-xl" style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                      Address
                    </h3>
                    <p style={{ color: 'var(--color-textSecondary)' }}>
                      123 Education Street, Learning City, LC 12345
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div 
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--color-primary)' + '20' }}
                  >
                    <FaPhone className="text-xl" style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                      Phone
                    </h3>
                    <p style={{ color: 'var(--color-textSecondary)' }}>
                      +1 (555) 123-4567
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div 
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--color-primary)' + '20' }}
                  >
                    <FaEnvelope className="text-xl" style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                      Email
                    </h3>
                    <p style={{ color: 'var(--color-textSecondary)' }}>
                      info@hayaschool.edu
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    Name
                  </label>
                  <input
                    type="text"
                    className="input-field w-full"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    className="input-field w-full"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    Message
                  </label>
                  <textarea
                    rows="4"
                    className="input-field w-full"
                    placeholder="How can we help you?"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-lg font-semibold text-white transition-all"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4" style={{ backgroundColor: 'var(--color-background)', borderTop: '1px solid var(--color-border)' }}>
        <div className="max-w-7xl mx-auto text-center">
          <p style={{ color: 'var(--color-textSecondary)' }}>
            © 2024 Haya School. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
