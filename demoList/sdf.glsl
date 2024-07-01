precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

float sphereSDF(vec2 p,float r){
    return length(p)-r;
}

float sceneSDF(vec2 p){
    float d = sphereSDF(p,0.4);
    d = min(sphereSDF(p-vec2(sin(u_time*0.2)*0.5,cos(u_time*0.3)*0.5),(sin(u_time*0.1)+1.)*0.2),d);
    return d;
}
    
void main(){
    vec2 uv=(gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
    vec2 mouse = (u_mouse/u_resolution)*2.-1.;

    float d = sceneSDF(uv*2.);
    
	// coloring
    vec3 col = (d>0.0) ? vec3(0.9,0.6,0.3) : vec3(0.65,0.85,1.0);
    col *= 1.0 - exp(-6.0*abs(d));
	col *= 0.8 + 0.2*cos(150.0*d);
	col = mix( col, vec3(1.0), 1.0-smoothstep(0.0,0.01,abs(d)) );

    gl_FragColor=vec4(col,1.);
}