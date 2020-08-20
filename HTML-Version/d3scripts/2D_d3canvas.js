window.Vis = window.Vis || {};

Vis.init = function() {
    Vis.isRunning = false;

    Vis.setup.initConsts();
    Vis.setup.initVars();

    Arrow.init(); // init arrows

    Vis.setup.initDisplay();
    Vis.setup.initGraph();
    Vis.setup.initDispersionDrag();
    Vis.setup.initSlider();

    Vis.start();
};

Vis.start = function() {
    if (Vis._stoptime) {
        Vis._then += Date.now() - Vis._stoptime; // add stopped time
    }

    if (!Vis.isRunning) {
        Vis.core.frame();
        Vis.isRunning = true;
    }
};

Vis.stop = function() {
    window.cancelAnimationFrame(Vis.animationFrameLoop);
    Vis.isRunning = false;
    Vis._stoptime = Date.now(); // record when animation paused
};

Vis.core = {
    frame: function() {
        Vis.t = (Date.now() - Vis._then) / 250; // time since start in seconds

        Vis.core.update();
        Vis.core.animate();

        Vis.animationFrameLoop = window.requestAnimationFrame(Vis.core.frame);
    },

    update: function() {
        Vis.workers.calcParams();
        Vis.workers.calcPos();
        Vis.workers.calcPhase();
    },

    animate: function() {
        Vis.context.clearRect(0, 0, Vis.canvasx, Vis.canvasy);
        
        Vis.context.fillStyle = 'orange';
        for (let i=0; i < Vis.N; i++) {
            Vis.context.beginPath();
            Vis.context.arc(Vis.convertCanvasX(Vis.x[i]), Vis.convertCanvasY(Vis.y[i]), Vis.convertCanvasX(Vis.pointR), 0, 2*Math.PI);
            Vis.context.fill();
        }
        
        // pick the middle particle to track with a black dot 
        Vis.context.fillStyle = 'black';
        Vis.context.beginPath();
        Vis.context.arc(Vis.convertCanvasX(Vis.x[Math.round(Vis.N/2 - Vis.Ny/2)]), Vis.convertCanvasY(Vis.y[Math.round(Vis.N/2 - Vis.Ny/2)]), Vis.convertCanvasX(Vis.pointR*1.03), 0, 2*Math.PI);
        Vis.context.fill();

        // draw phase track
        Vis.context.strokeStyle = 'green';
        Vis.context.lineWidth = 3;
        for (let i=0; i < Vis.Nphase; i++) {
            Vis.context.beginPath();
            Vis.context.moveTo(Vis.convertCanvasX(Vis.phasex[2*i]), Vis.convertCanvasY(Vis.phasey[2*i]));
            Vis.context.lineTo(Vis.convertCanvasX(Vis.phasex[2*i+1]), Vis.convertCanvasY(Vis.phasey[2*i+1]));
            Vis.context.stroke();
        }
    },

    updateSliders: function() {
        Vis.dxRange.value = Vis.dx;
        Vis.dxDisplay.textContent = Number(Vis.dx).toFixed(2);

        Vis.dyRange.value = Vis.dy;
        Vis.dyDisplay.textContent = Number(Vis.dy).toFixed(2);

        Vis.uxRange.value = Vis.ux;
        Vis.uxDisplay.textContent = Number(Vis.ux).toFixed(2);

        Vis.uyRange.value = Vis.uy;
        Vis.uyDisplay.textContent = Number(Vis.uy).toFixed(2);

        Vis.core.updateDisplay();
    },

    updateDisplay: function() {
        let ukvec = [Vis.ux, Vis.uy, 0];
        let kx = Vis.dx*Math.PI/Vis.a;
        let ky = Vis.dy*Math.PI/Vis.a;
        let kvec = [kx, ky, 0];

        //Update the text for cross and dot products
        let dotproduct = Math.round(100*Math.abs(math.dot(kvec, ukvec)))/100;
        Vis.dotDisplay.textContent = dotproduct.toString();

        let crossproduct = Math.round(Math.abs(100*Math.pow((Math.pow(math.cross(kvec, ukvec)[0], 2) + Math.pow(math.cross(kvec, ukvec)[1], 2) + Math.pow(math.cross(kvec, ukvec)[2], 2)), 0.5)))/100;
        Vis.crossDisplay.textContent = crossproduct.toString();

        //Update dot on the dispersion graph
        var cx = Vis.dispersionGraphWidth*(Vis.dx+1)/2;
        var cy = Vis.dispersionGraphHeight*(1-Vis.dy)/2;
        Vis.dispersionDot.attr("cx", cx).attr("cy", cy);
    }
};

