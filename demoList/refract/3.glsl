precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
const float PI=3.14159265359;

#define MAX_STEPS 64
#define MAX_DIST 10.
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

float easeInOutQuint(float x) {
    return x < 0.5 ? 16. * x * x * x * x * x : 1. - pow(-2. * x + 2., 5.) / 2.;
}

vec3 sceneSDF(vec3 p){
    float r = 2.;
    float d = sdSphere(p, r);
    float th = abs(p.x)*0.6;
    vec3 p2 = p*Rot3(p.x*(sin(u_time*0.9)*10.)+u_time,vec3(1,0,0)); 
    p2.x-=sin(u_time*0.3)*1.;
    float d2 = sdBox(p2, vec3(0.5,th,th));
    d = -smoothMin(-d,d2,1.+sin(u_time*0.87)*0.9);
    return vec3(d, 0.0, 0.0); // Return vec3 instead of float
}

vec3 sceneNormal(vec3 p){
    float eps=.001;
    vec3 n = vec3(
        sceneSDF(vec3(p.x+eps,p.y,p.z)).x-sceneSDF(vec3(p.x-eps,p.y,p.z)).x,
        sceneSDF(vec3(p.x,p.y+eps,p.z)).x-sceneSDF(vec3(p.x,p.y-eps,p.z)).x,
        sceneSDF(vec3(p.x,p.y,p.z+eps)).x-sceneSDF(vec3(p.x,p.y,p.z-eps)).x
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

vec3 rayMarch(vec3 ro,vec3 rd,float side){
    float d = 0.;
    float m = 0.;
    float h = 0.;
    for(int i=0;i<MAX_STEPS;i++){
        vec3 p = ro + rd*d;
        vec3 res = sceneSDF(p);
        h = res.x * side;
        m = res.y;
        d += h;
        if(h < SURF_DIST || d > MAX_DIST) break;
    }
    return vec3(d, m, h);
}


vec3 renderScene(vec3 ro,vec3 rd){
    vec3 col = skyBox(rd);
    float px = 1.0 / u_resolution.y; // Pixel size

    vec3 res = rayMarch(ro, rd, 1.0);
    float t = res.x;
    float d = t;
    float m = res.y;

    float IOR = 1.5; // index of refraction
    float abb = 0.07;

    if(d<MAX_DIST){
        vec3 p=ro+rd*d;
        vec3 n=sceneNormal(p);

        vec3 r = reflect(rd, n);
        vec3 refOutside = skyBox(r);
        
        vec3 rdIn = refract(rd, n, 1.0 / IOR);

        vec3 pEnter = p - n*SURF_DIST*3.;
        float dIn = rayMarch(pEnter, rdIn,-1.).x;

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
        
        col = mix(reflTex, refOutside, fresnel);
    }else{
        col = vec3(1.);
    }

    col = pow(col, vec3(0.14545));

    return col;
}

void main(){
    vec2 uv = (gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
    vec2 mouse = ((u_mouse.xy-u_resolution.xy)/u_resolution.y)*2.-1.;
    vec3 ray_origin=vec3(0.,0.,-6.);
    vec3 ray_direction=normalize(vec3(uv,1.));
    float t = u_time*.3;
    ray_origin *= Rot3(mouse.x*PI*2.+t,vec3(0.,1.,0.));
    ray_direction *= Rot3(mouse.x*PI*2.+t,vec3(0.,1.,0.));

    ray_origin *= Rot3(mouse.y*PI*2.+t,vec3(0.,0.,1.));
    ray_direction *= Rot3(mouse.y*PI*2.+t,vec3(0.,0.,1.));
    
    vec3 color = renderScene(ray_origin,ray_direction);
    
    gl_FragColor = vec4(color,1.);
}