package function

import (
	"encoding/json"
	"fmt"
)

type EventBaseInfo struct {
	Code   string
	Action string
	Index  int
}

type Vehicle struct {
	BoundingBox  []int
	Text         string
	SubText      string
	SubBrand     int
	BrandYear    int
	PlateNumber  string
	PlateColor   string
	VehicleColor string
	Country      string
}

type CommInfo struct {
	Seat []SeatInfo
}

type SeatInfo struct {
	Type     string
	Status   []string
	SunShade string
	ShadePos []int
	SafeBelt string
}

type TrafficEvent struct {
	EventBaseInfo EventBaseInfo
	Vehicle       Vehicle
	CommInfo      CommInfo
	GroupID       int
	Lane          int
	TriggerType   int
	Speed         int
}

func parseTrafficJunctionEvent(eventData []byte) (*TrafficEvent, error) {
	var event TrafficEvent

	err := json.Unmarshal(eventData, &event)
	if err != nil {
		return nil, err
	}

	switch event.EventBaseInfo.Action {
	case "Start":
		fmt.Println("Event Start Detected")
	case "Stop":
		fmt.Println("Event Stop Detected")
	case "Pulse":
		fmt.Println("Event Pulse Detected")
	}

	fmt.Printf("Vehicle: %s, Plate: %s, Color: %s\n", event.Vehicle.Text, event.Vehicle.PlateNumber, event.Vehicle.VehicleColor)

	return &event, nil
}
