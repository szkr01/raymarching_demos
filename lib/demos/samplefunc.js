const sampleFuncs = {
    sdf1:`//円の距離関数
float sdCircle(vec2 p,float r){
    return length(p)-r;
}

//円の距離関数を合成
float SDF(vec2 p){
    //半径1の円
    float Circle1 = sdCircle(p,1.);

    float R = (sin(u_time*0.1)+1.)*0.2;//半径の変化
    vec2 p2 = p - vec2(cos(time*0.2),sin(time*0.3));//座標系を移動

    float Circle2 = sdCircle(p2,R);//半径Rの円

    //合成、最小値をとることで和集合となる
    float result = min(Circle1,Circle2);
    return result;
}`
    
    , sdf2:`

//円の距離関数
float sdCircle(vec2 p,float r){
    return length(p)-r;
}






















`
    
    , rayMarch1:`
    
//レイマーチングをする関数
//ro:レイの原点
//rd:レイの方向
//ある点から、ある方向に光線(レイ)を発射して、物体に当たるまで進んだ距離を返す。
float rayMarch(vec3 rayOrigin,vec3 rayDirection){
    float totalDist = 0.;

    for(int i=0;i<MAX_STEPS;i++){
        //現在のレイの座標
        vec3 currentRayPos = rayOrigin + rayDirection*d;

        //現在の座標から物体までの距離
        float distToObject = SDF(currentRayPos);
        
        totalDist += distToObject;//レイを進める

        //物体に当たったら終了、または、最大距離を超えたら終了
        if(distToObject > MAX_DIST || abs(distToObject) < SURF_DIST)break;
    }

    return totalDist;
}
    

















`, logic1:`vec3 renderScene(vec3 ro,vec3 rd){
    float d = rayMarch(ro,rd);
    vec3 col;
    //距離が一定以下なら白、そうでなければ黒
    if(d<MAX_DIST){
        col = vec3(1);
    }else{
        col = vec3(0);
    }
    return col;
}

void main(){
    //GLSLにおいて、gl_FragCoordは画面のピクセルの座標を表す
    vec2 uv = (gl_FragCoord.xy-.5*u_resolution.xy)/u_resolution.y;

    //レイの原点と方向を設定
    vec3 ray_origin=vec3(0.,0.,-6.);
    vec3 ray_direction=normalize(vec3(uv,1.));
    
    //色を計算
    vec3 color = renderScene(ray_origin,ray_direction);
    
    //ピクセルに色を設定
    gl_FragColor = vec4(color,1.);
}
    



`

    
}

module.exports = sampleFuncs;