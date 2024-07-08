
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
    },
    test1: {
        name: "テスト1",
        fragmentShader: `precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
const float PI=3.14159265359;

#define MAX_STEPS 64
#define MAX_DIST 16.
#define SURF_DIST .001

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

float sceneSDF(vec3 p){
    float r = 0.5;
    float d;
    if(mod(u_time/6., 2.)<1.){
        d = sdSphere(p, r);
    }else{
        d = sdBox(p,vec3(0.5));
    }
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
        if(d>MAX_DIST || abs(dS) < SURF_DIST)break;
    }
    return d;
}


vec3 sense1(vec3 ro,vec3 rd){
    float d = rayMarch(ro,rd,1.0);
    if(d<MAX_DIST){
        return vec3(1);
    }
    return vec3(0);
}

vec3 sense2(vec3 ro,vec3 rd){
    float d = rayMarch(ro,rd,1.0);
    if(d<MAX_DIST){
        vec3 p=ro+rd*d;
        vec3 n=sceneNormal(p);
        n = n*.5+.5;
        return n;
    }
    return vec3(0);
}

vec3 sense3(vec3 ro,vec3 rd){
    float d = rayMarch(ro,rd,1.0);
    if(d<MAX_DIST){
        vec3 p=ro+rd*d;
        vec3 n=sceneNormal(p);
        return vec3(dot(n,vec3(1,0,0)));
    }
    return vec3(0);
}

vec3 sense4(vec3 ro,vec3 rd){
    float d = rayMarch(ro,rd,1.0);
    vec3 col = skyBox(rd);

    if(d<MAX_DIST){
        vec3 p=ro+rd*d;
        vec3 n = sceneNormal(p);
        col = vec3(dot(n,vec3(1,0,0)));
    }
    col = pow(col, vec3(0.4545));
    return col;
}

vec3 sense5(vec3 ro,vec3 rd){
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

        rdOut = refract(rdIn, nExit, IOR-abb);
        reflTex = skyBox(rdOut);
        
        float fresnel = pow(1.+dot(rd, n), 5.);
        
        col = mix(reflTex, refOutside, fresnel);
    }else{
        col = skyBox(rd);
    }
    col = pow(col, vec3(0.4545));
    return col;
}

vec3 sense6(vec3 ro,vec3 rd){
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
        col = skyBox(rd);
    }
    col = pow(col, vec3(0.4545));
    return col;
}


vec3 renderScene(vec3 ro,vec3 rd){
    vec3 col;

    float t = mod(u_time, 6.);

    if(0.<=t && t<1.){
        col = sense1(ro,rd);
    }
    if(1.<=t && t<2.){
        col = sense2(ro,rd);
    }
    if(2.<=t && t<3.){
        col = sense3(ro,rd);
    }
    if(3.<=t && t<4.){
        col = sense4(ro,rd);
    }
    if(4.<=t && t<5.){
        col = sense5(ro,rd);
    }
    if(5.<=t && t<6.){
        col = sense6(ro,rd);
    }

    return col;
}

void main(){
    vec2 uv = (gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
    vec2 mouse = ((u_mouse.xy-u_resolution.xy)/u_resolution.y)*2.-1.;
    vec3 ray_origin=vec3(0.,0.,-3.);
    vec3 ray_direction=normalize(vec3(uv,1.));
    float t = u_time*.3;
    ray_origin *= Rot3(mouse.x*PI*2.+t,vec3(0,1,0));
    ray_direction *=Rot3(mouse.x*PI*2.+t,vec3(0,1,0));

    ray_origin *= Rot3(mouse.y*PI*2.+t,vec3(0,0,1));
    ray_direction *= Rot3(mouse.y*PI*2.+t,vec3(0,0,1));
    
    vec3 color = renderScene(ray_origin,ray_direction);
    
    gl_FragColor = vec4(color,1.);
}`
    },
    result1: {
        name: "結果",
        fragmentShader: `precision mediump float;
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
}`
    },
    result2: {
        name: "結果2",
        fragmentShader: `precision mediump float;
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
        return sceneNormal(ro+rd*d)*.5+.5;
    }

    return vec3(0);
}

void main(){
    vec2 uv = (gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;

    vec3 ray_origin=vec3(0.,0.,-3.);
    vec3 ray_direction=normalize(vec3(uv,1.));

    vec3 color = render(ray_origin,ray_direction);
    
    gl_FragColor = vec4(color,1.);
}`
    }, refract3: {
        name: "屈折3",
        fragmentShader: `precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
const float PI=3.14159265359;

#define MAX_STEPS 64
#define MAX_DIST 10.
#define SURF_DIST .01
#define AA 2

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

float sceneSDF(vec3 p){
    float r = 1.1;
    p += cyclicNoise(p*(sin(u_time*0.03)+1.)*0.8+u_time+sin(u_time))*sin(u_time*0.1)*0.4;
    float d = sdSphere(p, r);
    
    d = smoothMin(d, sdSphere(p +vec3(0.6,0,0)* Rot3(u_time,vec3(1,1.2,0)),0.4), .8);
    d = smoothMin(d, sdSphere(p +vec3(0.8,0,0)* Rot3(u_time*0.2,vec3(1,-1.2,1.)),0.3), .8);
    d = smoothMin(d, sdSphere(p +vec3(0,0,0.8)* Rot3(u_time*1.5,vec3(0,-1.2,-1.)),0.3), .8);
    d = -smoothMin(-d, sdSphere(p +vec3(sin(u_time*0.2)),0.4), 0.8);
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
    return col;
}

float rayMarch(vec3 ro,vec3 rd,float side){
    float d=0.;
    for(int i=0;i<MAX_STEPS;i++){
        vec3 p = ro + rd*d;
        float dS=sceneSDF(p)*side;
        d+=dS;
        if(d>MAX_DIST || abs(dS) < SURF_DIST)break;
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
    vec3 color = vec3(0.0);
    
    for(int m=0; m<AA; m++) {
        for(int n=0; n<AA; n++) {
            vec2 o = vec2(float(m),float(n)) / float(AA) - 0.5;
            vec2 uv = ((gl_FragCoord.xy+o)-.5*u_resolution.xy)/u_resolution.y;
            vec2 mouse = ((u_mouse.xy-u_resolution.xy)/u_resolution.y)*2.-1.;
            vec3 ray_origin=vec3(0.,0.,-6.);
            vec3 ray_direction=normalize(vec3(uv,1.));
            float t = u_time*.3;

            ray_origin *= Rot3(mouse.x*PI*2.+t,vec3(0.,1.,0.));
            ray_direction *= Rot3(mouse.x*PI*2.+t,vec3(0.,1.,0.));

            ray_origin *= Rot3(mouse.y*PI*2.+t,vec3(1.,0.,0.)); 
            ray_direction *= Rot3(mouse.y*PI*2.+t,vec3(1.,0.,0.));
    
            color += renderScene(ray_origin,ray_direction);
        }
    }
    color /= float(AA*AA);

    gl_FragColor = vec4(color,1.);
}`
    }, refract4: {
        name: "屈折4",
        fragmentShader: `precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
const float PI=3.14159265359;

#define MAX_STEPS 64
#define MAX_DIST 10.
#define SURF_DIST .01

#define ANTIALIASING

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

    col = pow(col, vec3(0.3545));

    return col;
}

void main(){
    vec2 uv = (gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
    vec2 mouse = ((u_mouse.xy-u_resolution.xy)/u_resolution.y)*2.-1.;
    vec3 ray_origin=vec3(0.,0.,-6.);
    vec3 ray_direction=normalize(vec3(uv,1.));
    float t = u_time*.3;
    ray_origin = rotate(ray_origin,mouse.x*PI*2.+t,vec3(0.,1.,0.));
    ray_direction = rotate(ray_direction,mouse.x*PI*2.+t,vec3(0.,1.,0.));

    ray_origin = rotate(ray_origin,mouse.y*PI*2.+t,vec3(0.,0.,1.));
    ray_direction = rotate(ray_direction,mouse.y*PI*2.+t,vec3(0.,0.,1.));
    
    vec3 color = renderScene(ray_origin,ray_direction);
    
    gl_FragColor = vec4(color,1.);
}`
    }, refract5: {
        name: "屈折5",
        fragmentShader: `precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
const float PI=3.14159265359;

#define MAX_STEPS 60
#define MAX_DIST 10.
#define SURF_DIST .01

#define saturate(x) clamp(x,0.,1.)
const vec4 colorLift = vec4(0.01, -0.03, 0.05, -0.02);
const vec4 colorGamma = vec4(0.0, 0.0, -0.02, 0.0);
const vec4 colorGain = vec4(0.86, 1.14, 0.87, 1.06);

 const vec3 LUMA = vec3( 0.2126, 0.7152, 0.0722 );
 
vec3 liftGammaGain( vec3 rgb ) {
   vec4 liftt = 1.0 - pow( 1.0 - colorLift, log2( colorGain + 1.0 ) );
 
   vec4 gammat = colorGamma.rgba - vec4( 0.0, 0.0, 0.0, dot( LUMA, colorGamma.rgb ) );
   vec4 gammatTemp = 1.0 + 4.0 * abs( gammat );
   gammat = mix( gammatTemp, 1.0 / gammatTemp, step( 0.0, gammat ) );
 
   vec3 col = rgb;
   float luma = dot( LUMA, col );
 
   col = pow( col, gammat.rgb );
   col *= pow( colorGain.rgb, gammat.rgb );
   col = max( mix( 2.0 * liftt.rgb, vec3( 1.0 ), col ), 0.0 );
 
   luma = pow( luma, gammat.a );
   luma *= pow( colorGain.a, gammat.a );
   luma = max( mix( 2.0 * liftt.a, 1.0, luma ), 0.0 );
 
   col += luma - dot( LUMA, col );
 
   return saturate( col );
 }


mat3 Rot3(float a,vec3 v){
    float s=sin(a), c=cos(a);
    return mat3(
        c+v.x*v.x*(1.-c),v.x*v.y*(1.-c)-v.z*s,v.x*v.z*(1.-c)+v.y*s,
        v.y*v.x*(1.-c)+v.z*s,c+v.y*v.y*(1.-c),v.y*v.z*(1.-c)-v.x*s,
        v.z*v.x*(1.-c)-v.y*s,v.z*v.y*(1.-c)+v.x*s,c+v.z*v.z*(1.-c)
    );
}

vec2 random2(vec2 p) {
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

mat3 orthBas( vec3 z ) {
    z = normalize( z );
    vec3 up = abs( z.y ) > 0.999 ? vec3( 0, 0, 1 ) : vec3( 0, 1, 0 );
    vec3 x = normalize( cross( up, z ) );
    return mat3( x, cross( z, x ), z );
}

vec3 cyclicNoise( vec3 p ) {
    mat3 b = orthBas( vec3( 3.0, -1.2, 5.4 ) );
    float warp = 1.2;
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

vec2 hash2(vec2 p )
{
	return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

vec3 voronoi(vec2 x )
{
    vec2 ip = floor(x);
    vec2 fp = fract(x);

    //----------------------------------
    // first pass: regular voronoi
    //----------------------------------
	vec2 mg, mr;

    float md = 8.0;
    for( int j=-1; j<=1; j++ )
    for( int i=-1; i<=1; i++ )
    {
        vec2 g = vec2(float(i),float(j));
		vec2 o = hash2( ip + g );
        o = 0.5 + 0.5*sin( u_time + 6.2831*o );
        vec2 r = g + o - fp;
        float d = dot(r,r);

        if( d<md )
        {
            md = d;
            mr = r;
            mg = g;
        }
    }

    //----------------------------------
    // second pass: distance to borders
    //----------------------------------
    md = 8.0;
    for( int j=-1; j<=1; j++ )
    for( int i=-1; i<=1; i++ )
    {
        vec2 g = mg + vec2(float(i),float(j));
		vec2 o = hash2( ip + g );
        o = 0.5 + 0.5*sin( u_time + 6.2831*o );
        vec2 r = g + o - fp;

        if( dot(mr-r,mr-r)>0.0001 )
        md = min( md, dot( 0.5*(mr+r), normalize(r-mr) ) );
    }

    return vec3( md, mr );
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
    float d1 = sdSphere(p, 1.5);
    p.y += voronoi(p.xz).x * 0.5;
    float d = sdSphere(p, 2.5);
    
    d = -smoothMin(d, -sdBox(p-vec3(0,-3,0), vec3(5,2,5)), 0.4);
    d = min(d, d1);
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
    float d = res.x;

    float IOR = 1.4; // index of refraction
    float abb = 0.2;

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

    //
    col = liftGammaGain(col)*0.1 + col;
    col = pow(col, vec3(0.454));
    return col;
}

void main(){
    vec2 uv = (gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
    vec2 mouse = ((u_mouse.xy-u_resolution.xy)/u_resolution.y)*2.-1.;
    vec3 ray_origin=vec3(0.,1.,-6.);
    vec3 ray_direction=normalize(vec3(uv,1.));
    float t = u_time*.3;
    ray_direction *= Rot3(0.2,vec3(1.,0.,0.));

    ray_origin *= Rot3(mouse.x*PI*2.+t,vec3(0.,1.,0.));
    ray_direction *= Rot3(mouse.x*PI*2.+t,vec3(0.,1.,0.));
    
    vec3 color = renderScene(ray_origin,ray_direction);
    
    gl_FragColor = vec4(color,1.);
}`
    }, flactal1: {
        name: "フラクタル1",
        fragmentShader: `precision mediump float;
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

float sceneSDF(vec3 p){
    return map(p);
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


vec3 renderScene(vec3 ro,vec3 rd){
    vec3 col = vec3(0);
    float d = rayMarch(ro, rd, 1.0);

    if(d<MAX_DIST){
        vec3 p = ro + rd*d;
        vec3 n = sceneNormal(p);
        float rim = pow(max(0.,dot(n,rd)),2.);
        col += vec3(0.0, 0.6824, 1.0)*rim;
        col += pow(dot(-n,rd),2.0)*vec3(1.0, 1.0, 1.0)*0.1;
        col *= pow(1.0 - 0.1*clamp(d*0.1,0.0,1.0),2.0);
    }

    col = pow(col,vec3(.455));
    

    return col;
}

void main(){
    vec2 uv = (gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;
    vec2 mouse = ((u_mouse.xy-u_resolution.xy)/u_resolution.y)*2.-1.;
    
    vec3 ray_origin=vec3(0.,0.,-1.);
    vec3 ray_direction=normalize(vec3(uv,1.));

    float t = u_time*.1;

    //ray_origin *= Rot3(mouse.x*PI*2.+t,vec3(0.,1.,0.));
    //ray_direction *= Rot3(mouse.x*PI*2.+t,vec3(0.,1.,0.));
    ray_origin *= Rot3(mouse.y*PI*2.+t,vec3(0.,0.,1.));
    ray_direction *= Rot3(mouse.y*PI*2.+t,vec3(0.,0.,1.));
    
    vec3 color = renderScene(ray_origin,ray_direction);
    
    gl_FragColor = vec4(color,1.);
}`
    }, flactal2: {
        name: "フラクタル2",
        fragmentShader: `precision mediump float;
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
    pos2d = fract(pos2d-u_time) - 0.5;

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
}`
    }

};

export default demos