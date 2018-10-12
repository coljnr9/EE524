#pragma once
#include <stdio.h>
#include <stdlib.h>
#include <iostream>
#include <errno.h>
#include "CL/cl.h"
#include "read_source.h"
#include "CLHelpers.h"

#define LENGTH 12
#define CL_CHK_ERR(err_var, fail_msg, succ_msg) if (clStatus != CL_SUCCESS) { std::cout << fail_msg << " <err: " << getCLErrorString(err_var) << ">" << std::endl; } else { std::cout << succ_msg << std::endl; }