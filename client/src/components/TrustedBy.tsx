"use client";

import { useState, useEffect } from "react";

const TrustedBy = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById("trusted-by-section");
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  const companies = [
    { name: "Sfaximoules", logo: "/cb.png" },
    { name: "Acia SUD", logo: "/cc.png" },
    { name: "Compagnie des Phosphates de Gafsa", logo: "/cd1.png" },
    { name: "G.T.I Générales Technique Industriel", logo: "/ce.png" },
  ];

  return (
    <section id="trusted-by-section" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Trusted By Leading Companies
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust us for their business needs
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 items-center justify-items-center max-w-4xl mx-auto">
          {companies.map((company, index) => (
            <div
              key={company.name}
              className={`flex flex-col items-center justify-center transition-all duration-700 ease-out ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{
                transitionDelay: `${index * 100}ms`,
              }}
            >
              {/* Company logo */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 mb-3 flex items-center justify-center">
                <img
                  src={company.logo}
                  alt={`${company.name} logo`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              
              {/* Company name */}
              <div className="text-sm text-gray-600 font-medium text-center">
                {company.name}
              </div>
            </div>
          ))}
        </div>

        {/* Additional trust indicators */}
        <div className="mt-16 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-sm">ISO Certified</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <span className="text-sm">24/7 Support</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              </div>
              <span className="text-sm">Secure Payments</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustedBy;
