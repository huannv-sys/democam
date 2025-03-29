#include <windows.h>
#include <stdio.h>
#include "dhnetsdk.h"

#pragma comment(lib , "dhnetsdk.lib")

static LLONG g_lLoginHandle = 0L;
static char g_szDevIp[32] = "192.168.1.113";  // IP��ַ
static WORD g_nPort = 37777;                  // TCP ���Ӷ˿ڣ�����������¼�豸ҳ�� TCP �˿�����һ��
static char g_szUserName[64] = "admin";       // ��¼�û���
static char g_szPasswd[64] = "admin123";      // ��¼����
static BOOL g_bNetSDKInitFlag = FALSE;

//*********************************************************************************
// ���ûص���������
// �豸���߻ص�����
// �������ڸûص������е��� SDK �ӿ�
// ͨ�� CLIENT_Init ���øûص����������豸���ֶ���ʱ��SDK ����øú���
void CALLBACK DisConnectFunc(LLONG lLoginID, char* pchDVRIP, LONG nDVRPort, LDWORD dwUser);

// ���������ɹ��ص�����
// �������ڸûص������е��� SDK �ӿ�
// ͨ�� CLIENT_SetAutoReconnect ���øûص����������Ѷ��ߵ��豸�����ɹ�ʱ��SDK ����øú���
void CALLBACK HaveReConnect(LLONG lLoginID, char* pchDVRIP, LONG nDVRPort, LDWORD dwUser);

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
	// ���ö��������ص��ӿڣ����ù����������ɹ��ص������󣬵��豸���ֶ��������SDK �ڲ����Զ�������������
	// �˲���Ϊ��ѡ�������������û���������
	CLIENT_SetAutoReconnect(&HaveReConnect, 0);

	// ���õ�¼��ʱʱ��ͳ��Դ���
	// �˲���Ϊ��ѡ����
	int nWaitTime = 5000; // ��¼������Ӧ��ʱʱ������Ϊ 5s
	int nTryTimes = 3; // ��¼ʱ���Խ������� 3 ��
	CLIENT_SetConnectTime(nWaitTime, nTryTimes);

	// ���ø������������NET_PARAM �� nWaittime��nConnectTryNum ��Ա�� CLIENT_SetConnectTime �ӿ����õĵ�¼�豸��ʱʱ��ͳ��Դ���������ͬ
	// �˲���Ϊ��ѡ����
	NET_PARAM stuNetParm = { 0 };
	stuNetParm.nConnectTime = 3000; // ��¼ʱ���Խ������ӵĳ�ʱʱ��
	CLIENT_SetNetworkParam(&stuNetParm);

	// ���õ�¼�����Ľṹ��
	NET_IN_LOGIN_WITH_HIGHLEVEL_SECURITY stInparam;
	memset(&stInparam, 0, sizeof(stInparam));
	stInparam.dwSize = sizeof(stInparam);  // �ṹ���С
	strncpy_s(stInparam.szIP, g_szDevIp, sizeof(stInparam.szIP) - 1);
	strncpy_s(stInparam.szPassword, g_szPasswd, sizeof(stInparam.szPassword) - 1);
	strncpy_s(stInparam.szUserName, g_szUserName, sizeof(stInparam.szUserName) - 1);
	stInparam.nPort = g_nPort;
	// TCP��½, Ĭ�Ϸ�ʽ
	stInparam.emSpecCap = EM_LOGIN_SPEC_CAP_TCP;

	// ���ý��յ�¼����Ľṹ��
	NET_OUT_LOGIN_WITH_HIGHLEVEL_SECURITY stOutparam;
	memset(&stOutparam, 0, sizeof(stOutparam));
	stOutparam.dwSize = sizeof(stOutparam);

	while (0 == g_lLoginHandle)
	{
		// ��¼�豸
		g_lLoginHandle = CLIENT_LoginWithHighLevelSecurity(&stInparam, &stOutparam);

		if (0 == g_lLoginHandle)
		{
			// ���ݴ����룬������ dhnetsdk.h ���ҵ���Ӧ�Ľ��ͣ��˴���ӡ���� 16 ���ƣ�ͷ�ļ�����ʮ���ƣ����е�ת����ע��
			// ���磺
			// #define NET_NOT_SUPPORTED_EC(23) // ��ǰ SDK δ֧�ָù��ܣ���Ӧ�Ĵ�����Ϊ 0x80000017, 23 ��Ӧ�� 16 ����Ϊ 0x17
			printf("CLIENT_LoginWithHighLevelSecurity %s[%d] Failed! Last Error[%x]\n", g_szDevIp, g_nPort, CLIENT_GetLastError());
		}
		else
		{
			printf("CLIENT_LoginWithHighLevelSecurity %s[%d] Success.\n", g_szDevIp, g_nPort);
		}
		// �û����ε�¼�豸����Ҫ��ʼ��һЩ���ݲ�������ʵ��ҵ���ܣ������¼��ȴ�һС��ʱ�䣬����ȴ�ʱ�����豸����
		Sleep(1000);
		printf("\n");
	}
}
void RunTest()
{
	// ����ҵ��ʵ�ִ�
}
void EndTest()
{
	printf("input any key to quit!\n");
	getchar();
	// �˳��豸
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