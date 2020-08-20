//------------------------------------------------------------//
//Code for main vis and k in first brillouin zone starts here //
//------------------------------------------------------------//
window.Vis = window.Vis || {};

Vis.init = function() {             //Main initialising function
    Vis.isRunning = false;

    Vis.setup.initConsts();         //Setup constants
    Vis.setup.initVars();           //Initialise variables

    Circle.init();                  //Initialise First Brillouin Zone SVG

    Vis.setup.initGraph();          //Setup Canvas
    Vis.setup.initSlider();         //Link the sliders to the variables

    Vis.start();                    //Let time run for animation
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
        Vis.workers.calcParams();                                               //Calculate new k in First Brillouin Zone
        Vis.workers.calcPos();                                                  //Calculate new positions
    },

    animate: function() {
        Vis.context.clearRect(0, 0, Vis.canvasx, Vis.canvasy);                  //Redraw blank canvas
        
        Vis.context.fillStyle = 'orange';
        for (var i=0; i < Vis.N; i++) {                                         //Draw individual circles
            Vis.context.beginPath();
            Vis.context.arc(Vis.convertCanvasX(Vis.x[i]), Vis.convertCanvasY(Vis.y[i]), Vis.convertCanvasX(Vis.pointD), 0, 2*Math.PI);
            Vis.context.fill();
        }
        
        // pick a particle to track with a black dot 
        Vis.context.fillStyle = 'black';
        Vis.context.beginPath();
        Vis.context.arc(Vis.convertCanvasX(Vis.x[Math.round(Vis.N/2)]), Vis.convertCanvasY(Vis.y[Math.round(Vis.N/2)]), Vis.convertCanvasX(Vis.pointD*1.03), 0, 2*Math.PI);
        Vis.context.fill();

    },

    updateSliders: function() {
        Vis.dRange.value = Vis.d;
        Vis.dDisplay.textContent = Number(Vis.d).toFixed(2);
        Vis.dBox.value = Number(Vis.d).toFixed(2);

        Vis.uRange.value = Vis.u;
        Vis.uDisplay.textContent = Number(Vis.u).toFixed(2);

        slide(Vis.d);
    },
};

Vis.workers = {
    calcParams: function() {                                    //Calculation of k in First Brillouin Zone
        Vis.k = Vis.d * Math.PI / Vis.a;
        var dtemporary = Vis.d%2;
        if (Vis.d > 0 && dtemporary > 1) {Vis.dFBZ = dtemporary - 2; }
        else if (Vis.d < 0 && dtemporary < -1) {Vis.dFBZ = dtemporary + 2; }
        else {Vis.dFBZ = dtemporary;}
        Vis.w = Math.sqrt(4*Vis.dw*(Math.pow(Math.sin(Vis.k*Vis.a/2), 2)));
    },

    calcPos: function() {                                       //Calculation of new atomic positions
        for (var i=0; i < Vis.N; i++) {
                var offset = Math.cos(Vis.k*Vis.a*i - Vis.w*Vis.t);

                Vis.x[i] = i*Vis.a + Vis.u * offset;
                Vis.y[i] = Vis.N*Vis.a/2;
        }
    },
};

