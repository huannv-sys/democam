package function

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
)

type AuthorityList struct {
	OpenGate *bool
}

func insertTrafficRecord(recordName string, plateNumber string, masterOfCar string, plateColor string, plateType string, vehicleType string, vehicleColor string, beginTime string, cancelTime string, authorityList AuthorityList) (int, error) {
	baseURL := "http://192.168.1.108/cgi-bin/recordUpdater.cgi"

	params := url.Values{}
	params.Add("action", "insert")
	params.Add("name", recordName)
	params.Add("PlateNumber", plateNumber)
	params.Add("MasterOfCar", masterOfCar)
	params.Add("PlateColor", plateColor)
	params.Add("PlateType", plateType)
	params.Add("VehicleType", vehicleType)
	params.Add("VehicleColor", vehicleColor)
	params.Add("BeginTime", beginTime)
	params.Add("CancelTime", cancelTime)

	if recordName == "TrafficRedList" && authorityList.OpenGate != nil {
		params.Add("AuthorityList.OpenGate", strconv.FormatBool(*authorityList.OpenGate))
	}

	URL := fmt.Sprintf("%s?%s", baseURL, params.Encode())
	fmt.Println("Request URL:", URL)

	resp, err := http.Get(URL)
	if err != nil {
		return -1, fmt.Errorf("request failed: %v", err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return -1, fmt.Errorf("error reading response: %v", err)
	}

	fmt.Println("Response Body: ", string(body))

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
