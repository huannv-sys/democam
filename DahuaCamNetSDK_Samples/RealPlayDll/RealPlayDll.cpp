#pragma once
#include "RealPlayDll.h"

using namespace std;

int RealPlay::getDlgParameters(const dlgParameters src_Info) {
	memset(&stInparam, 0, sizeof(stInparam));
	stInparam.dwSize = sizeof(stInparam);
	strncpy_s(stInparam.szIP, src_Info.loginIP, sizeof(stInparam.szIP) - 1);
	strncpy_s(stInparam.szPassword, "admin123", sizeof(stInparam.szPassword) - 1);
	strncpy_s(stInparam.szUserName, "admin", sizeof(stInparam.szUserName) - 1);
	stInparam.nPort = 37777;
	stInparam.emSpecCap = EM_LOGIN_SPEC_CAP_TCP;
	hwnd = src_Info.hwnd;

	g_bNetSDKInitFlag = FALSE;
	g_lLoginHandle = 0L;
	g_lRealHandle = 0;
	g_saveData = FALSE;

	pfnGetConsoleWindow = GetConsoleWindow;

	return 0;
}

int RealPlay::Initial() {
	// C#可以用返回值来判断是否初始化成功
	g_bNetSDKInitFlag = CLIENT_Init(DisConnectFunc, 0);
	if (FALSE == g_bNetSDKInitFlag)
		return -1;

	CLIENT_SetAutoReconnect(&HaveReConnect, 0);

	int nWaitTime = 5000; // 登录请求响应超时时间设置为 5s
	int nTryTimes = 3; // 登录时尝试建立链接 3 次
	CLIENT_SetConnectTime(nWaitTime, nTryTimes);

	NET_PARAM stuNetParm = { 0 };
	stuNetParm.nConnectTime = 3000; // 登录时尝试建立链接的超时时间
	CLIENT_SetNetworkParam(&stuNetParm);

	NET_OUT_LOGIN_WITH_HIGHLEVEL_SECURITY stOutparam;
	memset(&stOutparam, 0, sizeof(stOutparam));
	stOutparam.dwSize = sizeof(stOutparam);

	// 登录设备
	g_lLoginHandle = CLIENT_LoginWithHighLevelSecurity(&stInparam, &stOutparam);

	// 用户初次登录设备，需要初始化一些数据才能正常实现业务功能，建议登录后等待一
	// 小段时间，具体等待时间因设备而异
	Sleep(1000);

	// 登录异常
	if (0 == g_lLoginHandle)
		return 1;

	// 系统登录成功
	return 0;
}

void RealPlay::PlayVideo() {
	int nChannelID = 0; // 预览通道号
	DH_RealPlayType emRealPlayType = DH_RType_Realplay; // 实时预览
	g_lRealHandle = CLIENT_RealPlayEx(g_lLoginHandle, nChannelID, hwnd, emRealPlayType);
}

void RealPlay::StopPlay() {
	if (0 != g_lRealHandle)
	{
		if (FALSE == CLIENT_StopRealPlayEx(g_lRealHandle))
		{
			printf("CLIENT_StopRealPlayEx Failed!Last Error[%x]\n", CLIENT_GetLastError());
		}
		else
		{
			g_lRealHandle = 0;
			printf("Success to CLIENT_StopRealPlayEx.\n");
		}
	}
}

int RealPlay::Exit() {
	// 退出设备
	if (0 != g_lLoginHandle)
	{
		if (FALSE == CLIENT_Logout(g_lLoginHandle))
		{
			return 1;
		}
		else
		{
			g_lLoginHandle = 0;
		}
	}
	// 清理初始化资源
	if (TRUE == g_bNetSDKInitFlag)
	{
		CLIENT_Cleanup();
		g_bNetSDKInitFlag = FALSE;
	}
	return 0;
}

int RealPlay::StartRecord() {
	if (0 == g_lRealHandle)
	{
		return 2;
	}

	if (std::filesystem::exists(path)) {
		if (std::filesystem::is_regular_file(path))
			return 3;
	}
	else {
		std::filesystem::create_directory(path);
	}

	g_saveData = CLIENT_SaveRealData(g_lRealHandle, "D:/DahuaRecord/temp.dav");
	if (g_saveData == FALSE)
		return 1;
	else
		return 0;
}

int RealPlay::StopRecord() {
	if (g_lRealHandle == 0)
		return 1;
	if (g_saveData == FALSE)
		return 2;
	if(FALSE == CLIENT_StopSaveRealData(g_lRealHandle))
		return 3;
	else {
		g_saveData = FALSE;
		return 0;
	}
}

void CALLBACK RealPlay::DisConnectFunc(LLONG lLoginID, char* pchDVRIP, LONG nDVRPort, LDWORD dwUser) {

}
void CALLBACK RealPlay::HaveReConnect(LLONG lLoginID, char* pchDVRIP, LONG nDVRPort, LDWORD dwUser) {

}
