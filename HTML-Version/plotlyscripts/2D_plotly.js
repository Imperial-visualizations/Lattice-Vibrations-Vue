//Author: Darren Lean

/*
*   Plotly
*/

// Some global constant
var N = 25;          // N atoms 
var a = 1;           // atomic spacing
var wd = 1;          // Debye wavelength 

// Note that k = r*pi/a 

// Setting up the initial plot
function initialData () {

  var dx = 0.1; 
  var dy = 0.1; 
  var kx = dx*Math.PI/a;
  var ky = dy*Math.PI/a;
  var k  = Math.sqrt(Math.pow(kx, 2) + Math.pow(ky, 2));
  var lamb = 2*Math.PI/k; 
  var w = Math.sqrt(4*wd*(Math.pow(Math.sin(kx*a/2), 2)) + Math.pow(Math.sin(ky*a/2), 2));
  var v = w/k; 
  var vx = v*kx/k;
  var vy = v*ky/k;

  var ukx = 0.5; 
  var uky = 0.5; 

  var latticeColour = 'rgb(17, 157, 255)';
  var trackSingleColour = 'rgb(0, 0, 0)';
  var trackPhaseColour = 'rgb(255, 0, 0)';
  
  var t = 0;
  var x = [], y = [];
  var colour = [];

  var fullData = [];

  // Lattice data
  for (l = 0; l < N; l++) {
    for (m = 0; m < N; m++) {
      x.push(l*a + ukx*Math.cos(l*kx*a + m*ky*a - w*t));
      y.push(m*a + uky*Math.cos(l*kx*a + m*ky*a - w*t));
      if (l == 15 && m == 15) {
        colour.push(trackSingleColour);         // Different colour to trace a single atom
      } else {
        colour.push(latticeColour);
      }
    }
  }

  var latticeData = {
    x: x,
    y: y,
    mode: 'markers',
    marker: {
      color: colour,
      size: 10,
    }
  };

  fullData.push(latticeData);

  // Phase track data
  var g = vy/vx;          // gradient of line
  var gi = vx/vy;         // inverse of gradient

  var spacing;            // distance between phases 
  var t_space;
  if (g >= -1 && g <= 1) {
      // do y processing
      spacing = lamb * ky / k; 
      if (vy == 0) {
          gi = 10000000;
          t_space = 20;
      } else {
          t_space = spacing / vy;
      }
  } else {
      // do x processing
      spacing = lamb * kx / k;
      if (vx == 0) {
          g = 10000000;
          t_space = 20;
      } else {
          t_space = spacing / vx;
      }
  }

  let offset = 10;

  for (let i=0; i < 2*N; i++) {
    var xphase = [], yphase = [];
    var phaseData;
    let T = t + (i - N)*t_space; // shift each phase particle 
                            // (+1 heuristic to get phase correct)

    if (g >= -1 && g <= 1) {
        // do x processing
        let x = T*vx;
        let y = g*(T*vx - N*a/2) + N*a/2;

        xphase.push(x - offset);
        yphase.push(y + gi*offset);

        xphase.push(x + offset);
        yphase.push(y - gi*offset);

        phaseData = {
          x: xphase,
          y: yphase,
          mode: 'lines',
          color: trackPhaseColour
        };

    } else {
        // do y processing
        let x = gi*(T*vy - N*a/2) + N*a/2;
        let y = T*vy;

        xphase.push(x + g*offset);
        yphase.push(y - offset);

        xphase.push(x - g*offset);
        yphase.push(y + offset);

        phaseData = {
          x: xphase,
          y: yphase,
          mode: 'lines',
          color: trackPhaseColour
        };
    }
    fullData.push(phaseData);
  }

  return fullData;

}

Plotly.newPlot("plotly-div", initialData(), {title: 'Infinite lattice',
  width: 500,
  height: 500,
  margin: {
    l: 50,
    r: 50,
    b: 50,
    t: 50,
    pad: 4
  },
  showlegend: false,
  xaxis: {title: 'x', range: [0.1*N*a, 0.95*N*a]},
  yaxis: {title: 'y', range: [0.1*N*a, 0.95*N*a]}
});



//Animate plot

var t = 0;

