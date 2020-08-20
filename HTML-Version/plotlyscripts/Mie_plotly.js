//Author: Darren Lean

/*
*   Plotly
*/

// Some global constant
var sigma = Math.pow(2, -1/6);
var epsilon = 0.1;                    
var r0 = sigma*Math.pow(2, 1/6);    //position of minimum

// Mie potential 
function MiePotential (r) {
  return 10*(4*epsilon)*(Math.pow((sigma/r), 12) - Math.pow((sigma/r), 6));
}

// Setting up the initial plot
function initialData () {

  var x = [], y = [];

  for (i = 0; i < 10000; i++) {
    x.push((0.8 + (0.6/10000)*i)*r0);
    y.push(MiePotential((0.8 + (0.6/10000)*i)*r0));
  }

  var trace1 = {    //Data for graph
    x: x,
    y: y
  };

  var trace2 = {    //Data for oscillator
    x: [r0],
    y: [MiePotential (r0)],
    type: 'markers'
  };

  return [trace1, trace2];
}

//Setting up new graph
Plotly.newPlot("plotly-div", initialData(), 
  {title: 'Mie Potential',
    width: 750,
    height: 500,
    margin: {
      l: 100,
      r: 0,
      b: 50,
      t: 50,
      pad: 4
    },
    showlegend: false,
      xaxis: {title: 'r normalised to minimum'},
      yaxis: {title: 'V(r)', range: [-1.5, 7]},
  }
);



//Animate plot

var t = 0;

function updateData () {

  var x = [], y = [];

  for (i = 0; i < 10000; i++) {
    x.push((0.8 + (0.6/10000)*i)*r0);
    y.push(MiePotential((0.8 + (0.6/10000)*i)*r0));
  }
  
  var trace1 = {      //Data for graph
    x: x,
    y: y
  };
  
  var trace2 = {      //Data for oscillator
    x: [r0 + 0.015*Math.sin(0.5*t)],
    y: [MiePotential (r0 + 0.015*Math.sin(0.5*t))],
    mode: 'markers',
      marker: {
        size: 10
    }
  };
  
  return [trace1, trace2];

}

function animatePlot(){
    t++;                    //Let time run 
    Plotly.animate("plotly-div",
    {data: updateData()},   //Fetch new data
            {
                fromcurrent: false,
                transition: {duration: 0,},
                frame: {duration: 0, redraw: true,},
                mode: "immediate"
            }
        );

    requestAnimationFrame(animatePlot);

}

requestAnimationFrame(animatePlot);