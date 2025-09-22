import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Plus,
  Calendar,
  User,
  Activity,
  Heart,
  Thermometer,
  Scale
} from 'lucide-react';

export const PatientRecords: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'records' | 'vitals' | 'prescriptions' | 'lab-results'>('records');

  const medicalRecords = [
    {
      id: '1',
      title: 'Annual Physical Examination',
      date: '2024-01-10',
      doctor: 'Dr. Sarah Smith',
      type: 'Examination',
      status: 'completed'
    },
    {
      id: '2',
      title: 'Blood Test Results',
      date: '2024-01-08',
      doctor: 'Dr. Sarah Smith',
      type: 'Lab Results',
      status: 'completed'
    },
    {
      id: '3',
      title: 'Cardiology Consultation',
      date: '2023-12-15',
      doctor: 'Dr. Michael Johnson',
      type: 'Consultation',
      status: 'completed'
    }
  ];

  const vitals = [
    { date: '2024-01-10', bloodPressure: '120/80', heartRate: '72', temperature: '98.6°F', weight: '165 lbs' },
    { date: '2024-01-08', bloodPressure: '118/78', heartRate: '68', temperature: '98.4°F', weight: '164 lbs' },
    { date: '2023-12-15', bloodPressure: '122/82', heartRate: '74', temperature: '98.7°F', weight: '166 lbs' }
  ];

  const prescriptions = [
    {
      id: '1',
      medication: 'Lisinopril 10mg',
      prescribedBy: 'Dr. Sarah Smith',
      startDate: '2024-01-10',
      endDate: '2024-07-10',
      dosage: 'Once daily',
      status: 'active'
    },
    {
      id: '2',
      medication: 'Metformin 500mg',
      prescribedBy: 'Dr. Sarah Smith',
      startDate: '2023-06-15',
      endDate: '2024-06-15',
      dosage: 'Twice daily with meals',
      status: 'active'
    }
  ];

  const labResults = [
    {
      id: '1',
      testName: 'Complete Blood Count (CBC)',
      date: '2024-01-08',
      status: 'normal',
      orderedBy: 'Dr. Sarah Smith'
    },
    {
      id: '2',
      testName: 'Lipid Panel',
      date: '2024-01-08',
      status: 'normal',
      orderedBy: 'Dr. Sarah Smith'
    },
    {
      id: '3',
      testName: 'HbA1c',
      date: '2023-12-01',
      status: 'elevated',
      orderedBy: 'Dr. Sarah Smith'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'vitals':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Vital Signs History</h3>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Vitals</span>
              </button>
            </div>

            <div className="grid gap-4">
              {vitals.map((vital, index) => (
                <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">
                      {new Date(vital.date).toLocaleDateString()}
                    </span>
                    <button className="text-blue-600 hover:text-blue-700">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-red-100 p-2 rounded-lg">
                        <Heart className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Blood Pressure</p>
                        <p className="font-semibold text-gray-900">{vital.bloodPressure} mmHg</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Activity className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Heart Rate</p>
                        <p className="font-semibold text-gray-900">{vital.heartRate} bpm</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="bg-yellow-100 p-2 rounded-lg">
                        <Thermometer className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Temperature</p>
                        <p className="font-semibold text-gray-900">{vital.temperature}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Scale className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Weight</p>
                        <p className="font-semibold text-gray-900">{vital.weight}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'prescriptions':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Current Prescriptions</h3>
            </div>

            <div className="grid gap-4">
              {prescriptions.map((prescription) => (
                <div key={prescription.id} className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{prescription.medication}</h4>
                      <p className="text-sm text-gray-600 mb-2">Prescribed by {prescription.prescribedBy}</p>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><strong>Dosage:</strong> {prescription.dosage}</p>
                        <p><strong>Duration:</strong> {prescription.startDate} to {prescription.endDate}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      prescription.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {prescription.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'lab-results':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Laboratory Results</h3>
            </div>

            <div className="grid gap-4">
              {labResults.map((result) => (
                <div key={result.id} className="bg-white p-6 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{result.testName}</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Ordered by {result.orderedBy} • {new Date(result.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        result.status === 'normal' 
                          ? 'bg-green-100 text-green-800'
                          : result.status === 'elevated'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {result.status}
                      </span>
                      <button className="text-blue-600 hover:text-blue-700">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Medical Records</h3>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Upload Record</span>
              </button>
            </div>

            <div className="grid gap-4">
              {medicalRecords.map((record) => (
                <div key={record.id} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{record.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(record.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{record.doctor}</span>
                          </div>
                        </div>
                        <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {record.type}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { key: 'records', label: 'Medical Records', icon: FileText },
            { key: 'vitals', label: 'Vital Signs', icon: Activity },
            { key: 'prescriptions', label: 'Prescriptions', icon: FileText },
            { key: 'lab-results', label: 'Lab Results', icon: FileText }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } transition-colors`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};