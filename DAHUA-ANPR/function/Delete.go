package function

import (
	"fmt"
	"net/http"
	"net/url"
)

func removeTrafficRecord(serverURL, listType string, recno int) error {
	reqURL := fmt.Sprintf("%s/cgi-bin/recordUpdater.cgi?action=remove&name=%s&recno=%d", serverURL, url.QueryEscape(listType), recno)

	resp, err := http.Get(reqURL)
	if err != nil {
		return fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var responseBody string
	_, err = fmt.Fscanf(resp.Body, "%s", &responseBody)
	if err != nil {
		return fmt.Errorf("failed to read response body: %v", err)
	}

	if responseBody != "OK" {
		return fmt.Errorf("failed to remove record: %s", responseBody)
	}

	fmt.Println("Record successfully removed.")
	return nil
}
