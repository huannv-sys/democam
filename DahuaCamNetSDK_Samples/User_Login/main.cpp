#include <windows.h>
#include <stdio.h>
#include "dhnetsdk.h"

#pragma comment(lib , "dhnetsdk.lib")

static LLONG g_lLoginHandle = 0L;
static char g_szDevIp[32] = "192.168.1.113";  // IP地址
static WORD g_nPort = 37777;                  // TCP 连接端口，需与期望登录设备页面 TCP 端口配置一致
static char g_szUserName[64] = "admin";       // 登录用户名
static char g_szPasswd[64] = "admin123";      // 登录密码
static BOOL g_bNetSDKInitFlag = FALSE;

//*********************************************************************************
// 常用回调集合声明
// 设备断线回调函数
// 不建议在该回调函数中调用 SDK 接口
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

	// 获取 SDK 版本信息
	// 此操作为可选操作
	DWORD dwNetSdkVersion = CLIENT_GetSDKVersion();
	printf("NetSDK version is [%d]\n", dwNetSdkVersion);
	// 设置断线重连回调接口，设置过断线重连成功回调函数后，当设备出现断线情况，SDK 内部会自动进行重连操作
	// 此操作为可选操作，但建议用户进行设置
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

	// 设置登录参数的结构体
	NET_IN_LOGIN_WITH_HIGHLEVEL_SECURITY stInparam;
	memset(&stInparam, 0, sizeof(stInparam));
	stInparam.dwSize = sizeof(stInparam);  // 结构体大小
	strncpy_s(stInparam.szIP, g_szDevIp, sizeof(stInparam.szIP) - 1);
	strncpy_s(stInparam.szPassword, g_szPasswd, sizeof(stInparam.szPassword) - 1);
	strncpy_s(stInparam.szUserName, g_szUserName, sizeof(stInparam.szUserName) - 1);
	stInparam.nPort = g_nPort;
	// TCP登陆, 默认方式
	stInparam.emSpecCap = EM_LOGIN_SPEC_CAP_TCP;

	// 设置接收登录结果的结构体
	NET_OUT_LOGIN_WITH_HIGHLEVEL_SECURITY stOutparam;
	memset(&stOutparam, 0, sizeof(stOutparam));
	stOutparam.dwSize = sizeof(stOutparam);

	while (0 == g_lLoginHandle)
	{
		// 登录设备
		g_lLoginHandle = CLIENT_LoginWithHighLevelSecurity(&stInparam, &stOutparam);

		if (0 == g_lLoginHandle)
		{
			// 根据错误码，可以在 dhnetsdk.h 中找到相应的解释，此处打印的是 16 进制，头文件中是十进制，其中的转换需注意
			// 例如：
			// #define NET_NOT_SUPPORTED_EC(23) // 当前 SDK 未支持该功能，对应的错误码为 0x80000017, 23 对应的 16 进制为 0x17
			printf("CLIENT_LoginWithHighLevelSecurity %s[%d] Failed! Last Error[%x]\n", g_szDevIp, g_nPort, CLIENT_GetLastError());
		}
		else
		{
			printf("CLIENT_LoginWithHighLevelSecurity %s[%d] Success.\n", g_szDevIp, g_nPort);
		}
		// 用户初次登录设备，需要初始化一些数据才能正常实现业务功能，建议登录后等待一小段时间，具体等待时间因设备而异
		Sleep(1000);
		printf("\n");
	}
}
void RunTest()
{
	// 功能业务实现处
}
void EndTest()
{
	printf("input any key to quit!\n");
	getchar();
	// 退出设备
	if (0 != g_lLoginHandle)
	{
		if (FALSE == CLIENT_Logout(g_lLoginHandle))
		{
			printf("CLIENT_Logout Failed! Last Error[%x]\n", CLIENT_GetLastError());
		}
		else
		{
			g_lLoginHandle = 0;
			printf("CLIENT_Logout success!\n");
		}
	}
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