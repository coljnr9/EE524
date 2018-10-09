#pragma once
#include <stdio.h>
#include <stdlib.h>
#include "CL/cl.h"
#include <iostream>

void print_platform_info(cl_platform_id platform, cl_platform_info param_name);
void print_device_info(cl_device_id device, cl_device_info param_name);