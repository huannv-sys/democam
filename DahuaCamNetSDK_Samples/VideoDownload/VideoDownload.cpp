// ���ļ�����
#include <windows.h>
#include <stdio.h>
#include <vector>
#include "dhnetsdk.h"

#pragma comment(lib , "dhnetsdk.lib")

static BOOL g_bNetSDKInitFlag = FALSE;
static LLONG g_lLoginHandle = 0L;
static LLONG g_lDownloadHandle = 0L;
static char g_szDevIp[32] = "192.168.1.111";
static WORD g_nPort = 37777; // tcp ���Ӷ˿ڣ�����������¼�豸ҳ�� tcp �˿�����һ��
static char g_szUserName[64] = "admin";
static char g_szPasswd[64] = "admin123";
static const int g_nMaxRecordFileCount = 5000;

//*********************************************************************************
// ���ûص���������
// 
// �豸���߻ص�����
// �������ڸûص������е��� SDK �ӿ�
// ͨ�� CLIENT_Init ���øûص����������豸���ֶ���ʱ��SDK ����øú���
void CALLBACK DisConnectFunc(LLONG lLoginID, char* pchDVRIP, LONG nDVRPort, LDWORD
	dwUser);

// ���������ɹ��ص�����
// �������ڸûص������е��� SDK �ӿ�
// ͨ�� CLIENT_SetAutoReconnect ���øûص����������Ѷ��ߵ��豸�����ɹ�ʱ��SDK ����øú���
void CALLBACK HaveReConnect(LLONG lLoginID, char* pchDVRIP, LONG nDVRPort, LDWORD
	dwUser);

// �ط�/���� ���Ȼص�����
// �������ڸûص������е��� SDK �ӿ�
// dwDownLoadSize: -1 ʱ��ʾ���λط�/���ؽ�����-2 ��ʾд�ļ�ʧ�ܣ�����ֵ��ʾ��Ч����
// ͨ�� CLIENT_DownloadByRecordFileEx ���øûص��������� SDK �յ��ط�/��������ʱ��SDK����øú���
void CALLBACK DownLoadPosCallBack(LLONG lPlayHandle, DWORD dwTotalSize, DWORD
	dwDownLoadSize, LDWORD dwUser);

// �ط�/���� ���ݻص�����
// �������ڸûص������е��� SDK �ӿ�
// �ط�ʱ���������أ�0����ʾ���λص�ʧ�ܣ��´λص��᷵����ͬ�����ݣ�1����ʾ���λص��ɹ����´λص��᷵�غ���������
// ����ʱ�����ܻص���������ֵΪ���ٶ���Ϊ�ص��ɹ����´λص��᷵�غ���������
// ͨ�� CLIENT_DownloadByRecordFileEx ���øûص��������� SDK �յ��ط�/��������ʱ��SDK����øú���
int CALLBACK DataCallBack(LLONG lRealHandle, DWORD dwDataType, BYTE* pBuffer, DWORD
	dwBufSize, LDWORD dwUser);