Vis.setup = {
    initConsts: function() {
        Vis.a = 1;                  //Atomic spacing
        Vis.dw = 1;                 //Debye wavelength

        Vis.N = 20;                 //Number of atoms in x direction

        Vis.canvasx = document.getElementById('main-vis').offsetWidth;
        Vis.canvasy = document.getElementById('main-vis').offsetHeight;

        Vis.pointD = 0.20 * Vis.a;  //Atomic radius
    },

    initVars: function() {
        Vis._then = Date.now();

        Vis.d = 0.10;               //k = (pi/a)*d
        Vis.dFBZ = 0.10;            //d in the First Brillouin Zone

        Vis.u = -0.50;              //Oscillation amplitude

        Vis.x = new Array(Vis.N);   //Empty array for atomic x positions
        Vis.y = new Array(Vis.N);   //Empty array for atomic y positions

    },

    initGraph: function() {         //Setup the canvas to the right scale
        Vis.canvas = d3.select('#main-vis')
                        .append('canvas')
                        .attr('width', Vis.canvasx)
                        .attr('height', Vis.canvasy);
        Vis.context = Vis.canvas.node().getContext('2d');

        Vis.convertCanvasX = d3.scaleLinear()                   //x range
                                .domain([0, Vis.N*Vis.a])
                                .range([0, Vis.canvasx]);
        Vis.convertCanvasY = d3.scaleLinear()                   //y range
                                .domain([0, Vis.N*Vis.a])
                                .range([Vis.canvasy, 0]);
    },

    initSlider: function() {
        // d slider linked to JS variable, d display and d input box in HTML 
        Vis.dRange = document.getElementById('d-range');
        Vis.dDisplay = document.getElementById('d-display');
        Vis.dBox = document.getElementById('d-box');

        Vis.dRange.addEventListener('input', function() {
            Vis.d = Vis.dRange.value;
            Vis.dDisplay.textContent = Number(Vis.d).toFixed(2);
            Vis.dBox.value = Number(Vis.d).toFixed(2);

            Vis.core.update();

            Circle.dCircle.x = parseFloat(Vis.dFBZ);
            Circle.core.draw();

            Circle.dCircle.y = parseFloat(0);
            Circle.core.draw();

            slide(Vis.d);

        });

        Vis.dBox.addEventListener('input', function() {
            Vis.d = Vis.dBox.value;
            Vis.dDisplay.textContent = Number(Vis.d).toFixed(2);
            Vis.dBox.textContent = Number(Vis.d).toFixed(2);

            Vis.core.update();
            
            Circle.dCircle.x = parseFloat(Vis.dFBZ);
            Circle.core.draw();

            Circle.dCircle.y = parseFloat(0);
            Circle.core.draw();

            slide(Vis.d);

        });

        // u slider
        Vis.uRange = document.getElementById('uk-range');
        Vis.uDisplay = document.getElementById('uk-display');

        Vis.uRange.addEventListener('input', function() {
            Vis.u = Vis.uRange.value;
            Vis.uDisplay.textContent = Vis.u;

        });

        Vis.core.updateSliders();
    },

};

window.Circle = window.Circle || {};

Circle.init = function() {
    Circle.setup.initConst();                   //Setup constants
    Circle.setup.initObjects();                 //Initialise SVG elements
};

Circle.core = {
    draw: function() {
        Circle.core.drawCircle(Circle.dCircle);
    },

    drawCircle: function(circle) {
        Circle.helpers.updateCircle(circle);
    }
};

Circle.helpers = {
    updateCircle: function(circle) {
        var tipx = (circle.x + 1)*Circle.width/2;       //Brings the x origin to the center 
        var tipy = (1 - circle.y)*Circle.height/2;      //SVG y coordinates increases vertically downward

        circle.body.attr('x2', tipx)
                    .attr('y2', tipy);
        circle.tip.attr('cx', tipx)
                    .attr('cy', tipy);

        circle.text.attr('x', Circle.width/2)
                    .attr('y', 0.8*Circle.height/2)
                    .attr('font-size', 12)
                    .text(circle.stext + ' = ' + Number(Vis.dFBZ).toFixed(2) + 'π');
    },
};

Circle.setup = {
    initConst: function() {                             //Setup constants
        Circle.width = document.getElementById('interactive-Circle').offsetWidth;
        Circle.height = document.getElementById('interactive-Circle').offsetHeight;

        Circle.strokeWidth = 2;
        Circle.tipRadius = 5;
    },

    initObjects: function() {                           //Initialise SVG elements
        Circle.svg = d3.select('#interactive-Circle')
                        .append('svg')
                        .attr('width', Circle.width)
                        .attr('height', Circle.height);

        Circle.svg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("height", Circle.height)
        .attr("width", Circle.width)
        .style("stroke", 'black')
        .style("fill", "none")
        .style("stroke-width", 1);

        Circle.dCircle = {
            x: Vis.dFBZ,
            y: 0,
            stext: 'k'
        };

        Circle.setup.initCircle(Circle.dCircle);
    },

    initCircle: function(circle) {                      //Add the SVG elements
        circle.container = Circle.setup.createCircleContainer();
        circle.body = Circle.setup.createCircleBody(circle);
        circle.tip = Circle.setup.createCircleTip(circle);
        circle.text = Circle.setup.createCircleText(circle);
        Circle.helpers.updateCircle(circle);
    },

    createCircleContainer: function() {
        return Circle.svg.append('svg')
                        .attr('width', Circle.width)
                        .attr('height', Circle.height);
    },

    createCircleBody: function(circle) {
        return circle.container.append('line')
                                    .attr('x1', Circle.width/2).attr('y1', Circle.height/2)
                                    .attr('stroke-width', Circle.strokeWidth)
                                    .attr('stroke', 'black');
    },

    createCircleTip: function(circle) {
        return circle.container.append('circle')
                                .attr('r', Circle.tipRadius);
    },

    createCircleText: function(circle) {
        return circle.container.append('text');
    }
};

