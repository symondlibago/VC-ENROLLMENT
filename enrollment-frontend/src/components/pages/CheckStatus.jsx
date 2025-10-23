import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Search, CheckCircle, Clock, AlertCircle, FileText, 
  CreditCard, GraduationCap, Sparkles, RefreshCw, Eye, Calendar, User, BookOpen, UserCheck, UserX, Building, Info, PartyPopper
} from 'lucide-react';
import { enrollmentAPI } from '@/services/api'; // Make sure this path is correct

// Internal component to display contextual descriptions
const TimelineDescription = ({ status }) => {
  let Icon, bgColor, borderColor, iconColor, title, text;

  // MODIFIED: Status cases now match backend response
  switch (status) {
    case 'Program Head Review':
      Icon = UserCheck;
      bgColor = 'bg-blue-50';
      borderColor = 'border-blue-200';
      iconColor = 'text-blue-600';
      title = "Next Step: Program Head's Review";
      text = "Your application is being reviewed by the Program Head to verify your information and selected subjects. Please check back for updates.";
      break;
    case 'Registrar Review':
      Icon = Building;
      bgColor = 'bg-indigo-50';
      borderColor = 'border-indigo-200';
      iconColor = 'text-indigo-600';
      title = "Next Step: Registrar's Office";
      text = "The Program Head has approved your application. It is now with the Registrar's Office for final verification of your documents and records.";
      break;
    case 'Pending Payment':
      Icon = CreditCard;
      bgColor = 'bg-amber-50';
      borderColor = 'border-amber-200';
      iconColor = 'text-amber-600';
      title = "Final Step: Payment";
      text = "Your application is fully approved! Please proceed to the Cashier's Office to settle your payment and become officially enrolled.";
      break;
    case 'Enrolled': // MODIFIED: Changed from 'Successfully Enrolled'
      Icon = PartyPopper;
      bgColor = 'bg-emerald-50';
      borderColor = 'border-emerald-200';
      iconColor = 'text-emerald-600';
      title = "Enrollment Complete!";
      text = "Congratulations and welcome! You are officially enrolled for the new semester. We wish you the best of luck in your studies.";
      break;
    case 'Rejected': // MODIFIED: Changed from 'Application Rejected'
      Icon = UserX;
      bgColor = 'bg-red-50';
      borderColor = 'border-red-200';
      iconColor = 'text-red-600';
      title = "Application Status: Rejected";
      text = "Unfortunately, your application did not pass the review process. Please see the remarks from the approver below for more details.";
      break;
    default:
      return null;
  }
  
  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4 flex items-start space-x-3`}>
      <div className="flex-shrink-0 pt-1">
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <h6 className="font-bold text-gray-800 text-sm">{title}</h6>
        <p className="text-gray-600 text-xs mt-1">{text}</p>
      </div>
    </div>
  );
};


const CheckStatus = ({ onBack }) => {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [error, setError] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const handleSearch = async () => {
    if (!referenceNumber.trim()) return;
    
    setIsSearching(true);
    setSearchResult(null);
    setShowResult(false);
    setError(null);
    
    try {
      // Assuming enrollmentAPI.checkStatus is already set up to call your backend
      const response = await enrollmentAPI.checkStatus(referenceNumber);
      if (response.success) {
        setSearchResult(response.data);
        setShowResult(true);
      } else {
        setError(response.message || 'Reference number not found.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 }}};
  const itemVariants = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] }}};

  // MODIFIED: Status strings now match the backend's simplified output
  const getStatusType = (detailedStatus) => {
    if (detailedStatus === 'Enrolled') return 'success';
    if (detailedStatus === 'Rejected') return 'error';
    return 'warning'; // All other pending statuses
  };
  
  const getStatusColor = (statusType) => {
    switch (statusType) {
      case 'success': return 'from-emerald-500 to-green-600';
      case 'warning': return 'from-amber-500 to-orange-600';
      case 'error': return 'from-red-500 to-red-600';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  const getStatusIcon = (statusType) => {
    switch (statusType) {
      case 'success': return <CheckCircle className="w-5 h-5" />;
      case 'warning': return <Clock className="w-5 h-5" />;
      case 'error': return <AlertCircle className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };
  
  // MODIFICATION: This function now also returns a background color class
  const getApprovalStepPresentation = (role, status) => {
    let Icon;
    let bgColorClass;

    switch (role) {
      case 'Program Head': Icon = UserCheck; break;
      case 'Registrar': Icon = Building; break;
      case 'Cashier': Icon = CreditCard; break;
      default: Icon = User; break;
    }

    switch (status) {
      case 'approved': bgColorClass = 'bg-gradient-to-br from-green-500 to-emerald-600'; break;
      case 'rejected': bgColorClass = 'bg-gradient-to-br from-red-500 to-red-600'; break;
      default: bgColorClass = 'bg-gradient-to-br from-gray-400 to-gray-500'; break; // for pending/null status
    }
    
    return { Icon: <Icon className="w-5 h-5 text-white" />, bgColorClass };
  };
  
  const roleOrder = { 'Program Head': 1, 'Registrar': 2, 'Cashier': 3 };
  const allRoles = ['Program Head', 'Registrar', 'Cashier'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--snowy-white)] via-[var(--whitish-pink)] to-white">
       <motion.div className="fixed top-4 left-4 z-50" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
        {onBack && <button onClick={handleBackClick} className="bg-white/90 backdrop-blur-sm text-[var(--dominant-red)] p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/20"><ArrowLeft className="w-5 h-5" /></button>}
       </motion.div>
       <motion.div className="container mx-auto px-4 py-8 max-w-4xl" variants={containerVariants} initial="hidden" animate="visible">

        {/* Hero Section */}
        <motion.div className="text-center mb-8" variants={itemVariants}>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[var(--dominant-red)] to-red-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Search className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold heading-bold text-gray-900">
                Enrollment Status Tracker
            </h1>
            <p className="text-gray-600 max-w-xl mx-auto leading-relaxed mt-2">Enter your reference number to track your application progress in real-time.</p>
        </motion.div>

        {/* Search Section */}
        <motion.div className="max-w-2xl mx-auto mb-8" variants={itemVariants}>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-[var(--dominant-red)] to-red-600 p-5 text-white">
                <h2 className="text-xl font-bold heading-bold mb-1 flex items-center"><Search className="w-5 h-5 mr-2" />Check Your Status</h2>
                <p className="text-red-100 text-sm">Enter the reference number provided upon submission</p>
            </div>
            <div className="p-6">
              <div className="space-y-5">
                <div>
                    <label className="text-gray-800 text-base font-bold heading-bold mb-3 flex items-center"><FileText className="w-4 h-4 mr-2 text-[var(--dominant-red)]" />Enter Reference Number</label>
                    <div className="relative">
                        <input type="text" placeholder="VIPC-2025-XXXX-XXX" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value.toUpperCase())} className="w-full bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl py-3 px-5 text-gray-800 focus:outline-none focus:border-[var(--dominant-red)] transition-all duration-300 hover:shadow-lg text-base font-semibold placeholder-gray-400" onKeyPress={(e) => e.key === 'Enter' && handleSearch()}/>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2"><Search className="w-4 h-4 text-gray-400" /></div>
                    </div>
                </div>
                <motion.button onClick={handleSearch} disabled={!referenceNumber.trim() || isSearching} className="w-full bg-gradient-to-r from-[var(--dominant-red)] to-red-600 text-white py-3 px-5 rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3" whileHover={{ scale: referenceNumber.trim() ? 1.02 : 1 }} whileTap={{ scale: referenceNumber.trim() ? 0.98 : 1 }}>
                    {isSearching ? (<><RefreshCw className="w-4 h-4 animate-spin" /><span>Searching...</span></>) : (<><Search className="w-4 h-4" /><span>Get Status</span></>)}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Error Message Display */}
        <AnimatePresence>
            {error && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-2xl mx-auto mb-8 text-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative">
                    <strong className="font-bold">Oh no! </strong>
                    <span className="block sm:inline">{error}</span>
                </motion.div>
            )}
        </AnimatePresence>
        
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
                <div className={`bg-gradient-to-r ${getStatusColor(getStatusType(searchResult.detailedStatus))} p-5 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(getStatusType(searchResult.detailedStatus))}
                      <div>
                        <h3 className="text-xl font-bold heading-bold">{searchResult.detailedStatus}</h3>
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
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center"><User className="w-4 h-4 text-white" /></div>
                        <h4 className="text-base font-bold heading-bold text-gray-900 ml-2">Student Information</h4>
                      </div>
                      <div className="space-y-2">
                      <div><p className="text-gray-600 text-xs font-semibold">Student ID Number</p><p className="text-gray-900 font-bold text-sm">{searchResult.student.student_id_number}</p></div>
                        <div><p className="text-gray-600 text-xs font-semibold">Full Name</p><p className="text-gray-900 font-bold text-sm">{searchResult.student.fullName}</p></div>
                        <div><p className="text-gray-600 text-xs font-semibold">Course</p><p className="text-gray-900 font-bold text-sm">{searchResult.student.course}</p></div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-5 border border-emerald-200">
                      <div className="flex items-center mb-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center"><Calendar className="w-4 h-4 text-white" /></div>
                        <h4 className="text-base font-bold heading-bold text-gray-900 ml-2">Academic Period</h4>
                      </div>
                      <div className="space-y-2">
                        <div><p className="text-gray-600 text-xs font-semibold">Semester</p><p className="text-gray-900 font-bold text-sm">{searchResult.student.semester}</p></div>
                        <div><p className="text-gray-600 text-xs font-semibold">School Year</p><p className="text-gray-900 font-bold text-sm">{searchResult.student.schoolYear}</p></div>
                      </div>
                    </div>
                  </div>

                  {/* MODIFIED: Approval Timeline */}
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-200">
                    <div className="flex items-center mb-4">
                      <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center"><FileText className="w-4 h-4 text-white" /></div>
                      <h4 className="text-base font-bold heading-bold text-gray-900 ml-2">Approval Timeline</h4>
                    </div>
                    <div className="space-y-4">
                      <TimelineDescription status={searchResult.detailedStatus} />

                      {/* MODIFICATION: Display all steps, showing pending ones */}
                      {allRoles.map((role, index) => {
                          const approval = searchResult.approvals.find(a => a.role === role);
                          const { Icon, bgColorClass } = getApprovalStepPresentation(role, approval?.status);
                          
                          return (
                            <div key={index} className="flex items-start space-x-4">
                                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${bgColorClass}`}>
                                    {Icon}
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <h5 className="font-bold text-gray-900">{role}</h5>
                                        {approval && (
                                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                              approval.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                          }`}>
                                              {approval.status === 'approved' ? 'Approved' : 'Rejected'}
                                          </span>
                                        )}
                                        {!approval && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600">Pending</span>}
                                    </div>
                                    {approval?.remarks && <p className="text-sm text-gray-700 mt-1 italic">"{approval.remarks}"</p>}
                                    {approval ? 
                                      <p className="text-xs text-gray-500 mt-1">Processed by {approval.processedBy} on {approval.date}</p>
                                      : <p className="text-xs text-gray-500 mt-1">Awaiting review from this office.</p>
                                    }
                                </div>
                            </div>
                          );
                      })}
                    </div>
                  </div>

                  {/* MODIFIED: Action Buttons */}
                  <div className="flex flex-wrap gap-3 justify-center">
                    {searchResult.detailedStatus === 'Pending Payment' && (
                       <motion.button className="bg-gradient-to-r from-[var(--dominant-red)] to-red-600 text-white px-6 py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center space-x-2 text-sm" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                         <CreditCard className="w-4 h-4" />
                         <span>Proceed to Payment</span>
                       </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
       </motion.div>
    </div>
  );
};
export default CheckStatus;