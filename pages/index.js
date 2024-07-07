import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Head from 'next/head';
import demos from "@/lib/demos/demos";
import { Separator } from '@/components/ui/separator';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, } from "@/components/ui/pagination"
import { Menu, X } from 'lucide-react';

import Image from 'next/image'
import dynamic from 'next/dynamic'

import sketches from "@/lib/sketches";
import CodeDisplay from "@/lib/code"
import sampleFuncs from '@/lib/demos/samplefunc';

import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

import { basePath } from "../next.config"
const BASE_PATH = basePath ? basePath : ""

const ReactP5Wrapper = dynamic(
	() => import("react-p5-wrapper").then((mod) => mod.ReactP5Wrapper),
	{
		ssr: false,
	}
)

// 新しいヘッダーコンポーネント
const Header = () => (
	<header className="bg-blue-900 text-white p-4">
		<div className="container mx-auto flex justify-between items-center">
			<h1 className="text-2xl font-bold">RayMarchingDemo</h1>
			<nav>
				<ul className="flex space-x-4">
					<li><a href="#" className="hover:text-gray-300">ホーム</a></li>
					<li><a href="#" className="hover:text-gray-300">デモ一覧</a></li>
					<li><a href="#" className="hover:text-gray-300">説明</a></li>
				</ul>
			</nav>
		</div>
	</header>
);

const HamburgerMenu = () => {
	const [isOpen, setIsOpen] = useState(false);

	const toggleMenu = () => {
		setIsOpen(!isOpen);
	};

	return (
		<>
			{/* Hamburger Icon */}
			<button
				onClick={toggleMenu}
				className="fixed top-4 right-4 z-50 p-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
				aria-label="Toggle menu"
			>
				{isOpen ? <X size={24} /> : <Menu size={24} />}
			</button>

			{/* Sidebar Menu */}
			<div
				className={`fixed top-0 right-0 h-full w-64 bg-gray-800 text-white p-5 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
					} z-40`}
			>
				<nav className="mt-10">
					<ul className="space-y-4">
						<li>
							<a href="#" className="block hover:text-gray-300">Home</a>
						</li>
						<li>
							<a href="#" className="block hover:text-gray-300">About</a>
						</li>
						<li>
							<a href="#" className="block hover:text-gray-300">Services</a>
						</li>
						<li>
							<a href="#" className="block hover:text-gray-300">Contact</a>
						</li>
					</ul>
				</nav>
			</div>

			{/* Overlay */}
			{isOpen && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 z-30"
					onClick={toggleMenu}
				></div>
			)}
		</>
	);
};

const createShader = (gl, type, source) => {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}
	return shader;
};

const vertexShader = `
  attribute vec4 position;
  void main() {
    gl_Position = position;
  }
`;

const RaymarchingDemo = ({ fragmentShader }) => {
	const canvasRef = useRef(null);
	const glRef = useRef(null);
	const programRef = useRef(null);
	const animationIdRef = useRef(null);
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
	const [isPlaying, setIsPlaying] = useState(true);
	const [isVisible, setIsVisible] = useState(true);

	const setupShader = useCallback((gl) => {
		const program = gl.createProgram();
		const vShader = createShader(gl, gl.VERTEX_SHADER, vertexShader);
		const fShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShader);

		gl.attachShader(program, vShader);
		gl.attachShader(program, fShader);
		gl.linkProgram(program);

		programRef.current = program;

		const positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

		const positionLocation = gl.getAttribLocation(program, 'position');
		gl.enableVertexAttribArray(positionLocation);
		gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

		gl.useProgram(program);

		return { positionBuffer, vShader, fShader };
	}, [fragmentShader]);

	useEffect(() => {
		const canvas = canvasRef.current;
		const gl = canvas.getContext('webgl');
		if (!gl) {
			console.error('WebGL not supported');
			return;
		}
		glRef.current = gl;

		const { positionBuffer, vShader, fShader } = setupShader(gl);

		const resolutionLocation = gl.getUniformLocation(programRef.current, 'u_resolution');
		const timeLocation = gl.getUniformLocation(programRef.current, 'u_time');
		const mouseLocation = gl.getUniformLocation(programRef.current, 'u_mouse');

		const handleMouseMove = (event) => {
			const rect = canvas.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;
			setMousePosition({ x, y: rect.height - y });
		};

		canvas.addEventListener('mousemove', handleMouseMove);

		let startTime = performance.now();
		let lastTime = startTime;

		const render = (time) => {
			if (!isPlaying || !isVisible) {
				lastTime = time;
				return;
			}

			const elapsedTime = time - startTime;
			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
			gl.uniform1f(timeLocation, time * 0.001);
			gl.uniform2f(mouseLocation, mousePosition.x, mousePosition.y);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			animationIdRef.current = requestAnimationFrame(render);
		};

		animationIdRef.current = requestAnimationFrame(render);

		// Intersection Observer setup
		const observer = new IntersectionObserver(
			([entry]) => {
				setIsVisible(entry.isIntersecting);
			},
			{ threshold: 0.2 } // Trigger when at least 10% of the element is visible
		);

		observer.observe(canvas);

		return () => {
			cancelAnimationFrame(animationIdRef.current);
			gl.deleteProgram(programRef.current);
			gl.deleteShader(vShader);
			gl.deleteShader(fShader);
			gl.deleteBuffer(positionBuffer);
			canvas.removeEventListener('mousemove', handleMouseMove);
			observer.disconnect();
		};
	}, [fragmentShader, isPlaying, isVisible, mousePosition, setupShader]);

	const handleCanvasClick = () => {
		setIsPlaying(!isPlaying);
	};

	return (
		<canvas
			ref={canvasRef}
			width={600}
			height={600}
			onClick={handleCanvasClick}
			style={{ cursor: 'pointer' }}
		></canvas>
	);
};

