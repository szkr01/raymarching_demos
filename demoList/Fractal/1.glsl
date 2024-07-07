precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
const float PI=3.14159265359;

#define MAX_STEPS 64
#define MAX_DIST 100.
#define SURF_DIST .01


mat3 Rot3(float a,vec3 v){
    float s=sin(a), c=cos(a);
    return mat3(
        c+v.x*v.x*(1.-c),v.x*v.y*(1.-c)-v.z*s,v.x*v.z*(1.-c)+v.y*s,
        v.y*v.x*(1.-c)+v.z*s,c+v.y*v.y*(1.-c),v.y*v.z*(1.-c)-v.x*s,
        v.z*v.x*(1.-c)-v.y*s,v.z*v.y*(1.-c)+v.x*s,c+v.z*v.z*(1.-c)
    );
}

mat3 orthBas( vec3 z ) {
    z = normalize( z );
    vec3 up = abs( z.y ) > 0.999 ? vec3( 0, 0, 1 ) : vec3( 0, 1, 0 );
    vec3 x = normalize( cross( up, z ) );
    return mat3( x, cross( z, x ), z );
}

vec3 cyclicNoise( vec3 p ) {
    mat3 b = orthBas( vec3( 3.0, -1.2, 5.4 ) );
    float warp = 1.1;
    float amp = 0.5;
    vec3 result = vec3( 0.0 );

    for ( int i = 0; i < 4; i ++ ) {
        p *= 1.1 * b;
        p += warp * sin( p.zxy );

        result += amp * cross( sin( p.yzx ), cos( p ) );

        warp *= 1.2;
        amp *= 0.5;
    }
    
    return result;
}

float smoothMin(float a,float b,float k){
    float h=clamp(.5+.5*(b-a)/k,0.,1.);
    return mix(b,a,h)-k*h*(1.-h);
}

float sdSphere(vec3 p,float s){
    return length(p)-s;
}

float sdBox(vec3 p,vec3 b){
    vec3 q=abs(p)-b;
    return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);
}

float cube(vec3 p, vec3 b){vec3 q=abs(p)-b;return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0);}
float map(vec3 rayP)
{
	float Scale = 10.;
  vec3 p = rayP/Scale;
  p.z-=-u_time*0.05;
  p.z=mod(p.z,2.4)-1.2;
	float d = cube(p, vec3(1.0));
	float s = 3.00; 
	for (int m = 0; m < 5; m++)
	{
		vec3 a = mod(p * s, 2.0) - 1.0;
		s *= 3.0;
		vec3 r = abs(1.0 - 3.0 * abs(a));
		float da = max(r.x, r.y); 
		float db = max(r.y, r.z); 
		float dc = max(r.z, r.x);
		float c = (min(da, min(db, dc)) - 1.0) / s;
		d = max(d, c);
	}
	return d*Scale;
}

float sceneSDF(vec3 p){
    return map(p);
}

vec3 sceneNormal(vec3 p){
    float eps=.001;
    vec3 n = vec3(
        sceneSDF(vec3(p.x+eps,p.y,p.z))-sceneSDF(vec3(p.x-eps,p.y,p.z)),
        sceneSDF(vec3(p.x,p.y+eps,p.z))-sceneSDF(vec3(p.x,p.y-eps,p.z)),
        sceneSDF(vec3(p.x,p.y,p.z+eps))-sceneSDF(vec3(p.x,p.y,p.z-eps))
    );
    return normalize(n);
}

vec3 skyBox(vec3 rd){
    vec3 col = vec3(1.);
    float sun = dot(cyclicNoise(rd+vec3(u_time*0.1)),vec3(0.,1.,0.));
    col-=vec3(1.0, 1.0, 1.0)*pow(max(sun,0.),2.);
    col-=vec3(1.0, 1.0, 1.0)*pow(max(-sun,0.),2.);
    col = pow(col,vec3(4));
    return col;
}

float rayMarch(vec3 ro,vec3 rd,float side){
    float d = 0.;
    float h = 0.;
    for(int i=0;i<MAX_STEPS;i++){
        vec3 p = ro + rd*d;
        float h = sceneSDF(p)*side;
        d += h;
        if(h < SURF_DIST || d > MAX_DIST) break;
    }
    return d;
}


vec3 renderScene(vec3 ro,vec3 rd){
    vec3 col = vec3(0);
    float d = rayMarch(ro, rd, 1.0);

    if(d<MAX_DIST){
        vec3 p = ro + rd*d;
        vec3 n = sceneNormal(p);
        
        vec3 light = normalize(vec3(1.,1.,1.));
        float diff = dot(n,light);
        col = vec3(1.)*diff;
    }

    col = pow(col,vec3(0.05));

    return col;
}

void main(){
    vec2 uv = (gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
    vec2 mouse = ((u_mouse.xy-u_resolution.xy)/u_resolution.y)*2.-1.;
    
    vec3 ray_origin=vec3(0.,0.,-1.);
    vec3 ray_direction=normalize(vec3(uv,1.));

    float t = u_time*.1;

    //ray_origin *= Rot3(mouse.x*PI*2.+t,vec3(0.,1.,0.));
    //ray_direction *= Rot3(mouse.x*PI*2.+t,vec3(0.,1.,0.));
    ray_origin *= Rot3(mouse.y*PI*2.+t,vec3(0.,0.,1.));
    ray_direction *= Rot3(mouse.y*PI*2.+t,vec3(0.,0.,1.));
    
    vec3 color = renderScene(ray_origin,ray_direction);
    
    gl_FragColor = vec4(color,1.);
}