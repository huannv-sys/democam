#pragma once
#include <windows.h>
#include <stdio.h>
#include "DataFormat.h"
#include "dhnetsdk.h"
#include <windows.h>
#include <string>
#include <fstream>
#include <filesystem>
#include <iostream>

#pragma comment(lib , "dhnetsdk.lib")


class RealPlay
{
public:
	int getDlgParameters(const dlgParameters src_Info);

	int Initial();
	int Exit();
	void PlayVideo();
	void StopPlay();
	int StartRecord();
	int StopRecord();

	static void CALLBACK DisConnectFunc(LLONG lLoginID, char* pchDVRIP, LONG nDVRPort, LDWORD dwUser);
	static void CALLBACK HaveReConnect(LLONG lLoginID, char* pchDVRIP, LONG nDVRPort, LDWORD dwUser);
	static LRESULT CALLBACK WindowProcedure(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp);

	typedef HWND(WINAPI* PROCGETCONSOLEWINDOW)();
	PROCGETCONSOLEWINDOW pfnGetConsoleWindow;
	NET_IN_LOGIN_WITH_HIGHLEVEL_SECURITY stInparam;


	BOOL g_bNetSDKInitFlag;
	LLONG g_lLoginHandle;
	LLONG g_lRealHandle;
	BOOL g_saveData;
	HWND hwnd;
	std::string path = "D:/DahuaRecord/";
};