Vis.workers = {
    calcParams: function() {
        Vis.k = Math.sqrt(Vis.kx**2 + Vis.ky**2);
        Vis.kx = Vis.dx * Math.PI / Vis.a;
        Vis.ky = Vis.dy * Math.PI / Vis.a;

        Vis.w = 2 * Vis.dw * Math.sqrt(Math.sin(Vis.kx * Vis.a / 2)**2 + Math.sin(Vis.ky * Vis.a / 2)**2);

        Vis.lamb = 2*Math.PI/Vis.k; // update spacing of phase tracker 
    },

    calcPos: function() {
        for (let i=0; i < Vis.Nx; i++) {
            for (let j=0; j < Vis.Ny; j++) {
                let n = Vis.Ny * i + j;
                let offset = Math.cos(Vis.kx*Vis.a*i + Vis.ky*Vis.a*j - Vis.w*Vis.t);

                Vis.x[n] = i*Vis.a + Vis.ux * offset;
                Vis.y[n] = j*Vis.a + Vis.uy * offset;
            }
        }
    },

    calcPhase: function() {
        let v = Vis.w / Vis.k;
        let vx = v * Vis.kx / Vis.k;
        let vy = v * Vis.ky / Vis.k;

        let m = vy / vx;                // gradient of line
        let mi = vx / vy;               // inverse of gradient

        var spacing;
        var t_space;
        if (m >= -1 && m <= 1) {
            // do y processing
            spacing = Vis.lamb * Vis.ky / Vis.k; // distance between phases 
            if (vy == 0) {
                mi = 10000000;
                t_space = 20;
            } else {
                t_space = spacing / vy;
            }
        } else {
            // do x processing
            spacing = Vis.lamb * Vis.kx / Vis.k;
            if (vx == 0) {
                m = 10000000;
                t_space = 20;
            } else {
                t_space = spacing / vx;
            }
        }

        let offset = 10;
        let t = Vis.t % (Vis.Nx*t_space/2); // heuristic # of time spacings until wrap around 

        for (let i=0; i < Vis.Nphase; i++) {
            let T = t + (i - Vis.Nphase/2)*t_space + Vis.shift; // shift each phase particle 
                                    // (+1 heuristic to get phase correct)

            if (m >= -1 && m <= 1) {
                // do x processing
                let x = T*vx;
                let y = m*(T*vx - Vis.Nx*Vis.a/2) + Vis.Ny*Vis.a/2;

                Vis.phasex[2*i] = x - offset;
                Vis.phasey[2*i] = y + mi*offset;

                Vis.phasex[2*i+1] = x + offset;
                Vis.phasey[2*i+1] = y - mi*offset;
            } else {
                // do y processing
                let x = mi*(T*vy - Vis.Ny*Vis.a/2) + Vis.Nx*Vis.a/2;
                let y = T*vy;

                Vis.phasex[2*i] = x + m*offset;
                Vis.phasey[2*i] = y - offset;

                Vis.phasex[2*i+1] = x - m*offset;
                Vis.phasey[2*i+1] = y + offset;
            }

            
        }
    }
};

