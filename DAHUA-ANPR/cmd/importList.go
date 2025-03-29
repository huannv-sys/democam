package main

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
)

func ImportBlacklistOrRedlist(server, filePath, fileType, fileFormat, fileCode string) error {
	file, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("could not open file: %v", err)
	}
	defer file.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("blackfile", filepath.Base(filePath))
	if err != nil {
		return fmt.Errorf("could not create form file: %v", err)
	}
	_, err = io.Copy(part, file)
	if err != nil {
		return fmt.Errorf("could not copy file data: %v", err)
	}
	writer.Close()

	url := fmt.Sprintf("http://%s/cgi-bin/trafficRecord.cgi?action=uploadFile&Type=%s&format=%s&code=%s", server, fileType, fileFormat, fileCode)

	req, err := http.NewRequest("POST", url, body)
	if err != nil {
		return fmt.Errorf("could not create request: %v", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("could not send request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to upload file: status %s", resp.Status)
	}

	fmt.Println("Blacklist/Redlist imported successfully!")
	return nil
}
