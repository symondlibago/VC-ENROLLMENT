import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Search, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  CreditCard, 
  GraduationCap,
  Sparkles,
  RefreshCw,
  Download,
  Eye,
  Calendar,
  User,
  BookOpen
} from 'lucide-react';

const CheckStatus = ({ onBack }) => {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const handleSearch = async () => {
    if (!referenceNumber.trim()) return;
    
    setIsSearching(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockResult = {
        referenceNumber: referenceNumber,
        studentName: "Juan Dela Cruz",
        course: "Bachelor of Science in Information Technology",
        semester: "2nd Semester",
        schoolYear: "2024-2025",
        status: "Pending Payment",
        statusType: "warning", // success, warning, error
        submissionDate: "March 15, 2025",
        lastUpdated: "March 16, 2025",
        nextStep: "Complete payment to proceed with enrollment",
        paymentAmount: "₱15,000.00",
        paymentDeadline: "March 25, 2025",
        documents: [
          { name: "Enrollment Form", status: "completed" },
          { name: "Academic Records", status: "completed" },
          { name: "Medical Certificate", status: "pending" },
          { name: "Payment Receipt", status: "missing" }
        ]
      };
      
      setSearchResult(mockResult);
      setIsSearching(false);
      setShowResult(true);
    }, 2000);
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.23, 1, 0.32, 1]
      }
    }
  };

  const getStatusColor = (type) => {
    switch (type) {
      case 'success': return 'from-emerald-500 to-green-600';
      case 'warning': return 'from-amber-500 to-orange-600';
      case 'error': return 'from-red-500 to-red-600';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  const getStatusIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5" />;
      case 'warning': return <Clock className="w-5 h-5" />;
      case 'error': return <AlertCircle className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--snowy-white)] via-[var(--whitish-pink)] to-white">
      {/* Floating Navigation */}
      <motion.div 
        className="fixed top-4 left-4 z-50"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        {onBack && (
          <button
            onClick={handleBackClick}
            className="bg-white/90 backdrop-blur-sm text-[var(--dominant-red)] p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
      </motion.div>

      {/* Main Container */}
      <motion.div
        className="container mx-auto px-4 py-8 max-w-4xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-8"
          variants={itemVariants}
        >
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-[var(--dominant-red)] to-red-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Search className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-md">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold heading-bold text-gray-900 mb-2">
            <span className="bg-gradient-to-r from-[var(--dominant-red)] to-red-600 bg-clip-text text-transparent">
              Enrollment Status
            </span>
            <span className="block text-xl md:text-2xl mt-1 text-gray-700">
              Tracking Center
            </span>
          </h1>
          <p className="text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
            Track your enrollment application progress in real-time
            <br />
            <span className="text-sm font-semibold text-[var(--dominant-red)]">
              2nd Semester, School Year 2024 - 2025
            </span>
          </p>
        </motion.div>

        {/* Enhanced Reminders Section */}
        <motion.div 
          className="max-w-3xl mx-auto mb-8"
          variants={itemVariants}
        >
          <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-200/30 to-orange-200/30 rounded-full -translate-y-12 translate-x-12"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-yellow-200/30 to-amber-200/30 rounded-full translate-y-8 -translate-x-8"></div>
            
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold heading-bold text-gray-900 ml-3">
                  Important Reminders
                </h3>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/50">
                <p className="text-gray-800 text-base leading-relaxed mb-4">
                  Please complete your payment within <span className="font-bold text-amber-700">3 days</span> after submitting your enrollment form. 
                  Failure to do so will invalidate your Online Enrollment Application. Thank you.
                </p>
                
                <div className="flex flex-wrap gap-3">
                  <motion.button 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center space-x-2 text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Payment Instructions</span>
                  </motion.button>
                  
                  <motion.button 
                    className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-5 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center space-x-2 text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Forms</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search Section */}
        <motion.div 
          className="max-w-2xl mx-auto mb-8"
          variants={itemVariants}
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-[var(--dominant-red)] to-red-600 p-5 text-white">
              <h2 className="text-xl font-bold heading-bold mb-1 flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Check Your Status
              </h2>
              <p className="text-red-100 text-sm">Enter your reference number to track your enrollment</p>
            </div>

            <div className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="text-gray-800 text-base font-bold heading-bold mb-3 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-[var(--dominant-red)]" />
                    Enter Reference Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="VIPC-2025-XXXX-XXX"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value.toUpperCase())}
                      className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl py-3 px-5 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 hover:shadow-lg text-base font-semibold placeholder-gray-400"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Search className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                <motion.button
                  onClick={handleSearch}
                  disabled={!referenceNumber.trim() || isSearching}
                  className="w-full bg-gradient-to-r from-[var(--dominant-red)] to-red-600 text-white py-3 px-5 rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
                  whileHover={{ scale: referenceNumber.trim() ? 1.02 : 1 }}
                  whileTap={{ scale: referenceNumber.trim() ? 0.98 : 1 }}
                >
                  {isSearching ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Get Status</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search Results */}
        <AnimatePresence>
          {showResult && searchResult && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.95 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="max-w-3xl mx-auto"
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                {/* Status Header */}
                <div className={`bg-gradient-to-r ${getStatusColor(searchResult.statusType)} p-5 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(searchResult.statusType)}
                      <div>
                        <h3 className="text-xl font-bold heading-bold">{searchResult.status}</h3>
                        <p className="text-white/90 text-sm">Reference: {searchResult.referenceNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white/90 text-xs">Last Updated</p>
                      <p className="font-bold text-sm">{searchResult.lastUpdated}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Student Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
                      <div className="flex items-center mb-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="text-base font-bold heading-bold text-gray-900 ml-2">Student Information</h4>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-gray-600 text-xs font-semibold">Full Name</p>
                          <p className="text-gray-900 font-bold text-sm">{searchResult.studentName}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs font-semibold">Course</p>
                          <p className="text-gray-900 font-bold text-sm">{searchResult.course}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-5 border border-emerald-200">
                      <div className="flex items-center mb-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="text-base font-bold heading-bold text-gray-900 ml-2">Academic Period</h4>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-gray-600 text-xs font-semibold">Semester</p>
                          <p className="text-gray-900 font-bold text-sm">{searchResult.semester}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-xs font-semibold">School Year</p>
                          <p className="text-gray-900 font-bold text-sm">{searchResult.schoolYear}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-5 border border-amber-200">
                    <div className="flex items-center mb-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg flex items-center justify-center">
                        <Clock className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="text-base font-bold heading-bold text-gray-900 ml-2">Next Steps</h4>
                    </div>
                    <p className="text-gray-800 font-semibold text-sm mb-3">{searchResult.nextStep}</p>
                    {searchResult.paymentAmount && (
                      <div className="flex items-center justify-between bg-white/70 rounded-lg p-3">
                        <div>
                          <p className="text-gray-600 text-xs font-semibold">Payment Amount</p>
                          <p className="text-xl font-bold text-amber-700">{searchResult.paymentAmount}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-600 text-xs font-semibold">Deadline</p>
                          <p className="text-base font-bold text-red-600">{searchResult.paymentDeadline}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Document Status */}
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-200">
                    <div className="flex items-center mb-4">
                      <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="text-base font-bold heading-bold text-gray-900 ml-2">Document Status</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {searchResult.documents.map((doc, index) => (
                        <div key={index} className="bg-white/70 rounded-lg p-3 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-7 h-7 rounded-md flex items-center justify-center ${
                              doc.status === 'completed' ? 'bg-green-100 text-green-600' :
                              doc.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-red-100 text-red-600'
                            }`}>
                              {doc.status === 'completed' ? <CheckCircle className="w-3 h-3" /> :
                               doc.status === 'pending' ? <Clock className="w-3 h-3" /> :
                               <AlertCircle className="w-3 h-3" />}
                            </div>
                            <span className="font-semibold text-gray-900 text-sm">{doc.name}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            doc.status === 'completed' ? 'bg-green-100 text-green-700' :
                            doc.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {doc.status ? doc.status.charAt(0).toUpperCase() + doc.status.slice(1) : 'Unknown'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 justify-center">
                    <motion.button 
                      className="bg-gradient-to-r from-[var(--dominant-red)] to-red-600 text-white px-6 py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center space-x-2 text-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Make Payment</span>
                    </motion.button>
                    
                    <motion.button 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center space-x-2 text-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Receipt</span>
                    </motion.button>
                    
                    <motion.button 
                      className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center space-x-2 text-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Help Section */}
        <motion.div 
          className="max-w-3xl mx-auto mt-8"
          variants={itemVariants}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <motion.div 
              className="bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-lg border border-white/20 liquid-hover cursor-pointer text-center"
              whileHover={{ y: -5 }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-bold heading-bold text-gray-900 mb-1">Need Help?</h3>
              <p className="text-gray-600 text-xs mb-3">Contact our enrollment support team</p>
              <button className="text-[var(--dominant-red)] font-semibold hover:underline text-xs">
                Get Support →
              </button>
            </motion.div>

            <motion.div 
              className="bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-lg border border-white/20 liquid-hover cursor-pointer text-center"
              whileHover={{ y: -5 }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-bold heading-bold text-gray-900 mb-1">FAQ</h3>
              <p className="text-gray-600 text-xs mb-3">Find answers to common questions</p>
              <button className="text-[var(--dominant-red)] font-semibold hover:underline text-xs">
                View FAQ →
              </button>
            </motion.div>

            <motion.div 
              className="bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-lg border border-white/20 liquid-hover cursor-pointer text-center"
              whileHover={{ y: -5 }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-bold heading-bold text-gray-900 mb-1">New Enrollment</h3>
              <p className="text-gray-600 text-xs mb-3">Start a new enrollment application</p>
              <button className="text-[var(--dominant-red)] font-semibold hover:underline text-xs">
                Enroll Now →
              </button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
export default CheckStatus;

