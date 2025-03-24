import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../lib/queryClient'
import { formatDate } from '../lib/utils'

function Alerts() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({
    cameraId: '',
    resolved: '',
    startDate: '',
    endDate: ''
  })
  
  // Fetch cameras for filter dropdown
  const { data: cameras = [] } = useQuery({
    queryKey: ['cameras'],
    queryFn: () => apiRequest('/api/cameras')
  })
  
  // Fetch alerts with filters
  const { data: alerts = [], isLoading, error } = useQuery({
    queryKey: ['alerts', filters],
    queryFn: () => {
      let url = '/api/alerts'
      const params = new URLSearchParams()
      
      if (filters.cameraId) params.append('cameraId', filters.cameraId)
      if (filters.resolved !== '') params.append('resolved', filters.resolved)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      
      const queryString = params.toString()
      if (queryString) url += `?${queryString}`
      
      return apiRequest(url)
    }
  })
  
  // Resolve alert mutation
  const resolveAlertMutation = useMutation({
    mutationFn: (alertId) => apiRequest(`/api/alerts/${alertId}`, {
      method: 'PUT',
      body: JSON.stringify({ resolved: true })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts'])
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
      resolved: '',
      startDate: '',
      endDate: ''
    })
  }
  
  // Resolve an alert
  const resolveAlert = (alertId) => {
    resolveAlertMutation.mutate(alertId)
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
  
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Cảnh báo</h1>
      </div>
      
      <div className="card">
        <h2 className="card-title">Lọc cảnh báo</h2>
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
            <label className="form-label" htmlFor="resolved">Trạng thái</label>
            <select
              className="form-input"
              id="resolved"
              name="resolved"
              value={filters.resolved}
              onChange={handleFilterChange}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="false">Chưa xử lý</option>
              <option value="true">Đã xử lý</option>
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
      
      <div className="stats-cards">
        <div className="grid">
          <div className="card">
            <h3 className="card-title">Tổng số cảnh báo</h3>
            <p className="stat">{alerts.length}</p>
          </div>
          <div className="card">
            <h3 className="card-title">Chưa xử lý</h3>
            <p className="stat">{alerts.filter(alert => !alert.resolved).length}</p>
          </div>
          <div className="card">
            <h3 className="card-title">Đã xử lý</h3>
            <p className="stat">{alerts.filter(alert => alert.resolved).length}</p>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="card">
          <p>Đang tải cảnh báo...</p>
        </div>
      ) : error ? (
        <div className="alert alert-error">
          Lỗi khi tải cảnh báo: {error.message}
        </div>
      ) : (
        <div className="card">
          <h2 className="card-title">Danh sách cảnh báo</h2>
          {alerts.length === 0 ? (
            <p>Không tìm thấy cảnh báo nào phù hợp với bộ lọc.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Loại cảnh báo</th>
                    <th>Camera</th>
                    <th>Thời gian</th>
                    <th>Mức độ</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map(alert => {
                    // Find camera name
                    const camera = cameras.find(c => c.id === alert.cameraId)
                    const cameraName = camera ? camera.name : 'Camera không xác định'
                    
                    return (
                      <tr key={alert.id}>
                        <td>{getAlertTypeLabel(alert.type)}</td>
                        <td>{cameraName}</td>
                        <td>{formatDate(alert.timestamp)}</td>
                        <td>
                          <span className={`severity severity-${alert.severity}`}>
                            {alert.severity === 'high' && 'Cao'}
                            {alert.severity === 'medium' && 'Trung bình'}
                            {alert.severity === 'low' && 'Thấp'}
                          </span>
                        </td>
                        <td>
                          <span className={`status ${alert.resolved ? 'status-resolved' : 'status-unresolved'}`}>
                            {alert.resolved ? 'Đã xử lý' : 'Chưa xử lý'}
                          </span>
                        </td>
                        <td>
                          {!alert.resolved && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => resolveAlert(alert.id)}
                              disabled={resolveAlertMutation.isLoading}
                            >
                              Đánh dấu đã xử lý
                            </button>
                          )}
                          {alert.snapshotUrl && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => window.open(alert.snapshotUrl, '_blank')}
                            >
                              Xem ảnh
                            </button>
                          )}
                          {alert.recordingId && (
                            <a 
                              href={`/recordings?id=${alert.recordingId}`}
                              className="btn btn-secondary btn-sm"
                            >
                              Xem video
                            </a>
                          )}
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
    </div>
  )
}

export default Alerts