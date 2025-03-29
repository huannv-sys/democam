package function

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
)

type StorageResponse struct {
	List struct {
		Info []StorageDevice
	}
}

type StorageDevice struct {
	Name   string
	State  string
	Detail []DeviceDetails
}

type DeviceDetails struct {
	IsError    bool
	Pointer    uint
	TotalBytes float64
	Type       string
	Path       string
	UsedBytes  float64
}

func getStorageDeviceInfo() {
	url := ""

	resp, err := http.Get(url)
	if err != nil {
		log.Fatalf("Failed to make request: %v", err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Fatalf("Failed to read response body: %v", err)
	}

	var storageResponse StorageResponse
	err = json.Unmarshal(body, &storageResponse)
	if err != nil {
		log.Fatalf("Failed to parse JSON: %v", err)
	}

	for _, device := range storageResponse.List.Info {
		fmt.Printf("Name: %s\n", device.Name)
		fmt.Printf("State:%s\n", device.State)
		for _, detail := range device.Detail {
			fmt.Printf("IsError: %t\n", detail.IsError)
			fmt.Printf("Pointer: %d\n", detail.Pointer)
			fmt.Printf("TotalBytes: %.2f\n", detail.TotalBytes)
			fmt.Printf("Type: %s\n", detail.Type)
			fmt.Printf("Path: %s\n", detail.Path)
			fmt.Printf("UsedBytes: %.2f\n", detail.UsedBytes)
		}
	}
}