const NullCanvas = () => {
	return <canvas width={600} height={600}></canvas>;
}

const RaymarchingExplanation = ({ description }) => (
	<div className="space-y-4">
		{description}
	</div>
);


const PanelItem = ({ title, subtitle, inv = false, demo, image, sketch, children, ELM, height }) => {
	let img = <>
		<div style={{ position: 'relative', width: '600px', height: '600px' }}>
			<Image
				src={image}
				layout="fill"
				objectFit="contain"
			/>
		</div>
	</>
	let elm = ELM ? ELM :((sketch) ?<ReactP5Wrapper sketch={sketch} /> : ((image) ? img : ((demo == null) ? <NullCanvas /> : <RaymarchingDemo fragmentShader={demo.fragmentShader} />)));
	if (inv) {
		return (<><div className="p-1">
			<Card>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
					<CardDescription>{subtitle}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col md:flex-row p-4 gap-8">
						{elm}
						<div className="flex-1">
							{children}
						</div>
					</div>
				</CardContent>
			</Card>
		</div></>);

	}
	return (<><div className="p-1">
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{subtitle}</CardDescription>
			</CardHeader>
			<CardContent>

				<div className="flex flex-col md:flex-row p-4 gap-4">
					<div className="flex-1">
						{children}
					</div>
					{elm}
				</div>
			</CardContent>
		</Card>
	</div></>);
}

const Sketch = dynamic(import('react-p5'), {
	loading: () => <></>,
	ssr: false
})

const MathWrap = ({ children }) => {
	const largeBlockStyle = {
		fontSize: '1.8em',
	};

	return (
		<div className="math">
			<div style={largeBlockStyle}>
				<BlockMath math={children} />
			</div>
		</div>
	);
};

