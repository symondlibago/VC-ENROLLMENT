import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { studentAPI } from '@/services/api';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  GraduationCap,
  Calendar,
  Loader2,
  ArrowRight,
  ClipboardList,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Assuming you have a LoadingSpinner component
// import LoadingSpinner from '@/components/layout/LoadingSpinner'; 

const StudentEnrollmentEligibility = () => {
  // Initialize eligibility with a structure to prevent null errors
  const [eligibility, setEligibility] = useState({
      academic_status: 'Loading',
      message: '',
      next_term: { year: 'N/A', semester: 'N/A', schoolYear: 'N/A' },
      ungraded_subjects: [],
      retakeable_subjects: { failed: [], dropped: [] },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchEligibility = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await studentAPI.checkMyEnrollmentEligibility(); 
        if (response.success && response.status_data) {
             setEligibility(response.status_data);
        } else {
             setError(response.message || 'Failed to check eligibility status.');
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEligibility();
  }, []);

  const handleSubmitEnrollNow = () => {
      // NOTE: This is where you would redirect the student to the subject selection page
      setIsSubmitting(true);
      setTimeout(() => {
          setIsSubmitting(false);
          // Simulate navigation or success
          alert(`Enrollment initiated. Status: ${eligibility.academic_status}.`);
      }, 2000);
  };
  
  // --- Status Determination from State ---
  const statusType = eligibility.academic_status; // Now directly from the fetched data

  // Checks for button clickability and specific warnings
  const isButtonEnabled = statusType === 'Regular';
  const isButtonRedirecting = statusType === 'Irregular'; // Irregular can still proceed but maybe to a different selection step
  const isIneligible = statusType === 'Ineligible';

  const getStatusDisplay = () => {
    if (loading || statusType === 'Loading') return { text: 'Checking Eligibility...', icon: Loader2, color: 'text-gray-500', bg: 'bg-gray-100' };
    
    if (statusType === 'Regular') {
      return { text: 'Regular Student', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
    }
    
    if (statusType === 'Irregular') {
      return { text: 'Irregular Student', icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-100' };
    }
    
    if (statusType === 'Ineligible') {
      return { text: 'Ineligible to Enroll', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' };
    }
    
    return { text: 'Status Unknown', icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  const status = getStatusDisplay();
  const nextTermInfo = eligibility.next_term;
  const retakeableSubjects = eligibility.retakeable_subjects;
  
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };
  
  return (
    <motion.div
      className="p-6 max-w-7xl mx-auto space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <GraduationCap className="w-8 h-8 text-red-700 mr-3" />
          Enrollment Eligibility Check
        </h1>
        <p className="text-gray-600 mt-1">
          Review your academic standing to proceed with enrollment for the next term.
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className={`col-span-1 lg:col-span-2 shadow-xl border-t-4 ${statusType === 'Regular' ? 'border-green-700' : statusType === 'Irregular' ? 'border-yellow-700' : 'border-red-700'}`}>
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Enrollment Status</h2>
              {loading ? (
                  <Loader2 className="animate-spin w-8 h-8 text-red-800" />
              ) : (
                  <Badge className={`text-lg font-bold py-2 px-4 ${status.bg} ${status.color}`}>
                      <status.icon className={`w-5 h-5 mr-2 ${loading ? 'animate-pulse' : ''}`} />
                      {status.text}
                  </Badge>
              )}
            </div>

            <div className="border-t border-gray-200 pt-6 space-y-4">
              <h3 className="text-xl font-semibold text-gray-700 flex items-center">
                <Calendar className="w-5 h-5 mr-3 text-red-700" />
                Target Enrollment Term
              </h3>
              <div className="grid grid-cols-3 text-center border rounded-lg divide-x divide-gray-200 bg-gray-50">
                <div className="p-3">
                  <p className="text-xs font-medium text-gray-500">School Year</p>
                  <p className="text-lg font-semibold text-gray-900">{nextTermInfo.schoolYear}</p>
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium text-gray-500">Semester</p>
                  <p className="text-lg font-semibold text-gray-900">{nextTermInfo.semester}</p>
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium text-gray-500">Target Year Level</p>
                  <p className="text-lg font-semibold text-gray-900">{nextTermInfo.year}</p>
                </div>
              </div>
            </div>

            {/* --- Action Button and Warning Messages --- */}
            <div className="pt-6 border-t border-gray-100">
              {statusType === 'Regular' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-3">
                  <div className="flex items-center text-green-700 font-semibold">
                    <CheckCircle className="w-5 h-5 mr-3" />
                    <span>Congratulations! You are  Regular  and fully eligible to enroll.</span>
                  </div>
                  <Button onClick={handleSubmitEnrollNow} disabled={isSubmitting} className="w-full bg-red-800 hover:bg-red-700 text-white font-bold liquid-morph">
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <ArrowRight className="mr-2 h-5 w-5" />}
                    Enroll Now
                  </Button>
                </div>
              )}
              
              {statusType === 'Irregular' && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl space-y-3">
                  <div className="flex items-center text-yellow-700 font-semibold">
                    <AlertCircle className="w-5 h-5 mr-3" />
                    <span>Warning: You are Irregular. You must resolve your failed/dropped subjects.</span>
                  </div>
                  <Button disabled={true} className="w-full bg-gray-400 text-white font-bold cursor-not-allowed">
                    Enroll Now (Button Disabled)
                  </Button>
                  <p className='text-sm text-yellow-800 mt-2'>*Please contact the Program Head or Registrar to resolve your Irregular status before proceeding with enrollment.</p>
                </div>
              )}

              {isIneligible && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
                  <div className="flex items-center text-red-700 font-semibold">
                    <XCircle className="w-5 h-5 mr-3" />
                    <span>You are ineligible to enroll at this time.</span>
                  </div>
                  <p className="text-sm text-red-600">You must wait for the final grades of the following subjects:</p>
                  <ul className="list-disc list-inside text-sm text-red-600 space-y-1 bg-red-100 p-3 rounded-lg">
                      {eligibility.ungraded_subjects.map((sub, index) => (
                          <li key={index} className='font-mono'>{sub.subject_code} - {sub.descriptive_title}</li>
                      ))}
                  </ul>
                  <Button disabled className="w-full bg-gray-400 text-white font-bold cursor-not-allowed">
                    Enroll Now (Ineligible)
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* --- Sidebar for Retake Subjects (Only for Irregular Status) --- */}
        {(statusType === 'Irregular') && (
          <motion.div variants={itemVariants} className="col-span-1 space-y-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <ClipboardList className="w-6 h-6 mr-2 text-yellow-700" />
              Academic Issues to Resolve
            </h3>
            <Card className="bg-white p-4 border border-yellow-200">
                <div className="space-y-3">
                    <p className="text-sm text-gray-600">You have subjects to retake or drop actions to be processed:</p>
                    
                    {/* Failed Subjects */}
                    {retakeableSubjects.failed.map(sub => (
                        <div key={sub.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <Badge variant="destructive" className="mb-1">Failed</Badge>
                            <p className="font-semibold text-sm text-gray-800">{sub.subject_code}</p>
                            <p className="text-xs text-gray-600">{sub.descriptive_title}</p>
                        </div>
                    ))}
                    
                    {/* Dropped Subjects */}
                    {retakeableSubjects.dropped.map(sub => (
                        <div key={sub.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <Badge className="bg-yellow-200 text-yellow-800 mb-1 hover:bg-yellow-200">Dropped (Need to Retake)</Badge>
                            <p className="font-semibold text-sm text-gray-800">{sub.subject_code}</p>
                            <p className="text-xs text-gray-600">{sub.descriptive_title}</p>
                        </div>
                    ))}
                </div>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default StudentEnrollmentEligibility;