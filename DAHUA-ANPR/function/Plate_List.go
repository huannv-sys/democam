package function

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
)

type Authority struct {
	OpenGate bool
}

type Record struct {
	Recno        int
	CreateTime   int
	PlateNumber  string
	MasterOfCar  string
	PlateColor   string
	PlateType    string
	VehicleType  string
	vehicleColor string
	BeginTime    string
	CancelTime   string
}

type Response struct {
	TotalCount int
	Found      int
	Record     []Record
}

func findTrafficRecords(server, name string, conditions map[string]string, count int, startTime, endTime string) (*Response, error) {
	baseURL := fmt.Sprintf("http://%s/cgi-bin/recordFinder.cgi?action=find&name=%s", server, url.QueryEscape(name))

	query := url.Values{}
	if count > 0 {
		query.Set("count", strconv.Itoa(count))
	}
	if startTime != "" {
		query.Set("StartTime", startTime)
	}
	if endTime != "" {
		query.Set("EndTime", endTime)
	}
	for key, value := range conditions {
		query.Set("condition,"+key, value)
	}

	URL := fmt.Sprintf("%s&%s", baseURL, query.Encode())

	resp, err := http.Get(URL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Failed to fetch record: %s", resp.Status)
	}

	var response Response
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, err
	}

	return &response, nil
}