Vis.setup = {
    initConsts: function() {
        Vis.a = 1; // atomic spacing
        Vis.dw = 1; // debye wavelength

        Vis.Nx = 20; // # of atoms in x direction
        Vis.Ny = 20; // # of atoms in y direction
        Vis.N = Vis.Nx * Vis.Ny;

        Vis.Nphase = 2*Vis.Nx;

        Vis.canvasx = document.getElementById('main-vis').offsetWidth;
        Vis.canvasy = document.getElementById('main-vis').offsetHeight;

        Vis.pointR = 0.20 * Vis.a;
    },

    initVars: function() {
        Vis._then = Date.now();

        Vis.dx = 0.10; // % of max x wavenumber, (-1, 1)
        Vis.dy = 0.10; // % of max y wavenumber, (-1, 1)

        Vis.ux = -0.50; // x amplitude
        Vis.uy = -0.50; // y amplitude

        Vis.x = new Array(Vis.N);
        Vis.y = new Array(Vis.N);

        Vis.shift = -5.3;

        Vis.phasex = new Array(2*Vis.Nphase); // requires two points to draw a line
        Vis.phasey = new Array(2*Vis.Nphase);
    },

    initGraph: function() {
        //Code for main-vis
        Vis.canvas = d3.select('#main-vis')
                        .append('canvas')
                        .attr('width', Vis.canvasx)
                        .attr('height', Vis.canvasy);
        Vis.context = Vis.canvas.node().getContext('2d');

        Vis.convertCanvasX = d3.scaleLinear()
                                .domain([0, Vis.Nx*Vis.a])
                                .range([0, Vis.canvasx]);
        Vis.convertCanvasY = d3.scaleLinear()
                                .domain([0, Vis.Ny*Vis.a])
                                .range([Vis.canvasy, 0]);

        //Code for dispersion graph
        function omega_k (dx, dy) {
            return Math.sqrt(4*1*(Math.pow(Math.sin(dx*Math.PI*1/2), 2) + Math.pow(Math.sin(dy*Math.PI*1/2), 2)));
        }
        
        Vis.dispersionGraphWidth = document.getElementById('dispersion-graph').offsetWidth;
        Vis.dispersionGraphHeight = document.getElementById('dispersion-graph').offsetHeight;

        var nx = Vis.dispersionGraphWidth+1, ny = Vis.dispersionGraphHeight+1, values = new Array(nx*ny);
        for (var i = 0; i < nx; i++){
            for (var j = 0; j < ny ; j++){
                var k = i + nx*j;
                var dx = -1 + 2*i/nx;
                var dy = -1 + 2*j/ny;
                values[k] = omega_k (dx, dy);
            }
        }

        Vis.dispersionGraph = d3.select('#dispersion-graph')
                                .append('canvas')
                                .attr('width', Vis.dispersionGraphWidth)
                                .attr('height', Vis.dispersionGraphHeight);

        Vis.dispersionContext = Vis.dispersionGraph.node().getContext('2d');  

        //Making contour
        var color = d3.scaleSequential(d3.interpolateTurbo).domain([0, 2.82]);
        var path = d3.geoPath(null, Vis.dispersionContext);
        var thresholds = d3.range(0, 2.82, 0.01);
        var contours = d3.contours().size([nx, ny]);
        
        function fillGraph(geometry) {
            Vis.dispersionContext.beginPath();
            path(geometry);
            Vis.dispersionContext.fillStyle = color(geometry.value);
            Vis.dispersionContext.fill();
        }
        
        contours
        .thresholds(thresholds)
        (values)
        .forEach(fillGraph);

        //Preparing SVG for dispersion dot and legend
        Vis.dispersionSVG = d3.select('#dispersion-graph')
                            .append("svg")
                            .attr('width', 1.4*Vis.dispersionGraphWidth)
                            .attr('height', Vis.dispersionGraphHeight)
                            .attr('transform', "translate(0, "+ -1.055*Vis.dispersionGraphHeight + ")");

        //Box to check if Canvas and SVG are aligned
        Vis.dispersionSVG.append("rect")
                            .attr("x", 0)
                            .attr("y", 0)
                            .attr("height", Vis.dispersionGraphHeight)
                            .attr("width", Vis.dispersionGraphWidth)
                            .style("stroke", 'black')
                            .style("fill", "none")
                            .style("stroke-width", 1);
    
        var legendXOffset = 1.175*Vis.dispersionGraphWidth;
        var legendYOffset = 0.1*Vis.dispersionGraphHeight;
        var legendHeight = 0.8*Vis.dispersionGraphHeight;
        var legendWidth = 0.15*Vis.dispersionGraphWidth;
        //Box for legend scale
        Vis.legendSVG = Vis.dispersionSVG.append("rect")
                            .attr("x", legendXOffset)
                            .attr("y", legendYOffset)
                            .attr("height", legendHeight)
                            .attr("width", legendWidth)
                            .style("stroke", 'black')
                            .style("fill", "none")
                            .style("stroke-width", 1);
                            
        for (var i = 0; i < 14 ; i++){
            Vis.dispersionSVG.append("rect")
            .attr("x", legendXOffset)
            .attr("y", legendHeight*(14-i)/14)
            .attr("transform", "translate(0," + legendYOffset/2.2 + ")")
            .attr("height", legendHeight/14)
            .attr("width", legendWidth)
            .style("fill", color(2.82*i/14));
        }

        var legendScale = d3.scaleLinear()
            .domain([0, 2.8])
            .range([legendHeight+legendYOffset, legendYOffset]);

        //Legend scale axis
        Vis.dispersionSVG.append('g')
        .attr("transform", "translate("+ legendXOffset+ ", 0)")  // Position of x axis
        .call(d3.axisLeft(legendScale));

        //Legend scale title
        Vis.dispersionSVG.append("text")
        .attr("text-anchor", "end")
        .attr("font-style", "italic")
        .attr('font-size', 10*legendWidth/25)
        .attr("x", legendXOffset+legendWidth)
        .attr("y", legendYOffset/2)
        .text("ω(k) = E/ħ");

        Vis.dispersionDot = Vis.dispersionSVG
                                .append('circle')
                                .attr("cx", 0)
                                .attr("cy", 0)
                                .attr("r", 5)
                                .attr("fill", "black");

        
    },

    initDispersionDrag: function() {
        function dispersionDragged() {
            return function() {
                var x = 2*d3.event.x/Vis.dispersionGraphWidth - 1;
                var y = 1 - 2*d3.event.y/Vis.dispersionGraphHeight;
                if (x > 1) {
                    x = 1;
                } else if (x < -1){
                    x = -1;
                }
                if (y > 1) {
                    y = 1;
                } else if (y < -1) {
                    y = -1;
                }
                Vis.dx = x;
                Vis.dy = y;
                Arrow.rArrow.x = x;
                Arrow.rArrow.y = y;
                Arrow.helpers.updateArrow(Arrow.rArrow);
                Vis.core.updateSliders(); // trigger update of sliders in vis
            };
        }
        Vis.dispersionDot.call(d3.drag().on('drag', dispersionDragged(Vis.dispersionDot)));
    },

    initSlider: function() {
        // r sliders
        Vis.dxRange = document.getElementById('dx-range');
        Vis.dxDisplay = document.getElementById('dx-display');

        Vis.dxRange.addEventListener('input', function() {
            Vis.dx = Vis.dxRange.value;
            Vis.dxDisplay.textContent = Vis.dx;

            Arrow.rArrow.x = parseFloat(Vis.dx);
            Arrow.core.draw();

            Vis.core.updateDisplay();
        });

        Vis.dyRange = document.getElementById('dy-range');
        Vis.dyDisplay = document.getElementById('dy-display');

        Vis.dyRange.addEventListener('input', function() {
            Vis.dy = Vis.dyRange.value;
            Vis.dyDisplay.textContent = Vis.dy;

            Arrow.rArrow.y = parseFloat(Vis.dy);
            Arrow.core.draw();

            Vis.core.updateDisplay();
        });

        // u sliders
        Vis.uxRange = document.getElementById('ukx-range');
        Vis.uxDisplay = document.getElementById('ukx-display');

        Vis.uxRange.addEventListener('input', function() {
            Vis.ux = Vis.uxRange.value;
            Vis.uxDisplay.textContent = Vis.ux;

            Arrow.uArrow.x = parseFloat(Vis.ux);
            Arrow.core.draw();

            Vis.core.updateDisplay();
        });

        Vis.uyRange = document.getElementById('uky-range');
        Vis.uyDisplay = document.getElementById('uky-display');

        Vis.uyRange.addEventListener('input', function() {
            Vis.uy = Vis.uyRange.value;
            Vis.uyDisplay.textContent = Vis.uy;

            Arrow.uArrow.y = parseFloat(Vis.uy);
            Arrow.core.draw();

            Vis.core.updateDisplay();
        });

        Vis.core.updateSliders();
    },

    initDisplay: function() {
        Vis.dotDisplay = document.getElementById("dotproduct");
        Vis.crossDisplay = document.getElementById("crossproduct");
    }
};

