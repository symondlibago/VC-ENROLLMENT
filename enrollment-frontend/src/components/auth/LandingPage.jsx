import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Award, 
  ArrowRight, 
  Play,
  CheckCircle,
  Star,
  Quote,
  TrendingUp,
  Shield,
  Zap,
  Globe,
  ClipboardCheck, // New Icon for Registration
  Factory,        // New Icon for Facilities
  Link,           // New Icon for Linkage
  CalendarCheck,  // New Icon for Enrollment
  HeartHandshake, // New Icon for Mission
  School          // New Icon for Institution
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const LandingPage = ({ onGetStarted, onEnrollNow }) => {
  const [isVisible, setIsVisible] = useState(false);
  const { scrollY } = useScroll();
  // Simplified scroll transformation for aesthetic background movement
  const y1 = useTransform(scrollY, [0, 500], [0, -75]); 
  
  const handleEnrollClick = () => {
    if (onEnrollNow) {
      onEnrollNow();
    }
  };
  
  const handleLoginClick = () => {
    if (onGetStarted) {
      onGetStarted();
    }
  };

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // 💡 NEW: Features based on Vineyard College's actual strengths
  const collegeStrengths = [
    {
      icon: HeartHandshake,
      title: 'Our Purpose and Mission',
      description: 'Providing quality basic, technical/vocational, higher, and advanced education responsive to the needs of time and society.',
      color: 'bg-red-50 text-[var(--dominant-red)]'
    },
    {
      icon: ClipboardCheck,
      title: 'National Registration',
      description: 'Fully registered with DepEd, TESDA, CHED, and DOT, ensuring recognized and compliant educational standards.',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      icon: Factory,
      title: 'Industry-Standard Facilities',
      description: 'Equipped with state-of-the-art hospitality and culinary training facilities, simulating the real workplace environment.',
      color: 'bg-green-50 text-green-600'
    },
    {
      icon: Link,
      title: 'Direct Industry Linkage',
      description: 'Guaranteed industry connections with various hotels and resorts all over Asia and Australia for OJT and employment.',
      color: 'bg-purple-50 text-purple-600'
    },
    {
      icon: CalendarCheck,
      title: 'Efficient Online Enrollment',
      description: 'Streamlined admissions process allowing students to check eligibility and enroll seamlessly for the next academic term.',
      color: 'bg-orange-50 text-orange-600'
    },
    {
      icon: School,
      title: 'Non-Profit Institution',
      description: 'A non-stock and non-profit educational institution focused solely on student growth and community service.',
      color: 'bg-indigo-50 text-indigo-600'
    }
  ];
  
  // 💡 REMOVED: Testimonials and Stats for realism, as requested.

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.23, 1, 0.32, 1]
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--snowy-white)] via-[var(--whitish-pink)] to-white">
      {/* Hero Section */}
      <motion.section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        variants={containerVariants}
      >
        {/* Background Elements */}
        <motion.div
          className="absolute inset-0 opacity-10"
          style={{ y: y1 }}
        >
          <div className="absolute top-20 left-20 w-72 h-72 bg-red-800 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        </motion.div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.p
               variants={itemVariants}
               className="text-xl md:text-2xl text-red-800 font-semibold mb-2 leading-relaxed tracking-wider"
            >
              WELCOME TO
            </motion.p>
            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-6xl font-extrabold heading-bold text-gray-900 mb-6 leading-tight uppercase"
            >
              VINEYARD INTERNATIONAL POLYTECHNIC COLLEGE
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed max-w-3xl mx-auto"
            >
              A non-stock and non-profit Educational Institution providing quality basic, technical/vocational, 
              higher, and advanced education responsive to the need of time and society.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <Button
                size="lg"
                onClick={handleLoginClick} 
                className="gradient-primary text-white px-8 py-4 text-lg liquid-button group cursor-pointer shadow-xl hover:shadow-2xl"
              >
                Login
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleEnrollClick} 
                className="px-8 py-4 text-lg border-2 border-red-80 text-red-800 bg-white hover:bg-red-800 liquid-button group cursor-pointer"
              >
                <Play className="mr-2 w-5 h-5" />
                Start New Enrollment
              </Button>
            </motion.div>

          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-gray-400 rounded-full mt-2"></div>
          </div>
        </motion.div>
      </motion.section>

      {/* College Strengths Section (Replaces Features) */}
      <motion.section
        className="py-24 bg-white"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className="container mx-auto px-6">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold heading-bold text-gray-900 mb-6">
              Our Core Strengths & 
              <span className="text-red-800"> Commitments</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              What sets Vineyard International Polytechnic College apart as an international training center.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collegeStrengths.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  whileHover={{ y: -6 }} // Reduced lift for a smoother card-hover effect
                  className="liquid-hover"
                >
                  <Card className="card-hover border-0 shadow-lg h-full">
                    <CardContent className="p-8">
                      <div className={`w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mb-6`}>
                        <Icon className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* 💡 REMOVED: Testimonials Section for realism */}
      
      {/* CTA Section (Updated) */}
      <motion.section
        className="py-24 gradient-primary text-white relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className="container mx-auto px-6 relative z-10">
          <motion.div variants={itemVariants} className="text-center max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold heading-bold mb-6">
              Begin Your Journey with Vineyard College
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Apply now and gain access to industry-standard training and global opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={handleEnrollClick}
                className="bg-white text-red-800 hover:bg-gray-100 px-8 py-4 text-lg liquid-button group shadow-xl hover:shadow-2xl"
              >
                Enroll Today!
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default LandingPage;