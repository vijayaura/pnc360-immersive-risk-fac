import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Clock, Award, TrendingUp } from 'lucide-react';
import { getActiveProjectTypes, getSubProjectTypesByProjectType } from '@/lib/masters-data';
import heroImage from '@/assets/hero-construction.jpg';

export const Hero = () => {
  const [selectedProjectType, setSelectedProjectType] = useState('');
  const activeProjectTypes = getActiveProjectTypes();

  return (
    <section className="relative bg-gradient-hero text-primary-foreground overflow-hidden">
      <div className="absolute inset-0 bg-black/20" />
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: `url(${heroImage})` }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                Get the Best CAR Insurance
                <span className="text-secondary"> Quotes</span>
              </h1>
              <p className="text-xl text-primary-foreground/90 max-w-lg">
                Compare Construction All Risks insurance from top insurers. Get instant quotes,
                expert advice, and comprehensive coverage for your construction projects.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="construction" size="xl" className="animate-bounce-subtle" asChild>
                <Link to="/proposal">Get Free Quotes Now</Link>
              </Button>
              <Button
                variant="outline"
                size="xl"
                className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-primary"
              >
                Learn More
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-6 h-6 text-secondary" />
                </div>
                <p className="text-sm font-medium">Instant Quotes</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Shield className="w-6 h-6 text-secondary" />
                </div>
                <p className="text-sm font-medium">Full Coverage</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Award className="w-6 h-6 text-secondary" />
                </div>
                <p className="text-sm font-medium">Best Rates</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-large">
              <h3 className="text-2xl font-bold mb-6 text-center">Quick Quote Calculator</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="hero-project-value" className="block text-sm font-medium mb-2">
                    Project Value
                  </label>
                  <input
                    id="hero-project-value"
                    type="text"
                    placeholder="e.g., AED 1,000,000"
                    className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>
                <div>
                  <label htmlFor="hero-project-type" className="block text-sm font-medium mb-2">
                    Project Type
                  </label>
                  <select
                    id="hero-project-type"
                    className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-secondary"
                    value={selectedProjectType}
                    onChange={(e) => setSelectedProjectType(e.target.value)}
                  >
                    <option value="">Select project type</option>
                    {activeProjectTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="hero-sub-project-type" className="block text-sm font-medium mb-2">
                    Sub Project Type
                  </label>
                  <select
                    id="hero-sub-project-type"
                    className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-secondary"
                    disabled={!selectedProjectType}
                  >
                    <option value="">Select sub project type</option>
                    {selectedProjectType &&
                      getSubProjectTypesByProjectType(
                        activeProjectTypes.find((pt) => pt.value === selectedProjectType)?.id || 0,
                      ).map((subType) => (
                        <option key={subType.value} value={subType.value}>
                          {subType.label}
                        </option>
                      ))}
                  </select>
                </div>
                <Button variant="construction" size="lg" className="w-full" asChild>
                  <Link to="/proposal">Get Instant Quote</Link>
                </Button>
              </div>
            </div>

            <div className="absolute -top-4 -right-4 w-20 h-20 bg-secondary rounded-full flex items-center justify-center animate-bounce-subtle">
              <TrendingUp className="w-8 h-8 text-secondary-foreground" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
