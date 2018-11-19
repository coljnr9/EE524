
#pragma once


#define NUM_KERNEL_REPEATS 100

#define STB_IMAGE_IMPLEMENTATION
#include "c:\CODE\GL\stb_image.h"
#define STB_IMAGE_WRITE_IMPLEMENTATION
#include "c:\CODE\GL\stb_image_write.h"
#include <stdio.h> 
#include <stdlib.h> 
#include <string.h> 
#include <string> 
#include <fstream> 
#include <malloc.h> 
#include <iostream>
#include <Windows.h>
#include <math.h>
using namespace std;
void serial_gaussian_blur(string inFile, const float* gaussianBlurFilter, string outFilename);
