import { useState } from 'react';
import { 
  X, Upload, Image as ImageIcon, FileText, Plus, Trash2, 
  DollarSign, Package, TrendingUp, Calendar, Edit2 
} from 'lucide-react';
import { 
  PatientFile, SessionRecord, PatientPhoto, Prescription, 
  SessionMaterialUsage, MaterialOrTool 
} from '../types';
import { toast } from 'sonner';

interface PatientFileViewProps {
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  onClose: () => void;
}

// Mock materials/tools
const mockMaterials: MaterialOrTool[] = [
  {
    id: 'mt1',
    name: 'Hyaluronic Acid Filler',
    type: 'material',
    unitPrice: 450,
    unit: 'ml',
  },
  {
    id: 'mt2',
    name: 'Botox Injectable',
    type: 'material',
    unitPrice: 12,
    unit: 'unit',
  },
  {
    id: 'mt4',
    name: 'Chemical Peel Solution',
    type: 'material',
    unitPrice: 85,
    unit: 'ml',
  },
];

interface SessionModalProps {
  session: SessionRecord | null;
  patientName: string;
  onClose: () => void;
  onSave: (session: SessionRecord) => void;
}

function SessionModal({ session, patientName, onClose, onSave }: SessionModalProps) {
  const isEditing = !!session;
  const [formData, setFormData] = useState<SessionRecord>(
    session || {
      id: '',
      appointmentId: '',
      date: new Date(),
      serviceId: '',
      serviceName: '',
      servicePrice: 0,
      materialsUsed: [],
      totalMaterialsCost: 0,
      netProfit: 0,
      notes: '',
      performedBy: '',
    }
  );

  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [materialQuantity, setMaterialQuantity] = useState(1);

  const handleAddMaterial = () => {
    if (!selectedMaterial) return;
    
    const material = mockMaterials.find(m => m.id === selectedMaterial);
    if (!material) return;

    const totalPrice = material.unitPrice * materialQuantity;
    const newMaterial: SessionMaterialUsage = {
      materialId: material.id,
      materialName: material.name,
      quantity: materialQuantity,
      unitPrice: material.unitPrice,
      totalPrice,
    };

    const updatedMaterials = [...formData.materialsUsed, newMaterial];
    const totalMaterialsCost = updatedMaterials.reduce((sum, m) => sum + m.totalPrice, 0);
    const netProfit = formData.servicePrice - totalMaterialsCost;

    setFormData({
      ...formData,
      materialsUsed: updatedMaterials,
      totalMaterialsCost,
      netProfit,
    });

    setSelectedMaterial('');
    setMaterialQuantity(1);
  };

  const handleRemoveMaterial = (index: number) => {
    const updatedMaterials = formData.materialsUsed.filter((_, i) => i !== index);
    const totalMaterialsCost = updatedMaterials.reduce((sum, m) => sum + m.totalPrice, 0);
    const netProfit = formData.servicePrice - totalMaterialsCost;

    setFormData({
      ...formData,
      materialsUsed: updatedMaterials,
      totalMaterialsCost,
      netProfit,
    });
  };

  const handleServicePriceChange = (price: number) => {
    const netProfit = price - formData.totalMaterialsCost;
    setFormData({
      ...formData,
      servicePrice: price,
      netProfit,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.serviceName || formData.servicePrice <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    onSave({
      ...formData,
      id: formData.id || `session-${Date.now()}`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-xl text-gray-900">
            {isEditing ? 'Edit' : 'Add'} Session for {patientName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Service Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-gray-700">Service Name *</label>
              <input
                type="text"
                value={formData.serviceName}
                onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                placeholder="Enter service name"
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-gray-700">Service Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.servicePrice}
                onChange={(e) => handleServicePriceChange(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-gray-700">Date</label>
            <input
              type="date"
              value={formData.date.toISOString().split('T')[0]}
              onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
            />
          </div>

          {/* Materials Used */}
          <div>
            <label className="block mb-2 text-gray-700">Materials & Tools Used</label>
            <div className="flex gap-2 mb-3">
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
              >
                <option value="">Select material/tool...</option>
                {mockMaterials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name} - ${material.unitPrice}/{material.unit}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={materialQuantity}
                onChange={(e) => setMaterialQuantity(parseFloat(e.target.value) || 1)}
                className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                placeholder="Qty"
              />
              <button
                type="button"
                onClick={handleAddMaterial}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Materials List */}
            {formData.materialsUsed.length > 0 && (
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                {formData.materialsUsed.map((material, index) => (
                  <div key={index} className="p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-gray-900">{material.materialName}</p>
                      <p className="text-sm text-gray-600">
                        {material.quantity} × ${material.unitPrice.toFixed(2)} = ${material.totalPrice.toFixed(2)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMaterial(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Financial Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Service Price:</span>
              <span className="text-gray-900">${formData.servicePrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Materials Cost:</span>
              <span className="text-red-600">-${formData.totalMaterialsCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-gray-900">Net Profit:</span>
              <span className={`text-lg ${formData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${formData.netProfit.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block mb-2 text-gray-700">Session Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
              rows={3}
              placeholder="Additional notes about the session..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              {isEditing ? 'Update' : 'Add'} Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PatientFileView({ 
  patientId, 
  patientName, 
  doctorId, 
  doctorName,
  onClose 
}: PatientFileViewProps) {
  const [activeTab, setActiveTab] = useState<'sessions' | 'photos' | 'prescriptions'>('sessions');
  const [patientFile, setPatientFile] = useState<PatientFile>({
    id: `pf-${doctorId}-${patientId}`,
    patientId,
    patientName,
    doctorId,
    doctorName,
    createdAt: new Date(),
    sessions: [],
    photos: [],
    prescriptions: [],
  });

  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionRecord | null>(null);

  const handleAddSession = () => {
    setSelectedSession(null);
    setIsSessionModalOpen(true);
  };

  const handleEditSession = (session: SessionRecord) => {
    setSelectedSession(session);
    setIsSessionModalOpen(true);
  };

  const handleSaveSession = (session: SessionRecord) => {
    if (selectedSession) {
      setPatientFile(prev => ({
        ...prev,
        sessions: prev.sessions.map(s => s.id === session.id ? session : s),
      }));
      toast.success('Session updated successfully');
    } else {
      setPatientFile(prev => ({
        ...prev,
        sessions: [...prev.sessions, { ...session, performedBy: doctorName }],
      }));
      toast.success('Session added successfully');
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    if (confirm('Are you sure you want to delete this session?')) {
      setPatientFile(prev => ({
        ...prev,
        sessions: prev.sessions.filter(s => s.id !== sessionId),
      }));
      toast.success('Session deleted successfully');
    }
  };

  const handlePhotoUpload = (type: 'before' | 'after' | 'during') => {
    // Simulated file upload
    const newPhoto: PatientPhoto = {
      id: `photo-${Date.now()}`,
      url: `https://via.placeholder.com/300x200?text=${type}+Photo`,
      type,
      uploadedAt: new Date(),
      uploadedBy: doctorName,
    };

    setPatientFile(prev => ({
      ...prev,
      photos: [...prev.photos, newPhoto],
    }));
    toast.success('Photo uploaded successfully');
  };

  const handleDeletePhoto = (photoId: string) => {
    if (confirm('Are you sure you want to delete this photo?')) {
      setPatientFile(prev => ({
        ...prev,
        photos: prev.photos.filter(p => p.id !== photoId),
      }));
      toast.success('Photo deleted successfully');
    }
  };

  const handleAddPrescription = () => {
    const name = prompt('Enter prescription name:');
    if (!name) return;

    const newPrescription: Prescription = {
      id: `rx-${Date.now()}`,
      name,
      prescribedAt: new Date(),
      prescribedBy: doctorName,
    };

    setPatientFile(prev => ({
      ...prev,
      prescriptions: [...prev.prescriptions, newPrescription],
    }));
    toast.success('Prescription added successfully');
  };

  const handleDeletePrescription = (prescriptionId: string) => {
    if (confirm('Are you sure you want to delete this prescription?')) {
      setPatientFile(prev => ({
        ...prev,
        prescriptions: prev.prescriptions.filter(p => p.id !== prescriptionId),
      }));
      toast.success('Prescription deleted successfully');
    }
  };

  const totalRevenue = patientFile.sessions.reduce((sum, s) => sum + s.servicePrice, 0);
  const totalCosts = patientFile.sessions.reduce((sum, s) => sum + s.totalMaterialsCost, 0);
  const totalProfit = totalRevenue - totalCosts;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl text-gray-900">{patientName}'s Medical File</h2>
            <p className="text-sm text-gray-600">Managed by {doctorName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial Summary */}
        <div className="p-6 bg-gradient-to-r from-pink-50 to-purple-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">Total Sessions</span>
              </div>
              <p className="text-2xl text-gray-900">{patientFile.sessions.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">Total Revenue</span>
              </div>
              <p className="text-2xl text-blue-600">${totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-red-600" />
                <span className="text-sm text-gray-600">Materials Cost</span>
              </div>
              <p className="text-2xl text-red-600">${totalCosts.toFixed(2)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">Net Profit</span>
              </div>
              <p className={`text-2xl ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${totalProfit.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-6 py-3 border-b-2 transition-colors ${
                activeTab === 'sessions'
                  ? 'border-pink-600 text-pink-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Sessions ({patientFile.sessions.length})
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`px-6 py-3 border-b-2 transition-colors ${
                activeTab === 'photos'
                  ? 'border-pink-600 text-pink-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Photos ({patientFile.photos.length})
            </button>
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`px-6 py-3 border-b-2 transition-colors ${
                activeTab === 'prescriptions'
                  ? 'border-pink-600 text-pink-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Prescriptions ({patientFile.prescriptions.length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg text-gray-900">Treatment Sessions</h3>
                <button
                  onClick={handleAddSession}
                  className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add Session
                </button>
              </div>

              {patientFile.sessions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No sessions recorded yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {patientFile.sessions.map((session) => (
                    <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-lg text-gray-900">{session.serviceName}</h4>
                          <p className="text-sm text-gray-600">
                            {session.date.toLocaleDateString()} • By {session.performedBy}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditSession(session)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-600">Service Price</p>
                          <p className="text-lg text-gray-900">${session.servicePrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Materials Cost</p>
                          <p className="text-lg text-red-600">-${session.totalMaterialsCost.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Net Profit</p>
                          <p className={`text-lg ${session.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${session.netProfit.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {session.materialsUsed.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-2">Materials Used:</p>
                          <div className="flex flex-wrap gap-2">
                            {session.materialsUsed.map((material, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                              >
                                {material.materialName} ({material.quantity})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {session.notes && (
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                          {session.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg text-gray-900">Patient Photos</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePhotoUpload('before')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Upload className="w-4 h-4" />
                    Before
                  </button>
                  <button
                    onClick={() => handlePhotoUpload('during')}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    <Upload className="w-4 h-4" />
                    During
                  </button>
                  <button
                    onClick={() => handlePhotoUpload('after')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <Upload className="w-4 h-4" />
                    After
                  </button>
                </div>
              </div>

              {patientFile.photos.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No photos uploaded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {patientFile.photos.map((photo) => (
                    <div key={photo.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <img src={photo.url} alt={photo.type} className="w-full h-48 object-cover" />
                      <div className="p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            photo.type === 'before' ? 'bg-blue-100 text-blue-700' :
                            photo.type === 'during' ? 'bg-purple-100 text-purple-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {photo.type.charAt(0).toUpperCase() + photo.type.slice(1)}
                          </span>
                          <button
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600">
                          {photo.uploadedAt.toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">By {photo.uploadedBy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Prescriptions Tab */}
          {activeTab === 'prescriptions' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg text-gray-900">Prescriptions</h3>
                <button
                  onClick={handleAddPrescription}
                  className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add Prescription
                </button>
              </div>

              {patientFile.prescriptions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No prescriptions added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {patientFile.prescriptions.map((prescription) => (
                    <div key={prescription.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-start">
                      <div>
                        <h4 className="text-lg text-gray-900">{prescription.name}</h4>
                        <p className="text-sm text-gray-600">
                          Prescribed: {prescription.prescribedAt.toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500">By {prescription.prescribedBy}</p>
                        {prescription.dosage && (
                          <p className="text-sm text-gray-600 mt-1">Dosage: {prescription.dosage}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeletePrescription(prescription.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isSessionModalOpen && (
        <SessionModal
          session={selectedSession}
          patientName={patientName}
          onClose={() => setIsSessionModalOpen(false)}
          onSave={handleSaveSession}
        />
      )}
    </div>
  );
}
