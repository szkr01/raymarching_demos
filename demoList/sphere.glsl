precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

float sphereSDF(vec3 p,float r){
    return length(p)-r;
}

float sceneSDF(vec3 p){
    return sphereSDF(p,1.);
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
    vec2 uv=(gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
    vec2 mouse = (u_mouse/u_resolution)*2.-1.;
    vec3 ray_origin=vec3(0.,0.,3.) - vec3(mouse,0.);
    vec3 ray_direction=normalize(vec3(uv,-1.));
    vec3 color=vec3(0.);
    float t=0.;
    for(int i=0;i<100;i++){
        vec3 p=ray_origin+t*ray_direction;
        float d=sceneSDF(p);
        if(d<.001){
            vec3 p=ray_origin+t*ray_direction;
            vec3 normal=estimateNormal(p);
            vec3 light=normalize(vec3(1.,1.,-1.));
            float diff=max(0.,dot(normal,light)*.5+.5);
            color = normal;
        };
        t+=d;
        if(t>100.)break;
    }
    gl_FragColor=vec4(color,1.);
}