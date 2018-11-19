#pragma once
#include "CL/cl.h"


const char *getCLErrorString(cl_int err_var);
#define CL_CHK_ERR(err_var, fail_msg, succ_msg) if (err_var != CL_SUCCESS) { std::cout << fail_msg << " <err: " << getCLErrorString(err_var) << ">" << std::endl; } else { std::cout << succ_msg << std::endl; }