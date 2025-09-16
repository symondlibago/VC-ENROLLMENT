import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Search, 
  Filter,
  Plus,
  MoreVertical,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Share,
  Folder,
  File,
  Image,
  Video,
  Music,
  Archive,
  Star,
  Clock,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Documents = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  const documents = [
    {
      id: 1,
      name: 'Student Handbook 2024.pdf',
      type: 'pdf',
      size: '2.4 MB',
      category: 'handbook',
      uploadedBy: 'Admin User',
      uploadDate: '2024-01-20',
      lastModified: '2024-01-20',
      downloads: 156,
      isStarred: true,
      isShared: true,
      icon: FileText,
      color: 'text-red-600'
    },
    {
      id: 2,
      name: 'Course Curriculum - Mathematics.docx',
      type: 'docx',
      size: '1.8 MB',
      category: 'curriculum',
      uploadedBy: 'Dr. Sarah Johnson',
      uploadDate: '2024-01-19',
      lastModified: '2024-01-19',
      downloads: 89,
      isStarred: false,
      isShared: true,
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      id: 3,
      name: 'Enrollment Form Template.xlsx',
      type: 'xlsx',
      size: '0.5 MB',
      category: 'forms',
      uploadedBy: 'Emily Davis',
      uploadDate: '2024-01-18',
      lastModified: '2024-01-18',
      downloads: 234,
      isStarred: true,
      isShared: false,
      icon: FileText,
      color: 'text-green-600'
    },
    {
      id: 4,
      name: 'Campus Tour Video.mp4',
      type: 'mp4',
      size: '45.2 MB',
      category: 'media',
      uploadedBy: 'James Wilson',
      uploadDate: '2024-01-17',
      lastModified: '2024-01-17',
      downloads: 67,
      isStarred: false,
      isShared: true,
      icon: Video,
      color: 'text-purple-600'
    },
    {
      id: 5,
      name: 'Graduation Ceremony Photos',
      type: 'folder',
      size: '125 items',
      category: 'media',
      uploadedBy: 'Lisa Anderson',
      uploadDate: '2024-01-16',
      lastModified: '2024-01-16',
      downloads: 198,
      isStarred: true,
      isShared: true,
      icon: Folder,
      color: 'text-yellow-600'
    },
    {
      id: 6,
      name: 'Policy Documents Archive.zip',
      type: 'zip',
      size: '12.7 MB',
      category: 'policies',
      uploadedBy: 'David Brown',
      uploadDate: '2024-01-15',
      lastModified: '2024-01-15',
      downloads: 123,
      isStarred: false,
      isShared: false,
      icon: Archive,
      color: 'text-orange-600'
    },
    {
      id: 7,
      name: 'Course Schedule Template.pdf',
      type: 'pdf',
      size: '0.8 MB',
      category: 'templates',
      uploadedBy: 'Admin User',
      uploadDate: '2024-01-14',
      lastModified: '2024-01-14',
      downloads: 89,
      isStarred: false,
      isShared: true,
      icon: FileText,
      color: 'text-red-600'
    },
    {
      id: 8,
      name: 'Student Assessment Rubric.docx',
      type: 'docx',
      size: '1.2 MB',
      category: 'assessment',
      uploadedBy: 'Prof. Michael Chen',
      uploadDate: '2024-01-13',
      lastModified: '2024-01-13',
      downloads: 156,
      isStarred: true,
      isShared: true,
      icon: FileText,
      color: 'text-blue-600'
    }
  ];

  const stats = [
    {
      title: 'Total Documents',
      value: '1,247',
      change: '+12.5%',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Storage Used',
      value: '2.4 GB',
      change: '+8.2%',
      icon: Archive,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Shared Files',
      value: '456',
      change: '+23.1%',
      icon: Share,
      color: 'text-[var(--dominant-red)]',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Downloads',
      value: '8.9K',
      change: '+15.4%',
      icon: Download,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  const folders = [
    { name: 'Course Materials', count: 45, icon: Folder, color: 'text-blue-600' },
    { name: 'Student Records', count: 234, icon: Folder, color: 'text-green-600' },
    { name: 'Administrative', count: 67, icon: Folder, color: 'text-purple-600' },
    { name: 'Media Files', count: 89, icon: Folder, color: 'text-orange-600' }
  ];

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
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.23, 1, 0.32, 1]
      }
    }
  };

  const getFileTypeColor = (type) => {
    switch (type) {
      case 'pdf':
        return 'bg-red-100 text-red-800';
      case 'docx':
        return 'bg-blue-100 text-blue-800';
      case 'xlsx':
        return 'bg-green-100 text-green-800';
      case 'mp4':
        return 'bg-purple-100 text-purple-800';
      case 'zip':
        return 'bg-orange-100 text-orange-800';
      case 'folder':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'handbook':
        return 'bg-blue-100 text-blue-800';
      case 'curriculum':
        return 'bg-green-100 text-green-800';
      case 'forms':
        return 'bg-purple-100 text-purple-800';
      case 'media':
        return 'bg-pink-100 text-pink-800';
      case 'policies':
        return 'bg-orange-100 text-orange-800';
      case 'templates':
        return 'bg-yellow-100 text-yellow-800';
      case 'assessment':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <motion.div
      className="p-6 space-y-6 max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="animate-fade-in">
        <div className="gradient-soft rounded-2xl p-8 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold heading-bold text-gray-900 mb-2 flex items-center">
                <FileText className="w-8 h-8 text-[var(--dominant-red)] mr-3" />
                Document Management
              </h1>
              <p className="text-gray-600 text-lg">
                Organize, share, and manage all your educational documents and files.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="liquid-button">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
              <Button className="gradient-primary text-white liquid-button">
                <Plus className="w-4 h-4 mr-2" />
                New Folder
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              whileHover={{ scale: 1.02 }}
              className="liquid-hover"
            >
              <Card className="card-hover border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold heading-bold text-gray-900">
                        {stat.value}
                      </p>
                      <p className="text-sm text-green-600 font-medium mt-1">
                        {stat.change}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Quick Access Folders */}
      <motion.div variants={itemVariants}>
        <Card className="card-hover border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold heading-bold">Quick Access</CardTitle>
            <CardDescription>Frequently used folders and collections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {folders.map((folder, index) => {
                const Icon = folder.icon;
                return (
                  <motion.button
                    key={folder.name}
                    className="p-4 rounded-xl border border-gray-200 hover:border-[var(--dominant-red)] liquid-morph text-left group"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-8 h-8 ${folder.color}`} />
                      <div>
                        <h3 className="font-medium text-gray-900">{folder.name}</h3>
                        <p className="text-sm text-gray-500">{folder.count} items</p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search and Filter Section */}
      <motion.div variants={itemVariants}>
        <Card className="card-hover border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search documents by name or author..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 liquid-morph"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:border-[var(--dominant-red)] focus:ring-[var(--dominant-red)] liquid-morph"
                >
                  <option value="all">All Categories</option>
                  <option value="handbook">Handbook</option>
                  <option value="curriculum">Curriculum</option>
                  <option value="forms">Forms</option>
                  <option value="media">Media</option>
                  <option value="policies">Policies</option>
                  <option value="templates">Templates</option>
                  <option value="assessment">Assessment</option>
                </select>
                
                <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 text-sm font-medium liquid-morph ${
                      viewMode === 'grid' 
                        ? 'bg-[var(--dominant-red)] text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 text-sm font-medium liquid-morph ${
                      viewMode === 'list' 
                        ? 'bg-[var(--dominant-red)] text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    List
                  </button>
                </div>

                <Button variant="outline" className="liquid-button">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Documents Grid/List */}
      <motion.div variants={itemVariants}>
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDocuments.map((doc, index) => {
              const Icon = doc.icon;
              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: {
                      duration: 0.6,
                      delay: index * 0.1,
                      ease: [0.23, 1, 0.32, 1]
                    }
                  }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="liquid-hover"
                >
                  <Card className="card-hover border-0 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-8 h-8 ${doc.color}`} />
                          {doc.isStarred && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="liquid-button">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share className="mr-2 h-4 w-4" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="mb-4">
                        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{doc.name}</h3>
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={`${getFileTypeColor(doc.type)} text-xs`}>
                            {doc.type ? doc.type.toUpperCase() : 'UNKNOWN'}
                          </Badge>
                          <Badge className={`${getCategoryColor(doc.category)} text-xs`}>
                            {doc.category}
                          </Badge>
                          {doc.isShared && (
                            <Share className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center justify-between">
                          <span>Size</span>
                          <span className="font-medium">{doc.size}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Downloads</span>
                          <span className="font-medium">{doc.downloads}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span className="text-xs">{doc.uploadedBy}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">{doc.uploadDate}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-2">
                          <Button size="sm" className="flex-1 gradient-primary text-white liquid-button">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="liquid-button">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card className="card-hover border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="space-y-1">
                {filteredDocuments.map((doc, index) => {
                  const Icon = doc.icon;
                  return (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ 
                        opacity: 1, 
                        x: 0,
                        transition: {
                          duration: 0.6,
                          delay: index * 0.05,
                          ease: [0.23, 1, 0.32, 1]
                        }
                      }}
                      whileHover={{ scale: 1.01, x: 4 }}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 liquid-morph border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <Icon className={`w-6 h-6 ${doc.color}`} />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900">{doc.name}</h3>
                            {doc.isStarred && (
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            )}
                            {doc.isShared && (
                              <Share className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span>{doc.uploadedBy}</span>
                            <span>{doc.uploadDate}</span>
                            <span>{doc.size}</span>
                            <span>{doc.downloads} downloads</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={`${getFileTypeColor(doc.type)} text-xs`}>
                          {doc.type.toUpperCase()}
                        </Badge>
                        <Badge className={`${getCategoryColor(doc.category)} text-xs`}>
                          {doc.category}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="liquid-button">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share className="mr-2 h-4 w-4" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Empty State */}
      {filteredDocuments.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="text-center py-12"
        >
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria.</p>
          <Button className="gradient-primary text-white liquid-button">
            <Upload className="w-4 h-4 mr-2" />
            Upload First Document
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Documents;