//---------------------------------//
// Interactive Arrow Object        //
//---------------------------------//

window.Arrow = window.Arrow || {};

Arrow.init = function() {
    Arrow.setup.initConst();
    Arrow.setup.initObjects();
    Arrow.setup.initDrag();

};

Arrow.core = {
    draw: function() {
        Arrow.core.drawArrow(Arrow.rArrow);
        Arrow.core.drawArrow(Arrow.uArrow);
    },

    drawArrow: function(arrow) {
        Arrow.helpers.updateArrow(arrow);
    }
};

Arrow.helpers = {
    updateArrow: function(arrow) {
        var tipx = (arrow.x + 1)*Arrow.width/2;
        var tipy = (1 - arrow.y)*Arrow.height/2;
        var fontSize = 12;

        arrow.body.attr('x2', tipx)
                    .attr('y2', tipy);
        arrow.tip.attr('cx', tipx)
                    .attr('cy', tipy);

        if (tipy > 22) {
            if (tipx < 85) {
                arrow.text.attr('x', tipx + 10)
                .attr('y', tipy - 7.5)
                .attr('font-size', fontSize)
                .text(arrow.stext + ' (' + Number(arrow.x).toFixed(2) + ', ' + Number(arrow.y).toFixed(2) + ')');
            } else if (tipx < 100) {
                arrow.text.attr('x', tipx + 10 - 80)
                .attr('y', tipy - 7.5)
                .attr('font-size', fontSize)
                .text(arrow.stext + ' (' + Number(arrow.x).toFixed(2) + ', ' + Number(arrow.y).toFixed(2) + ')');
            } else {
                arrow.text.attr('x', tipx + 10 - 105)
                .attr('y', tipy - 7.5)
                .attr('font-size', fontSize)
                .text(arrow.stext + ' (' + Number(arrow.x).toFixed(2) + ', ' + Number(arrow.y).toFixed(2) + ')');
            }   
        } else {
            if (tipx < 85) {
                arrow.text.attr('x', tipx)
                .attr('y', tipy + 15)
                .attr('font-size', fontSize)
                .text(arrow.stext + ' (' + Number(arrow.x).toFixed(2) + ', ' + Number(arrow.y).toFixed(2) + ')');
            } else if (tipx < 100) {
                arrow.text.attr('x', tipx - 90)
                .attr('y', tipy + 15)
                .attr('font-size', fontSize)
                .text(arrow.stext + ' (' + Number(arrow.x).toFixed(2) + ', ' + Number(arrow.y).toFixed(2) + ')');
            } else {
                arrow.text.attr('x', tipx - 110)
                .attr('y', tipy + 15)
                .attr('font-size', fontSize)
                .text(arrow.stext + ' (' + Number(arrow.x).toFixed(2) + ', ' + Number(arrow.y).toFixed(2) + ')');
            }   
        }


    },

    convertCoords: function(sx, sy) {
        var x = 2*sx/Arrow.width - 1;
        var y = 1 - 2*sy/Arrow.height;
        if (x > 1) {
            x = 1;
        } else if (x < -1){
            x = -1;
        }
        if (y > 1) {
            y = 1;
        } else if (y < -1) {
            y = -1;
        }
        return [x, y];
    },

    updateAPP: function() {
        Vis.dx = Arrow.rArrow.x;
        Vis.dy = Arrow.rArrow.y;

        Vis.ux = Arrow.uArrow.x;
        Vis.uy = Arrow.uArrow.y;
    }
};

