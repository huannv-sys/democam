#include <stdio.h>
#include <string>
#include "play.h"
#include "afx.h"
#include "afxstr.h"
#include "CharactorTansfer.h"

CFile srcFile;
CString strsrcFile = "D:/DahuaRecord/record.dav";
CString strdstFile = "D:/DahuaRecord/record.mp4";
bool isConverting = false;

bool StartConvert() {
	if (!srcFile.Open(strsrcFile, CFile::modeRead | CFile::shareDenyNone)) {
		isConverting = false;
		return false;
	}

	PLAY_SetStreamOpenMode(0, STREAME_FILE);
	PLAY_OpenStream(0, NULL, 0, (SOURCE_BUF_MIN + SOURCE_BUF_MAX) / 2);
	PLAY_Play(0, NULL);

	BOOL bRet = FALSE;
	std::string strFileNameA = UnicodeToGbk(strdstFile.GetBuffer(0));

	bRet = PLAY_StartDataRecord(0, (char*)strFileNameA.c_str(), DATA_RECORD_MP4);

	if (!bRet)
	{
		isConverting = false;
		PLAY_Stop(0);
		PLAY_CloseStream(0);
		srcFile.Close();
		return false;
	}
}

void StopConvert() {
	PLAY_StopDataRecord(0);
	PLAY_Stop(0);
	PLAY_CloseStream(0);
	srcFile.Close();
}

void videoConvert() {
	if (!StartConvert())
		return;

	const int readlen = 8 * 1024;
	BYTE readBuffer[readlen];

	while (isConverting) {
		DWORD nRead = srcFile.Read(readBuffer, readlen);
		if (nRead < 0)
			break;
		while (!PLAY_InputData(0, readBuffer, readlen))
			Sleep(10);
	}

	while ((PLAY_GetBufferValue(0, BUF_VIDEO_RENDER) + PLAY_GetSourceBufferRemain(0)) > 0)
	{
		Sleep(5);
	}

	StopConvert();
	srcFile.Close();
	printf("Convert finished.\n");
}