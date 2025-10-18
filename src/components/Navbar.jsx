import React, { useState } from 'react';
import { Wifi, Menu, X, MessageCircle, Github, Linkedin, Instagram } from 'lucide-react';
import { useMQTT } from '../hooks/useMQTT';

const Navbar = ({ title, subtitle, onMenuClick }) => {
  const { isConnected } = useMQTT();
  const [showContactModal, setShowContactModal] = useState(false);

  const contactLinks = [
    {
      name: 'WhatsApp',
      icon: 'whatsapp',
      url: 'https://wa.me/6281216199725',
      color: 'text-green-500'
    },
    {
      name: 'Instagram',
      icon: 'instagram',
      url: 'https://instagram.com/nazirrrvyn',
      color: 'text-pink-500'
    },
    {
      name: 'LinkedIn',
      icon: 'linkedin',
      url: 'https://linkedin.com/in/maulvinnazir',
      color: 'text-blue-600'
    },
    {
      name: 'GitHub',
      icon: 'github',
      url: 'https://github.com/mauldevrinz',
      color: 'text-gray-800'
    }
  ];

  return (
    <>
      <div className="bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-400 backdrop-blur-lg border-b border-blue-500 sticky top-0 z-30 shadow-lg">
        <div className="px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Left Side - Hamburger + Greeting */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Hamburger Button for Mobile */}
              <button
                onClick={onMenuClick}
                className="md:hidden bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-all backdrop-blur-sm"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Greeting */}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight drop-shadow-sm truncate">
                  {title || 'Good Morning, Operator!'}
                </h1>
                <p className="text-blue-50 text-xs md:text-sm drop-shadow-sm hidden sm:block truncate">
                  {subtitle || "Here's today's update from your industrial monitoring system"}
                </p>
              </div>
            </div>

            {/* Right Side - System Info & Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* MQTT Status Button */}
              <button className={`px-2 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl transition-all flex items-center space-x-1 md:space-x-2 shadow-lg border-2 ${
                isConnected
                  ? 'bg-white hover:bg-blue-50 text-emerald-600 border-white'
                  : 'bg-white hover:bg-blue-50 text-red-600 border-white'
              }`}>
                <Wifi className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm font-medium hidden sm:inline">
                  {isConnected ? 'MQTT Connected' : 'MQTT Offline'}
                </span>
              </button>

              {/* Contact Support Button */}
              <button
                onClick={() => setShowContactModal(true)}
                className="px-2 md:px-4 py-2 md:py-2.5 bg-white text-blue-600 rounded-lg md:rounded-xl hover:bg-blue-50 transition-all flex items-center space-x-1 md:space-x-2 shadow-lg border-2 border-white">
                <MessageCircle className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm font-medium hidden sm:inline">Contact support</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Support Modal - Rendered outside navbar */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowContactModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative my-auto" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Contact Support</h2>
              <p className="text-sm text-gray-500">Choose a platform to get in touch</p>
            </div>

            {/* Contact Links */}
            <div className="space-y-3">
              {contactLinks.map((link, index) => {
                const renderIcon = () => {
                  switch(link.icon) {
                    case 'whatsapp':
                      return (
                        <svg className={`w-6 h-6 ${link.color}`} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                      );
                    case 'instagram':
                      return <Instagram className={`w-6 h-6 ${link.color}`} />;
                    case 'linkedin':
                      return <Linkedin className={`w-6 h-6 ${link.color}`} />;
                    case 'github':
                      return <Github className={`w-6 h-6 ${link.color}`} />;
                    default:
                      return null;
                  }
                };

                return (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      {renderIcon()}
                      <span className="font-medium text-gray-700 group-hover:text-blue-600">{link.name}</span>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
