import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Head from 'next/head';
import demos from "@/lib/demos/demos";
import { Separator } from '@/components/ui/separator';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, } from "@/components/ui/pagination"
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel"

import Image from 'next/image' // 追記
import dynamic from 'next/dynamic'
import sketches from "@/lib/sketches";

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

	useEffect(() => {
		const canvas = canvasRef.current;
		const gl = canvas.getContext('webgl');
		if (!gl) {
			console.error('WebGL not supported');
			return;
		}
		glRef.current = gl;

		const setupShader = () => {
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
		};

		const { positionBuffer, vShader, fShader } = setupShader();

		const resolutionLocation = gl.getUniformLocation(programRef.current, 'u_resolution');
		const timeLocation = gl.getUniformLocation(programRef.current, 'u_time');
		const mouseLocation = gl.getUniformLocation(programRef.current, 'u_mouse');

		const handleMouseMove = (event) => {
			const rect = canvas.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;
			mousePosition.x = x;
			mousePosition.y = rect.height - y;
		};

		canvas.addEventListener('mousemove', handleMouseMove);

		let startTime = performance.now();
		let lastTime = startTime;

		const render = (time) => {
			if (!isPlaying) {
				lastTime = time;
				return;
			}

			const elapsedTime = time - startTime;
			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
			gl.uniform1f(timeLocation, elapsedTime * 0.001);
			gl.uniform2f(mouseLocation, mousePosition.x, mousePosition.y);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			animationIdRef.current = requestAnimationFrame(render);
		};

		animationIdRef.current = requestAnimationFrame(render);

		return () => {
			cancelAnimationFrame(animationIdRef.current);
			gl.deleteProgram(programRef.current);
			gl.deleteShader(vShader);
			gl.deleteShader(fShader);
			gl.deleteBuffer(positionBuffer);
			canvas.removeEventListener('mousemove', handleMouseMove);
		};
	}, [fragmentShader, isPlaying]);

	const handleCanvasClick = () => {
		setIsPlaying(!isPlaying);
	};

	return <canvas ref={canvasRef} width={600} height={600} onClick={handleCanvasClick} style={{ cursor: 'pointer' }}></canvas>;
};

const NullCanvas = () => {
	return <canvas width={600} height={600}></canvas>;
}

const RaymarchingExplanation = ({ description }) => (
	<div className="space-y-4">
		{description}
	</div>
);

const PaginationDemo = () => {
	return (
		<Pagination>
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious href="#" />
				</PaginationItem>
				{Object.entries(demos).map(([key, demo]) => (
					<PaginationItem>
						<PaginationPrevious href="#" />
					</PaginationItem>
				))}
			</PaginationContent>
		</Pagination>
	)
}

const PanelItem = ({ title, subtitle, inv = false, demo, image, sketch, children, height }) => {
	let img = <>
		<div style={{ position: 'relative', width: '600px', height: '600px' }}>
			<Image
				src={image}
				layout="fill"
				objectFit="contain"
			/>
		</div>
	</>
	if (inv) {
		return (<><div className="p-1">
			<Card>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
					<CardDescription>{subtitle}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col md:flex-row p-4 gap-8">
						{(sketch) ? <ReactP5Wrapper sketch={sketch} /> : ((image) ? img : ((demo == null) ? <NullCanvas /> : <RaymarchingDemo fragmentShader={demo.fragmentShader} />))}
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
					{(sketch) ? <ReactP5Wrapper sketch={sketch} /> : ((image) ? img : ((demo == null) ? <NullCanvas /> : <RaymarchingDemo fragmentShader={demo.fragmentShader} />))}
				</div>
			</CardContent>
		</Card>
	</div></>);
}

const Sketch = dynamic(import('react-p5'), {
	loading: () => <></>,
	ssr: false
})


const RaymarchingPage = () => {
	const [currentDemo, setCurrentDemo] = useState(Object.keys(demos)[0]);

	return (
		<>
			<Head>
				<title>RayMarchingDemo</title>
			</Head>

			<Header />

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
				</PanelItem>
				<PanelItem title={"#3"} subtitle={""} demo={demos["box"]} inv={true}>
					<h1 className="text-4xl font-bold mb-2">解説の流れ</h1>
					<Separator className="my-4" />
					<li className="text-4xl mb-1">1.感覚的理解</li>
					<li className="text-4xl mb-1">2.距離関数</li>
					<li className="text-4xl mb-1">3.様々な例</li>
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
					<p>特に純粋にこの手法に従ったものを"Sphere Tracing"と呼びます。</p>
					<p>この手法を改変して、正しく距離が計算できない場面でも問題なく描画できるように、工夫がなされる事があります。</p>
					<br />
					<br />
				</PanelItem>
				<PanelItem title={"§1-1"} subtitle={"感覚的理解"} image={"/assets/slide_11.gif"} height={877}>
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
				<PanelItem title={"§1-2"} subtitle={"感覚的理解"} image={"/assets/pix.png"} height={877}>
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
					<p>SDFは"Sigind Distance Function"の略です。</p>
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
				</PanelItem>
			</div>
		</>
	);
};

export default RaymarchingPage;