import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { enrollmentAPI } from '../../services/api';

const StudentDetailsModal = ({ isOpen, onClose, studentId }) => {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && studentId) {
      fetchStudentDetails();
    }
  }, [isOpen, studentId]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await enrollmentAPI.getStudentDetails(studentId);
      
      if (response.success) {
        setStudent(response.data.student);
        // Make sure we're getting the subjects from the API response
        setSubjects(response.data.subjects || []);
        console.log('Student details:', response.data);
      } else {
        setError('Failed to load student details');
      }
    } catch (error) {
      setError(error.message || 'An error occurred while fetching student details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-red-800 text-white z-10 flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Student Details</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:text-red-800 hover:bg-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center p-4">{error}</div>
          ) : student ? (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-xl font-medium mb-3 text-black">BASIC INFORMATION</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{student.last_name}, {student.first_name} {student.middle_name || ''}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email Address</p>
                    <p className="font-medium">{student.email_address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Number</p>
                    <p className="font-medium">{student.contact_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="font-medium">{student.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Birth Date</p>
                    <p className="font-medium">{new Date(student.birth_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Birth Place</p>
                    <p className="font-medium">{student.birth_place}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nationality</p>
                    <p className="font-medium">{student.nationality}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Civil Status</p>
                    <p className="font-medium">{student.civil_status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Religion</p>
                    <p className="font-medium">{student.religion || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{student.address}</p>
                  </div>
                </div>
              </div>

              {/* Enrollment Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3 text-black">ENROLLMENT INFORMATION</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Course</p>
                    <p className="font-medium">{student.course ? student.course.course_name : 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Enrollment Type</p>
                    <p className="font-medium">{student.enrollment_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Semester</p>
                    <p className="font-medium">{student.semester}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">School Year</p>
                    <p className="font-medium">{student.school_year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Enrollment Date</p>
                    <p className="font-medium">{new Date(student.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Enrollment Code</p>
                    <p className="font-medium">{student.enrollmentCode?.code || 'Not available'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Program</p>
                    <p className="font-medium">{student.course && student.course.program ? student.course.program.program_name : 'Not available'}</p>
                  </div>
                </div>
              </div>
              

              {/* Approval Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3 text-black">APPROVAL STATUS</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Program Head</p>
                    <p className={`font-medium ${student.program_head_approved ? 'text-green-600' : 'text-yellow-600'}`}>
                      {student.program_head_approved ? 'Approved' : 'Pending'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Registrar</p>
                    <p className={`font-medium ${student.registrar_approved ? 'text-green-600' : 'text-yellow-600'}`}>
                      {student.registrar_approved ? 'Approved' : 'Pending'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cashier</p>
                    <p className={`font-medium ${student.cashier_approved ? 'text-green-600' : 'text-yellow-600'}`}>
                      {student.cashier_approved ? 'Approved' : 'Pending'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Selected Subjects */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3 text-black">SELECTED SUBJECTS</h3>
                {subjects.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Code</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descriptive Title</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {subjects.map((subject) => (
                          <tr key={subject.id}>
                            <td className="px-4 py-2 whitespace-nowrap">{subject.subject_code}</td>
                            <td className="px-4 py-2 whitespace-nowrap">{subject.descriptive_title}</td>
                            <td className="px-4 py-2 whitespace-nowrap">{subject.total_units}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">No subjects selected</p>
                )}
              </div>

              {/* Parent/Guardian Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3 text-black">PARENT/GUARDIAN INFORMATION</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Father's Name</p>
                    <p className="font-medium">{student.father_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Father's Occupation</p>
                    <p className="font-medium">{student.father_occupation || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Father's Contact</p>
                    <p className="font-medium">{student.father_contact_number || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Mother's Name</p>
                    <p className="font-medium">{student.mother_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Mother's Occupation</p>
                    <p className="font-medium">{student.mother_occupation || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Mother's Contact</p>
                    <p className="font-medium">{student.mother_contact_number || 'Not specified'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Parents' Address</p>
                    <p className="font-medium">{student.parents_address || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3 text-black">EMERGENCY CONTACT</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{student.emergency_contact_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Number</p>
                    <p className="font-medium">{student.emergency_contact_number}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{student.emergency_contact_address}</p>
                  </div>
                </div>
              </div>

              {/* Educational Background with Images */}
<div className="bg-gray-50 p-4 rounded-lg">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Left Side: Educational Background Header + Details */}
    <div>
      <h3 className="text-lg font-semibold mb-3 text-black border-b pb-1">
        EDUCATIONAL BACKGROUND
      </h3>
      <div className="space-y-4">
        {student.elementary && (
          <div>
            <p className="text-sm font-medium">Elementary</p>
            <p className="text-sm">{student.elementary}</p>
            <p className="text-xs text-gray-500">Completed: {student.elementary_date_completed || 'Not specified'}</p>
          </div>
        )}
        {student.junior_high_school && (
          <div>
            <p className="text-sm font-medium">Junior High School</p>
            <p className="text-sm">{student.junior_high_school}</p>
            <p className="text-xs text-gray-500">Completed: {student.junior_high_date_completed || 'Not specified'}</p>
          </div>
        )}
        {student.senior_high_school && (
          <div>
            <p className="text-sm font-medium">Senior High School</p>
            <p className="text-sm">{student.senior_high_school}</p>
            <p className="text-xs text-gray-500">Completed: {student.senior_high_date_completed || 'Not specified'}</p>
          </div>
        )}
        {student.high_school_non_k12 && (
          <div>
            <p className="text-sm font-medium">High School (Non-K12)</p>
            <p className="text-sm">{student.high_school_non_k12}</p>
            <p className="text-xs text-gray-500">Completed: {student.high_school_non_k12_date_completed || 'Not specified'}</p>
          </div>
        )}
        {student.college && (
          <div>
            <p className="text-sm font-medium">College</p>
            <p className="text-sm">{student.college}</p>
            <p className="text-xs text-gray-500">Completed: {student.college_date_completed || 'Not specified'}</p>
          </div>
        )}
      </div>
    </div>

    {/* Right Side: Header + ID Photo & Signature Side by Side */}
    <div>
      <h3 className="text-lg font-semibold mb-3 text-black border-b pb-1 text-right">
        IDENTIFICATION & SIGNATURE
      </h3>
      <div className="flex justify-end gap-4">
        {student.id_photo_url && (
          <div className="w-40 h-40 border rounded-lg overflow-hidden shadow-md">
            <img src={student.id_photo_url} alt="ID Photo" className="w-full h-full object-cover" />
          </div>
        )}
        {student.signature_url && (
          <div className="w-40 h-40 border rounded-lg overflow-hidden shadow-md">
            <img src={student.signature_url} alt="Signature" className="w-full h-full object-contain" />
          </div>
        )}
      </div>
    </div>
  </div>
</div>



            </div>
          ) : (
            <div className="text-center p-4">No student data found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDetailsModal;