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
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const LandingPage = ({ onGetStarted }) => {
  const [isVisible, setIsVisible] = useState(false);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const y2 = useTransform(scrollY, [0, 300], [0, -100]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: Users,
      title: 'Student Management',
      description: 'Comprehensive student profiles, enrollment tracking, and academic progress monitoring.',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      icon: BookOpen,
      title: 'Course Management',
      description: 'Create, organize, and manage courses with flexible scheduling and capacity control.',
      color: 'bg-green-50 text-green-600'
    },
    {
      icon: Award,
      title: 'Certification System',
      description: 'Automated certificate generation and digital credential management.',
      color: 'bg-purple-50 text-purple-600'
    },
    {
      icon: TrendingUp,
      title: 'Analytics Dashboard',
      description: 'Real-time insights into enrollment trends, student performance, and system metrics.',
      color: 'bg-orange-50 text-orange-600'
    },
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Enterprise-grade security with role-based access control and data encryption.',
      color: 'bg-red-50 text-[var(--dominant-red)]'
    },
    {
      icon: Globe,
      title: 'Multi-Campus Support',
      description: 'Manage multiple campuses, departments, and programs from a single platform.',
      color: 'bg-indigo-50 text-indigo-600'
    }
  ];

  const testimonials = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Academic Director',
      institution: 'Stanford University',
      content: 'EduEnroll has transformed our enrollment process. The intuitive interface and powerful features have increased our efficiency by 300%.',
      avatar: 'SJ',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'IT Administrator',
      institution: 'MIT',
      content: 'The best enrollment system we\'ve used. The analytics and reporting features provide incredible insights into our student data.',
      avatar: 'MC',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Registrar',
      institution: 'Harvard University',
      content: 'Student satisfaction has improved dramatically since implementing EduEnroll. The mobile-friendly design is a game-changer.',
      avatar: 'ER',
      rating: 5
    }
  ];

  const stats = [
    { number: '50K+', label: 'Students Enrolled' },
    { number: '1,200+', label: 'Institutions' },
    { number: '99.9%', label: 'Uptime' },
    { number: '24/7', label: 'Support' }
  ];

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
          <div className="absolute top-20 left-20 w-72 h-72 bg-[var(--dominant-red)] rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        </motion.div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div variants={itemVariants} className="mb-6">
              <Badge className="mb-4 bg-[var(--dominant-red)] text-white px-4 py-2 text-sm">
                🚀 New: AI-Powered Enrollment Insights
              </Badge>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-7xl font-bold heading-bold text-gray-900 mb-6 leading-tight"
            >
              Transform Your
              <span className="text-[var(--dominant-red)] block">
                Enrollment Process
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed"
            >
              The most advanced enrollment management system trusted by leading educational institutions worldwide. 
              Streamline admissions, manage students, and boost efficiency with our cutting-edge platform.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <Button
                size="lg"
                onClick={onGetStarted}
                className="gradient-primary text-white px-8 py-4 text-lg liquid-button group"
              >
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg border-2 border-gray-300 hover:border-[var(--dominant-red)] liquid-button group"
              >
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="text-2xl md:text-3xl font-bold heading-bold text-[var(--dominant-red)] mb-1">
                    {stat.number}
                  </div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </motion.div>
              ))}
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

      {/* Features Section */}
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
              Everything You Need to
              <span className="text-[var(--dominant-red)]"> Succeed</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive platform provides all the tools you need to manage enrollments, 
              track student progress, and optimize your educational operations.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  whileHover={{ y: -10 }}
                  className="liquid-hover"
                >
                  <Card className="card-hover border-0 shadow-lg h-full">
                    <CardContent className="p-8">
                      <div className={`w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mb-6`}>
                        <Icon className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold heading-bold text-gray-900 mb-4">
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

      {/* Testimonials Section */}
      <motion.section
        className="py-24 gradient-soft"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className="container mx-auto px-6">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold heading-bold text-gray-900 mb-6">
              Trusted by Leading
              <span className="text-[var(--dominant-red)]"> Institutions</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of educational institutions that have transformed their enrollment process with EduEnroll.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                className="liquid-hover"
              >
                <Card className="card-hover border-0 shadow-lg h-full">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <Quote className="w-8 h-8 text-[var(--dominant-red)] mb-4" />
                    <p className="text-gray-700 mb-6 leading-relaxed">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-[var(--dominant-red)] rounded-full flex items-center justify-center text-white font-bold mr-4">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{testimonial.name}</div>
                        <div className="text-sm text-gray-600">{testimonial.role}</div>
                        <div className="text-sm text-[var(--dominant-red)]">{testimonial.institution}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="py-24 gradient-primary text-white relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{ y: y2 }}
        >
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        </motion.div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div variants={itemVariants} className="text-center max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold heading-bold mb-6">
              Ready to Transform Your Enrollment Process?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of institutions already using EduEnroll to streamline their operations 
              and improve student satisfaction.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={onGetStarted}
                className="bg-white text-[var(--dominant-red)] hover:bg-gray-100 px-8 py-4 text-lg liquid-button group"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-[var(--dominant-red)] px-8 py-4 text-lg liquid-button"
              >
                Schedule Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default LandingPage;