document.addEventListener('DOMContentLoaded', Vis.init);

//--------------------------------------//
//Code for dispersion graph starts here //
//--------------------------------------//

// Dispersion relation
function omega_k (d) {
    return Math.sqrt(4*1*(Math.pow(Math.sin(d*Math.PI*1/2), 2)));
}

// Setting up data for graph
var k = [], w_k = [];
var data = [];
for (var i = 0; i < 20000; i++) {
    var thisd = (-10 + i/1000);
    var thisk = (-10 + i/1000)*Math.PI;
    k.push(Number(thisk.toFixed(2)));      // fix to 2 decimal places
    w_k.push(omega_k(thisd));
    data.push({x: Number(thisk.toFixed(2)), y: omega_k(thisd)});
}
var dispersionWidth = document.getElementById('dispersion-graph').offsetWidth;
var dispersionHeight = document.getElementById('dispersion-graph').offsetHeight;
// set the dimensions and margins of the graph
var margin = {top: 0.1*dispersionHeight, right: 0.1*dispersionWidth, bottom: 0.2*dispersionHeight, left: 0.1*dispersionWidth},
    width = 0.8*dispersionWidth,
    height = 0.7*dispersionHeight;

// append the svg object to the body of the page
var sVg = d3.select("#dispersion-graph")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    // translate this svg element to leave some margin.
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// X scale and Axis
var x = d3.scaleLinear()
    .domain([k[0], k.slice(-1)[0]])                           // Range of x axis
    .range([0, width]);                                       // Length of x axis

sVg.append('g')
    .attr("transform", "translate(0," + height + ")")  // Position of x axis
    .call(d3.axisBottom(x));

// Add X axis label:
sVg.append("text")
    .attr("text-anchor", "end")
    .attr("font-style", "italic")
    .attr("font-size", height/11)
    .attr("x", width)
    .attr("y", 11*height/12 + 14*margin.bottom/11)
    .text("k = πd");

// Y scale and Axis
var y = d3.scaleLinear()
.domain([math.min(w_k), math.max(w_k)])                       // Range of y axis
.range([height, 0]);                                      // Length of y axis

sVg.append('g')
.attr("transform", "translate(" + width/2 + ", 0)")  // Position of x axis
.call(d3.axisLeft(y));

// Y axis label:
sVg.append("text")
.attr("text-anchor", "end")
.attr("font-style", "italic")
.attr("font-size", height/11)
.attr("x", 1.4*width/2)
.attr("y", -margin.top/2)
.text("ω(k) = E/ħ");

// Draw the potential
sVg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", d3.line()
    .x(function(d) { return x(d.x); })
    .y(function(d) { return y(d.y); })
    );

// Draw current k 
var movingk = sVg
    .selectAll()
    .data([{x: 0.1*Math.PI, y: omega_k(0.1)}])
    .enter()
    .append("circle")
    .attr("cx", function(d){ return x(d.x); })
    .attr("cy", function(d){ return y(d.y); })
    .attr("r", 3)
    .attr("fill", "orange");

//Slide current k 
function slide(newd) {
    movingk.attr('cx', function(){ return x(newd*Math.PI); }).attr('cy', function(){ return y(omega_k(newd)); });
}