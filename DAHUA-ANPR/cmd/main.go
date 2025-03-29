package main

import (
	"fmt"
	"io/ioutil"
	"net/url"
	"regexp"
	"strconv"

	digest_auth_client "github.com/xinsnake/go-http-digest-auth-client"
)

type AuthorityList struct {
	OpenGate *bool
}

func insertTrafficRecord(recordName string, plateNumber string, masterOfCar string, plateColor string, plateType string, vehicleType string, vehicleColor string, beginTime string, cancelTime string, authorityList AuthorityList, username, password string) (int, error) {
	baseURL := "http://192.168.1.100/cgi-bin/recordUpdater.cgi"

	if plateNumber == "" {
		return -1, fmt.Errorf("PlateNumber is required")
	}

	params := url.Values{}
	params.Add("action", "insert")
	params.Add("name", recordName)
	params.Add("PlateNumber", plateNumber)

	if masterOfCar != "" {
		params.Add("MasterOfCar", masterOfCar)
	}
	if plateColor != "" {
		params.Add("PlateColor", plateColor)
	}
	if plateType != "" {
		params.Add("PlateType", plateType)
	}
	if vehicleType != "" {
		params.Add("VehicleType", vehicleType)
	}
	if vehicleColor != "" {
		params.Add("VehicleColor", vehicleColor)
	}
	if beginTime != "" {
		params.Add("BeginTime", beginTime)
	}
	if cancelTime != "" {
		params.Add("CancelTime", cancelTime)
	}

	if recordName == "TrafficRedList" && authorityList.OpenGate != nil {
		params.Add("AuthorityList.OpenGate", strconv.FormatBool(*authorityList.OpenGate))
	}

	URL := fmt.Sprintf("%s?%s", baseURL, params.Encode())
	fmt.Println("Request URL:", URL)

	digestClient := digest_auth_client.NewRequest(username, password, "POST", URL, "")
	resp, err := digestClient.Execute()
	if err != nil {
		return -1, fmt.Errorf("request failed: %v", err)
	}
	defer resp.Body.Close()

	fmt.Printf("Response Status: %s\n", resp.Status)
	fmt.Printf("Response Headers: %v\n", resp.Header)

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return -1, fmt.Errorf("error reading response: %v", err)
	}

	fmt.Println("Response Body: ", string(body))

	if len(body) == 0 {
		return -1, fmt.Errorf("empty response from server")
	}

	recNoRegexp := regexp.MustCompile(`RecNo=(\d+)`)
	matches := recNoRegexp.FindStringSubmatch(string(body))
	if len(matches) > 1 {
		recNo, err := strconv.Atoi(matches[1])
		if err != nil {
			return -1, fmt.Errorf("failed to parse RecNo: %v", err)
		}
		fmt.Printf("Record inserted successfully, RecNo: %d\n", recNo)
		return recNo, nil
	}

	return -1, fmt.Errorf("error inserting record: %s", string(body))
}

func main() {
	openGate := true
	authorityList := AuthorityList{
		OpenGate: &openGate,
	}

	recordName := "TrafficRedList"
	plateNumber := "ABC1234"
	masterOfCar := "John Doe"
	plateColor := "Blue"
	plateType := "Private"
	vehicleType := "Toyota"
	vehicleColor := "Black"
	beginTime := "2024-09-30 10:00:00"
	cancelTime := "2024-09-30 12:00:00"

	username := "admin"
	password := "admin123"

	recNo, err := insertTrafficRecord(recordName, plateNumber, masterOfCar, plateColor, plateType, vehicleType, vehicleColor, beginTime, cancelTime, authorityList, username, password)
	if err != nil {
		fmt.Println("Error inserting traffic record:", err)
	} else {
		fmt.Println("Traffic record inserted successfully with RecNo:", recNo)
	}
}