const RaymarchingPage = () => {
	const [currentDemo, setCurrentDemo] = useState(Object.keys(demos)[0]);

	return (
		<>
			<Head>
				<title>RayMarchingDemo</title>
			</Head>

			<Header />
			<HamburgerMenu />
			<div className="container mx-auto p-4">
				<PanelItem title={"#1"} subtitle={""} demo={demos["complex_cube"]}>
					<h1 className="text-6xl font-bold mb-2">RayMarching</h1>
					<Separator className="my-4" />
					<h2 className="text-1xl font-bold mb-2">RayMarching(レイマーチング)</h2>
					<p>レイマーチングとは光線をシミュレーションして描画するアルゴリズムの一つです。</p>
					<br />
					<p>レイマーチングを用いると右のような作品が、手軽に作成できます。</p>
					<p>この映像はモデルなどは使用しておらず、100行程度のGLSLというプログラムで描画されています。</p>
					<br />
					<br />
					<br />
					<br />
					<br />
					<br />
					<br />
					<br />
					<br />
					<br />
					<br />
					<p className="text-2xl" style={{ color: 'red' }}>※GPUを使用しているため、使用機種によっては重い可能性があります。</p>
					<p className="text-2xl" style={{ color: 'red' }}>※その場合は映像をクリックして停止することを推奨します。</p>
				</PanelItem>
				<PanelItem title={"#2"} subtitle={""} demo={demos["refract1"]}>
					<h1 className="text-4xl font-bold mb-2">解説の目的</h1>
					<Separator className="my-4" />
					<p>この記事では、レイマーチングについて興味を持たせることを目的としています。</p>
					<p>具体的にこのような作品を作るためには、プログラミングの知識、高度な数学の感覚が必要になります。</p>
					<p>技能の会得には非常に難易度が高いため、作品を作るためには能動的に勉強することが推奨されます。</p>
					<br />
					<p>そのような事から、このような物がある事を知ってもらう事を目的とします。</p>
					<p>ただ単にプログラミングで、美しい映像を作成できると理解できれば良いです。</p>
					<br />
				</PanelItem>
				<PanelItem title={"#3"} subtitle={""} demo={demos["box"]} inv={true}>
					<h1 className="text-4xl font-bold mb-2">解説の流れ</h1>
					<Separator className="my-4" />
					<li className="text-4xl mb-1">1.感覚的理解</li>
					<li className="text-4xl mb-1">2.距離関数</li>
					<li className="text-4xl mb-1">3.実際に書いてみる</li>
					<li className="text-4xl mb-1">4.様々な例</li>
				</PanelItem>
				<PanelItem title={"§1"} subtitle={"感覚的理解"} sketch={sketches.sketch_1} >
					<h1 className="text-4xl font-bold mb-2">レイマーチングの感覚的理解</h1>
					<Separator className="my-4" />
					<p>右はレイマーチング(Sphere Tracing)を2次元に落とし込み、視覚的に解りやすくした図です。</p>
					<br />
					<p>レイマーチングは光線シミュレーションする方法のことです</p>
					<p>現在の位置から、「一番近い物体のへの距離」だけレイを前方に進めることを繰り返し、</p>
					<p>光線が物体に当たるまでのシミュレーションを行います。</p>
					<p>これがレイマーチングの肝です。</p>
					<br />
					<br />
					<p>この手法は</p>
					<p class="text-2xl" style={{ color: 'red' }}>「ある点から一番近い物体までの距離を計算できる」</p>
					<p>という事を満たしていれば、どんな複雑な物体でも応用ができます。</p>
					<br />
					<p>特に純粋にこの手法に従ったものを「Sphere Tracing」と呼びます。</p>
					<p>この手法を改変して、正しく距離が計算できない場面でも問題なく描画できるように、工夫がなされる事があります。</p>
					<br />
					<br />
				</PanelItem>
				<PanelItem title={"§1-1"} subtitle={"感覚的理解"} image={`${BASE_PATH}/assets/slide_11.gif`} height={877}>
					<h1 className="text-4xl font-bold mb-2">レイマーチングの感覚的理解#1</h1>
					<Separator className="my-4" />
					<p>先ほどのレイマーチング(Sphere Tracing)の図を3次元に拡張した図です。</p>
					<p>カメラからスクリーンの点に向かって光線を発射し、当たった場所の色を得ることで</p>
					<p>物体を描画することができます。</p>
					<br />
					<br />
					<br />
					<br />
					<br />
					<br />
					<br />
					<br />
					<br />
					<br />
					<br />
					<br />
					<br />
					<br />
					<br />
					<Separator className="my-4" />
					<a style={{ color: "#299" }} href='https://reindernijhoff.net/2017/07/raymarching-distance-fields/'>図引用:https://reindernijhoff.net/2017/07/raymarching-distance-fields/</a>
				</PanelItem>
				<PanelItem title={"§1-2"} subtitle={"感覚的理解"} image={`${BASE_PATH}/assets/pix.png`} height={877}>
					<h1 className="text-4xl font-bold mb-2">レイマーチングの感覚的理解#2</h1>
					<Separator className="my-4" />
					<p>先ほどの説明で、ある程度軽量に光をシミュレーションする方法が分かりました。</p>
					<p>あとは画面上の全てのピクセルに対して、GPUを用い並列してそれぞれのピクセルの色を計算する事によって</p>
					<p>リアルタイムで描画をすることができます。</p>
					<br />
					<br />
					<br />
					<br />
					<br />
					<br />
					<br />
					<br />
					<br />
					<br />
					<br />
					<br />
					<br />
					<br />
					<Separator className="my-4" />
					<a style={{ color: "#299" }} href='https://qiita.com/edo_m18/items/034665d42c562da88cb6'>図引用:https://qiita.com/edo_m18/items/034665d42c562da88cb6/</a>
				</PanelItem>

				<PanelItem title={"§2"} subtitle={"距離関数"} sketch={sketches.sketch_2}>
					<h1 className="text-4xl font-bold mb-2">距離関数</h1>
					<Separator className="my-4" />
					<p>レイマーチング(Sphere Tracing)において最も重要な事は、物体への距離を計算する事です。</p>
					<br />
					<p>ある点から、描画したい物体への距離を計算する関数を作成する事によって、物体の形状を定義します。</p>
					<p>その計算をする関数を</p>
					<p class="text-2xl" style={{ color: 'red' }}>「距離関数」</p>
					<p>と呼びます。</p>
					<br />
					<p>また、距離関数の中でも物体の内部と外部で正負が定義されるものを</p>
					<p class="text-2xl" style={{ color: 'red' }}>「符号付距離関数(SDF)」</p>
					<p>と呼びます。</p>
					<p>SDFは「Sigind Distance Function」の略です。</p>
					<br />
					<br />
					<p>このような関数を考える事で、容易に物体までの距離を計算することができます。</p>
					<br />
					<br />
					<p>右の図は四角形の距離関数を2次元に落とし込んで視覚化したものです。</p>
					<p>このように、距離を用いて物体の形状を定義します。</p>
					<p>このように物体の形状を定義するとレイマーチングにとって非常に都合が良いのです。</p>
				</PanelItem>
				<PanelItem title={"§2-1"} subtitle={"距離関数"} demo={demos["sdf"]}>
					<h1 className="text-4xl font-bold mb-2">距離関数#1</h1>
					<Separator className="my-4" />
					<p>右の図は、距離関数合成を表した図です。</p>
					<p>距離が同じ場所は同じ濃さで描画されます。</p>
					<p>2つの距離関数の最小、最大をとることで、物体の和集合、積集合をとることができます。</p>
					<CodeDisplay language={"glsl"} code={sampleFuncs.sdf1}/>
				</PanelItem>

				<PanelItem title={"§3"} subtitle={"実際に書いてみる"} ELM={<CodeDisplay language={"glsl"} code={demos["complex_cube"].fragmentShader} width='600px'height={`568px`} maxHeight='100%'/>} inv>
					<h1 className="text-4xl font-bold mb-2">実際に書いてみる</h1>
					<Separator className="my-4" />
					<p>以上の説明で、最低限の知識は揃いました。</p>
					<p>ここからは実際にレイマーチングのコードを書いてみます。</p>
					<p>シェーダー言語のGLSLのコードを作成していきます。</p>
				</PanelItem>
				<PanelItem title={"§3"} subtitle={"実際に書いてみる"} demo={demos["test1"]}>
					<h1 className="text-4xl font-bold mb-2">実際に書いてみる</h1>
					<Separator className="my-4" />
					<h2 className="text-4xl font-bold mb-2">ステップ</h2>
					<li className="text-4xl mb-1">1.距離関数の定義</li>
					<li className="text-4xl mb-1">2.レイマーチングで光をシミュレーション</li>
					<li className="text-4xl mb-1">3.ロジックの組み立て</li>
					<li className="text-4xl mb-1">4.完成</li>
				</PanelItem>

				<PanelItem title={"§3-1"} subtitle={"実際に書いてみる"} ELM={<CodeDisplay language={"glsl"} code={sampleFuncs["sdf2"]} width='600px' height={`568px`} maxHeight='100%' overflow="hidden" />}>
					<h1 className="text-4xl font-bold mb-2">距離関数の定義</h1>
					<Separator className="my-4" />
					<p>まずは距離関数を定義します。</p>
					<p>ここでは3次元ユークリッド距離空間における球体の距離関数を考えます。</p>
					<br />
					<p>「ある点pから、原点にある半径Rの球体への距離d」は以下のようにあらわせます。</p>
					<MathWrap>
						{`d = \\sqrt{p.x^2+p.y^2+p.z^2} - R`}
					</MathWrap>
					<p>GLSLの関数にはベクトルの長さを計算する物があるので、それを使うと</p>
					<MathWrap>
						{`d = length(p) - R`}
					</MathWrap>
					<p>と書けます。</p>
					<br />
					<p>これで球体の距離関数が定義できました。</p>
				</PanelItem>

				<PanelItem title={"§3-2"} subtitle={"実際に書いてみる"} ELM={<CodeDisplay language={"glsl"} code={sampleFuncs["rayMarch1"]} width='600px' height={`568px`} maxHeight='100%' overflow ="hidden"/>}>
					<h1 className="text-4xl font-bold mb-2">レイマーチングで光(レイ)をシミュレーション</h1>
					<Separator className="my-4" />
					<p>次にレイマーチングで光をシミュレーションします。</p>
					<br />
					<p>シミュレーションは以下のループで実現します。</p>
					<br />
					<h2 className="text-2xl font-bold mb-2">ループ</h2>
					<p>~1 : 現在のレイの場所を計算</p>
					<p>~2 : 距離関数で物体までの距離を計算</p>
					<p>~3 : 計算した距離だけレイを進める</p>
					<p>~4 : 物体に当たったら終了</p>
					<p>~5 : 1に戻る</p>
					<br />
					<p>このようなループを作成することで、光が物体に当たるまでどれだけ進めるかを</p>
					<p>シミュレーションすることができます。</p>
				</PanelItem>

				<PanelItem title={"§3-3"} subtitle={"実際に書いてみる"} ELM={<CodeDisplay language={"glsl"} code={sampleFuncs["logic1"]} width='600px' height={`568px`} maxHeight='100%' overflow="hidden" />}>
					<h1 className="text-4xl font-bold mb-2">ロジックの組み立て</h1>
					<Separator className="my-4" />
					<p>次に、このループをGLSLで実装します。</p>
					<p>以下のように書くことで、描画処理を実装することができます。</p>
					<br />
					<p>これで最低限の実装ができました</p>
				</PanelItem>

				<PanelItem title={"§3-3"} subtitle={"実際に書いてみる"} demo={demos["result1"]} inv>
					<h1 className="text-4xl font-bold mb-2">結果</h1>
					<Separator className="my-4" />
					<p>これが最低限の結果です</p>
					<br />
					<p>ただの円に見えますが、内部では実際に光をシミュレーションしています</p>
					<p>物体に当たったら白、当たらなかったら黒としているので</p>
					<p>このようにのっぺりした円が描画されます。</p>
					<br />
					<p>立体的にするには、色の計算を工夫する必要があります。</p>
				</PanelItem>

				<PanelItem title={"§3-3"} subtitle={"実際に書いてみる"} demo={demos["result2"]} inv>
					<h1 className="text-4xl font-bold mb-2">結果</h1>
					<Separator className="my-4" />
					<p>色の計算を工夫したものです。</p>
					<br />
					<p>物体の法線に基づき色を決めると、このような結果を得ることができます。</p>
				</PanelItem>

				<PanelItem title={"§4"} subtitle={"様々な例"} demo={demos["refract3"]}>
					<h1 className="text-4xl font-bold mb-2">様々な例</h1>
					<Separator className="my-4" />
					<p>ここまでで、基本的な解説は終了します</p>
					<br />
					<p>ここからは様々な例を紹介します</p>
					<p></p>
				</PanelItem>

				<PanelItem title={"§4-1"} subtitle={"様々な例"} demo={demos["refract4"]}>
					<h1 className="text-4xl font-bold mb-2">屈折 & 空間の歪み</h1>
					<Separator className="my-4" />
					<br />
					<br />
					<p>このサンプルでは、屈折&滑らかな歪みを利用して作成しています。</p>
					<br />
					<br />
					<h2 className="text-2xl font-bold mb-2">屈折</h2>
					<p>屈折の表現をするために、物体の内部にレイが通るようにレイマーチングを工夫しています。</p>
					<p>符号付距離関数に-1を掛けると物体の内部と外部が入れ替わり</p>
					<p>内部にレイが通るようになります。</p>
					<br />
					<h2 className="text-2xl font-bold mb-2">空間の歪み</h2>
					<p>渦のような表現は座標空間をゆがませることで実現しています</p>
					<p>座標空間に軸に依存する量で回転行列を掛ける事で</p>
					<p>このような表現が可能になります。</p>

				</PanelItem>

				<PanelItem title={"§4-2"} subtitle={"様々な例"} demo={demos["refract5"]}>
					<h1 className="text-4xl font-bold mb-2">ボロノイ</h1>
					<Separator className="my-4" />
					<br />
					<br />
					<p>このサンプルでは、ボロノイを用いています。</p>
					<br />
					<br />
					<h2 className="text-2xl font-bold mb-2">空間の歪み2</h2>
					<p>地面に当たる部分は、ただの平面をゆがませて作成しています。</p>
					<p>平面の距離関数を適応する際に、y座標にボロノイを足すことで成り立っています。</p>
				</PanelItem>


			</div>
		</>
	);
};



export default RaymarchingPage;