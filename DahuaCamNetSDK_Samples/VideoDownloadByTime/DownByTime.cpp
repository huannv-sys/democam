#include <windows.h>
#include <stdio.h>
#include "dhnetsdk.h"

#pragma comment(lib , "dhnetsdk.lib")

static BOOL g_bNetSDKInitFlag = FALSE;
static LLONG g_lLoginHandle = 0L;
static LLONG g_lDownloadHandle = 0L;
static char g_szDevIp[32] = "192.168.1.111";
static WORD g_nPort = 37777; // tcp 连接端口，需与期望登录设备页面 tcp 端口配置一致
static char g_szUserName[64] = "admin";
static char g_szPasswd[64] = "admin123";

bool DownStatus = false;
int DownloadPercent = 0;

//*********************************************************************************
// 常用回调集合声明
// 
// 设备断线回调函数
// 不建议在该回调函数中调用 SDK 接口
// 通过 CLIENT_Init 设置该回调函数，当设备出现断线时，SDK 会调用该函数。
void CALLBACK DisConnectFunc(LLONG lLoginID, char* pchDVRIP, LONG nDVRPort, LDWORD
	dwUser);

// 断线重连成功回调函数
// 不建议在该回调函数中调用 SDK 接口
// 通过 CLIENT_SetAutoReconnect 设置该回调函数，当已断线的设备重连成功时，SDK 会调用该函数。
void CALLBACK HaveReConnect(LLONG lLoginID, char* pchDVRIP, LONG nDVRPort, LDWORD
	dwUser);

// 按时间回放进度回调函数
// 不建议在该回调函数中调用 SDK 接口
// dwDownLoadSize: -1 时表示本次回放/下载结束，-2 表示写文件失败，其他值表示有效数据
// 通过 CLIENT_DownloadByTimeEx 设置该回调函数，当 SDK 收到回放/下载数据时，SDK 会调用该函数
void CALLBACK TimeDownLoadPosCallBack(LLONG lPlayHandle, DWORD dwTotalSize, DWORD
	dwDownLoadSize, int index, NET_RECORDFILE_INFO recordfileinfo, LDWORD dwUser);

// 回放/下载 数据回调函数
// 不建议在该回调函数中调用 SDK 接口
// 回放时：参数返回，0：表示本次回调失败，下次回调会返回相同的数据，1：表示本次回调成
// 功，下次回调会返回后续的数据
// 下载时：不管回调函数返回值为多少都认为回调成功，下次回调会返回后续的数据
// 通过 CLIENT_DownloadByTimeEx 设置该回调函数，当 SDK 收到回放/下载数据时，SDK 会调用该函数
int CALLBACK DataCallBack(LLONG lRealHandle, DWORD dwDataType, BYTE* pBuffer, DWORD
	dwBufSize, LDWORD dwUser);

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

	// 设置断线重连回调接口，设置过断线重连成功回调函数后，当设备出现断线情况，SDK 内
	// 部会自动进行重连操作
	// 此操作为可选操作，但建议用户进行设置
	CLIENT_SetAutoReconnect(&HaveReConnect, 0);

	// 设置登录超时时间和尝试次数
	// 此操作为可选操作
	int nWaitTime = 5000; // 登录请求响应超时时间设置为 5s
	int nTryTimes = 3; // 登录时尝试建立链接 3 次
	CLIENT_SetConnectTime(nWaitTime, nTryTimes);

	// 设置更多网络参数，NET_PARAM 的 nWaittime，nConnectTryNum 成员与
	// CLIENT_SetConnectTime 接口设置的登录设备超时时间和尝试次数意义相同
	// 此操作为可选操作
	NET_PARAM stuNetParm = { 0 };
	stuNetParm.nConnectTime = 3000; // 登录时尝试建立链接的超时时间
	CLIENT_SetNetworkParam(&stuNetParm);

	NET_IN_LOGIN_WITH_HIGHLEVEL_SECURITY stInparam;
	memset(&stInparam, 0, sizeof(stInparam));
	stInparam.dwSize = sizeof(stInparam);
	strncpy_s(stInparam.szIP, g_szDevIp, sizeof(stInparam.szIP) - 1);
	strncpy_s(stInparam.szPassword, g_szPasswd, sizeof(stInparam.szPassword) - 1);
	strncpy_s(stInparam.szUserName, g_szUserName, sizeof(stInparam.szUserName) - 1);
	stInparam.nPort = g_nPort;
	stInparam.emSpecCap = EM_LOGIN_SPEC_CAP_TCP;

	NET_OUT_LOGIN_WITH_HIGHLEVEL_SECURITY stOutparam;
	memset(&stOutparam, 0, sizeof(stOutparam));
	stOutparam.dwSize = sizeof(stOutparam);

	while (0 == g_lLoginHandle)
	{
		// 登录设备
		g_lLoginHandle = CLIENT_LoginWithHighLevelSecurity(&stInparam, &stOutparam);

		if (0 == g_lLoginHandle)
		{
			// 根据错误码，可以在 dhnetsdk.h 中找到相应的解释，此处打印的是 16 进制，头
			// 文件中是十进制，其中的转换需注意
			// 例如：
			// #define NET_NOT_SUPPORTED_EC(23) // 当前 SDK 未支持该功能，对应的错误码
			// 为 0x80000017, 23 对应的 16 进制为 0x17
			printf("CLIENT_LoginWithHighLevelSecurity %s[%d]Failed!Last Error[%x]\n",
				g_szDevIp, g_nPort, CLIENT_GetLastError());
		}
		else
		{
			printf("CLIENT_LoginWithHighLevelSecurity %s[%d] Success\n", g_szDevIp, g_nPort);
		}
		// 用户初次登录设备，需要初始化一些数据才能正常实现业务功能，建议登录后等待一
		// 小段时间，具体等待时间因设备而异。
		Sleep(1000);
		printf("\n");
	}
}

