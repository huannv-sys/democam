import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../lib/queryClient'
import { formatDate } from '../lib/utils'

function Dashboard() {
  const [selectedCamera, setSelectedCamera] = useState(null)
  
  // Fetch cameras
  const { data: cameras = [], isLoading: camerasLoading } = useQuery({
    queryKey: ['cameras'],
    queryFn: () => apiRequest('/api/cameras')
  })
  
  // Fetch recent alerts (last 24 hours)
  const oneDayAgo = new Date()
  oneDayAgo.setDate(oneDayAgo.getDate() - 1)
  
  const { data: recentAlerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['recentAlerts'],
    queryFn: () => apiRequest(`/api/alerts?startDate=${oneDayAgo.toISOString()}`)
  })
  
  // Fetch recent recordings (last 24 hours)
  const { data: recentRecordings = [], isLoading: recordingsLoading } = useQuery({
    queryKey: ['recentRecordings'],
    queryFn: () => apiRequest(`/api/recordings?startDate=${oneDayAgo.toISOString()}`)
  })
  
  // Fetch system settings for status information
  const { data: settings = {}, isLoading: settingsLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiRequest('/api/settings')
  })
  
  // Connect to camera for streaming
  const startStream = async (camera) => {
    try {
      const response = await apiRequest(`/api/cameras/${camera.id}/stream/start`, {
        method: 'POST'
      })
      
      if (response.success) {
        setSelectedCamera({
          ...camera,
          wsUrl: response.wsUrl
        })
      }
    } catch (error) {
      console.error('Error starting stream:', error)
    }
  }
  
  // Disconnect from camera
  const stopStream = async () => {
    if (!selectedCamera) return
    
    try {
      await apiRequest(`/api/cameras/${selectedCamera.id}/stream/stop`, {
        method: 'POST'
      })
      setSelectedCamera(null)
    } catch (error) {
      console.error('Error stopping stream:', error)
    }
  }
  
  // Render camera stream
  const renderCameraStream = () => {
    if (!selectedCamera) return null
    
    return (
      <div className="camera-stream-container">
        <div className="stream-header">
          <h3>{selectedCamera.name}</h3>
          <button className="btn btn-secondary" onClick={stopStream}>
            Đóng luồng
          </button>
        </div>
        <div className="stream-content">
          <div className="video-wrapper">
            <img 
              src={`http://${window.location.hostname}:9999/stream.mjpg`} 
              alt={`Luồng từ camera ${selectedCamera.name}`}
            />
          </div>
        </div>
      </div>
    )
  }
  
  // Tính toán các số liệu thống kê
  const stats = {
    totalCameras: cameras.length,
    onlineCameras: cameras.filter(c => c.status === 'online' || c.status === 'streaming').length,
    offlineCameras: cameras.filter(c => c.status === 'offline' || c.status === 'error').length,
    pendingAlerts: recentAlerts.filter(a => !a.resolved).length,
    totalRecordings: recentRecordings.length,
    recordingStorage: recentRecordings.reduce((total, rec) => total + rec.size, 0) / (1024 * 1024 * 1024) // GB
  }
  
  // Get alert type label
  const getAlertTypeLabel = (type) => {
    switch (type) {
      case 'motion':
        return 'Phát hiện chuyển động'
      case 'object':
        return 'Phát hiện đối tượng'
      case 'face':
        return 'Nhận diện khuôn mặt'
      case 'tamper':
        return 'Can thiệp camera'
      case 'disconnect':
        return 'Ngắt kết nối'
      default:
        return type
    }
  }
  
  const isLoading = camerasLoading || alertsLoading || recordingsLoading || settingsLoading
  
  if (isLoading) {
    return (
      <div className="loading-container">
        <p>Đang tải dữ liệu...</p>
      </div>
    )
  }
  
  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">Bảng điều khiển</h1>
      </div>
      
      <div className="stats-cards">
        <div className="grid grid-cols-3 gap-4">
          <div className="card">
            <h3 className="card-title">Tổng số camera</h3>
            <p className="stat">{stats.totalCameras}</p>
            <div className="stat-detail">
              <span className="online">{stats.onlineCameras} trực tuyến</span>
              <span className="offline">{stats.offlineCameras} ngoại tuyến</span>
            </div>
          </div>
          
          <div className="card">
            <h3 className="card-title">Cảnh báo chờ xử lý</h3>
            <p className="stat">{stats.pendingAlerts}</p>
            <div className="stat-detail">
              <span>Trong 24 giờ qua</span>
            </div>
          </div>
          
          <div className="card">
            <h3 className="card-title">Bản ghi gần đây</h3>
            <p className="stat">{stats.totalRecordings}</p>
            <div className="stat-detail">
              <span>{stats.recordingStorage.toFixed(2)} GB</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="grid grid-cols-2 gap-4">
          {/* Camera Overview */}
          <div className="card">
            <h2 className="card-title">Camera</h2>
            {cameras.length === 0 ? (
              <p>Không có camera nào được cấu hình.</p>
            ) : (
              <div className="camera-grid">
                {cameras.map(camera => (
                  <div key={camera.id} className={`camera-card status-${camera.status}`}>
                    <div className="camera-header">
                      <h3>{camera.name}</h3>
                      <span className={`status status-${camera.status}`}>
                        {camera.status === 'online' && 'Trực tuyến'}
                        {camera.status === 'offline' && 'Ngoại tuyến'}
                        {camera.status === 'error' && 'Lỗi'}
                        {camera.status === 'streaming' && 'Đang phát'}
                      </span>
                    </div>
                    <div className="camera-body">
                      <p>IP: {camera.ipAddress}</p>
                      <div className="camera-actions">
                        <button 
                          className="btn btn-primary"
                          onClick={() => startStream(camera)}
                          disabled={camera.status === 'offline' || camera.status === 'error'}
                        >
                          Xem luồng
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Stream or Recent Alerts */}
          {selectedCamera ? (
            <div className="card">
              {renderCameraStream()}
            </div>
          ) : (
            <div className="card">
              <h2 className="card-title">Cảnh báo gần đây</h2>
              {recentAlerts.length === 0 ? (
                <p>Không có cảnh báo nào trong 24 giờ qua.</p>
              ) : (
                <div className="recent-alerts">
                  {recentAlerts.slice(0, 5).map(alert => (
                    <div key={alert.id} className={`alert-item severity-${alert.severity}`}>
                      <div className="alert-time">{formatDate(alert.timestamp)}</div>
                      <div className="alert-info">
                        <h4>{getAlertTypeLabel(alert.type)}</h4>
                        <p>
                          {alert.message} 
                          <span className={`status ${alert.resolved ? 'resolved' : 'unresolved'}`}>
                            {alert.resolved ? '(Đã xử lý)' : '(Chưa xử lý)'}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Recent Recordings */}
      <div className="card">
        <h2 className="card-title">Bản ghi gần đây</h2>
        {recentRecordings.length === 0 ? (
          <p>Không có bản ghi nào trong 24 giờ qua.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Camera</th>
                  <th>Thời gian bắt đầu</th>
                  <th>Thời lượng</th>
                  <th>Kích thước</th>
                  <th>Loại</th>
                </tr>
              </thead>
              <tbody>
                {recentRecordings.slice(0, 5).map(recording => {
                  // Find camera name
                  const camera = cameras.find(c => c.id === recording.cameraId)
                  const cameraName = camera ? camera.name : 'Camera không xác định'
                  
                  // Format duration
                  const minutes = Math.floor(recording.duration / 60)
                  const seconds = recording.duration % 60
                  const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`
                  
                  return (
                    <tr key={recording.id}>
                      <td>{cameraName}</td>
                      <td>{formatDate(recording.startTime)}</td>
                      <td>{formattedDuration}</td>
                      <td>{(recording.size / (1024 * 1024)).toFixed(2)} MB</td>
                      <td>{recording.triggerEvent || 'Theo lịch'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* System Status */}
      <div className="card">
        <h2 className="card-title">Trạng thái hệ thống</h2>
        <div className="system-status">
          <div className="status-item">
            <span className="status-label">Lưu trữ bản ghi:</span>
            <span className="status-value">{settings.storagePath}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Thời gian lưu trữ:</span>
            <span className="status-value">{settings.retentionDays} ngày</span>
          </div>
          <div className="status-item">
            <span className="status-label">Phát hiện chuyển động:</span>
            <span className={`status-value ${settings.motionDetection ? 'enabled' : 'disabled'}`}>
              {settings.motionDetection ? 'Đã bật' : 'Đã tắt'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Nhận diện khuôn mặt:</span>
            <span className={`status-value ${settings.faceDetection ? 'enabled' : 'disabled'}`}>
              {settings.faceDetection ? 'Đã bật' : 'Đã tắt'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Phát hiện đối tượng:</span>
            <span className={`status-value ${settings.objectDetection ? 'enabled' : 'disabled'}`}>
              {settings.objectDetection ? 'Đã bật' : 'Đã tắt'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard