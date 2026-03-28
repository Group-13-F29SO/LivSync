'use client';

import { useState, useEffect } from 'react';
import { X, Loader, Plus, Trash2 } from 'lucide-react';

export default function PrescriptionForm({ 
  patients, 
  providerId, 
  onClose, 
  onSuccess,
  initialData = null 
}) {
  const [formData, setFormData] = useState({
    patientId: initialData?.patients?.id || '',
    medicines: initialData?.prescription_items?.map(item => ({
      medicineName: item.medicine_name,
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration || '',
      instructions: item.instructions || '',
    })) || [{ medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    notes: initialData?.notes || '',
    expiryDate: initialData?.expiry_date ? new Date(initialData.expiry_date).toISOString().split('T')[0] : '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(
    initialData?.patients || null
  );

  const validateForm = () => {
    const newErrors = {};

    if (!formData.patientId) {
      newErrors.patientId = 'Patient is required';
    }

    const validMedicines = formData.medicines.filter(m => m.medicineName.trim());
    if (validMedicines.length === 0) {
      newErrors.medicines = 'At least one medicine is required';
    }

    for (let i = 0; i < formData.medicines.length; i++) {
      const medicine = formData.medicines[i];
      if (medicine.medicineName.trim()) {
        if (!medicine.dosage.trim()) {
          newErrors[`medicine_${i}_dosage`] = 'Dosage is required';
        }
        if (!medicine.frequency.trim()) {
          newErrors[`medicine_${i}_frequency`] = 'Frequency is required';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePatientChange = (e) => {
    const patientId = e.target.value;
    const patient = patients.find(p => p.id === patientId);
    setFormData({ ...formData, patientId });
    setSelectedPatient(patient);
    if (errors.patientId) {
      setErrors({ ...errors, patientId: '' });
    }
  };

  const handleMedicineChange = (index, field, value) => {
    const newMedicines = [...formData.medicines];
    newMedicines[index] = { ...newMedicines[index], [field]: value };
    setFormData({ ...formData, medicines: newMedicines });
    
    // Clear field-specific errors
    const errorKey = `medicine_${index}_${field}`;
    if (errors[errorKey]) {
      const newErrors = { ...errors };
      delete newErrors[errorKey];
      setErrors(newErrors);
    }
  };

  const addMedicine = () => {
    setFormData({
      ...formData,
      medicines: [
        ...formData.medicines,
        { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' },
      ],
    });
  };

  const removeMedicine = (index) => {
    setFormData({
      ...formData,
      medicines: formData.medicines.filter((_, i) => i !== index),
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = initialData
        ? `/api/provider/prescriptions/${initialData.id}`
        : '/api/provider/prescriptions';

      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId,
          patientId: formData.patientId,
          medicines: formData.medicines.filter(m => m.medicineName.trim()),
          notes: formData.notes || null,
          expiryDate: formData.expiryDate || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save prescription');
      }

      const data = await response.json();
      setFormData({
        patientId: '',
        medicines: [{ medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }],
        notes: '',
        expiryDate: '',
      });
      
      onSuccess?.(data.prescription);
      onClose?.();
    } catch (error) {
      console.error('Error saving prescription:', error);
      setErrors({
        form: error.message || 'Failed to save prescription',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
            {initialData ? 'Edit Prescription' : 'Create Prescription'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Form Error */}
        {errors.form && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{errors.form}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Patient *
            </label>
            <select
              value={formData.patientId}
              onChange={handlePatientChange}
              disabled={initialData}
              className={`w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50 ${
                errors.patientId ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="">Select a patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.first_name} {patient.last_name} ({patient.email})
                </option>
              ))}
            </select>
            {errors.patientId && (
              <p className="text-red-500 text-sm mt-1">{errors.patientId}</p>
            )}
          </div>

          {/* Selected Patient Info */}
          {selectedPatient && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">
                Patient Details
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Name:</span>
                  <p className="font-medium text-gray-900 dark:text-gray-50">
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Email:</span>
                  <p className="font-medium text-gray-900 dark:text-gray-50">
                    {selectedPatient.email}
                  </p>
                </div>
                {selectedPatient.patient_profiles?.date_of_birth && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Age:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-50">
                      {new Date().getFullYear() -
                        new Date(selectedPatient.patient_profiles.date_of_birth).getFullYear()}{' '}
                      years
                    </p>
                  </div>
                )}
                {selectedPatient.patient_profiles?.height_cm && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Height:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-50">
                      {selectedPatient.patient_profiles.height_cm} cm
                    </p>
                  </div>
                )}
                {selectedPatient.patient_profiles?.weight_kg && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Weight:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-50">
                      {selectedPatient.patient_profiles.weight_kg} kg
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Medicines Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                Medicines *
              </h3>
              <button
                type="button"
                onClick={addMedicine}
                className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 flex items-center gap-2 text-sm transition-colors"
              >
                <Plus size={16} />
                Add Medicine
              </button>
            </div>

            {errors.medicines && (
              <p className="text-red-500 text-sm mb-3">{errors.medicines}</p>
            )}

            <div className="space-y-4">
              {formData.medicines.map((medicine, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-50">
                      Medicine {index + 1}
                    </h4>
                    {formData.medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedicine(index)}
                        className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Medicine Name *
                      </label>
                      <input
                        type="text"
                        value={medicine.medicineName}
                        onChange={(e) => handleMedicineChange(index, 'medicineName', e.target.value)}
                        placeholder="e.g., Paracetamol"
                        className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-gray-50 text-sm ${
                          errors[`medicine_${index}_medicineName`] ? 'border-red-500' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Dosage *
                      </label>
                      <input
                        type="text"
                        value={medicine.dosage}
                        onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                        placeholder="e.g., 500mg"
                        className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-gray-50 text-sm ${
                          errors[`medicine_${index}_dosage`] ? 'border-red-500' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      {errors[`medicine_${index}_dosage`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`medicine_${index}_dosage`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Frequency *
                      </label>
                      <input
                        type="text"
                        value={medicine.frequency}
                        onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                        placeholder="e.g., Twice daily"
                        className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-gray-50 text-sm ${
                          errors[`medicine_${index}_frequency`] ? 'border-red-500' : 'border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      {errors[`medicine_${index}_frequency`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`medicine_${index}_frequency`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Duration
                      </label>
                      <input
                        type="text"
                        value={medicine.duration}
                        onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                        placeholder="e.g., 7 days"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Instructions
                    </label>
                    <textarea
                      value={medicine.instructions}
                      onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                      placeholder="e.g., Take with food"
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* General Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              General Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="e.g., Continue until review appointment, Follow up in 2 weeks"
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prescription Expiry Date
            </label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isLoading && <Loader size={18} className="animate-spin" />}
              {initialData ? 'Update Prescription' : 'Create Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