void RunTest()
{
	if (FALSE == g_bNetSDKInitFlag)
	{
		return;
	}
	if (0 == g_lLoginHandle)
	{
		return;
	}
	// 录像文件查询
	// 设置查询时的录像码流类型
	int nStreamType = 0; // 0-主辅码流,1-主码流,2-辅码流
	CLIENT_SetDeviceMode(g_lLoginHandle, DH_RECORD_STREAM_TYPE, &nStreamType);

	int nChannelID = 0; // 通道号

	NET_TIME stuStartTime = { 0 };
	stuStartTime.dwYear = 2023;
	stuStartTime.dwMonth = 7;
	stuStartTime.dwDay = 14;

	NET_TIME stuStopTime = { 0 };
	stuStopTime.dwYear = 2023;
	stuStopTime.dwMonth = 7;
	stuStopTime.dwDay = 15;

	// 录像下载功能业务实现处
	// 开启录像下载
	// 函数形参 sSavedFileName 和 fDownLoadDataCallBack 需至少有一个为有效值，否则入参有误
	g_lDownloadHandle = CLIENT_DownloadByTimeEx(g_lLoginHandle, nChannelID,
		EM_RECORD_TYPE_ALL, &stuStartTime, &stuStopTime, "test.dav", TimeDownLoadPosCallBack, NULL,
		DataCallBack, NULL);
	if (g_lDownloadHandle == 0)
	{
		printf("CLIENT_DownloadByTimeEx: failed! Error code: %x.\n", CLIENT_GetLastError());
	}
	else
	{
		while (DownStatus == false)
		{
			printf("Downloading:%d%%!\n",DownloadPercent);
			Sleep(1000);
		}
		DownStatus = false;
		printf("Download completed!\n");
	}
}

void EndTest()
{
	printf("Input any key to quit!\n");
	getchar();
	// 关闭下载，可在下载结束后调用，也可在下载中调用
	if (0 != g_lDownloadHandle)
	{
		if (FALSE == CLIENT_StopDownload(g_lDownloadHandle))
		{
			printf("CLIENT_StopDownload Failed, g_lDownloadHandle[%x]!Last Error[%x]\n",
				g_lDownloadHandle, CLIENT_GetLastError());
		}
		else
		{
			g_lDownloadHandle = 0;
		}
	}
	// 退出设备
	if (0 != g_lLoginHandle)
	{
		if (FALSE == CLIENT_Logout(g_lLoginHandle))
		{
			printf("CLIENT_Logout Failed!Last Error[%x]\n", CLIENT_GetLastError());
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

void CALLBACK HaveReConnect(LLONG lLoginID, char* pchDVRIP, LONG nDVRPort, LDWORD
	dwUser)
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

void CALLBACK TimeDownLoadPosCallBack(LLONG lPlayHandle, DWORD dwTotalSize, DWORD
	dwDownLoadSize, int index, NET_RECORDFILE_INFO recordfileinfo, LDWORD dwUser)
{
	// 若多个回放/下载使用相同的进度回调函数，则用户可通过 lPlayHandle 进行一一对应
	if (lPlayHandle == g_lDownloadHandle)
	{
		//printf("lPlayHandle[%p]\n", lPlayHandle);
		//printf("dwTotalSize[%d]\n", dwTotalSize);
		//printf("dwDownLoadSize[%d]\n", dwDownLoadSize);
		//printf("index[%d]\n", index);
		//printf("dwUser[%p]\n", dwUser);
		//printf("\n");

		DownloadPercent = int(dwDownLoadSize * 100 / dwTotalSize);
		if (dwDownLoadSize == -1)
		{
			DownStatus = true;
		}
	}
}

int CALLBACK DataCallBack(LLONG lRealHandle, DWORD dwDataType, BYTE* pBuffer, DWORD
	dwBufSize, LDWORD dwUser)
{
	int nRet = 0;
	//printf("call DataCallBack\n");
	// 若多个回放/下载使用相同的数据回调函数，则用户可通过 lRealHandle 进行一一对应
	if (lRealHandle == g_lDownloadHandle)
	{
		//printf("lPlayHandle[%p]\n", lRealHandle);
		//printf("dwDataType[%d]\n", dwDataType);
		//printf("pBuffer[%p]\n", pBuffer);
		//printf("dwBufSize[%d]\n", dwBufSize);
		//printf("dwUser[%p]\n", dwUser);
		//printf("\n");
		switch (dwDataType)
		{
		case 0:
			//Original data 
			// 用户在此处保存码流数据，离开回调函数后再进行解码或转发等一系列处理
			nRet = 1;// 

			break;
		case 1:
			//Standard video data 

			break;
		case 2:
			//yuv data

			break;
		case 3:
			//pcm audio data 

			break;
		case 4:
			//Original audio data 

			break;
		default:
			break;
		}
	}
	return nRet;
}
