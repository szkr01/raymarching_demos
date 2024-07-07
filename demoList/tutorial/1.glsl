precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
const float PI=3.14159265359;

#define MAX_STEPS 64
#define MAX_DIST 10.
#define SURF_DIST .0001


float sdSphere(vec3 p,float s){
    return length(p)-s;
}

float SDF(vec3 p){
    float r = 1.;
    float d;
    d = sdSphere(p, r);
    return d;
}

vec3 sceneNormal(vec3 p){
    float eps=.001;
    return normalize(vec3(
        SDF(vec3(p.x+eps,p.y,p.z))-SDF(vec3(p.x-eps,p.y,p.z)),
        SDF(vec3(p.x,p.y+eps,p.z))-SDF(vec3(p.x,p.y-eps,p.z)),
        SDF(vec3(p.x,p.y,p.z+eps))-SDF(vec3(p.x,p.y,p.z-eps))
    ));
}

float rayMarch(vec3 ro,vec3 rd){
    float d=0.;
    for(int i=0;i<MAX_STEPS;i++){
        vec3 p = ro + rd*d;
        float dS = SDF(p);
        d+=dS;
        if(dS>MAX_DIST || abs(d) < SURF_DIST)break;
    }
    return d;

}


vec3 render(vec3 ro,vec3 rd){
    float d = rayMarch(ro,rd);

    if(d<MAX_DIST){
        return vec3(1);
    }

    return vec3(0);
}

void main(){
    vec2 uv = (gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;

    vec3 ray_origin=vec3(0.,0.,-3.);
    vec3 ray_direction=normalize(vec3(uv,1.));

    vec3 color = render(ray_origin,ray_direction);
    
    gl_FragColor = vec4(color,1.);
}