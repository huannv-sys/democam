// 按文件下载
#include <windows.h>
#include <stdio.h>
#include <vector>
#include "dhnetsdk.h"

#pragma comment(lib , "dhnetsdk.lib")

static BOOL g_bNetSDKInitFlag = FALSE;
static LLONG g_lLoginHandle = 0L;
static LLONG g_lDownloadHandle = 0L;
static char g_szDevIp[32] = "192.168.1.111";
static WORD g_nPort = 37777; // tcp 连接端口，需与期望登录设备页面 tcp 端口配置一致
static char g_szUserName[64] = "admin";
static char g_szPasswd[64] = "admin123";
static const int g_nMaxRecordFileCount = 5000;

//*********************************************************************************
// 常用回调集合声明
// 
// 设备断线回调函数
// 不建议在该回调函数中调用 SDK 接口
// 通过 CLIENT_Init 设置该回调函数，当设备出现断线时，SDK 会调用该函数
void CALLBACK DisConnectFunc(LLONG lLoginID, char* pchDVRIP, LONG nDVRPort, LDWORD
	dwUser);

// 断线重连成功回调函数
// 不建议在该回调函数中调用 SDK 接口
// 通过 CLIENT_SetAutoReconnect 设置该回调函数，当已断线的设备重连成功时，SDK 会调用该函数
void CALLBACK HaveReConnect(LLONG lLoginID, char* pchDVRIP, LONG nDVRPort, LDWORD
	dwUser);

// 回放/下载 进度回调函数
// 不建议在该回调函数中调用 SDK 接口
// dwDownLoadSize: -1 时表示本次回放/下载结束，-2 表示写文件失败，其他值表示有效数据
// 通过 CLIENT_DownloadByRecordFileEx 设置该回调函数，当 SDK 收到回放/下载数据时，SDK会调用该函数
void CALLBACK DownLoadPosCallBack(LLONG lPlayHandle, DWORD dwTotalSize, DWORD
	dwDownLoadSize, LDWORD dwUser);

// 回放/下载 数据回调函数
// 不建议在该回调函数中调用 SDK 接口
// 回放时：参数返回，0：表示本次回调失败，下次回调会返回相同的数据，1：表示本次回调成功，下次回调会返回后续的数据
// 下载时：不管回调函数返回值为多少都认为回调成功，下次回调会返回后续的数据
// 通过 CLIENT_DownloadByRecordFileEx 设置该回调函数，当 SDK 收到回放/下载数据时，SDK会调用该函数
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
		// 用户初次登录设备，可能要初始化一些数据才能正常实现业务功能，所以建议登录后
		// 等待一小段时间，具体等待时间因设备而异。
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
	int nStreamType = 0; // 0-主辅码流,1-主码流,2-辅码流1,3-辅码流2,4-辅码流3
	CLIENT_SetDeviceMode(g_lLoginHandle, DH_RECORD_STREAM_TYPE, &nStreamType);

	// 录像查询有两种实现方式：1，一次取完时间段内的所有录像文件；2，分次取时间段内的
	// 所有录像文件。
	// 此处通过第二种方案实现，第一种方案的实现可参考 CLIENT_QueryRecordFile 接口说明。
	int nChannelID = 0; // 通道号

	// 开始时间
	NET_TIME stuStartTime = { 0 };
	stuStartTime.dwYear = 2015;
	stuStartTime.dwMonth = 9;
	stuStartTime.dwDay = 20;

	// 结束时间
	NET_TIME stuStopTime = { 0 };
	stuStopTime.dwYear = 2015;
	stuStopTime.dwMonth = 9;
	stuStopTime.dwDay = 30;

	int lFindHandle = CLIENT_FindFile(g_lLoginHandle, nChannelID, 0, NULL, &stuStartTime,
		&stuStopTime, FALSE, 5000);
	if (0 == lFindHandle)
	{
		printf("CLIENT_FindFile Failed!Last Error[%x]\n", CLIENT_GetLastError());
		return;
	}
	// demo 的示例代码，以最大支持 g_nMaxRecordFileCount 录像文件为例。
	std::vector<NET_RECORDFILE_INFO> bufFileInfo(g_nMaxRecordFileCount);

	int nFileIndex;
	for (nFileIndex = 0; nFileIndex < g_nMaxRecordFileCount; ++nFileIndex)
	{
		int result = CLIENT_FindNextFile(lFindHandle, &bufFileInfo[nFileIndex]);
		if (0 == result)// 录像文件信息数据取完
		{
			break;
		}
		else if (1 != result)// 参数出错
		{
			printf("CLIENT_FindNextFile Failed!Last Error[%x]\n", CLIENT_GetLastError());
			break;
		}
	}

	//停止查找
	if (0 != lFindHandle)
	{
		CLIENT_FindClose(lFindHandle);
	}
	// 将查询过来的第一个文件设置为下载文件
	NET_RECORDFILE_INFO stuNetFileInfo;
	if (nFileIndex > 0)
	{
		memcpy(&stuNetFileInfo, (void*)&bufFileInfo[0], sizeof(stuNetFileInfo));
	}
	else
	{
		printf("no record, return\n");
		return;
	}

	// 录像文件下载
	// 开启录像下载
	// 函数形参 sSavedFileName 和 fDownLoadDataCallBack 至少有一个为有效值
	// 实际应用中，一般根据需求选择直接保存至 sSavedFileName 或回调处理数据两者之一
	g_lDownloadHandle = CLIENT_DownloadByRecordFileEx(g_lLoginHandle, &stuNetFileInfo,
		"test.dav", DownLoadPosCallBack, NULL, DataCallBack, NULL);
	if (0 == g_lDownloadHandle)
	{
		printf("CLIENT_DownloadByRecordFileEx: failed! Error code: %x.\n", CLIENT_GetLastError());
	}
}

void EndTest()
{
	printf("input any key to quit!\n");
	getchar();
	// 关闭下载，可在下载结束后调用，也可在下载中调用。
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

void CALLBACK DownLoadPosCallBack(LLONG lPlayHandle, DWORD dwTotalSize, DWORD
	dwDownLoadSize, LDWORD dwUser)
{
	// 若多个回放/下载使用相同的进度回调函数，则用户可通过 lPlayHandle 进行一一对应
	if (lPlayHandle == g_lDownloadHandle)
	{
		printf("lPlayHandle[%p]\n", lPlayHandle);
		printf("dwTotalSize[%d]\n", dwTotalSize);
		printf("dwDownLoadSize[%d]\n", dwDownLoadSize);
		printf("dwUser[%p]\n", dwUser);
		printf("\n");
	}
}

int CALLBACK DataCallBack(LLONG lRealHandle, DWORD dwDataType, BYTE* pBuffer, DWORD
	dwBufSize, LDWORD dwUser)
{
	int nRet = 0;
	printf("call DataCallBack\n");
	// 若多个回放/下载使用相同的数据回调函数，则用户可通过 lRealHandle 进行一一对应
	if (lRealHandle == g_lDownloadHandle)
	{
		printf("lPlayHandle[%p]\n", lRealHandle);
		printf("dwDataType[%d]\n", dwDataType);
		printf("pBuffer[%p]\n", pBuffer);
		printf("dwBufSize[%d]\n", dwBufSize);
		printf("dwUser[%p]\n", dwUser);
		printf("\n");
		switch (dwDataType)
		{
		case 0:
			// Original data 
			// 不加密的码流
			// 用户在此处保存码流数据，离开回调函数后再进行解码或转发等一系列处理
			nRet = 1;

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