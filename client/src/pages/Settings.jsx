import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../lib/queryClient'

function Settings() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('general')

  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiRequest('/api/settings')
  })

  // Update settings
  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings) => 
      apiRequest('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(newSettings)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['settings'])
      alert('Cài đặt đã được lưu!')
    },
    onError: (error) => {
      alert(`Lỗi: ${error.message}`)
    }
  })

  // Form states
  const [generalSettings, setGeneralSettings] = useState({
    storageLocation: '',
    maxStorageSize: 1000,
    retentionPeriod: 30,
    recordingFormat: 'MP4',
    maxConcurrentStreams: 4
  })

  const [notificationSettings, setNotificationSettings] = useState({
    notificationsEnabled: true,
    emailNotifications: false,
    emailAddress: '',
    motionDetectionSensitivity: 50
  })

  // Load form data when settings are fetched
  React.useEffect(() => {
    if (settings) {
      setGeneralSettings({
        storageLocation: settings.storageLocation || '/recordings',
        maxStorageSize: settings.maxStorageSize || 1000,
        retentionPeriod: settings.retentionPeriod || 30,
        recordingFormat: settings.recordingFormat || 'MP4',
        maxConcurrentStreams: settings.maxConcurrentStreams || 4
      })

      setNotificationSettings({
        notificationsEnabled: settings.notificationsEnabled !== undefined ? settings.notificationsEnabled : true,
        emailNotifications: settings.emailNotifications || false,
        emailAddress: settings.emailAddress || '',
        motionDetectionSensitivity: settings.defaultMotionSensitivity || 50
      })
    }
  }, [settings])

  // Handle general settings changes
  const handleGeneralChange = (e) => {
    const { name, value, type } = e.target
    setGeneralSettings({
      ...generalSettings,
      [name]: type === 'number' ? parseInt(value, 10) : value
    })
  }

  // Handle notification settings changes
  const handleNotificationChange = (e) => {
    const { name, value, type, checked } = e.target
    setNotificationSettings({
      ...notificationSettings,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? parseInt(value, 10) : value
    })
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Combine all settings
    const newSettings = {
      ...generalSettings,
      ...notificationSettings,
      defaultMotionSensitivity: notificationSettings.motionDetectionSensitivity
    }
    
    updateSettingsMutation.mutate(newSettings)
  }

  if (isLoading) {
    return <div>Đang tải cài đặt...</div>
  }

  return (
    <div>
      <h1 className="page-title">Cài đặt hệ thống</h1>
      
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          Cài đặt chung
        </button>
        <button 
          className={`tab ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          Thông báo
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="card">
          {activeTab === 'general' && (
            <div>
              <h2 className="card-title">Cài đặt chung</h2>
              
              <div className="form-group">
                <label className="form-label" htmlFor="storageLocation">Vị trí lưu trữ</label>
                <input
                  className="form-input"
                  type="text"
                  id="storageLocation"
                  name="storageLocation"
                  value={generalSettings.storageLocation}
                  onChange={handleGeneralChange}
                />
                <small>Nơi lưu trữ bản ghi và ảnh chụp</small>
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="maxStorageSize">Dung lượng lưu trữ tối đa (MB)</label>
                <input
                  className="form-input"
                  type="number"
                  id="maxStorageSize"
                  name="maxStorageSize"
                  value={generalSettings.maxStorageSize}
                  onChange={handleGeneralChange}
                  min="100"
                />
                <small>Khi vượt quá dung lượng, các bản ghi cũ sẽ tự động bị xóa</small>
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="retentionPeriod">Thời gian lưu trữ (ngày)</label>
                <input
                  className="form-input"
                  type="number"
                  id="retentionPeriod"
                  name="retentionPeriod"
                  value={generalSettings.retentionPeriod}
                  onChange={handleGeneralChange}
                  min="1"
                  max="365"
                />
                <small>Các bản ghi cũ hơn số ngày này sẽ tự động bị xóa</small>
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="recordingFormat">Định dạng bản ghi</label>
                <select
                  className="form-input"
                  id="recordingFormat"
                  name="recordingFormat"
                  value={generalSettings.recordingFormat}
                  onChange={handleGeneralChange}
                >
                  <option value="MP4">MP4</option>
                  <option value="WEBM">WEBM</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="maxConcurrentStreams">Số luồng xem đồng thời tối đa</label>
                <input
                  className="form-input"
                  type="number"
                  id="maxConcurrentStreams"
                  name="maxConcurrentStreams"
                  value={generalSettings.maxConcurrentStreams}
                  onChange={handleGeneralChange}
                  min="1"
                  max="16"
                />
                <small>Số lượng camera có thể xem cùng lúc</small>
              </div>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div>
              <h2 className="card-title">Cài đặt thông báo</h2>
              
              <div className="form-group">
                <label className="form-label" htmlFor="notificationsEnabled">
                  <input
                    type="checkbox"
                    id="notificationsEnabled"
                    name="notificationsEnabled"
                    checked={notificationSettings.notificationsEnabled}
                    onChange={handleNotificationChange}
                  />
                  <span className="ms-2">Bật thông báo</span>
                </label>
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="emailNotifications">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    name="emailNotifications"
                    checked={notificationSettings.emailNotifications}
                    onChange={handleNotificationChange}
                    disabled={!notificationSettings.notificationsEnabled}
                  />
                  <span className="ms-2">Gửi thông báo qua email</span>
                </label>
              </div>
              
              {notificationSettings.emailNotifications && (
                <div className="form-group">
                  <label className="form-label" htmlFor="emailAddress">Địa chỉ email</label>
                  <input
                    className="form-input"
                    type="email"
                    id="emailAddress"
                    name="emailAddress"
                    value={notificationSettings.emailAddress}
                    onChange={handleNotificationChange}
                    disabled={!notificationSettings.notificationsEnabled}
                  />
                </div>
              )}
              
              <div className="form-group">
                <label className="form-label" htmlFor="motionDetectionSensitivity">
                  Độ nhạy phát hiện chuyển động ({notificationSettings.motionDetectionSensitivity}%)
                </label>
                <input
                  type="range"
                  id="motionDetectionSensitivity"
                  name="motionDetectionSensitivity"
                  min="0"
                  max="100"
                  value={notificationSettings.motionDetectionSensitivity}
                  onChange={handleNotificationChange}
                  disabled={!notificationSettings.notificationsEnabled}
                  className="form-range"
                  style={{ width: '100%' }}
                />
                <small>Giá trị càng cao, hệ thống càng nhạy với chuyển động</small>
              </div>
            </div>
          )}
          
          <div className="form-group mt-4">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={updateSettingsMutation.isLoading}
            >
              {updateSettingsMutation.isLoading ? 'Đang lưu...' : 'Lưu cài đặt'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default Settings