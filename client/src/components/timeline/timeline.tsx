import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Recording } from "@shared/schema";

interface TimelineProps {
  selectedDate: Date;
  selectedCamera: number | "all";
  onTimeSelected: (timestamp: Date) => void;
}

export default function Timeline({ selectedDate, selectedCamera, onTimeSelected }: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [timeMarkerPosition, setTimeMarkerPosition] = useState(50); // Default to middle (%)
  
  // Fetch recordings for the selected date and camera
  const { data: recordings = [] } = useQuery<Recording[]>({
    queryKey: ['/api/recordings', selectedCamera !== 'all' ? selectedCamera : null],
    enabled: !!selectedDate,
  });

  // Filter recordings for the selected date
  const dateRecordings = recordings.filter(recording => {
    const recordingDate = new Date(recording.startTime);
    return (
      recordingDate.getFullYear() === selectedDate.getFullYear() &&
      recordingDate.getMonth() === selectedDate.getMonth() &&
      recordingDate.getDate() === selectedDate.getDate()
    );
  });

  // Handle timeline click
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const position = ((e.clientX - rect.left) / rect.width) * 100;
      setTimeMarkerPosition(position);
      
      // Calculate the selected time based on position
      // Assuming the timeline represents a 24-hour period from 00:00 to 23:59:59
      const dayStartTime = new Date(selectedDate);
      dayStartTime.setHours(0, 0, 0, 0);
      
      const millisInDay = 24 * 60 * 60 * 1000;
      const selectedTimeOffset = millisInDay * (position / 100);
      
      const selectedTime = new Date(dayStartTime.getTime() + selectedTimeOffset);
      onTimeSelected(selectedTime);
    }
  };

  // Group recordings by camera ID
  const recordingsByCamera: Record<number, Recording[]> = {};
  dateRecordings.forEach(recording => {
    if (!recordingsByCamera[recording.cameraId]) {
      recordingsByCamera[recording.cameraId] = [];
    }
    recordingsByCamera[recording.cameraId].push(recording);
  });

  // Generate time markers (2-hour intervals)
  const timeMarkers = [];
  for (let hour = 0; hour < 24; hour += 2) {
    timeMarkers.push({
      hour,
      label: `${hour.toString().padStart(2, '0')}:00`
    });
  }

  return (
    <div className="relative">
      <div className="timeline-scroll overflow-x-auto pb-2">
        <div 
          ref={timelineRef}
          className="timeline bg-secondary-100 rounded-lg relative"
          style={{ width: "100%", minWidth: "1000px" }}
          onClick={handleTimelineClick}
        >
          {/* Time markers */}
          <div className="flex justify-between px-2 text-xs text-secondary-500 font-mono absolute top-1 w-full">
            {timeMarkers.map((marker, idx) => (
              <span key={idx}>{marker.label}</span>
            ))}
          </div>
          
          {/* Timeline segments */}
          <div className="flex h-full pt-5 pb-1 px-2 space-x-0.5">
            {/* Generate segments for each 2-hour period (12 segments total) */}
            {Array.from({ length: 12 }).map((_, segmentIndex) => (
              <div key={segmentIndex} className="h-full flex-1 flex flex-col space-y-1">
                {/* For each camera, show recording segments */}
                {Array.from({ length: 4 }).map((_, camIndex) => {
                  const cameraId = camIndex + 1;
                  const cameraRecordings = recordingsByCamera[cameraId] || [];
                  
                  // Calculate recording coverage for this time segment
                  const segmentStart = segmentIndex * 2; // hours
                  const segmentEnd = segmentStart + 2; // hours
                  
                  // Find recordings that overlap with this segment
                  const overlappingRecordings = cameraRecordings.filter(recording => {
                    const recStart = new Date(recording.startTime);
                    const recEnd = recording.endTime ? new Date(recording.endTime) : new Date();
                    
                    const recStartHour = recStart.getHours() + (recStart.getMinutes() / 60);
                    const recEndHour = recEnd.getHours() + (recEnd.getMinutes() / 60);
                    
                    return (recStartHour < segmentEnd && recEndHour > segmentStart);
                  });
                  
                  // Calculate coverage percentage for this segment
                  let coveragePercent = 0;
                  if (overlappingRecordings.length > 0) {
                    // Simple calculation - if any recording exists, assume coverage
                    coveragePercent = 70 + Math.random() * 30; // Random between 70-100% for demo
                  }
                  
                  // Find motion events in this segment
                  const motionEvents = overlappingRecordings
                    .filter(rec => rec.hasMotion)
                    .map(rec => {
                      // Random position and width for demo
                      return {
                        position: 20 + Math.random() * 60, // Random position between 20-80%
                        width: 3 + Math.random() * 7 // Random width between 3-10%
                      };
                    });
                  
                  return (
                    <div key={camIndex} className="h-3 bg-primary-200 rounded relative">
                      {coveragePercent > 0 && (
                        <div 
                          className="absolute left-0 top-0 h-full rounded bg-primary-500" 
                          style={{ width: `${coveragePercent}%` }}
                        ></div>
                      )}
                      
                      {/* Motion events */}
                      {motionEvents.map((event, idx) => (
                        <div 
                          key={idx}
                          className="absolute top-0 h-full rounded-sm bg-danger" 
                          style={{ 
                            left: `${event.position}%`, 
                            width: `${event.width}%` 
                          }}
                        ></div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          
          {/* Current time marker */}
          <div 
            className="timeline-marker"
            style={{ left: `${timeMarkerPosition}%` }}
          ></div>
        </div>
      </div>
      
      {/* Camera labels */}
      <div className="absolute left-0 top-0 bottom-0 flex flex-col space-y-1 pt-5 pb-1 justify-center text-xs">
        <div className="h-3 flex items-center pr-2">
          <span className="text-secondary-600">CAM 1</span>
        </div>
        <div className="h-3 flex items-center pr-2">
          <span className="text-secondary-600">CAM 2</span>
        </div>
        <div className="h-3 flex items-center pr-2">
          <span className="text-secondary-600">CAM 3</span>
        </div>
        <div className="h-3 flex items-center pr-2">
          <span className="text-secondary-600">CAM 4</span>
        </div>
      </div>
    </div>
  );
}
