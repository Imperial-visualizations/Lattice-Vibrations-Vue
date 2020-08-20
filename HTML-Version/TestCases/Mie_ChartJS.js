//Author: Darren Lean

/*
*   Chart JS
*/

// Some global constant
var sigma = Math.pow(2, -1/6);
var epsilon = 0.1;                    
var r0 = sigma*Math.pow(2, 1/6);    //position of minimum

// Mie potential 
function MiePotential (r) {
  return 10*(4*epsilon)*(Math.pow((sigma/r), 12) - Math.pow((sigma/r), 6));
}

// Setting up the data
var r = [], V = [];
var data = [];
for (i = 0; i < 20; i++) {
  var rnow = (0.8 + 0.05*i)*r0;
  r.push(Number(rnow.toFixed(2)));      // fix to 2 decimal places
  V.push(MiePotential(rnow));
  data.push({x: Number(rnow.toFixed(2)), y: MiePotential(rnow)});
}

Chart.defaults.global.elements.line.fill = false;
new Chart(document.getElementById("line-chart"), {
  type: 'line',
  data: {
    labels: r,
    datasets: [
      { 
        data: data
      },
      {
        data: [{x: r5, y: MiePotential(r0)}],
      }
    ]
  },
  options: {
    scales: {
      yAxes: [{
        scaleLabel: {
          display: true,
          labelString: 'V(r)',
          fontStyle: "italic"
        }
      }],
      xAxes: [{
        scaleLabel: {
          display: true,
          labelString: 'r normalised to minimum',
          fontStyle: "italic"
        }
      }],
    },
    legend: {
      display: false
    },
    title: {
      display: true,
      text: 'Mie potential',
      fontStyle: "bold"
    },
  }
});