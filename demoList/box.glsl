precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;

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

float boxSDF(vec3 p,vec3 b){
    vec3 q=abs(p)-b;
    return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);
}

float sceneSDF(vec3 p){
    p = rotate(p, u_time, vec3(1.,1.,1.));
    return boxSDF(p,vec3(.5));
}

vec3 estimateNormal(vec3 p){
    float eps=.001;
    return normalize(vec3(
        sceneSDF(vec3(p.x+eps,p.y,p.z))-sceneSDF(vec3(p.x-eps,p.y,p.z)),
        sceneSDF(vec3(p.x,p.y+eps,p.z))-sceneSDF(vec3(p.x,p.y-eps,p.z)),
        sceneSDF(vec3(p.x,p.y,p.z+eps))-sceneSDF(vec3(p.x,p.y,p.z-eps))
    ));
}

void main(){
    vec2 uv = (gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
    vec2 mouse = ((u_resolution.xy-gl_FragCoord.xy)/u_resolution.y)*2.-1.;
    vec3 ray_origin=vec3(0.,0.,-3.);
    vec3 ray_direction=normalize(vec3(uv,1.));
    
    ray_origin = rotate(ray_origin,u_time*0.2,vec3(0.,1.,0.));
    ray_direction = rotate(ray_direction,u_time*0.2,vec3(0.,1.,0.));

    float t=0.;
    for(int i=0;i<64;i++){
        vec3 p=ray_origin+t*ray_direction;
        float d=sceneSDF(p);
        if(d<.0001)break;
        t+=d;
        if(t>100.)break;
    }
    
    vec3 p=ray_origin+t*ray_direction;
    vec3 normal=estimateNormal(p);
    vec3 light=normalize(vec3(1.,1.,-1.));
    float diff=dot(normal,light);
    diff = max(diff+0.3,0.);
    
    vec3 color=vec3(.5,.8,1.)*diff;
    gl_FragColor=vec4(color,1.);
}