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

const RaymarchingPage = () => {
	const [currentDemo, setCurrentDemo] = useState(Object.keys(demos)[0]);

	return (
		<>
			<Head>
				<title>RayMarchingDemo</title>
			</Head>

			<Header />

			<div className="container mx-auto p-4">
					<Carousel className="w-full">
						<CarouselContent>
							{Object.entries(demos).map(([key, demo]) => (
								<CarouselItem key={key}>
									<div className="p-1">
										<Card>
											<CardHeader>
												<CardTitle>レイマーチングとは</CardTitle>
												<CardDescription>GLSLを使用したレイマーチングの例</CardDescription>
											</CardHeader>
											<CardContent>
												<div className="flex flex-col md:flex-row p-4 gap-4">
													<RaymarchingDemo fragmentShader={demo.fragmentShader} />
													<div className="flex-1">
														<h1 className="text-4xl font-bold mb-2">{demo.name}</h1>
														<Separator className="my-4" />
														<RaymarchingExplanation description={demo.description} />
													</div>
												</div>
											</CardContent>
										</Card>
									</div>
								</CarouselItem>
							))}
						</CarouselContent>
						<CarouselPrevious />
						<CarouselNext />
					</Carousel>
			</div>
		</>
	);
};

export default RaymarchingPage;