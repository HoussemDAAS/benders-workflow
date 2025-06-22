import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
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
  Type,
  Quote
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
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load resources for the task
  useEffect(() => {
    if (isOpen && task) {
      loadResources();
    }
  }, [isOpen, task]);

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

  const handleFormatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    checkActiveFormats();
  };

  const checkActiveFormats = () => {
    if (!editorRef.current) return;
    
    const formats = new Set<string>();
    
    // Check various formatting states
    if (document.queryCommandState('bold')) formats.add('bold');
    if (document.queryCommandState('italic')) formats.add('italic');
    if (document.queryCommandState('underline')) formats.add('underline');
    if (document.queryCommandState('insertUnorderedList')) formats.add('insertUnorderedList');
    if (document.queryCommandState('insertOrderedList')) formats.add('insertOrderedList');
    
    setActiveFormats(formats);
  };

  const handleEditorFocus = () => {
    checkActiveFormats();
  };

  const handleEditorKeyUp = () => {
    checkActiveFormats();
  };

  const handleEditorClick = () => {
    checkActiveFormats();
  };

  const handleSaveResource = async () => {
    if (!activeResource) return;

    try {
      const updatedContent = editorRef.current?.innerHTML || editorContent;
      
      // Filter out null/undefined values to avoid validation errors
      const updateData = {
        type: activeResource.type,
        title: activeResource.title,
        content: updatedContent,
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
      setEditorContent(updatedResource.content || '');
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
    <>
      {/* Custom styles for the rich text editor */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .rich-text-editor {
            font-family: system-ui, -apple-system, sans-serif;
          }
          
          .rich-text-editor ul {
            list-style-type: disc;
            margin-left: 1.5rem;
            margin-bottom: 1rem;
            padding-left: 0;
          }
          
          .rich-text-editor ol {
            list-style-type: decimal;
            margin-left: 1.5rem;
            margin-bottom: 1rem;
            padding-left: 0;
          }
          
          .rich-text-editor li {
            margin-bottom: 0.25rem;
            line-height: 1.6;
          }
          
          .rich-text-editor ul ul,
          .rich-text-editor ol ol,
          .rich-text-editor ul ol,
          .rich-text-editor ol ul {
            margin-top: 0.25rem;
            margin-bottom: 0.25rem;
          }
          
          .rich-text-editor p {
            margin-bottom: 1rem;
            line-height: 1.6;
          }
          
          .rich-text-editor h1,
          .rich-text-editor h2,
          .rich-text-editor h3,
          .rich-text-editor h4,
          .rich-text-editor h5,
          .rich-text-editor h6 {
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
            font-weight: 600;
          }
          
          .rich-text-editor h1 { font-size: 1.875rem; }
          .rich-text-editor h2 { font-size: 1.5rem; }
          .rich-text-editor h3 { font-size: 1.25rem; }
          
          .rich-text-editor blockquote {
            border-left: 4px solid #e5e7eb;
            padding-left: 1rem;
            margin: 1rem 0;
            font-style: italic;
            color: #6b7280;
          }
          
          .rich-text-editor strong {
            font-weight: 600;
          }
          
          .rich-text-editor em {
            font-style: italic;
          }
          
          .rich-text-editor u {
            text-decoration: underline;
          }
          
          .rich-text-editor br {
            display: block;
            margin: 0.5rem 0;
            content: "";
          }
        `
      }} />
      
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
            <p className="text-gray-600 mt-1">Task Resources & Documentation</p>
            
            {/* Active Resource Title Editor */}
            {activeResource && (
              <div className="mt-4 flex items-center gap-3">
                <span className="text-sm text-gray-500">Editing:</span>
                {isEditingTitle ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editableTitle}
                      onChange={(e) => setEditableTitle(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary flex-1 max-w-md"
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
                    <button
                      onClick={handleSaveTitle}
                      className="px-3 py-1 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEditingTitle}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleStartEditingTitle}
                    className="text-sm font-medium text-gray-900 hover:text-primary transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-lg"
                  >
                    {activeResource.title}
                  </button>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
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
                        className="flex items-start gap-3 flex-1 cursor-pointer"
                        onClick={() => {
                          if (editingSidebarResourceId !== resource.id) {
                            setActiveResource(resource);
                            setEditorContent(resource.content || '');
                            setIsEditing(false);
                          }
                        }}
                      >
                        <div className={`${
                          activeResource?.id === resource.id ? 'text-white' : 'text-gray-600'
                        }`}>
                          {getResourceIcon(resource.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          {editingSidebarResourceId === resource.id ? (
                            <div className="flex items-center gap-1 mb-1">
                              <input
                                type="text"
                                value={sidebarEditTitle}
                                onChange={(e) => setSidebarEditTitle(e.target.value)}
                                className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-primary bg-white text-gray-900 flex-1"
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
                          ) : (
                            <div className="flex items-center gap-2 group">
                              <h4 className={`font-medium text-sm line-clamp-2 flex-1 ${
                                activeResource?.id === resource.id ? 'text-white' : 'text-gray-900'
                              }`}>
                                {resource.title}
                              </h4>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEditingSidebarTitle(resource);
                                }}
                                className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded hover:bg-gray-100 ${
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
                      <div className="flex items-center gap-1">
                        {editingSidebarResourceId === resource.id && (
                          <>
                            <button
                              onClick={() => handleSaveSidebarTitle(resource.id)}
                              className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                              title="Save"
                            >
                              <Save className="w-3 h-3" />
                            </button>
                            <button
                              onClick={handleCancelSidebarEdit}
                              className="p-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                              title="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        )}
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
          <div className="flex-1 flex flex-col">
            {activeResource ? (
              <>
                {/* Toolbar */}
                {activeResource.type === 'document' && (
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleFormatText('bold')}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-200 ${
                            activeFormats.has('bold')
                              ? 'bg-primary text-white border-primary shadow-md'
                              : 'bg-white hover:bg-gray-100 border-gray-200'
                          }`}
                        >
                          <Bold className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleFormatText('italic')}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-200 ${
                            activeFormats.has('italic')
                              ? 'bg-primary text-white border-primary shadow-md'
                              : 'bg-white hover:bg-gray-100 border-gray-200'
                          }`}
                        >
                          <Italic className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleFormatText('underline')}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-200 ${
                            activeFormats.has('underline')
                              ? 'bg-primary text-white border-primary shadow-md'
                              : 'bg-white hover:bg-gray-100 border-gray-200'
                          }`}
                        >
                          <Underline className="w-4 h-4" />
                        </button>
                        <div className="w-px h-6 bg-gray-300 mx-2"></div>
                        <button
                          onClick={() => handleFormatText('insertUnorderedList')}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-200 ${
                            activeFormats.has('insertUnorderedList')
                              ? 'bg-primary text-white border-primary shadow-md'
                              : 'bg-white hover:bg-gray-100 border-gray-200'
                          }`}
                        >
                          <List className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleFormatText('insertOrderedList')}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-200 ${
                            activeFormats.has('insertOrderedList')
                              ? 'bg-primary text-white border-primary shadow-md'
                              : 'bg-white hover:bg-gray-100 border-gray-200'
                          }`}
                        >
                          <ListOrdered className="w-4 h-4" />
                        </button>
                        
                        <div className="w-px h-6 bg-gray-300 mx-2"></div>
                        
                        <button
                          onClick={() => handleFormatText('formatBlock', 'h2')}
                          className="w-8 h-8 bg-white hover:bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 transition-all duration-200"
                          title="Heading"
                        >
                          <Type className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleFormatText('formatBlock', 'blockquote')}
                          className="w-8 h-8 bg-white hover:bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 transition-all duration-200"
                          title="Quote"
                        >
                          <Quote className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {isEditing && (
                        <button
                          onClick={handleSaveResource}
                          className="btn-primary"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Content Area */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {activeResource.type === 'document' ? (
                    <div
                      ref={editorRef}
                      contentEditable
                      className="rich-text-editor max-w-none min-h-full focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg p-4 bg-white"
                      dangerouslySetInnerHTML={{ __html: editorContent }}
                      onInput={() => setIsEditing(true)}
                      onFocus={handleEditorFocus}
                      onKeyUp={handleEditorKeyUp}
                      onClick={handleEditorClick}
                      onMouseUp={handleEditorClick}
                      style={{ 
                        minHeight: '100%',
                        lineHeight: '1.6',
                        fontSize: '16px'
                      }}
                    />
                  ) : activeResource.type === 'link' ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Link2 className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{activeResource.title}</h3>
                      <p className="text-gray-600 mb-6">{activeResource.url}</p>
                      <a
                        href={activeResource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open Link
                      </a>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        {getResourceIcon(activeResource.type)}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{activeResource.title}</h3>
                      {activeResource.fileSize && (
                        <p className="text-gray-600 mb-6">{formatFileSize(activeResource.fileSize)}</p>
                      )}
                      <button className="btn-primary">
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <FileText className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No resource selected</h3>
                  <p className="text-gray-600 mb-6">Select a resource from the sidebar or create a new one</p>
                  <button onClick={handleCreateDocument} className="btn-primary">
                    <Plus className="w-4 h-4" />
                    Create Document
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
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
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
    </>
  );
} 