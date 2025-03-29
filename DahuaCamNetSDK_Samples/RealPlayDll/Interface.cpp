#include "RealPlayDll.h"
#include "DataFormat.h"

dlgParameters enDlgParameters;
RealPlay rp;

extern "C" _declspec(dllexport) void _stdcall interface_getParameters(dlgParameters* info);
void _stdcall interface_getParameters(dlgParameters* info) {
	strncpy_s(enDlgParameters.loginIP, info->loginIP, sizeof(enDlgParameters.loginIP) - 1);
	enDlgParameters.hwnd = info->hwnd;
}

extern "C" _declspec(dllexport) int _stdcall interface_Login();
int _stdcall interface_Login() {
	int status;
	rp.getDlgParameters(enDlgParameters);
	status = rp.Initial();
	//if (status != 0) 
		return status;
}

extern "C" _declspec(dllexport) int _stdcall interface_Logout();
int _stdcall interface_Logout() {
	int status;
	status = rp.Exit();
	return status;
}

extern "C" _declspec(dllexport) void _stdcall interface_OpenRealPlay();
void _stdcall interface_OpenRealPlay() {
	rp.PlayVideo();
}

extern "C" _declspec(dllexport) void _stdcall interface_StopRealPlay();
void _stdcall interface_StopRealPlay() {
	rp.StopPlay();
}

extern "C" _declspec(dllexport) int _stdcall interface_StartRecord();
int _stdcall interface_StartRecord() {
	return rp.StartRecord();
}

extern "C" _declspec(dllexport) int _stdcall interface_StopRecord();
int _stdcall interface_StopRecord() {
	return rp.StopRecord();
}