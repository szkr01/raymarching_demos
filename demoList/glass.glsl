
precision lowp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

#define MAX_STEPS 100
#define MAX_DIST 100.0
#define SURF_DIST 0.0001
#define PI 3.14159265359

vec3 rotate(vec3 p,float angle,vec3 axis){
    vec3 a=normalize(axis);
    float s=sin(angle);
    float c=cos(angle);
    float r=1.-c;
    mat3 m=mat3(
        a.x*a.x*r+c,
        a.y*a.x*r+a.z*s,
        a.z*a.x*r-a.y*s,
        a.x*a.y*r-a.z*s,
        a.y*a.y*r+c,
        a.z*a.y*r+a.x*s,
        a.x*a.z*r+a.y*s,
        a.y*a.z*r-a.x*s,
        a.z*a.z*r+c
    );
    return m*p;
}

mat3 orthBas( vec3 z ) {
    z = normalize( z );
    vec3 up = abs( z.y ) > 0.999 ? vec3( 0, 0, 1 ) : vec3( 0, 1, 0 );
    vec3 x = normalize( cross( up, z ) );
    return mat3( x, cross( z, x ), z );
}

vec3 cyclicNoise( vec3 p ) {
    mat3 b = orthBas( vec3( 3.0, -1.2, 5.4 ) ); // magic, does not make any sense
    float warp = 1.1;
    float amp = 0.5;
    vec3 result = vec3( 0.0 );

    for ( int i = 0; i < 4; i ++ ) {
        p *= 2.0 * b;
        p += warp * sin( p.zxy );

        result += amp * cross( sin( p.yzx ), cos( p ) );

        warp *= 1.2;
        amp *= 0.5;
    }
    
    return result;
}

float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

float sdBox(vec3 p, vec3 b) {
    vec3 d = abs(p) - b;
    return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
}

float sdBoxFrame( vec3 p, vec3 b, float e )
{
    p = abs(p  )-b;
    vec3 q = abs(p+e)-e;
    return min(min(
    length(max(vec3(p.x,q.y,q.z),0.0))+min(max(p.x,max(q.y,q.z)),0.0),
    length(max(vec3(q.x,p.y,q.z),0.0))+min(max(q.x,max(p.y,q.z)),0.0)),
    length(max(vec3(q.x,q.y,p.z),0.0))+min(max(q.x,max(q.y,p.z)),0.0)
    );
}

float map(vec3 p)
{


    float ret = sdBoxFrame(p, vec3(2.0),0.2);
    p = rotate(p, u_time, vec3(0.,1.,0.));
    ret = min(ret, sdBoxFrame(p, vec3(1.6),0.2));
    p = rotate(p, u_time, vec3(1.,0.,0.));
    ret = min(ret, sdBoxFrame(p, vec3(1.2),0.2));
    p = rotate(p, u_time, vec3(0.,0.,1.));
    ret = min(ret, sdBoxFrame(p, vec3(0.8),0.2));
    //ret = sdSphere(p,1.0);
    return ret;
}

vec3 getNormal(vec3 p) {
    float eps=.001;
    return normalize(vec3(
        map(vec3(p.x+eps,p.y,p.z))-map(vec3(p.x-eps,p.y,p.z)),
        map(vec3(p.x,p.y+eps,p.z))-map(vec3(p.x,p.y-eps,p.z)),
        map(vec3(p.x,p.y,p.z+eps))-map(vec3(p.x,p.y,p.z-eps))
    ));
}

float rayMarch(vec3 ro, vec3 rd) {
    float dO = 0.0;

    for(int i = 0; i < MAX_STEPS; i++) {
        vec3 p = ro + rd * dO;
        float dS = map(p);
        dO += dS;
        if(dO > MAX_DIST || abs(dS) < SURF_DIST) break;
    }
    return dO;
}

vec3 skyBox(vec3 rd) {
    vec3 col = vec3(0.0);
    
    float t = sin(rd.x*10.)+sin(rd.y*10.)+sin(rd.z*10.);
    col = vec3(length(cyclicNoise(rd*2.)),0,0);

    return col;
}

vec3 render(vec3 pos,vec3 ray){
    vec3 rayOr = ray;
    pos*=1.;
    vec3 op = pos;
    float d=0.;
    vec3 color= skyBox(ray);
    vec3 N;
    for(int refc=0;refc<8;refc++){
        float rl = 1E-2;
        vec3 rp = op + ray * rl;

        for(int i=0;i<64;i++){
            d = map(rp);
            rl += d;
            rp = op + ray * rl;
        }
        if(d<1e-4){
            N = getNormal(rp);
            op = rp;
            ray = reflect(ray,N);
            color += color * vec3( 0.5 + 0.5 * N ); // considering the colorRemain
            color *= 0.5; // decay the colorRemain
        }else{
            break;
        }
    }

    if(dot(rayOr,N)>-0.0){
        color+=vec3(0,0.2,1)*dot(rayOr,N);
    }


    return color;
}

void main(){
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    vec3 ro = vec3(0.0, 0.0, -8.0);
    vec3 rd = normalize(vec3(uv, 1.0));
    vec2 mouse = u_mouse/u_resolution;
    //rotate
    rd=rotate(rd,u_time*0.1+mouse.x*PI*2.,vec3(0.,1.,0.));
    ro=rotate(ro,u_time*0.1+mouse.x*PI*2.,vec3(0.,1.,0.));
    rd=rotate(rd,u_time*0.1+mouse.y*PI*2.,vec3(1.,0.,0.));
    ro=rotate(ro,u_time*0.1+mouse.y*PI*2.,vec3(1.,0.,0.));

    vec3 col = render(ro, rd);
    
    gl_FragColor = vec4(col, 1.0);
}