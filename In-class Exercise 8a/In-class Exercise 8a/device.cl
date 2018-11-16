__kernel void img_conv_filter(__read_only image2d_t inImg, __write_only image2d_t outImg, __constant float* convfilter, uint filtWidth)
{
// use global IDs for output coords
int x = get_global_id(0); // columns
int y = get_global_id(1); // rows
const sampler_t samplerA = CLK_NORMALIZED_COORDS_TRUE |
                           CLK_ADDRESS_REPEAT         |
                           CLK_FILTER_NEAREST;
int halfWidth = (int)(filtWidth/2); // auto-round nearest int
float sum = 0.0f;
int filtIdx = 0; // filter kernel passed in as linearized buffer array
int2 coords;
for(int i = -halfWidth; i <= halfWidth; i++) // iterate filter rows
{
coords.y = y + i;
for(int j = -halfWidth; j <= halfWidth; j++) // iterate filter cols
{
coords.x = x + j;
float pixel = convert_float(read_imageui(inImg, samplerA, coords).x); // operate on single component (x = r)
sum += pixel * convfilter[filtIdx];
filtIdx++;
}
}
//write resultant filtered pixel to output image
coords = (int2)(x,y);
write_imageui(outImg, coords, convert_uint4((float4)(sum,sum,sum,1.0f))); // leave a-channel unchanged
}