function updateData () {

  var dx = document.getElementById("dx").value;
  document.getElementById("dx-display").innerHTML = dx.toString();
  var ukx = document.getElementById("ukx").value;
  document.getElementById("ukx-display").innerHTML = ukx.toString();
  var dy = document.getElementById("dy").value;
  document.getElementById("dy-display").innerHTML = dy.toString();
  var uky = document.getElementById("uky").value;
  document.getElementById("uky-display").innerHTML = uky.toString();
  

  var ukvec = [ukx, uky, 0];
  var kx = dx*Math.PI/a;
  var ky = dy*Math.PI/a;
  var kvec = [kx, ky, 0];
  var k  = Math.sqrt(Math.pow(kx, 2) + Math.pow(ky, 2));
  var lamb = 2*Math.PI/k; 
  var w = Math.sqrt(4*wd*(Math.pow(Math.sin(kx*a/2), 2)) + Math.pow(Math.sin(ky*a/2), 2));
  var v = w/k; 
  var vx = v*kx/k;
  var vy = v*ky/k;
  var trackPhaseColour = 'rgb(255, 0, 0)';

  var dotproduct = Math.round(100*Math.abs(math.dot(kvec, ukvec)))/100;
  document.getElementById("dotproduct").innerHTML = dotproduct.toString();
  var crossproduct = Math.round(Math.abs(100*Math.pow((Math.pow(math.cross(kvec, ukvec)[0], 2) + Math.pow(math.cross(kvec, ukvec)[1], 2) + Math.pow(math.cross(kvec, ukvec)[2], 2) ), 0.5)))/100;
  document.getElementById("crossproduct").innerHTML = crossproduct.toString();

  var x = [], y = [];
  var fullData = [];
  
  // Lattice data
  for (l = 0; l < N; l++) {
    for (m = 0; m < N; m++) {
      x.push(l*a + ukx*Math.cos(l*kx*a + m*ky*a - w*t));
      y.push(m*a + uky*Math.cos(l*kx*a + m*ky*a - w*t));
    }
  }

  var latticeData = {x: x, y: y};

  fullData.push(latticeData);

  // Phase track data
  var g = vy/vx;          // gradient of line
  var gi = vx/vy;         // inverse of gradient

  var spacing;
  var t_space;
  if (g >= -1 && g <= 1) {
      // do y processing
      spacing = lamb * ky / k; // distance between phases 
      if (vy == 0) {
          gi = 10000000;
          t_space = 20;
      } else {
          t_space = spacing / vy;
      }
  } else {
      // do x processing
      spacing = lamb * kx / k;
      if (vx == 0) {
          g = 10000000;
          t_space = 20;
      } else {
          t_space = spacing / vx;
      }
  }

  let offset = 10;

  for (let i=0; i < 2*N; i++) {
    var xphase = [], yphase = [];
    var phaseData;
    let T = t + (i - N)*t_space; // shift each phase particle 
                            // (+1 heuristic to get phase correct)

    if (g >= -1 && g <= 1) {
        // do x processing
        let x = T*vx;
        let y = g*(T*vx - N*a/2) + N*a/2;

        xphase.push(x - offset);
        yphase.push(y + gi*offset);

        xphase.push(x + offset);
        yphase.push(y - gi*offset);

        phaseData = {
          x: xphase,
          y: yphase,
          mode: 'lines',
          color: trackPhaseColour
        };

    } else {
        // do y processing
        let x = gi*(T*vy - N*a/2) + N*a/2;
        let y = T*vy;

        xphase.push(x + g*offset);
        yphase.push(y - offset);

        xphase.push(x - g*offset);
        yphase.push(y + offset);

        phaseData = {
          x: xphase,
          y: yphase,
          mode: 'lines',
          color: trackPhaseColour
        };
    }
    fullData.push(phaseData);
      
  }


return fullData;

}

function animatePlot(){
    t++;
    Plotly.animate("plotly-div",
    {data: updateData()},
            {
                fromcurrent: false,
                transition: {duration: 0,},
                frame: {duration: 0, redraw: true,},
                mode: "immediate"
            }
        );
    if (t == 30) {
      t = 0;
    }
    requestAnimationFrame(animatePlot);

}
requestAnimationFrame(animatePlot);