import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Search, User, BookOpen, UploadCloud, X, RefreshCw, AlertCircle, CheckCircle, CreditCard 
} from 'lucide-react';
import { uploadReceiptAPI } from '@/services/api'; // Ensure the path is correct

const UploadReceipt = ({ onBack }) => {
  // --- FIX: Add all state declarations here ---
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadMessage, setUploadMessage] = useState({ type: '', text: '' });
  const [previewUrl, setPreviewUrl] = useState(null);
  // -----------------------------------------

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    }
  };
  
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    setError(null);
    setSearchResults([]);
    setSelectedStudent(null);
    try {
      const response = await uploadReceiptAPI.searchStudents(searchTerm.trim());
      if (response.success && response.data.length > 0) {
        setSearchResults(response.data);
      } else {
        setError('No students found matching your search who are pending payment.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during search.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setSearchResults([]);
    setSearchTerm('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setReceiptFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setUploadMessage({ type: '', text: '' });
    } else {
      setReceiptFile(null);
      setPreviewUrl(null);
      setUploadMessage({ type: 'error', text: 'Please select a valid image file.' });
    }
  };
  
  const handleSubmitReceipt = async () => {
    if (!receiptFile || !selectedStudent) return;
    setIsUploading(true);
    setUploadMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('student_id', selectedStudent.id);
    formData.append('receipt_photo', receiptFile);

    try {
      const response = await uploadReceiptAPI.upload(formData);
      if (response.success) {
        setUploadMessage({ type: 'success', text: response.message });
        setReceiptFile(null);
        setPreviewUrl(null);
        setTimeout(() => {
          setSelectedStudent(null);
          setUploadMessage({ type: '', text: '' });
        }, 3000);
      } else {
        setUploadMessage({ type: 'error', text: response.message || 'Upload failed.' });
      }
    } catch (err) {
      const errorMessage = err.errors ? Object.values(err.errors).flat().join(' ') : (err.message || 'An error occurred during upload.');
      setUploadMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsUploading(false);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 }}};
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 }}};

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--snowy-white)] via-[var(--whitish-pink)] to-white">
      <motion.div className="fixed top-4 left-4 z-50" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        {onBack && <button onClick={handleBackClick} className="bg-white/90 backdrop-blur-sm text-[var(--dominant-red)] p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"><ArrowLeft className="w-5 h-5" /></button>}
      </motion.div>
      <motion.div className="container mx-auto px-4 py-8 max-w-2xl" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div className="text-center mb-8" variants={itemVariants}>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[var(--dominant-red)] to-red-600 rounded-2xl flex items-center justify-center shadow-xl">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold heading-bold text-gray-900">Upload Enrollment Receipt</h1>
          <p className="text-gray-600 mt-2">Search for the student and upload their payment receipt.</p>
        </motion.div>
        <motion.div variants={itemVariants}>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="space-y-4">
              <div>
                <label className="text-gray-800 text-base font-bold heading-bold mb-2 flex items-center">
                  <User className="w-4 h-4 mr-2 text-[var(--dominant-red)]" />
                  Find Student by Name
                </label>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    placeholder="Enter student's last name or first name" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-grow bg-gray-50 border-2 border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:border-[var(--dominant-red)] transition-all font-semibold"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <motion.button 
                    onClick={handleSearch} 
                    disabled={!searchTerm.trim() || isSearching} 
                    className="bg-gradient-to-r from-[var(--dominant-red)] to-red-600 text-white py-3 px-5 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center"
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}
                  >
                    {isSearching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  </motion.button>
                </div>
              </div>
              <AnimatePresence>
                {(isSearching || searchResults.length > 0 || error) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gray-50 rounded-lg border border-gray-200 mt-2 overflow-hidden"
                  >
                    {isSearching && <p className="p-4 text-center text-gray-600">Searching...</p>}
                    {error && <p className="p-4 text-center text-red-600">{error}</p>}
                    {searchResults.length > 0 && (
                      <ul className="max-h-60 overflow-y-auto divide-y divide-gray-200">
                        {searchResults.map((student) => (
                          <li 
                            key={student.id} 
                            onClick={() => handleSelectStudent(student)}
                            className="p-3 hover:bg-red-50 cursor-pointer transition-colors"
                          >
                            <p className="font-bold text-gray-800">{student.fullName}</p>
                            <p className="text-sm text-gray-500">{student.course} - {student.referenceNumber}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
        <AnimatePresence>
          {selectedStudent && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="mt-8"
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-bold heading-bold text-gray-900 mb-4 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-[var(--dominant-red)]" />
                    Student Details
                  </h3>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-600">Full Name</p>
                      <p className="font-bold text-gray-900">{selectedStudent.fullName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600">Reference No.</p>
                      <p className="font-bold text-gray-900">{selectedStudent.referenceNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600">Course</p>
                      <p className="font-bold text-gray-900">{selectedStudent.course}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600">Academic Period</p>
                      <p className="font-bold text-gray-900">{selectedStudent.semester}, {selectedStudent.schoolYear}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold heading-bold text-gray-900 mb-4 flex items-center">
                    <UploadCloud className="w-5 h-5 mr-2 text-[var(--dominant-red)]" />
                    Upload Receipt
                  </h3>
                  {previewUrl ? (
                    <div className="relative text-center">
                      <img src={previewUrl} alt="Receipt Preview" className="max-h-60 w-auto mx-auto rounded-lg border border-gray-300 shadow-md" />
                      <button 
                        onClick={() => { setReceiptFile(null); setPreviewUrl(null); }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[var(--dominant-red)] hover:bg-red-50 transition-colors"
                      onClick={() => document.getElementById('receipt-upload').click()}
                    >
                      <input type="file" id="receipt-upload" className="hidden" accept="image/*" onChange={handleFileChange} />
                      <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">Click or drag file to upload</p>
                      <p className="text-xs text-gray-500">PNG, JPG, etc. up to 5MB</p>
                    </div>
                  )}
                </div>
                {uploadMessage.text && (
                  <div className={`p-3 rounded-lg flex items-center text-sm ${
                    uploadMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {uploadMessage.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
                    {uploadMessage.text}
                  </div>
                )}
                <motion.button 
                  onClick={handleSubmitReceipt} 
                  disabled={!receiptFile || isUploading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3 px-5 rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  whileHover={{ scale: (receiptFile && !isUploading) ? 1.02 : 1 }}
                  whileTap={{ scale: (receiptFile && !isUploading) ? 0.98 : 1 }}
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Submit Receipt</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default UploadReceipt;