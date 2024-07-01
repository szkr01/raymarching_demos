
//demoListフォルダ内のglslファイルをすべて取得

const demos = {
    complex_cube: {
        name: "レイマーチングとは",
        fragmentShader: `
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

        for(int i=0;i<50;i++){
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
}`,
        description: (<>
            <p>これはレイマーチングという手法を使って複雑な形状を描画するデモです。</p>
            <p>モデルを描画しているわけではなく、100行程度のプログラムによって描画されています。</p>
            <br />
            <p>レイマーチングとは光線をシミュレーションして描画するアルゴリズムの一つです。</p>
            <p>計算のみで完結するため、手軽に複雑で美しいアニメーションを作成できます。</p>
        </>
        ),
    },
    sdf: {
        name: "距離関数",
        fragmentShader: `precision mediump float;
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
    `,
        description: (<>
            <p>レイマーチングでは距離関数を用いて図形を作ります</p>
            <p>モデルを描画しているわけではなく、100行程度のプログラムによって描画されています。</p>
            <p>レイマーチングとは光線をシミュレーションして描画するアルゴリズムの一つです。</p>
            <p>計算のみで完結するため、手軽に複雑で美しいアニメーションを作成できます。</p>
        </>
        ),
    },
    sdf2: {
        name: "距離関数2",
        fragmentShader: `precision lowp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

float sdCircle(vec2 p,float r){
    return length(p)-r;
}

float sdBox(vec2 p,vec2 b )
{
    vec2 d = abs(p)-b;
    return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
}

float sceneSDF(vec2 p){
    float d = sdBox(p,vec2(0.4));
    //d = min(sdCircle(p-vec2(sin(u_time*0.2)*0.5,cos(u_time*0.3)*0.5),(sin(u_time*0.1)+1.)*0.2),d);
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
}`
    },
    sphere: {
        name: "球体",
        fragmentShader: `
precision lowp float;
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
    `,
        description: "単純な球体をレイマーチングでレンダリングします。",
    },
    box: {
        name: "立方体",
        fragmentShader: `
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
    `,
        description: "立方体をレイマーチングでレンダリングします。",
    },
    refract1: {
        name: "屈折",
        fragmentShader: `precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
const float PI=3.14159265359;

#define MAX_STEPS 64
#define MAX_DIST 10.
#define SURF_DIST .01

vec3 rotate(vec3 p,float angle,vec3 axis){
    vec3 a=normalize(axis);
    float s=sin(angle);
    float c=cos(angle);
    float r=1.-c;
    mat3 m = mat3(
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

mat2 Rot(float a) {
    float s=sin(a), c=cos(a);
    return mat2(c, -s, s, c);
}

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

float sceneSDF(vec3 p){
    p += 0.1*cyclicNoise(p*0.6+(u_time*PI+sin(u_time*PI))*0.05);
    return sdSphere(p, 1.0);
}

vec3 sceneNormal(vec3 p){
    float eps=.001;
    return normalize(vec3(
        sceneSDF(vec3(p.x+eps,p.y,p.z))-sceneSDF(vec3(p.x-eps,p.y,p.z)),
        sceneSDF(vec3(p.x,p.y+eps,p.z))-sceneSDF(vec3(p.x,p.y-eps,p.z)),
        sceneSDF(vec3(p.x,p.y,p.z+eps))-sceneSDF(vec3(p.x,p.y,p.z-eps))
    ));
}

vec3 skyBox(vec3 rd){
    vec3 col = vec3(1.);
    float sun = dot(cyclicNoise(rd+vec3(u_time*0.1)),vec3(0.,1.,0.));
    col-=vec3(1.0, 1.0, 1.0)*pow(max(sun,0.),2.);
    col-=vec3(1.0, 1.0, 1.0)*pow(max(-sun,0.),2.);
    col = pow(col,vec3(4));
    //col+=vec3(1.0, 0.7686, 0.0)*pow(max(dot(cyclicNoise(rd+vec3(u_time)),vec3(0.,1.,0.)),0.),2.);
    return col;
}

float rayMarch(vec3 ro,vec3 rd,float side){
    float d=0.;
    for(int i=0;i<MAX_STEPS;i++){
        vec3 p = ro + rd*d;
        float dS=sceneSDF(p)*side;
        d+=dS;
        if(dS>MAX_DIST || abs(d) < SURF_DIST)break;
    }
    return d;

}

vec3 renderScene(vec3 ro,vec3 rd){
    float d = rayMarch(ro,rd,1.);

    vec3 col = skyBox(rd);
    float IOR = 1.3; // index of refraction
    float abb = 0.05;
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
        
        col = mix(reflTex, refOutside, fresnel);
        //col = n*.5+.5;
    }

    col = pow(col, vec3(0.4545));

    return col;
}

void main(){
    vec2 uv = (gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
    vec2 mouse = ((u_mouse.xy-u_resolution.xy)/u_resolution.y)*2.-1.;
    vec3 ray_origin=vec3(0.,0.,-3.);
    vec3 ray_direction=normalize(vec3(uv,1.));
    
    ray_origin = rotate(ray_origin,mouse.x*PI*2.,vec3(0.,1.,0.));
    ray_direction = rotate(ray_direction,mouse.x*PI*2.,vec3(0.,1.,0.));

    ray_origin = rotate(ray_origin,mouse.y*PI*2.,vec3(0.,0.,1.));
    ray_direction = rotate(ray_direction,mouse.y*PI*2.,vec3(0.,0.,1.));
    
    vec3 color = renderScene(ray_origin,ray_direction);
    
    gl_FragColor = vec4(color,1.);
}`
    },
    refract2: {
        name: "屈折2",
        fragmentShader: `precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
const float PI=3.14159265359;

#define MAX_STEPS 128
#define MAX_DIST 10.
#define SURF_DIST .1

vec3 rotate(vec3 p,float angle,vec3 axis){
    vec3 a=normalize(axis);
    float s=sin(angle);
    float c=cos(angle);
    float r=1.-c;
    mat3 m = mat3(
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

mat2 Rot(float a) {
    float s=sin(a), c=cos(a);
    return mat2(c, -s, s, c);
}

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
    mat3 b = orthBas( vec3( 3.0, -1.2, 5.4 ) ); // magic, does not make any sense
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

float sceneSDF(vec3 p){
    float r = 1.4;
    float d = sdSphere(p, r);
    float th = abs(p.x*p.x);
    d = -min(-d, sdBox(p*Rot3(p.x*2.+u_time,vec3(1,0,0)), vec3(2.8,th,th)));
    return d;
}

vec3 sceneNormal(vec3 p){
    float eps=.001;
    return normalize(vec3(
        sceneSDF(vec3(p.x+eps,p.y,p.z))-sceneSDF(vec3(p.x-eps,p.y,p.z)),
        sceneSDF(vec3(p.x,p.y+eps,p.z))-sceneSDF(vec3(p.x,p.y-eps,p.z)),
        sceneSDF(vec3(p.x,p.y,p.z+eps))-sceneSDF(vec3(p.x,p.y,p.z-eps))
    ));
}

vec3 skyBox(vec3 rd){
    vec3 col = vec3(1.);
    float sun = dot(cyclicNoise(rd+vec3(u_time*0.1)),vec3(0.,1.,0.));
    col-=vec3(1.0, 1.0, 1.0)*pow(max(sun,0.),2.);
    col-=vec3(1.0, 1.0, 1.0)*pow(max(-sun,0.),2.);
    col = pow(col,vec3(4));
    //col+=vec3(1.0, 0.7686, 0.0)*pow(max(dot(cyclicNoise(rd+vec3(u_time)),vec3(0.,1.,0.)),0.),2.);
    return col;
}

float rayMarch(vec3 ro,vec3 rd,float side){
    float d=0.;
    for(int i=0;i<MAX_STEPS;i++){
        vec3 p = ro + rd*d;
        float dS=sceneSDF(p)*side;
        d+=dS;
        if(dS>MAX_DIST || abs(d) < SURF_DIST)break;
    }
    return d;

}

vec3 renderScene(vec3 ro,vec3 rd){
    float d = rayMarch(ro,rd,1.0);

    vec3 col = skyBox(rd);
    float IOR = 1.4; // index of refraction
    float abb = 0.05;
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
        
        col = mix(reflTex, refOutside, fresnel);
        //col = n*.5+.5;
    }else{
        col = vec3(1.);
    }

    col = pow(col, vec3(0.4545));

    return col;
}

void main(){
    vec2 uv = (gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
    vec2 mouse = ((u_mouse.xy-u_resolution.xy)/u_resolution.y)*2.-1.;
    vec3 ray_origin=vec3(0.,0.,-4.);
    vec3 ray_direction=normalize(vec3(uv,1.));
    
    ray_origin = rotate(ray_origin,mouse.x*PI*2.,vec3(0.,1.,0.));
    ray_direction = rotate(ray_direction,mouse.x*PI*2.,vec3(0.,1.,0.));

    ray_origin = rotate(ray_origin,mouse.y*PI*2.,vec3(0.,0.,1.));
    ray_direction = rotate(ray_direction,mouse.y*PI*2.,vec3(0.,0.,1.));
    
    vec3 color = renderScene(ray_origin,ray_direction);
    
    gl_FragColor = vec4(color,1.);
}`
    }
};

export default demos