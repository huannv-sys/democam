import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../lib/queryClient'

function Cameras() {
  const [showAddCamera, setShowAddCamera] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    username: '',
    password: '',
    type: 'RTSP'
  })
  const [selectedCamera, setSelectedCamera] = useState(null)
  const videoRef = useRef(null)
  const queryClient = useQueryClient()

  // Fetch cameras
  const { data: cameras = [], isLoading, error } = useQuery({
    queryKey: ['cameras'],
    queryFn: () => apiRequest('/api/cameras')
  })

  // Connect to camera stream
  const connectMutation = useMutation({
    mutationFn: (cameraId) => apiRequest(`/api/cameras/${cameraId}/connect`, { method: 'POST' }),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['cameras'])

      if (selectedCamera && selectedCamera.id === data.streamId) {
        // Connect to WebSocket stream
        const wsUrl = `ws://localhost:${data.wsPort}`
        
        // Logic to display the video stream would go here
        // This depends on the streaming method used (WebSocket, HLS, etc.)
        console.log(`Connecting to stream at ${wsUrl}`)
        
        // For this example, we'll set the source of an HTML canvas
        // In a real application, you'd use a proper video player library
        const videoElement = videoRef.current
        if (videoElement) {
          // Here you would initialize your player with the stream URL
          videoElement.setAttribute('data-stream-url', wsUrl)
        }
      }
    }
  })

  // Disconnect from camera stream
  const disconnectMutation = useMutation({
    mutationFn: (cameraId) => apiRequest(`/api/cameras/${cameraId}/disconnect`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['cameras'])
    }
  })

  // Add new camera
  const addCameraMutation = useMutation({
    mutationFn: (data) => apiRequest('/api/cameras', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['cameras'])
      setShowAddCamera(false)
      setFormData({
        name: '',
        url: '',
        username: '',
        password: '',
        type: 'RTSP'
      })
    }
  })

  // Delete camera
  const deleteCameraMutation = useMutation({
    mutationFn: (cameraId) => apiRequest(`/api/cameras/${cameraId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['cameras'])
      if (selectedCamera && selectedCamera.id === deleteCameraMutation.variables) {
        setSelectedCamera(null)
      }
    }
  })

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    addCameraMutation.mutate(formData)
  }

  // Handle camera selection
  const handleCameraSelect = (camera) => {
    setSelectedCamera(camera)
  }

  // Toggle camera connection
  const toggleCameraConnection = (camera) => {
    if (camera.status === 'connected') {
      disconnectMutation.mutate(camera.id)
    } else {
      connectMutation.mutate(camera.id)
    }
  }

  // Handle camera deletion
  const handleDeleteCamera = (cameraId) => {
    if (confirm('Bạn có chắc chắn muốn xóa camera này không?')) {
      deleteCameraMutation.mutate(cameraId)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Quản lý Camera</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddCamera(!showAddCamera)}
        >
          {showAddCamera ? 'Hủy' : 'Thêm Camera'}
        </button>
      </div>

      {showAddCamera && (
        <div className="card">
          <h2 className="card-title">Thêm Camera Mới</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Tên Camera</label>
              <input
                className="form-input"
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="url">URL Stream (RTSP/ONVIF)</label>
              <input
                className="form-input"
                type="text"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                placeholder="rtsp://username:password@camera-ip:554/stream"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="type">Loại kết nối</label>
              <select
                className="form-input"
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
              >
                <option value="RTSP">RTSP Stream</option>
                <option value="ONVIF">ONVIF</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="username">Tên đăng nhập (Tùy chọn)</label>
              <input
                className="form-input"
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Mật khẩu (Tùy chọn)</label>
              <input
                className="form-input"
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={addCameraMutation.isLoading}
              >
                {addCameraMutation.isLoading ? 'Đang thêm...' : 'Thêm Camera'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div>Đang tải...</div>
      ) : error ? (
        <div className="alert alert-error">Lỗi: {error.message}</div>
      ) : (
        <div className="grid">
          {cameras.length === 0 ? (
            <div className="card">
              <p>Chưa có camera nào. Hãy thêm camera để bắt đầu.</p>
            </div>
          ) : (
            cameras.map((camera) => (
              <div 
                key={camera.id} 
                className={`camera-card ${selectedCamera?.id === camera.id ? 'selected' : ''}`}
                onClick={() => handleCameraSelect(camera)}
              >
                <div className="camera-card-preview">
                  {/* Camera preview would go here */}
                  {camera.status === 'connected' ? (
                    <div className="stream-active">Stream đang hoạt động</div>
                  ) : (
                    <div className="stream-inactive">Stream không hoạt động</div>
                  )}
                </div>
                <div className="camera-card-content">
                  <h3 className="camera-card-title">{camera.name}</h3>
                  <div className="camera-card-status">
                    <span 
                      className={`status-indicator ${camera.status === 'connected' ? 'status-online' : 'status-offline'}`}
                    ></span>
                    {camera.status === 'connected' ? 'Đang kết nối' : 'Đã ngắt kết nối'}
                  </div>
                  <div className="camera-card-actions">
                    <button 
                      className={`btn ${camera.status === 'connected' ? 'btn-danger' : 'btn-primary'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCameraConnection(camera);
                      }}
                    >
                      {camera.status === 'connected' ? 'Ngắt kết nối' : 'Kết nối'}
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCamera(camera.id);
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {selectedCamera && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">{selectedCamera.name}</h2>
            <div>
              <button 
                className={`btn ${selectedCamera.status === 'connected' ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => toggleCameraConnection(selectedCamera)}
              >
                {selectedCamera.status === 'connected' ? 'Ngắt kết nối' : 'Kết nối'}
              </button>
            </div>
          </div>
          <div className="video-player">
            {selectedCamera.status === 'connected' ? (
              <div>
                {/* This would be replaced with a proper video player component */}
                <canvas 
                  ref={videoRef} 
                  width="640" 
                  height="360"
                  style={{ background: '#000', width: '100%', height: '100%' }}
                ></canvas>
                <div>Kết nối tới: {selectedCamera.url}</div>
              </div>
            ) : (
              <div className="video-placeholder">
                <p>Camera hiện không kết nối. Nhấn "Kết nối" để bắt đầu stream.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Cameras