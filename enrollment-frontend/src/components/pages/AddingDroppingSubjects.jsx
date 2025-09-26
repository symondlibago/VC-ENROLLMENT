import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { subjectChangeAPI, authAPI } from '@/services/api';
import { Search, ChevronDown, Plus, Minus, Undo2, X, Save, Loader2, User, Book, Hash, PlusCircle, MinusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Modal Sub-Component for Viewing Details
const SubjectChangeDetailsModal = ({ isOpen, onClose, requestDetails, currentUserRole, onStatusChange }) => {
    const [remarks, setRemarks] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setRemarks(''); // Reset remarks when a new request is opened
    }, [requestDetails]);

    if (!isOpen || !requestDetails) return null;

    const { student, items, status } = requestDetails;
    const addedSubjects = items.filter(item => item.action === 'add');
    const droppedSubjects = items.filter(item => item.action === 'drop');

    const handleProcessRequest = async (newStatus) => {
        setIsSaving(true);
        try {
            await subjectChangeAPI.processRequest(requestDetails.id, {
                status: newStatus,
                remarks: remarks,
            });
            toast.success(`Request has been ${newStatus}.`);
            onStatusChange(); // This will trigger a refresh in the parent component
            onClose();
        } catch (error) {
            toast.error(error.message || 'Failed to process the request.');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };
    
    // Determine if the current user can take action
    const canApprove = 
        (status === 'pending_program_head' && currentUserRole === 'Program Head') ||
        (status === 'pending_cashier' && currentUserRole === 'Cashier') ||
        currentUserRole === 'Admin';
    
    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending_program_head': return <Badge variant="secondary">Pending Program Head</Badge>;
            case 'pending_cashier': return <Badge className="bg-yellow-100 text-yellow-800">Pending Cashier</Badge>;
            case 'approved': return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
            case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };
    
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                    >
                        <div className="sticky top-0 bg-gray-50 z-10 flex items-center justify-between p-4 border-b">
                            <div>
                                <h2 className="text-xl font-semibold">Subject Change Details</h2>
                                {getStatusBadge(status)}
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8"><X size={20} /></Button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto">
                            <div className="border rounded-lg p-4 bg-gray-50/50">
                                <h3 className="font-semibold mb-2">Student Information</h3>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                    <p className="flex items-center"><User size={14} className="mr-2 text-gray-500" /> <b>Name:</b> &nbsp;{student.last_name}, {student.first_name}</p>
                                    <p className="flex items-center"><Hash size={14} className="mr-2 text-gray-500" /> <b>ID Number:</b> &nbsp;{student.student_id_number}</p>
                                    <p className="flex items-center col-span-2"><Book size={14} className="mr-2 text-gray-500" /> <b>Course:</b> &nbsp;{student.course?.course_name}</p>
                                </div>
                            </div>
                            
                            {addedSubjects.length > 0 && (
                                <div className="border rounded-lg p-4">
                                    <h3 className="font-semibold mb-2 text-green-600 flex items-center"><PlusCircle size={16} className="mr-2"/>Subjects to be Added</h3>
                                    <ul className="space-y-1 list-disc list-inside text-sm">
                                        {addedSubjects.map(item => <li key={item.id}>{item.subject.subject_code} - {item.subject.descriptive_title}</li>)}
                                    </ul>
                                </div>
                            )}

                            {droppedSubjects.length > 0 && (
                                <div className="border rounded-lg p-4">
                                    <h3 className="font-semibold mb-2 text-red-600 flex items-center"><MinusCircle size={16} className="mr-2"/>Subjects to be Dropped</h3>
                                    <ul className="space-y-1 list-disc list-inside text-sm">
                                        {droppedSubjects.map(item => <li key={item.id}>{item.subject.subject_code} - {item.subject.descriptive_title}</li>)}
                                    </ul>
                                </div>
                            )}

                            {canApprove && (
                                <div className="border rounded-lg p-4 bg-gray-50">
                                    <h3 className="font-semibold mb-2">Approval Action ({currentUserRole})</h3>
                                    <div className="space-y-3">
                                        <Label htmlFor="remarks">Remarks (Optional)</Label>
                                        <Textarea id="remarks" placeholder="Add remarks for rejection or approval..." value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                                        <div className="flex justify-end gap-3">
                                            <Button variant="destructive" onClick={() => handleProcessRequest('rejected')} disabled={isSaving}>
                                                {isSaving ? <Loader2 className="animate-spin" /> : 'Reject'}
                                            </Button>
                                            <Button onClick={() => handleProcessRequest('approved')} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                                                {isSaving ? <Loader2 className="animate-spin" /> : 'Approve'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


// Main Component
const yearOptions = ['All Years', '1st Year', '2nd Year', '3rd Year', '4th Year'];
const semesterOptions = ['All Semesters', '1st Semester', '2nd Semester'];

const AddingDroppingSubjects = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [allEnrolledSubjects, setAllEnrolledSubjects] = useState([]);
  const [allAvailableSubjects, setAllAvailableSubjects] = useState([]);
  const [subjectsToAdd, setSubjectsToAdd] = useState([]);
  const [subjectsToDrop, setSubjectsToDrop] = useState([]);
  const [yearFilter, setYearFilter] = useState('All Years');
  const [semesterFilter, setSemesterFilter] = useState('All Semesters');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [changeRequests, setChangeRequests] = useState([]);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    setCurrentUser(authAPI.getUserData());
  }, []);

  const fetchChangeRequests = useCallback(async () => {
    try {
      const response = await subjectChangeAPI.getAllRequests();
      if (response.success) setChangeRequests(response.data);
    } catch (error) { console.error("Failed to fetch change requests:", error); }
  }, []);

  useEffect(() => { fetchChangeRequests(); }, [fetchChangeRequests]);

  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }
    const handler = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await subjectChangeAPI.searchStudents(searchTerm);
        if (response.success) setSearchResults(response.data);
      } catch (error) { console.error("Search failed:", error); setSearchResults([]); }
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setSearchTerm('');
    setSearchResults([]);
    setSubjectsToAdd([]);
    setSubjectsToDrop([]);
    setYearFilter('All Years');
    setSemesterFilter('All Semesters');
    setIsLoading(true);
    try {
      const response = await subjectChangeAPI.getStudentSubjectDetails(student.id);
      if (response.success) {
        setAllEnrolledSubjects(response.data.enrolled);
        setAllAvailableSubjects(response.data.available);
      }
    } catch (error) { console.error("Failed to fetch student details:", error); }
    setIsLoading(false);
  };
  
  const subjectsToDropIds = useMemo(() => new Set(subjectsToDrop.map(s => s.id)), [subjectsToDrop]);
  const subjectsToAddIds = useMemo(() => new Set(subjectsToAdd.map(s => s.id)), [subjectsToAdd]);

  const displayedEnrolledSubjects = useMemo(() => {
    return allEnrolledSubjects.filter(subject => !subjectsToDropIds.has(subject.id));
  }, [allEnrolledSubjects, subjectsToDropIds]);

  const filteredAvailableSubjects = useMemo(() => {
    return allAvailableSubjects
      .filter(subject => !subjectsToAddIds.has(subject.id))
      .filter(subject =>
        (yearFilter === 'All Years' || subject.year === yearFilter) &&
        (semesterFilter === 'All Semesters' || subject.semester === semesterFilter)
      );
  }, [allAvailableSubjects, yearFilter, semesterFilter, subjectsToAddIds]);

  const handleAddSubject = (subject) => setSubjectsToAdd([...subjectsToAdd, subject]);
  const handleDropSubject = (subject) => setSubjectsToDrop([...subjectsToDrop, subject]);
  const handleUndoAdd = (subjectToUndo) => setSubjectsToAdd(subjectsToAdd.filter(s => s.id !== subjectToUndo.id));
  const handleUndoDrop = (subjectToUndo) => setSubjectsToDrop(subjectsToDrop.filter(s => s.id !== subjectToUndo.id));

  const handleSaveChanges = async () => {
    if (!selectedStudent || (subjectsToAdd.length === 0 && subjectsToDrop.length === 0)) return;
    setIsSaving(true);
    try {
        const payload = {
            student_id: selectedStudent.id,
            subjects_to_add: subjectsToAdd.map(s => s.id),
            subjects_to_drop: subjectsToDrop.map(s => s.id),
        };
        const response = await subjectChangeAPI.createRequest(payload);
        if (response.success) {
            toast.success('Changes submitted for approval successfully!');
            fetchChangeRequests();
            await handleSelectStudent(selectedStudent);
        }
    } catch (error) {
        toast.error('Error: Failed to submit changes.');
    } finally { setIsSaving(false); }
  };

  const handleViewDetails = async (requestId) => {
    try {
      const response = await subjectChangeAPI.getRequestDetails(requestId);
      if (response.success) {
        setSelectedRequest(response.data);
        setIsDetailsModalOpen(true);
      } else { toast.error('Failed to fetch request details.'); }
    } catch (error) { toast.error('An error occurred while fetching details.'); }
  };

  return (
    <>
      <div className="p-6 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Student Subject Management</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search student by ID, first name, or last name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                  {searchResults.map(student => (
                    <div key={student.id} onClick={() => handleSelectStudent(student)} className="p-2 cursor-pointer hover:bg-gray-100">
                      {student.last_name}, {student.first_name} ({student.student_id_number})
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardHeader>
          {selectedStudent && (
            <CardContent>
              <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-bold text-lg">{selectedStudent.last_name}, {selectedStudent.first_name}</h3>
                  <p className="text-sm text-gray-600">{selectedStudent.student_id_number} • {selectedStudent.course.course_name}</p>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-48 justify-between">{yearFilter} <ChevronDown className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>{yearOptions.map(year => (<DropdownMenuItem key={year} onSelect={() => setYearFilter(year)}>{year}</DropdownMenuItem>))}</DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-48 justify-between">{semesterFilter} <ChevronDown className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>{semesterOptions.map(sem => (<DropdownMenuItem key={sem} onSelect={() => setSemesterFilter(sem)}>{sem}</DropdownMenuItem>))}</DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold mb-2">Available Subjects ({filteredAvailableSubjects.length})</h3>
                  <div className="border rounded-md max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Title</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {filteredAvailableSubjects.map(subject => (
                          <TableRow key={subject.id}>
                            <TableCell>{subject.subject_code}</TableCell>
                            <TableCell>{subject.descriptive_title}</TableCell>
                            <TableCell><Button size="sm" onClick={() => handleAddSubject(subject)}><Plus className="h-4 w-4 mr-1"/> Add</Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold mb-2">Enrolled Subjects ({displayedEnrolledSubjects.length})</h3>
                  <div className="border rounded-md max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Title</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {displayedEnrolledSubjects.map(subject => (
                          <TableRow key={subject.id}>
                            <TableCell>{subject.subject_code}</TableCell>
                            <TableCell>{subject.descriptive_title}</TableCell>
                            <TableCell><Button size="sm" variant="destructive" onClick={() => handleDropSubject(subject)}><Minus className="h-4 w-4 mr-1"/> Drop</Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t">
                  { (subjectsToAdd.length > 0 || subjectsToDrop.length > 0) &&
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md space-y-2">
                          <h4 className="font-bold text-blue-800">Pending Changes:</h4>
                          {subjectsToAdd.map(subject => (
                              <div key={`add-${subject.id}`} className="flex items-center justify-between text-sm text-green-700">
                                  <span><b>Adding:</b> {subject.subject_code} - {subject.descriptive_title}</span>
                                  <Button size="sm" variant="ghost" onClick={() => handleUndoAdd(subject)} className="h-6 w-6 p-0"><Undo2 className="h-4 w-4"/></Button>
                              </div>
                          ))}
                          {subjectsToDrop.map(subject => (
                               <div key={`drop-${subject.id}`} className="flex items-center justify-between text-sm text-red-700">
                                  <span><b>Dropping:</b> {subject.subject_code} - {subject.descriptive_title}</span>
                                  <Button size="sm" variant="ghost" onClick={() => handleUndoDrop(subject)} className="h-6 w-6 p-0"><Undo2 className="h-4 w-4"/></Button>
                              </div>
                          ))}
                      </div>
                  }
                  <Button onClick={handleSaveChanges} disabled={isSaving || (subjectsToAdd.length === 0 && subjectsToDrop.length === 0)} className="w-full">
                      {isSaving ? 'Submitting...' : 'Submit Changes for Approval'}
                  </Button>
              </div>
            </CardContent>
          )}
        </Card>
        <Card>
          <CardHeader><CardTitle>Subject Change Requests</CardTitle></CardHeader>
          <CardContent>
              <Table>
                  <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                  <TableBody>
                      {changeRequests.map(req => (
                          <TableRow key={req.id}>
                              <TableCell>{req.student?.last_name}, {req.student?.first_name}</TableCell>
                              <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
                              <TableCell>{req.status.replace(/_/g, ' ').toUpperCase()}</TableCell>
                              <TableCell><Button variant="outline" size="sm" onClick={() => handleViewDetails(req.id)}>View Details</Button></TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </CardContent>
        </Card>
      </div>
      <SubjectChangeDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        requestDetails={selectedRequest}
        currentUserRole={currentUser?.role}
        onStatusChange={() => {
          fetchChangeRequests();
        }}
      />
    </>
  );
};

export default AddingDroppingSubjects;