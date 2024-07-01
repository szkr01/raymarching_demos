precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

#define TAU (atan(1.)*8.)
#define rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))

const float e = exp(1.);
const float pi = tan(1.);
const vec3 cPos = vec3(0,0,10);
vec3 lightPos = vec3(1,0,0);
vec2 mouse;
// rotate
vec3 rotate(vec3 p, float angle, vec3 axis){
    vec3 a = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float r = 1.0 - c;
    mat3 m = mat3(
        a.x * a.x * r + c,
        a.y * a.x * r + a.z * s,
        a.z * a.x * r - a.y * s,
        a.x * a.y * r - a.z * s,
        a.y * a.y * r + c,
        a.z * a.y * r + a.x * s,
        a.x * a.z * r + a.y * s,
        a.y * a.z * r - a.x * s,
        a.z * a.z * r + c
    );
    return m * p;
}

float softMax(float a,float b,float R){
    return (1./R)*log(exp(a*R)+exp(b*R));
}

float d_Sphere(vec3 p,float size){
    return length(p)-size;
}

float d_Box(vec3 p,float s){
    float c = length(max(abs(p)-s,0.0))-0.04;
    return c;
}

float sdBox( vec3 p, vec3 b )
{
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

float sd_cross(vec3 p,float t){
    float s1 = sdBox(p,vec3(t,100.0,t));
    float s2 = sdBox(p,vec3(100.0,t,t));
    float s3 = sdBox(p,vec3(t,t,100.0));
    float s4 = min(s1,s2);
    return min(s4,s3);
}

float map(vec3 p)
{

    p = rotate(p,pi,vec3(0.,1.,-1.));
    p = rotate(p,-0.3,vec3(0.,1.,1.));

    p = rotate(p,u_mouse.x/200.-1.,vec3(1.,0.,0.));
    p = rotate(p,u_mouse.y/200.-1.,vec3(0.,1.,0.));
    float t = (sin((fract(u_time*0.5)*2.-1.)*pi)+1.)/2.;
    float s0 = sdBox(p,vec3(1));

    float s1 =  sd_cross(p,fract(t));
    float s2 =  sd_cross(p,fract(t+0.5));
    float ret = 0.;
    if(fract(t)<0.5){
        ret = max(s0,min(s1,-s2));
    }else{
        ret = max(s0,max(s1,-s2));
    }
     
    return ret;
}

vec3 getNormal(vec3 p){
    float d = 0.001;
    return normalize(vec3(
        map(vec3(p.x+d,p.y,p.z))-map(vec3(p.x-d,p.y,p.z)),
        map(vec3(p.x,p.y+d,p.z))-map(vec3(p.x,p.y-d,p.z)),
        map(vec3(p.x,p.y,p.z+d))-map(vec3(p.x,p.y,p.z-d))
    ));
}

vec3 trace(vec3 pos,vec3 ray,float time){
    vec3 rayOr = ray;
    ray = rotate(ray, time*0.1, vec3(0,0.3,1));
    pos = rotate(pos, time*0.1, vec3(0,0.3,1));
    pos*=1.;
    vec3 op = pos;
    float d=0.;
    vec3 color=vec3(1.0, 1.0, 1.0);
    vec3 N;
    for(int refc=0;refc<4;refc++){
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

    if(d<1e-4){
        color=vec3(0.8627, 0.9725, 1.0);
    }

    if(dot(rayOr,N)>-0.0){
        color+=vec3(0,0.2,1)*dot(rayOr,N);
    }

    return color;
}

void main() {
	vec2 pos = (2.0*gl_FragCoord.xy-u_resolution.xy)/min(u_resolution.x,u_resolution.y);
	mouse = (2.0*u_mouse.xy-u_resolution.xy)/min(u_resolution.x,u_resolution.y);
    vec3 ray = normalize((vec3(pos,0)-cPos)*vec3(2,2,1));
    //float noise = sin(u_time+pos.y+pos.x)*10.;
    gl_FragColor = vec4(trace(cPos,ray,u_time),1);
}