Arrow.setup = {
    initConst: function() {
        Arrow.width = document.getElementById('interactive-arrow').offsetWidth;
        Arrow.height = document.getElementById('interactive-arrow').offsetHeight;

        Arrow.strokeWidth = 2;
        Arrow.tipRadius = 5;
    },

    initObjects: function() {
        Arrow.svg = d3.select('#interactive-arrow')
        .append('svg')
        .attr('width', Arrow.width)
        .attr('height', Arrow.height);

        Arrow.svg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("height", Arrow.height)
        .attr("width", Arrow.width)
        .style("stroke", 'black')
        .style("fill", "none")
        .style("stroke-width", 1);

        Arrow.rArrow = {
            x: Vis.dx,
            y: Vis.dy,
            stext: 'd'
        };

        Arrow.uArrow = {
            x: Vis.ux,
            y: Vis.uy,
            stext: 'u'
        };

        Arrow.setup.initArrow(Arrow.rArrow);
        Arrow.setup.initArrow(Arrow.uArrow);
    },

    initDrag: function() {
        function dragged(arrow) {
            return function() {
                var xy = Arrow.helpers.convertCoords(d3.event.x, d3.event.y);
                arrow.x = xy[0];
                arrow.y = xy[1];
                Arrow.helpers.updateArrow(arrow);
                Arrow.helpers.updateAPP(); // sync arrow values with main vis
                Vis.core.updateSliders(); // trigger update of sliders in vis
            };
        }
        Arrow.rArrow.tip.call(d3.drag().on('drag', dragged(Arrow.rArrow)));
        Arrow.uArrow.tip.call(d3.drag().on('drag', dragged(Arrow.uArrow)));
    },

    initArrow: function(arrow) {
        arrow.container = Arrow.setup.createArrowContainer();
        arrow.body = Arrow.setup.createArrowBody(arrow);
        arrow.tip = Arrow.setup.createArrowTip(arrow);
        arrow.text = Arrow.setup.createArrowText(arrow);

        Arrow.helpers.updateArrow(arrow);
    },

    createArrowContainer: function() {
        return Arrow.svg.append('svg')
                        .attr('width', Arrow.width)
                        .attr('height', Arrow.height);
    },

    createArrowBody: function(arrow) {
        return arrow.container.append('line')
                                    .attr('x1', Arrow.width/2).attr('y1', Arrow.height/2)
                                    .attr('stroke-width', Arrow.strokeWidth)
                                    .attr('stroke', 'black');
    },

    createArrowTip: function(arrow) {
        return arrow.container.append('circle')
                                .attr('r', Arrow.tipRadius);
    },

    createArrowText: function(arrow) {
        return arrow.container.append('text');
    }
};

document.addEventListener('DOMContentLoaded', Vis.init);