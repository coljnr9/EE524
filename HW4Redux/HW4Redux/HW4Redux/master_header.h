//Master Header File includes.h
#include <stdio.h>
#include <stdlib.h>
#include <CL/cl.h>
#include "read_source.h"
#include <windows.h>
#include <math.h>
#include <stdio.h> 
#include <stdlib.h> 
#include <string.h> 
#include <string> 
#include <fstream> 
#include <malloc.h> 

#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"
#define STB_IMAGE_WRITE_IMPLEMENTATION
#include "stb_image_write.h"

#define CHECK_ERROR(a,b,c) (a == CL_SUCCESS) ? printf(b):printf(c)