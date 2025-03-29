#include <windows.h>
#include <stdio.h>
#include "dhnetsdk.h"

#pragma comment(lib , "dhnetsdk.lib")

static BOOL g_bNetSDKInitFlag = FALSE;

//*********************************************************************************
// ���ûص���������

// �豸���߻ص�����
// �������� SDK �Ļص������е��� SDK �ӿ�
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

	// �˲���Ϊ��ѡ����
	// ��ȡ SDK �汾��Ϣ
	DWORD dwNetSdkVersion = CLIENT_GetSDKVersion();
	printf("NetSDK version is [%d]", dwNetSdkVersion);

	// ���ö��������ص��ӿڣ����ù����������ɹ��ص������󣬵��豸���ֶ��������SDK �ڲ����Զ���������������
	// �˲���Ϊ��ѡ�������������û��������á�
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

	// �û����ε�¼�豸����Ҫ��ʼ��һЩ���ݲ�������ʵ��ҵ���ܣ����Խ����¼��ȴ�һС��ʱ�䣬����ȴ�ʱ�����豸���졣
	Sleep(1000);
	printf("\n");
}

void RunTest()
{
	if (FALSE == g_bNetSDKInitFlag)
	{
		return;
	}
	// ����ҵ��ʵ�ִ�

}

void EndTest()
{
	printf("Input any key to quit!\n");
	getchar();

	// �˴���ʵ���˳��豸����

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