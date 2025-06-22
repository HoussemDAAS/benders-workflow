import React, { useState, useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../styles/quill-custom.css';
import { 
  X, 
  Link2, 
  Image, 
  FileText, 
  Save, 
  Upload,
  Trash2,
  ExternalLink,
  Download,
  Plus,
  Edit2,
  Menu,
  ChevronLeft
} from 'lucide-react';
import { KanbanTask } from '../types';
import { taskResourceService, TaskResource } from '../services/taskResourceService';

interface TaskResourceEditorProps {
  task: KanbanTask;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (taskId: string, resources: TaskResource[]) => void;
}

export function TaskResourceEditor({ task, isOpen, onClose, onSave }: TaskResourceEditorProps) {
  const [resources, setResources] = useState<TaskResource[]>([]);
  const [activeResource, setActiveResource] = useState<TaskResource | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editableTitle, setEditableTitle] = useState('');
  const [editingSidebarResourceId, setEditingSidebarResourceId] = useState<string | null>(null);
  const [sidebarEditTitle, setSidebarEditTitle] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default to closed on mobile
  
  const quillRef = useRef<ReactQuill>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quill modules configuration
  const modules = {
    toolbar: [
      [{ 'header': ['1', '2', '3', false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      [{ 'align': [] }],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ],
  };

  const formats = [
    'header', 'bold', 'italic', 'underline',
    'list', 'bullet', 'blockquote', 'code-block',
    'link', 'image', 'align', 'color', 'background'
  ];

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true); // Always open on desktop
      } else {
        setIsSidebarOpen(false); // Closed by default on mobile
      }
    };

    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load resources for the task
  useEffect(() => {
    if (isOpen && task) {
      loadResources();
    }
  }, [isOpen, task]);

  // Update editor content when active resource changes
  useEffect(() => {
    if (activeResource) {
      setEditorContent(activeResource.content || '');
    }
  }, [activeResource]);

  // Add keyboard shortcut for saving (Cmd+S / Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && activeResource?.type === 'document' && isEditing) {
        e.preventDefault();
        handleSaveResource();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, activeResource, isEditing]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const taskResources = await taskResourceService.getTaskResources(task.id);
      setResources(taskResources);
      if (taskResources.length > 0) {
        setActiveResource(taskResources[0]);
        setEditorContent(taskResources[0].content || '');
      } else {
        setActiveResource(null);
        setEditorContent('');
      }
    } catch (error) {
      console.error('Failed to load task resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (content: string) => {
    setEditorContent(content);
    setIsEditing(true);
  };

  const handleSaveResource = async () => {
    if (!activeResource) return;

    try {
      // Filter out null/undefined values to avoid validation errors
      const updateData = {
        type: activeResource.type,
        title: activeResource.title,
        content: editorContent,
        ...(activeResource.url && { url: activeResource.url }),
        ...(activeResource.fileName && { fileName: activeResource.fileName }),
        ...(activeResource.fileSize !== undefined && activeResource.fileSize !== null && { fileSize: activeResource.fileSize }),
        ...(activeResource.mimeType && { mimeType: activeResource.mimeType })
      };
      
      const updatedResource = await taskResourceService.updateTaskResource(
        task.id,
        activeResource.id,
        updateData
      );

      const updatedResources = resources.map(r => 
        r.id === activeResource.id ? updatedResource : r
      );

      setResources(updatedResources);
      setActiveResource(updatedResource);
      setIsEditing(false);
      
      // Call optional onSave callback
      onSave?.(task.id, updatedResources);
    } catch (error) {
      console.error('Failed to save resource:', error);
      // You might want to show a toast notification here
    }
  };

  const handleSaveTitle = async () => {
    if (!activeResource || !editableTitle.trim()) return;

    try {
      // Filter out null/undefined values to avoid validation errors
      const updateData = {
        type: activeResource.type,
        title: editableTitle.trim(),
        ...(activeResource.content && { content: activeResource.content }),
        ...(activeResource.url && { url: activeResource.url }),
        ...(activeResource.fileName && { fileName: activeResource.fileName }),
        ...(activeResource.fileSize !== undefined && activeResource.fileSize !== null && { fileSize: activeResource.fileSize }),
        ...(activeResource.mimeType && { mimeType: activeResource.mimeType })
      };

      const updatedResource = await taskResourceService.updateTaskResource(
        task.id,
        activeResource.id,
        updateData
      );

      const updatedResources = resources.map(r => 
        r.id === activeResource.id ? updatedResource : r
      );

      setResources(updatedResources);
      setActiveResource(updatedResource);
      setIsEditingTitle(false);
      setEditableTitle('');
      
      // Call optional onSave callback
      onSave?.(task.id, updatedResources);
    } catch (error) {
      console.error('Failed to save resource title:', error);
    }
  };

  const handleStartEditingTitle = () => {
    if (activeResource) {
      setEditableTitle(activeResource.title);
      setIsEditingTitle(true);
    }
  };

  const handleCancelEditingTitle = () => {
    setIsEditingTitle(false);
    setEditableTitle('');
  };

  const handleStartEditingSidebarTitle = (resource: TaskResource) => {
    setEditingSidebarResourceId(resource.id);
    setSidebarEditTitle(resource.title);
  };

  const handleSaveSidebarTitle = async (resourceId: string) => {
    if (!sidebarEditTitle.trim()) return;

    try {
      const resource = resources.find(r => r.id === resourceId);
      if (!resource) return;

      // Filter out null/undefined values to avoid validation errors
      const updateData = {
        type: resource.type,
        title: sidebarEditTitle.trim(),
        ...(resource.content && { content: resource.content }),
        ...(resource.url && { url: resource.url }),
        ...(resource.fileName && { fileName: resource.fileName }),
        ...(resource.fileSize !== undefined && resource.fileSize !== null && { fileSize: resource.fileSize }),
        ...(resource.mimeType && { mimeType: resource.mimeType })
      };

      const updatedResource = await taskResourceService.updateTaskResource(
        task.id,
        resourceId,
        updateData
      );

      const updatedResources = resources.map(r => 
        r.id === resourceId ? updatedResource : r
      );

      setResources(updatedResources);
      
      // Update active resource if it's the one being edited
      if (activeResource?.id === resourceId) {
        setActiveResource(updatedResource);
      }
      
      setEditingSidebarResourceId(null);
      setSidebarEditTitle('');
      
      // Call optional onSave callback
      onSave?.(task.id, updatedResources);
    } catch (error) {
      console.error('Failed to save sidebar resource title:', error);
    }
  };

  const handleCancelSidebarEdit = () => {
    setEditingSidebarResourceId(null);
    setSidebarEditTitle('');
  };

  const handleCreateDocument = async () => {
    try {
      const newResource = await taskResourceService.createTaskResource(task.id, {
        type: 'document',
        title: 'New Document',
        content: '<h2>New Document</h2><p>Start writing your content here...</p>'
      });

      const updatedResources = [...resources, newResource];
      setResources(updatedResources);
      setActiveResource(newResource);
      setEditorContent(newResource.content || '');
      setIsEditing(true);
      setShowAddMenu(false);
      
      // Call optional onSave callback
      onSave?.(task.id, updatedResources);
    } catch (error) {
      console.error('Failed to create document:', error);
    }
  };

  const handleAddLink = async () => {
    if (!linkUrl || !linkTitle) return;

    try {
      const newResource = await taskResourceService.createTaskResource(task.id, {
        type: 'link',
        title: linkTitle,
        url: linkUrl
      });

      const updatedResources = [...resources, newResource];
      setResources(updatedResources);
      setActiveResource(newResource);
      setLinkUrl('');
      setLinkTitle('');
      setShowLinkDialog(false);
      setShowAddMenu(false);
      
      // Call optional onSave callback
      onSave?.(task.id, updatedResources);
    } catch (error) {
      console.error('Failed to add link:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // In a real implementation, you'd upload the file to a storage service
      // and get back a URL. For now, we'll store the file name and metadata
      const newResource = await taskResourceService.createTaskResource(task.id, {
        type: 'file',
        title: file.name,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        // url: fileUploadUrl // This would be the actual file URL from your storage service
      });

      const updatedResources = [...resources, newResource];
      setResources(updatedResources);
      setActiveResource(newResource);
      setShowAddMenu(false);
      
      // Call optional onSave callback
      onSave?.(task.id, updatedResources);
    } catch (error) {
      console.error('Failed to upload file:', error);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    try {
      await taskResourceService.deleteTaskResource(task.id, resourceId);
      
      const updatedResources = resources.filter(r => r.id !== resourceId);
      setResources(updatedResources);
      
      if (activeResource?.id === resourceId) {
        setActiveResource(updatedResources[0] || null);
        setEditorContent(updatedResources[0]?.content || '');
      }
      
      // Call optional onSave callback
      onSave?.(task.id, updatedResources);
    } catch (error) {
      console.error('Failed to delete resource:', error);
    }
  };

  const handleResourceSelect = (resource: TaskResource) => {
    if (editingSidebarResourceId !== resource.id) {
      setActiveResource(resource);
      setEditorContent(resource.content || '');
      setIsEditing(false);
      // Close sidebar on mobile after selection
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="w-4 h-4" />;
      case 'link': return <Link2 className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'file': return <Upload className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-7xl h-[95vh] sm:h-[90vh] flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 relative z-30">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Mobile sidebar toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors shrink-0"
            >
              {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{task.title}</h2>
              <p className="text-gray-600 mt-1 text-sm sm:text-base hidden sm:block">Task Resources & Documentation</p>
            </div>

            {/* Active Resource Title Editor - Hidden on mobile when sidebar is open */}
            {activeResource && !isSidebarOpen && (
              <div className="flex items-center gap-2 min-w-0 flex-1 max-w-sm lg:max-w-md xl:max-w-lg">
                <span className="text-sm text-gray-500 hidden md:inline shrink-0">Editing:</span>
                {isEditingTitle ? (
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <input
                      type="text"
                      value={editableTitle}
                      onChange={(e) => setEditableTitle(e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary flex-1 min-w-0"
                      placeholder="Resource title"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveTitle();
                        } else if (e.key === 'Escape') {
                          handleCancelEditingTitle();
                        }
                      }}
                      autoFocus
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={handleSaveTitle}
                        className="px-2 py-1 bg-primary text-white rounded text-sm hover:bg-primary/90 transition-colors whitespace-nowrap"
                        title="Save (Enter)"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEditingTitle}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors whitespace-nowrap"
                        title="Cancel (Esc)"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleStartEditingTitle}
                    className="text-sm font-medium text-gray-900 hover:text-primary transition-colors bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded truncate flex-1 min-w-0 text-left"
                  >
                    {activeResource.title}
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 hover:bg-gray-200 rounded-lg sm:rounded-xl flex items-center justify-center transition-colors duration-200 shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          {/* Sidebar Overlay for mobile */}
          {isSidebarOpen && (
            <div 
              className="absolute inset-0 bg-black/20 z-10 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div className={`
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
            absolute lg:relative
            z-20 lg:z-auto
            w-80 sm:w-96 lg:w-80 xl:w-96
            h-full
            bg-gray-50 border-r border-gray-200 
            flex flex-col
            transition-transform duration-300 ease-in-out
            lg:transition-none
          `}>
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <button
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  className="w-full btn-primary justify-center"
                >
                  <Plus className="w-4 h-4" />
                  Add Resource
                </button>
                
                {showAddMenu && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10">
                    <button
                      onClick={handleCreateDocument}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                    >
                      <FileText className="w-4 h-4 text-gray-600" />
                      <span>New Document</span>
                    </button>
                    <button
                      onClick={() => setShowLinkDialog(true)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                    >
                      <Link2 className="w-4 h-4 text-gray-600" />
                      <span>Add Link</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                    >
                      <Upload className="w-4 h-4 text-gray-600" />
                      <span>Upload File</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-3">
                    <div className="loading-spinner"></div>
                    <span className="text-gray-600 text-sm">Loading resources...</span>
                  </div>
                </div>
              ) : resources.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 mb-4">No resources yet</p>
                  <button onClick={handleCreateDocument} className="text-sm text-primary hover:text-primary/80">
                    Create your first document
                  </button>
                </div>
              ) : (
                resources.map((resource) => (
                  <div
                    key={resource.id}
                    className={`p-3 rounded-xl transition-all duration-200 group ${
                      activeResource?.id === resource.id
                        ? 'bg-primary text-white shadow-lg'
                        : 'bg-white hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div 
                        className="flex items-start gap-3 flex-1 cursor-pointer min-w-0"
                        onClick={() => handleResourceSelect(resource)}
                      >
                        <div className={`shrink-0 ${
                          activeResource?.id === resource.id ? 'text-white' : 'text-gray-600'
                        }`}>
                          {getResourceIcon(resource.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          {editingSidebarResourceId === resource.id ? (
                            <div className="mb-1">
                              <div className="flex items-center gap-1 mb-2">
                                <input
                                  type="text"
                                  value={sidebarEditTitle}
                                  onChange={(e) => setSidebarEditTitle(e.target.value)}
                                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-primary bg-white text-gray-900 flex-1 min-w-0"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSaveSidebarTitle(resource.id);
                                    } else if (e.key === 'Escape') {
                                      handleCancelSidebarEdit();
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  autoFocus
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleSaveSidebarTitle(resource.id)}
                                  className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors whitespace-nowrap"
                                  title="Save"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelSidebarEdit}
                                  className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors whitespace-nowrap"
                                  title="Cancel"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group">
                              <h4 className={`font-medium text-sm line-clamp-2 flex-1 min-w-0 ${
                                activeResource?.id === resource.id ? 'text-white' : 'text-gray-900'
                              }`}>
                                {resource.title}
                              </h4>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEditingSidebarTitle(resource);
                                }}
                                className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded hover:bg-gray-100 shrink-0 ${
                                  activeResource?.id === resource.id ? 'text-white hover:bg-white/20' : 'text-gray-500'
                                }`}
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          <p className={`text-xs mt-1 ${
                            activeResource?.id === resource.id ? 'text-white/70' : 'text-gray-500'
                          }`}>
                            {resource.type === 'file' && resource.fileSize
                              ? formatFileSize(resource.fileSize)
                              : new Date(resource.updatedAt).toLocaleDateString()
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteResource(resource.id);
                          }}
                          className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-lg hover:bg-red-100 ${
                            activeResource?.id === resource.id ? 'text-white hover:bg-white/20' : 'text-red-600'
                          }`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            {activeResource ? (
              <>
                {/* Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {activeResource.type === 'document' ? (
                    <div className="flex-1 flex flex-col relative overflow-hidden">
                      <div className={`flex-1 overflow-hidden ${isEditing ? 'pb-20' : ''}`}>
                        <div className={`quill-editor-container ${isEditing ? 'h-[calc(100%-80px)]' : 'h-full'} ${isEditing ? 'has-save-button' : ''}`}>
                          <ReactQuill
                            ref={quillRef}
                            theme="snow"
                            value={editorContent}
                            onChange={handleContentChange}
                            modules={modules}
                            formats={formats}
                            style={{ 
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column'
                            }}
                          />
                        </div>
                      </div>
                      {isEditing && (
                        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 border-t border-gray-200 bg-gray-50 shadow-lg z-10 min-h-[60px]">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Unsaved changes</span>
                            <button
                              onClick={handleSaveResource}
                              className="btn-primary text-sm"
                            >
                              <Save className="w-4 h-4" />
                              <span className="hidden sm:inline ml-2">Save Document</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : activeResource.type === 'link' ? (
                    <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
                      <div className="text-center max-w-md">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Link2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 break-words">{activeResource.title}</h3>
                        <p className="text-gray-600 mb-6 text-sm sm:text-base break-all">{activeResource.url}</p>
                        <a
                          href={activeResource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary text-sm sm:text-base"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span className="ml-2">Open Link</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
                      <div className="text-center max-w-md">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          {getResourceIcon(activeResource.type)}
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 break-words">{activeResource.title}</h3>
                        {activeResource.fileSize && (
                          <p className="text-gray-600 mb-6 text-sm sm:text-base">{formatFileSize(activeResource.fileSize)}</p>
                        )}
                        <button className="btn-primary text-sm sm:text-base">
                          <Download className="w-4 h-4" />
                          <span className="ml-2">Download</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <FileText className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">No resource selected</h3>
                  <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">Select a resource from the sidebar or create a new one</p>
                  <button 
                    onClick={() => {
                      setIsSidebarOpen(true);
                      handleCreateDocument();
                    }}
                    className="btn-primary text-sm sm:text-base"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="ml-2">Create Document</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Link</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="Enter link title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="https://example.com"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowLinkDialog(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLink}
                disabled={!linkUrl || !linkTitle}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                Add Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileUpload}
        multiple
      />
    </div>
  );
} 