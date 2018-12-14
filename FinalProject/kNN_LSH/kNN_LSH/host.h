#pragma once
#define N 10000
#include <string>
#include <iostream>
#include <stdio.h>

#include "read_source.h"
#include "CLHelpers.h"

#include "CL/cl.h"
#include "b_scalars.h"
#include "inputVectors.hpp"
#include "random_a_vectors.h"


#define NOTIFY(msg) std::cout << std::string(10, '*') << msg << std::string(10, '*') << std::endl;
void printFloat16(cl_float16 vec);