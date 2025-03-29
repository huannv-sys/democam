#pragma once

// 这个结构体用于前端向后端传参
typedef struct
{
	char loginIP[32];
	HWND hwnd;
}dlgParameters;