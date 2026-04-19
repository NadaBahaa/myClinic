import { useState, useEffect } from 'react';
import { Plus, Search, Phone, Mail, Calendar, FolderOpen, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import PatientDetailModal, { Patient } from './PatientDetailModal';
import PatientFileView from './PatientFileView';
import { doctorService } from '../../lib/services/doctorService';
import { patientService } from '../../lib/services/patientService';

interface PatientsViewProps {
  isDoctorView?: boolean;
  doctorId?: string;
  doctorName?: string;
}

export default function PatientsView({ isDoctorView = false, doctorId = '', doctorName = '' }: PatientsViewProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatientFile, setSelectedPatientFile] = useState<{ patientId: string; patientName: string; doctorId: string; doctorName: string } | null>(null);
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
  const [showDoctorPicker, setShowDoctorPicker] = useState(false);
  const [patientForFile, setPatientForFile] = useState<Patient | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPatientsLoading(true);
    patientService
      .getAll()
      .then((list) => {
        if (!cancelled) setPatients(list);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Failed to load patients');
          setPatients([]);
        }
      })
      .finally(() => {
        if (!cancelled) setPatientsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isDoctorView]);

  useEffect(() => {
    if (!isDoctorView) {
      doctorService.getAll().then((list) => setDoctors(list.map((d) => ({ id: d.id, name: d.name })))).catch(() => {});
    }
  }, [isDoctorView]);

  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.phone.includes(searchQuery)
  );

  const handleAddPatient = () => {
    setSelectedPatient(null);
    setIsModalOpen(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const handleSavePatient = (patient: Patient) => {
    if (selectedPatient) {
      setPatients((prev) => prev.map((p) => (p.id === patient.id ? patient : p)));
    } else {
      setPatients((prev) => [...prev, patient]);
    }
  };

  const handleDeletePatient = (id: string) => {
    setPatients(prev => prev.filter(p => p.id !== id));
  };

  const handleOpenPatientFile = (patient: Patient) => {
    if (isDoctorView && doctorId && doctorName) {
      setSelectedPatientFile({ patientId: patient.id, patientName: patient.name, doctorId, doctorName });
    } else {
      setPatientForFile(patient);
      setShowDoctorPicker(true);
    }
  };

  const handlePickDoctorForFile = (dId: string, dName: string) => {
    if (!patientForFile) return;
    setSelectedPatientFile({
      patientId: patientForFile.id,
      patientName: patientForFile.name,
      doctorId: dId,
      doctorName: dName,
    });
    setShowDoctorPicker(false);
    setPatientForFile(null);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">
            {isDoctorView ? 'My Patients' : 'Patients'}
          </h1>
          <p className="text-gray-600">
            {patients.length} {isDoctorView ? 'patients in your care' : 'total patients'}
          </p>
        </div>
        {!isDoctorView && (
          <button
            onClick={handleAddPatient}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Patient
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search patients by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={patientsLoading}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600 disabled:opacity-50"
        />
      </div>

      {patientsLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-600">
          <Loader2 className="w-10 h-10 animate-spin text-pink-600 mb-3" />
          <p>Loading patients...</p>
        </div>
      ) : (
      /* Patients Grid */
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.map((patient) => (
          <div key={patient.id} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-4">
              <h3 className="text-lg text-gray-900 mb-1">{patient.name}</h3>
              <p className="text-sm text-gray-600">Patient ID: {patient.id}</p>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{patient.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{patient.phone}</span>
              </div>
              {patient.lastVisit && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Last visit: {new Date(patient.lastVisit).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-600">{patient.totalVisits} total visits</span>
              <button 
                onClick={() => handleEditPatient(patient)}
                className="text-sm text-pink-600 hover:text-pink-700"
              >
                View Details
              </button>
            </div>

            {patient.notes && (
              <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                {patient.notes}
              </div>
            )}

            <button
              onClick={() => handleOpenPatientFile(patient)}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FolderOpen className="w-4 h-4" />
              Open Patient File
            </button>
          </div>
        ))}
      </div>
      )}

      {!patientsLoading && filteredPatients.length === 0 && (
        <div className="text-center py-12 text-gray-600">
          {searchQuery ? 'No patients found matching your search.' : 'No patients yet. Add a patient to get started.'}
        </div>
      )}

      {/* Patient Detail Modal */}
      {isModalOpen && (
        <PatientDetailModal
          patient={selectedPatient}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSavePatient}
          onDelete={handleDeletePatient}
        />
      )}

      {/* Doctor picker for admin/assistant */}
      {showDoctorPicker && patientForFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg text-gray-900">Select doctor for {patientForFile.name}&apos;s file</h3>
              <button onClick={() => { setShowDoctorPicker(false); setPatientForFile(null); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2">
              {doctors.map((d) => (
                <button key={d.id} onClick={() => handlePickDoctorForFile(d.id, d.name)} className="w-full px-4 py-3 border border-gray-200 rounded-lg hover:bg-pink-50 text-left">
                  {d.name}
                </button>
              ))}
            </div>
            {doctors.length === 0 && <p className="text-gray-500 text-sm">No doctors found.</p>}
          </div>
        </div>
      )}

      {/* Patient File View */}
      {selectedPatientFile && (
        <PatientFileView
          patientId={selectedPatientFile.patientId}
          patientName={selectedPatientFile.patientName}
          doctorId={selectedPatientFile.doctorId}
          doctorName={selectedPatientFile.doctorName}
          onClose={() => setSelectedPatientFile(null)}
        />
      )}
    </div>
  );
}