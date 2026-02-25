import { useState } from 'react';
import { Plus, Search, Phone, Mail, Calendar, FolderOpen } from 'lucide-react';
import PatientDetailModal, { Patient } from './PatientDetailModal';
import PatientFileView from './PatientFileView';

const initialPatients: Patient[] = [
  {
    id: 'p1',
    name: 'Emma Wilson',
    email: 'emma.wilson@email.com',
    phone: '(555) 123-4567',
    dateOfBirth: '1990-05-15',
    lastVisit: '2024-12-20',
    totalVisits: 8,
    notes: 'Prefers Dr. Sarah Johnson',
    address: '123 Main St, New York, NY 10001',
    emergencyContact: 'John Wilson (555) 123-4568'
  },
  {
    id: 'p2',
    name: 'Olivia Brown',
    email: 'olivia.brown@email.com',
    phone: '(555) 234-5678',
    dateOfBirth: '1985-08-22',
    lastVisit: '2024-12-18',
    totalVisits: 12,
    address: '456 Oak Ave, Brooklyn, NY 11201',
  },
  {
    id: 'p3',
    name: 'Sophia Davis',
    email: 'sophia.davis@email.com',
    phone: '(555) 345-6789',
    dateOfBirth: '1992-03-10',
    lastVisit: '2024-12-15',
    totalVisits: 5,
    address: '789 Pine Rd, Queens, NY 11354',
  },
  {
    id: 'p4',
    name: 'Ava Martinez',
    email: 'ava.martinez@email.com',
    phone: '(555) 456-7890',
    dateOfBirth: '1988-11-30',
    totalVisits: 3,
  },
];

interface PatientsViewProps {
  isDoctorView?: boolean;
  doctorId?: string;
  doctorName?: string;
}

export default function PatientsView({ isDoctorView = false, doctorId = '', doctorName = '' }: PatientsViewProps) {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatientFile, setSelectedPatientFile] = useState<{ patientId: string; patientName: string } | null>(null);

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
      // Update existing patient
      setPatients(prev => prev.map(p => p.id === patient.id ? patient : p));
    } else {
      // Add new patient
      setPatients(prev => [...prev, patient]);
    }
  };

  const handleDeletePatient = (id: string) => {
    setPatients(prev => prev.filter(p => p.id !== id));
  };

  const handleOpenPatientFile = (patient: Patient) => {
    if (isDoctorView && doctorId && doctorName) {
      setSelectedPatientFile({
        patientId: patient.id,
        patientName: patient.name,
      });
    }
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
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
        />
      </div>

      {/* Patients Grid */}
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

            {isDoctorView && (
              <button
                onClick={() => handleOpenPatientFile(patient)}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FolderOpen className="w-4 h-4" />
                Open Patient File
              </button>
            )}
          </div>
        ))}
      </div>

      {filteredPatients.length === 0 && (
        <div className="text-center py-12 text-gray-600">
          No patients found matching your search.
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

      {/* Patient File View */}
      {selectedPatientFile && doctorId && doctorName && (
        <PatientFileView
          patientId={selectedPatientFile.patientId}
          patientName={selectedPatientFile.patientName}
          doctorId={doctorId}
          doctorName={doctorName}
          onClose={() => setSelectedPatientFile(null)}
        />
      )}
    </div>
  );
}