precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

float sdLine(vec2 p,vec2 p1,vec2 p2,float r){
  vec2 a1 = p - p1; vec2 a2 = p2 - p1;
  float h = clamp(dot(a1,a2)/dot(a2,a2),0.0,1.0);
  return length(a1 - a2*h) - r;
}

float sdCircle(vec2 p,float r){
    return length(p)-r;
}

float sceneSDF(vec2 p){
    float d =  sdCircle(p,0.4);
    d = min(sdCircle(p-vec2(sin(u_time*0.2)*0.5,cos(u_time*0.3)*0.5),(sin(u_time*0.1)+1.)*0.2),d);
    return d;
}
    
void main(){
    vec2 uv = (gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
    vec2 mouse = (u_mouse.xy-.5*u_resolution.xy)/u_resolution.y;
    mouse = mouse*2.0;

    vec2 rd = vec2(cos(u_time*0.1),sin(u_time*0.1));
    vec2 ro = mouse;

    float dd = sdLine(uv*2.,ro,ro+rd*100.,0.002);
    
    vec3 col = (dd<0.0)?vec3(1.):vec3(0.);

    float t = 0.;
    for(int i=0;i<100;i++){
        vec2 p = ro+rd*t;
        float d = sdCircle(p,0.2);
        t+=d;

        

        if(d<0.01){
            col = vec3(1);
            break;
        
        }
    }

    gl_FragColor=vec4(col,1.);
}