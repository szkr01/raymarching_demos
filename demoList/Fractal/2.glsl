precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
const float PI=3.14159265359;

#define MAX_STEPS 64
#define MAX_DIST 100.
#define SURF_DIST .01

vec3 palette2(float t,vec3 a, vec3 b, vec3 c, vec3 d ) { return a + b*cos( 6.28318*(c*t+d) ); }

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
        p *= 2.5 * b;
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

	for (int m = 0; m < 6; m++)
	{
		vec3 a = mod(p * s, 2.0) - 1.0;
		s *= 3.0;
		vec3 r = abs(1.0 - 3.0 * abs(a));
		float da = max(r.x, r.y); 
		float db = max(r.y, r.z); 
		float dc = max(r.z, r.x);
		float c = (min(da, min(db, dc)) - 1.0) / s;
		d = max(d, c);
        if(float(m)>mod(u_time,6.))break;
	}
	return d*Scale;
}

float sdf(vec3 pos3d)
{
    // Constants
    float SCALE = 8. / 6.28318530718;
    const float radius = 0.4;
    // Choose 2 dimensions and apply the forward log-polar map
    vec2 pos2d = pos3d.xz;
    
    float r = length(pos2d);
    pos2d = vec2(log(r), atan(pos2d.y, pos2d.x));

    // Scale pos2d so tiles will fit nicely in the ]-pi,pi] interval
    pos2d *= SCALE;

    // Convert pos2d to single-tile coordinates
    pos2d = fract(pos2d-u_time+1e10) - 0.5;

    // Get ball distance;
    // Shrink Y coordinate proportionally to the other dimensions;
    // Return distance value multiplied by the final scaling factor
    float mul = r/SCALE;
    return (length(vec3(pos2d, max(0.0, -pos3d.y/mul))) - radius) * mul;
}

float sceneSDF(vec3 p){
    return sdf(p);
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

vec3 cc(vec3 p)
{
    float height = p.y*20.0;
	vec3 top = vec3(0.1294, 0.1843, 0.2471);
	vec3 ring = vec3(0.6, 0.04, 0.0);
	vec3 bottom = vec3(0.3, 0.3, 0.3);
	bottom = mix(vec3(0.0), bottom, min(1.0, -1.0/(p.y*20.0-1.0)));
	vec3 side = mix(bottom, ring, smoothstep(-height-0.001, -height, p.y));
	return mix(side, top, smoothstep(-0.01, 0.0, p.y));
}

vec3 renderScene(vec3 ro,vec3 rd){
    float d = rayMarch(ro,rd,1.0);

    vec3 col = skyBox(rd);
    float IOR = 1.1; // index of refraction
    float abb = 0.005;
    if(d<MAX_DIST){
        vec3 p=ro+rd*d;
        vec3 n=sceneNormal(p);

        vec3 r = reflect(rd, n);
        vec3 refOutside = skyBox(r);
        
        vec3 rdIn = refract(rd, n, 1.0 / IOR);

        vec3 pEnter = p - n*SURF_DIST*3.;
        float dIn = rayMarch(pEnter, rdIn,-1.);

        vec3 pExit = pEnter + rdIn * dIn; // 3d position of exit
        vec3 nExit = -sceneNormal(pExit); 

        vec3 reflTex = vec3(0);
        
        vec3 rdOut = vec3(0);

        // red
        rdOut = refract(rdIn, nExit, IOR-abb);
        if(dot(rdOut, rdOut)==0.) rdOut = reflect(rdIn, nExit);
        reflTex.r = skyBox(rdOut).r;
        
        // green
        rdOut = refract(rdIn, nExit, IOR);
        if(dot(rdOut, rdOut)==0.) rdOut = reflect(rdIn, nExit);
        reflTex.g = skyBox(rdOut).g;
        
        // blue
        rdOut = refract(rdIn, nExit, IOR+abb);
        if(dot(rdOut, rdOut)==0.) rdOut = reflect(rdIn, nExit);
        reflTex.b = skyBox(rdOut).b;

        float dens = .1;
        float optDist = exp(-dIn*dens);
        
        reflTex = reflTex*optDist;//*vec3(1., .05,.2);
        
        float fresnel = pow(1.+dot(rd, n), 5.);
        
        col = n*.5+.5;
        col += mix(reflTex, refOutside, fresnel)*0.1;

        col = mix(col, cc(p), smoothstep(0., 1., d/MAX_DIST));
        //col = normalize(col);
    }else{
        col = vec3(1.);
    }

    //distance fog
    col = mix(col, vec3(0), 1.-exp(-d*0.4));

    col = 1.-col;

    col = pow(col, vec3(0.3545));

    return col;
}

void main(){
    vec2 uv = (gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
    vec2 mouse = ((u_mouse.xy-u_resolution.xy)/u_resolution.y)*2.-1.;
    
    vec3 ray_origin=vec3(0.,0.,-2.);
    vec3 ray_direction=normalize(vec3(uv,1.));

    float t = u_time*.1;

    ray_origin *= Rot3(mouse.y,vec3(1.,0.,0.));
    ray_direction *= Rot3(mouse.y,vec3(1.,0.,0.));
    ray_origin *= Rot3(mouse.x*PI*2.+t,vec3(0.,1.,0.));
    ray_direction *= Rot3(mouse.x*PI*2.+t,vec3(0.,1.,0.));
    
    
    vec3 color = renderScene(ray_origin,ray_direction);
    
    gl_FragColor = vec4(color,1.);
}