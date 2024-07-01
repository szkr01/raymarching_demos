const sketches = {
    sketch_1: ((p5) => {
        let theta = 0;

        let circles = [
            [100, 100, 100],
            [500, 700, 300],
            [500, 700, 300],
            [400, 200, 50],
        ]

        function d_s(p, size) {
            return p5.sqrt(p[0] ** 2 + p[1] ** 2) - size;
        }

        function maps(p) {
            let t2 = 10000000;
            for (let t of circles) {
                let tp = [p[0] - t[0], p[1] - t[1]];
                t2 = p5.min(t2, d_s(tp, t[2]));
            }
            return t2;
        }

        p5.setup = () => {
            p5.createCanvas(600, 600);

        }

        p5.draw = () => {
            p5.background(0);
            theta += 0.002;
            p5.noFill()
            p5.stroke(255);
            let op = [p5.mouseX, p5.mouseY];
            let cp = [p5.mouseX, p5.mouseY];
            let ray = [p5.cos(theta), p5.sin(theta)];
            let d = 0;
            p5.textSize(20)
            p5.push()
            p5.translate(cp[0], cp[1]);
            p5.rotate(theta)
            drawCamera();
            p5.pop()
            for (let i = 0; i < 10; i++) {
                d = maps(cp);
                p5.push()
                p5.translate(cp[0], cp[1]);

                p5.stroke(255, 0, 0);
                p5.line(0, 0, d * ray[0], d * ray[1]);

                p5.push()
                p5.translate(d * ray[0], d * ray[1]);
                p5.rotate(theta)
                p5.line(0, 0, -10, -10)
                p5.line(0, 0, -10, 10)
                p5.pop()

                p5.stroke(0, 255, 255);

                p5.noFill()
                p5.circle(0, 0, 2 * d)
                p5.fill(255, 255, 255)
                p5.circle(d * ray[0], d * ray[1], 5)

                p5.stroke(255);
                p5.fill(255, 255, 255)
                p5.text(i, 10, -20)
                p5.pop()
                cp[0] += d * ray[0];
                cp[1] += d * ray[1];

            }

            for (let t of circles) {
                p5.push()
                p5.translate(t[0], t[1]);
                p5.circle(0, 0, 2 * t[2])
                p5.pop()
            }
        }

        function drawCamera() {
            p5.translate(-70, -20);
            p5.beginShape(p5.LINE_STRIP)
            p5.vertex(0, 0)
            p5.vertex(60, 0)
            p5.vertex(60, 40)
            p5.vertex(0, 40)
            p5.vertex(0, 0)
            p5.endShape()
            p5.beginShape(p5.LINE_STRIP)
            p5.vertex(60, 20)
            p5.vertex(70, 5)
            p5.vertex(70, 35)
            p5.vertex(60, 20)
            p5.endShape()
        }

        p5.mouseWheel = (e) => {
            theta += e.delta / 3000;
        }
    }),
    sketch_2: ((p5) => {
        
        function rectSdf(p, s) {
            let dx = p5.abs(p[0]) - s[0];
            let dy = p5.abs(p[1]) - s[1];
            let d = 0;
            if (dx > 0 && dy > 0) {
                d = p5.sqrt(dx*dx + dy*dy);
            } else if (dx > 0) {
                d = dx;
            } else if (dy > 0) {
                d = dy;
            }

            d += p5.min(p5.max(dx, dy), 0.0)
            return d;
        }

        function sdf(p) {
            return rectSdf(p, [100, 100]);
        }

        function renderSdf() {
            p5.push()
            p5.translate(p5.width*0.5, p5.height*0.5);
            p5.rect(-100,-100,200,200);
            p5.pop();
        }

        p5.setup = () => {
            p5.createCanvas(600, 600);
            p5.background(0, 0, 0);
        }

        p5.draw = () => {
            p5.background(0,0,0);
            p5.noFill()
            p5.stroke(255);
            renderMouse();
            renderSdf()
        }

        function renderMouse() {
            let x = p5.mouseX;
            let y = p5.mouseY;
            let d = sdf([x-p5.width*0.5, y-p5.height*0.5]);
            p5.push()
            p5.translate(x, y);
            //p5.circle(0, 0, 10);
            p5.push();
            d > 0? p5.stroke(255, 255/2, 0): p5.stroke(0, 255/2,255);
            p5.circle(0, 0, d * 2);
            p5.pop();
            p5.fill(255, 255, 255);
            p5.textSize(20);
            p5.text("dist to rect: " + d.toFixed(2), 0, -20);
            
            p5.pop();
        }
    }),
    sketch_3: ((p5) => {
        function SphereSDF(p, r) {
            return p5.sqrt(p[0] * p[0] + p[1] * p[1]) - r;
        }

        function rectSdf(p, s) {
            let dx = p5.abs(p[0]) - s[0];
            let dy = p5.abs(p[1]) - s[1];
            let d = 0;
            if (dx > 0 && dy > 0) {
                d = p5.sqrt(dx * dx + dy * dy);
            } else if (dx > 0) {
                d = dx;
            } else if (dy > 0) {
                d = dy;
            }
            d += p5.min(p5.max(dx, dy), 0.0)
            return d;
        }

        function sdf(p) {
            let d = rectSdf(p, [150, 150]);
            d = p5.max(d, -SphereSDF([p[0] - 50, p[1]], 100));
            return d;
        }

        function plotSdf() {
            let rx = p5.random() * p5.width;
            let ry = p5.random() * p5.height;
            let d = sdf([rx-p5.width*0.5, ry-p5.height*0.5]);
            let t = (p5.sin(d*0.8) + 1) / 2;
            t = t ** 2;
            if (d > 0) {
                p5.stroke(255 * t, 255 / 2 * t, 0);
            } else {
                p5.stroke(0, 255 / 2 * t, 255 * t);
            }
            p5.circle(rx, ry,2);
        }

        p5.setup = () => {
            p5.createCanvas(600, 600);
            p5.background(0, 0, 0);
            
        }

        p5.draw = () => {
            p5.noFill()
            for (let i = 0; i < 10; i++) {
                plotSdf();
            }
        }
    })
}

export default sketches