//*********************************************************************************
void InitTest()
{
	// ��ʼ�� SDK
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

	// ��ȡ SDK �汾��Ϣ
	// �˲���Ϊ��ѡ����
	DWORD dwNetSdkVersion = CLIENT_GetSDKVersion();
	printf("NetSDK version is [%d]\n", dwNetSdkVersion);

	// ���ö��������ص��ӿڣ����ù����������ɹ��ص������󣬵��豸���ֶ��������SDK ��
	// �����Զ�������������
	// �˲���Ϊ��ѡ�������������û���������
	CLIENT_SetAutoReconnect(&HaveReConnect, 0);

	// ���õ�¼��ʱʱ��ͳ��Դ���
	// �˲���Ϊ��ѡ����
	int nWaitTime = 5000; // ��¼������Ӧ��ʱʱ������Ϊ 5s
	int nTryTimes = 3; // ��¼ʱ���Խ������� 3 ��
	CLIENT_SetConnectTime(nWaitTime, nTryTimes);

	// ���ø������������NET_PARAM �� nWaittime��nConnectTryNum ��Ա��
	// CLIENT_SetConnectTime �ӿ����õĵ�¼�豸��ʱʱ��ͳ��Դ���������ͬ
	// �˲���Ϊ��ѡ����
	NET_PARAM stuNetParm = { 0 };
	stuNetParm.nConnectTime = 3000; // ��¼ʱ���Խ������ӵĳ�ʱʱ��
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
		// ��¼�豸
		g_lLoginHandle = CLIENT_LoginWithHighLevelSecurity(&stInparam, &stOutparam);

		if (0 == g_lLoginHandle)
		{
			// ���ݴ����룬������ dhnetsdk.h ���ҵ���Ӧ�Ľ��ͣ��˴���ӡ���� 16 ���ƣ�ͷ
			// �ļ�����ʮ���ƣ����е�ת����ע��
			// ���磺
			// #define NET_NOT_SUPPORTED_EC(23) // ��ǰ SDK δ֧�ָù��ܣ���Ӧ�Ĵ�����
			// Ϊ 0x80000017, 23 ��Ӧ�� 16 ����Ϊ 0x17
			printf("CLIENT_LoginWithHighLevelSecurity %s[%d]Failed!Last Error[%x]\n",
				g_szDevIp, g_nPort, CLIENT_GetLastError());
		}
		else
		{
			printf("CLIENT_LoginWithHighLevelSecurity %s[%d] Success\n", g_szDevIp, g_nPort);
		}
		// �û����ε�¼�豸������Ҫ��ʼ��һЩ���ݲ�������ʵ��ҵ���ܣ����Խ����¼��
		// �ȴ�һС��ʱ�䣬����ȴ�ʱ�����豸���졣
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
	// ¼���ļ���ѯ
	// ���ò�ѯʱ��¼����������
	int nStreamType = 0; // 0-��������,1-������,2-������1,3-������2,4-������3
	CLIENT_SetDeviceMode(g_lLoginHandle, DH_RECORD_STREAM_TYPE, &nStreamType);

	// ¼���ѯ������ʵ�ַ�ʽ��1��һ��ȡ��ʱ����ڵ�����¼���ļ���2���ִ�ȡʱ����ڵ�
	// ����¼���ļ���
	// �˴�ͨ���ڶ��ַ���ʵ�֣���һ�ַ�����ʵ�ֿɲο� CLIENT_QueryRecordFile �ӿ�˵����
	int nChannelID = 0; // ͨ����

	// ��ʼʱ��
	NET_TIME stuStartTime = { 0 };
	stuStartTime.dwYear = 2015;
	stuStartTime.dwMonth = 9;
	stuStartTime.dwDay = 20;

	// ����ʱ��
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
	// demo ��ʾ�����룬�����֧�� g_nMaxRecordFileCount ¼���ļ�Ϊ����
	std::vector<NET_RECORDFILE_INFO> bufFileInfo(g_nMaxRecordFileCount);

	int nFileIndex;
	for (nFileIndex = 0; nFileIndex < g_nMaxRecordFileCount; ++nFileIndex)
	{
		int result = CLIENT_FindNextFile(lFindHandle, &bufFileInfo[nFileIndex]);
		if (0 == result)// ¼���ļ���Ϣ����ȡ��
		{
			break;
		}
		else if (1 != result)// ��������
		{
			printf("CLIENT_FindNextFile Failed!Last Error[%x]\n", CLIENT_GetLastError());
			break;
		}
	}

	//ֹͣ����
	if (0 != lFindHandle)
	{
		CLIENT_FindClose(lFindHandle);
	}
	// ����ѯ�����ĵ�һ���ļ�����Ϊ�����ļ�
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

	// ¼���ļ�����
	// ����¼������
	// �����β� sSavedFileName �� fDownLoadDataCallBack ������һ��Ϊ��Чֵ
	// ʵ��Ӧ���У�һ���������ѡ��ֱ�ӱ����� sSavedFileName ��ص�������������֮һ
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
	// �ر����أ��������ؽ�������ã�Ҳ���������е��á�
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
	// �˳��豸
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
	// �����ʼ����Դ
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
// ���ûص����϶���

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
	// ������ط�/����ʹ����ͬ�Ľ��Ȼص����������û���ͨ�� lPlayHandle ����һһ��Ӧ
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
	// ������ط�/����ʹ����ͬ�����ݻص����������û���ͨ�� lRealHandle ����һһ��Ӧ
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
			// �����ܵ�����
			// �û��ڴ˴������������ݣ��뿪�ص��������ٽ��н����ת����һϵ�д���
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