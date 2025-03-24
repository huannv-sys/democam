import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../lib/queryClient'
import { formatDate, formatDuration } from '../lib/utils'

function Recordings() {
  const [selectedRecording, setSelectedRecording] = useState(null)
  const [filters, setFilters] = useState({
    cameraId: '',
    startDate: '',
    endDate: ''
  })

  // Fetch cameras for the filter dropdown
  const { data: cameras = [] } = useQuery({
    queryKey: ['cameras'],
    queryFn: () => apiRequest('/api/cameras')
  })

  // Fetch recordings with filters
  const { data: recordings = [], isLoading, error } = useQuery({
    queryKey: ['recordings', filters],
    queryFn: () => {
      let url = '/api/recordings'
      const params = new URLSearchParams()
      
      if (filters.cameraId) params.append('cameraId', filters.cameraId)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      
      const queryString = params.toString()
      if (queryString) url += `?${queryString}`
      
      return apiRequest(url)
    }
  })

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Reset filters
  const resetFilters = () => {
    setFilters({
      cameraId: '',
      startDate: '',
      endDate: ''
    })
  }

  // Play recording
  const playRecording = (recording) => {
    setSelectedRecording(recording)
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Bản ghi Video</h1>
      </div>

      <div className="card">
        <h2 className="card-title">Lọc bản ghi</h2>
        <div className="filter-form">
          <div className="form-group">
            <label className="form-label" htmlFor="cameraId">Camera</label>
            <select
              className="form-input"
              id="cameraId"
              name="cameraId"
              value={filters.cameraId}
              onChange={handleFilterChange}
            >
              <option value="">Tất cả camera</option>
              {cameras.map(camera => (
                <option key={camera.id} value={camera.id}>{camera.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="startDate">Từ ngày</label>
            <input
              className="form-input"
              type="date"
              id="startDate"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="endDate">Đến ngày</label>
            <input
              className="form-input"
              type="date"
              id="endDate"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>
          <div className="form-group">
            <button className="btn btn-primary" onClick={resetFilters}>Xóa bộ lọc</button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="card">
          <p>Đang tải bản ghi...</p>
        </div>
      ) : error ? (
        <div className="alert alert-error">
          Lỗi khi tải bản ghi: {error.message}
        </div>
      ) : (
        <div className="card">
          <h2 className="card-title">Danh sách bản ghi</h2>
          {recordings.length === 0 ? (
            <p>Không tìm thấy bản ghi nào phù hợp với bộ lọc.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Camera</th>
                    <th>Thời gian bắt đầu</th>
                    <th>Thời lượng</th>
                    <th>Kích thước</th>
                    <th>Sự kiện</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {recordings.map(recording => {
                    // Find camera name
                    const camera = cameras.find(c => c.id === recording.cameraId)
                    const cameraName = camera ? camera.name : 'Camera không xác định'
                    
                    return (
                      <tr key={recording.id}>
                        <td>{cameraName}</td>
                        <td>{formatDate(recording.startTime)}</td>
                        <td>{formatDuration(recording.duration)}</td>
                        <td>{(recording.size / (1024 * 1024)).toFixed(2)} MB</td>
                        <td>{recording.triggerEvent || 'Theo lịch'}</td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => playRecording(recording)}
                          >
                            Xem
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedRecording && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              Xem bản ghi
              {cameras.find(c => c.id === selectedRecording.cameraId)?.name && (
                ` - ${cameras.find(c => c.id === selectedRecording.cameraId).name}`
              )}
            </h2>
            <button 
              className="btn btn-secondary"
              onClick={() => setSelectedRecording(null)}
            >
              Đóng
            </button>
          </div>
          <div className="video-player">
            <video 
              controls 
              src={`/api/recordings/${selectedRecording.id}/stream`}
              style={{ width: '100%' }}
            />
          </div>
          <div className="recording-details">
            <p><strong>Thời gian bắt đầu:</strong> {formatDate(selectedRecording.startTime)}</p>
            <p><strong>Thời lượng:</strong> {formatDuration(selectedRecording.duration)}</p>
            <p><strong>Kích thước:</strong> {(selectedRecording.size / (1024 * 1024)).toFixed(2)} MB</p>
            {selectedRecording.triggerEvent && (
              <p><strong>Sự kiện kích hoạt:</strong> {selectedRecording.triggerEvent}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Recordings