import React, { useState, useEffect } from 'react';
import { X, Building, Mail, Phone, User } from 'lucide-react';
import { Client } from '../types';

interface ClientModalProps {
  client?: Client;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateClientData) => Promise<void>;
}

interface CreateClientData {
  name: string;
  company: string;
  email: string;
  phone?: string;
  isActive: boolean;
}

export function ClientModal({ client, isOpen, onClose, onSubmit }: ClientModalProps) {
  const [formData, setFormData] = useState<CreateClientData>({
    name: '',
    company: '',
    email: '',
    phone: '',
    isActive: true
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when client changes
  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        company: client.company,
        email: client.email,
        phone: client.phone || '',
        isActive: client.isActive
      });
    } else {
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        isActive: true
      });
    }
    setErrors({});
  }, [client, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.company.trim()) {
      newErrors.company = 'Company is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.phone && !/^[+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreateClientData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error saving client:', error);
      setErrors({ submit: 'Failed to save client. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">
            {client ? 'Edit Client' : 'Add New Client'}
          </h2>
          <button 
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <User size={16} className="text-gray-400" />
                Client Name *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                  errors.name 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red/20 bg-red-50' 
                    : 'border-gray-200 focus:border-primary'
                }`}
                placeholder="John Doe"
                disabled={isSubmitting}
              />
              {errors.name && <span className="text-sm text-red-600">{errors.name}</span>}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="company" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Building size={16} className="text-gray-400" />
                Company *
              </label>
              <input
                id="company"
                type="text"
                value={formData.company}
                onChange={e => handleInputChange('company', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                  errors.company 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red/20 bg-red-50' 
                    : 'border-gray-200 focus:border-primary'
                }`}
                placeholder="Acme Corporation"
                disabled={isSubmitting}
              />
              {errors.company && <span className="text-sm text-red-600">{errors.company}</span>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Mail size={16} className="text-gray-400" />
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                  errors.email 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red/20 bg-red-50' 
                    : 'border-gray-200 focus:border-primary'
                }`}
                placeholder="john@acme.com"
                disabled={isSubmitting}
              />
              {errors.email && <span className="text-sm text-red-600">{errors.email}</span>}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Phone size={16} className="text-gray-400" />
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={e => handleInputChange('phone', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                  errors.phone 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red/20 bg-red-50' 
                    : 'border-gray-200 focus:border-primary'
                }`}
                placeholder="+1 (555) 123-4567"
                disabled={isSubmitting}
              />
              {errors.phone && <span className="text-sm text-red-600">{errors.phone}</span>}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={e => handleInputChange('isActive', e.target.checked)}
                className="w-5 h-5 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary/20 focus:ring-2"
                disabled={isSubmitting}
              />
              <span className="text-sm font-medium text-gray-700">Active Client</span>
            </label>
          </div>
          
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors duration-200"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white rounded-xl font-medium transition-colors duration-200 flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                client ? 'Update Client' : 'Add Client'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}