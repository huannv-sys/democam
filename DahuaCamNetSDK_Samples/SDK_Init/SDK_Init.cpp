#include <windows.h>
#include <stdio.h>
#include "dhnetsdk.h"

#pragma comment(lib , "dhnetsdk.lib")

static BOOL g_bNetSDKInitFlag = FALSE;

//*********************************************************************************
// 常用回调集合声明

// 设备断线回调函数
// 不建议在 SDK 的回调函数中调用 SDK 接口
// 通过 CLIENT_Init 设置该回调函数，当设备出现断线时，SDK 会调用该函数
void CALLBACK DisConnectFunc(LLONG lLoginID, char* pchDVRIP, LONG nDVRPort, LDWORD dwUser);

// 断线重连成功回调函数
// 不建议在该回调函数中调用 SDK 接口
// 通过 CLIENT_SetAutoReconnect 设置该回调函数，当已断线的设备重连成功时，SDK 会调用该函数
void CALLBACK HaveReConnect(LLONG lLoginID, char* pchDVRIP, LONG nDVRPort, LDWORD dwUser);

//*********************************************************************************
void InitTest()
{
	// 初始化 SDK
	g_bNetSDKInitFlag = CLIENT_Init(DisConnectFunc, 0);
	if (FALSE == g_bNetSDKInitFlag)
	{
		printf("Initialize client SDK fail; \n");
		return;
	}
	else
	{
		printf("Initialize client SDK done; \n");
	}

	// 此操作为可选操作
	// 获取 SDK 版本信息
	DWORD dwNetSdkVersion = CLIENT_GetSDKVersion();
	printf("NetSDK version is [%d]", dwNetSdkVersion);

	// 设置断线重连回调接口，设置过断线重连成功回调函数后，当设备出现断线情况，SDK 内部会自动进行重连操作。
	// 此操作为可选操作，但建议用户进行设置。
	CLIENT_SetAutoReconnect(&HaveReConnect, 0);

	// 设置登录超时时间和尝试次数
	// 此操作为可选操作
	int nWaitTime = 5000; // 登录请求响应超时时间设置为 5s
	int nTryTimes = 3; // 登录时尝试建立链接 3 次
	CLIENT_SetConnectTime(nWaitTime, nTryTimes);

	// 设置更多网络参数，NET_PARAM 的 nWaittime，nConnectTryNum 成员与 CLIENT_SetConnectTime 接口设置的登录设备超时时间和尝试次数意义相同
	// 此操作为可选操作
	NET_PARAM stuNetParm = { 0 };
	stuNetParm.nConnectTime = 3000; // 登录时尝试建立链接的超时时间
	CLIENT_SetNetworkParam(&stuNetParm);

	// 用户初次登录设备，需要初始化一些数据才能正常实现业务功能，所以建议登录后等待一小段时间，具体等待时间因设备而异。
	Sleep(1000);
	printf("\n");
}

void RunTest()
{
	if (FALSE == g_bNetSDKInitFlag)
	{
		return;
	}
	// 功能业务实现处

}

void EndTest()
{
	printf("Input any key to quit!\n");
	getchar();

	// 此处可实现退出设备操作

	// 清理初始化资源
	if (TRUE == g_bNetSDKInitFlag)
	{
		CLIENT_Cleanup();
		g_bNetSDKInitFlag = FALSE;
	}
	return;
}
int main()
{
	InitTest();
	RunTest();
	EndTest();
	return 0;
}
//*********************************************************************************
// 常用回调集合定义
void CALLBACK DisConnectFunc(LLONG lLoginID, char* pchDVRIP, LONG nDVRPort, LDWORD dwUser)
{
	printf("Call DisConnectFunc\n");
	printf("lLoginID[0x%x]", lLoginID);
	if (NULL != pchDVRIP)
	{
		printf("pchDVRIP[%s]\n", pchDVRIP);
	}
	printf("nDVRPort[%d]\n", nDVRPort);
	printf("dwUser[%p]\n", dwUser);
	printf("\n");
}

void CALLBACK HaveReConnect(LLONG lLoginID, char* pchDVRIP, LONG nDVRPort, LDWORD dwUser)
{
	printf("Call HaveReConnect\n");
	printf("lLoginID[0x%x]", lLoginID);
	if (NULL != pchDVRIP)
	{
		printf("pchDVRIP[%s]\n", pchDVRIP);
	}
	printf("nDVRPort[%d]\n", nDVRPort);
	printf("dwUser[%p]\n", dwUser);
	printf("\n");
}