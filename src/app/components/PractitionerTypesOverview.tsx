import { Shield, Settings, Calendar, CheckCircle2, Info } from 'lucide-react';
import { usePractitionerTypes } from '../contexts/PractitionerTypeContext';

/**
 * Visual overview component showing all practitioner types and their capabilities
 * Can be used in settings or help sections
 */
export default function PractitionerTypesOverview() {
  const { practitionerTypes } = usePractitionerTypes();

  const getPermissionCount = (permissions: Record<string, boolean>) => {
    return Object.values(permissions).filter(Boolean).length;
  };

  const getFeatureCount = (features: Record<string, boolean>) => {
    return Object.values(features).filter(Boolean).length;
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-1">About Practitioner Types</h3>
            <p className="text-sm text-blue-700">
              Practitioner types define the permissions, features, and capabilities for different healthcare
              professionals in your clinic. Each type can be customized to match your specific needs.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {practitionerTypes.map((type) => (
          <div
            key={type.id}
            className="bg-white border-2 rounded-lg overflow-hidden"
            style={{ borderLeftColor: type.color, borderLeftWidth: '6px' }}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: type.color }}
                  >
                    <Settings className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl text-gray-900">{type.name}</h3>
                    <p className="text-sm text-gray-500">{type.category}</p>
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs ${
                    type.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {type.active ? 'Active' : 'Inactive'}
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 mb-4">{type.description}</p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Shield className="w-4 h-4" />
                    <span>Permissions</span>
                  </div>
                  <p className="text-2xl font-medium text-gray-900">
                    {getPermissionCount(type.permissions)}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Settings className="w-4 h-4" />
                    <span>Features</span>
                  </div>
                  <p className="text-2xl font-medium text-gray-900">
                    {getFeatureCount(type.features)}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>Duration</span>
                  </div>
                  <p className="text-2xl font-medium text-gray-900">
                    {type.schedulingRules.defaultAppointmentDuration}
                    <span className="text-sm text-gray-500 ml-1">min</span>
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Max/Day</span>
                  </div>
                  <p className="text-2xl font-medium text-gray-900">
                    {type.schedulingRules.maxAppointmentsPerDay}
                  </p>
                </div>
              </div>

              {/* Expandable Details */}
              <details className="group">
                <summary className="cursor-pointer text-sm text-pink-600 hover:text-pink-700 font-medium">
                  View Details
                </summary>
                <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-200">
                  {/* Permissions */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 text-sm">Key Permissions</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(type.permissions)
                        .filter(([_, enabled]) => enabled)
                        .map(([key]) => (
                          <div key={key} className="flex items-center gap-2 text-xs text-gray-600">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 text-sm">Specialized Features</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(type.features)
                        .filter(([_, enabled]) => enabled)
                        .map(([key]) => (
                          <div key={key} className="flex items-center gap-2 text-xs text-gray-600">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            <span>
                              {key.replace(/needs/g, '').replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Certifications */}
                  {type.requiredCertifications.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 text-sm">
                        Required Certifications
                      </h4>
                      <ul className="space-y-1">
                        {type.requiredCertifications.map((cert, idx) => (
                          <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                            <span className="text-pink-600 mt-0.5">•</span>
                            <span>{cert}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Allowed Services */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 text-sm">
                      Allowed Service Categories
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {type.allowedServiceCategories.map((cat) => (
                        <span
                          key={cat}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Scheduling Details */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 text-sm">Scheduling Rules</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Buffer Before:</span>{' '}
                        {type.schedulingRules.bufferTimeBefore} min
                      </div>
                      <div>
                        <span className="font-medium">Buffer After:</span>{' '}
                        {type.schedulingRules.bufferTimeAfter} min
                      </div>
                      <div>
                        <span className="font-medium">Double Booking:</span>{' '}
                        {type.schedulingRules.allowDoubleBooking ? 'Allowed' : 'Not Allowed'}
                      </div>
                      <div>
                        <span className="font-medium">Initial Consultation:</span>{' '}
                        {type.schedulingRules.requiresConsultation ? 'Required' : 'Optional'}
                      </div>
                    </div>
                  </div>
                </div>
              </details>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
