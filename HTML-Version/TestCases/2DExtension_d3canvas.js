//---------------------------------//
// Visualisation Object            //
//---------------------------------//

window.Vis = window.Vis || {};

Vis.init = function() {
    Vis.isRunning = false;

    Vis.setup.initConsts();
    Vis.setup.initVars();

    Vis.setup.initGraph();
    //Vis.setup.initButton();
    Vis.setup.initSlider();

    Vis.start();
};

Vis.start = function() {
    if (Vis._stoptime) {
        Vis._then += Date.now() - Vis._stoptime; // add stopped time
    };

    if (!Vis.isRunning) {
        Vis.core.frame();
        Vis.isRunning = true;
    };
};

Vis.stop = function() {
    window.cancelAnimationFrame(Vis.animationFrameLoop);
    Vis.isRunning = false;
    Vis._stoptime = Date.now(); // record when animation paused
}

Vis.core = {
    frame: function() {
        Vis.t = (Date.now() - Vis._then) / 250; // time since start in seconds

        Vis.core.update();
        Vis.core.animate();

        Vis.animationFrameLoop = window.requestAnimationFrame(Vis.core.frame);
    },

    update: function() {
        Vis.workers.calcPos();
    },

    animate: function() {
        Vis.context.clearRect(0, 0, Vis.canvasx, Vis.canvasy);

        Vis.context.fillStyle = 'orange';
        for (let i=0; i < Vis.N; i++) {
            Vis.context.beginPath();
            Vis.context.arc(Vis.convertCanvasX(Vis.x[i]), Vis.convertCanvasY(Vis.y[i])
                                , Vis.convertCanvasX(Vis.pointR), 0, 2*Math.PI);
            Vis.context.fill();
        }

        // pick the middle particle to track with a black dot 
        Vis.context.fillStyle = 'black';
        Vis.context.beginPath();
        Vis.context.arc(Vis.convertCanvasX(Vis.x[Math.round(Vis.N/2 - Vis.Ny/2)])
                            , Vis.convertCanvasY(Vis.y[Math.round(Vis.N/2 - Vis.Ny/2)])
                            , Vis.convertCanvasX(Vis.pointR*1.03), 0, 2*Math.PI);
        Vis.context.fill();
    },

    updateSliders: function() {

        Vis.kxbarRange.value = Vis.kxbar;
        Vis.kxbarDisplay.textContent = Vis.kxbar;

        Vis.kybarRange.value = Vis.kybar;
        Vis.kybarDisplay.textContent = Vis.kybar;

        Vis.sigmaxRange.value = Vis.sigmax;
        Vis.sigmaxDisplay.textContent = Vis.sigmax;

        Vis.sigmayRange.value = Vis.sigmay;
        Vis.sigmayDisplay.textContent = Vis.sigmay;

    },

}

Vis.workers = {

    calcPos: function() {

        var Ax = Math.pow(4*Vis.sigmax, 2)/0.01;     //Normalisation
        var Ay = Math.pow(4*Vis.sigmay, 2)/0.01;

        for (i=0; i < Vis.Nx; i++) {
            for (j=0; j < Vis.Ny; j++) {
                let n = Vis.Ny * i + j;
                let xdisp = 0;
                let ydisp = 0;
                for (let kxcurrent = Vis.kxbar - 2*Vis.sigmax; kxcurrent < Vis.kxbar + 2*Vis.sigmax; kxcurrent += 0.1) {
                    for (let kycurrent = Vis.kybar - 2*Vis.sigmay; kycurrent < Vis.kybar + 2*Vis.sigmay; kycurrent += 0.1) {
                        let w = Math.sqrt(4*Vis.dw*(Math.pow(Math.sin(kxcurrent*Vis.a/2), 2)) + Math.pow(Math.sin(kycurrent*Vis.a/2), 2));
                        let ukx = Math.pow(2*Math.PI*Math.pow(Vis.sigmax, 2), -1/2)*Math.exp(-0.5*Math.pow((kxcurrent-Vis.kxbar)/Vis.sigmax, 2))/Ax;
                        let uky = Math.pow(2*Math.PI*Math.pow(Vis.sigmay, 2), -1/2)*Math.exp(-0.5*Math.pow((kycurrent-Vis.kybar)/Vis.sigmay, 2))/Ay;
                        xdisp += ukx*Math.cos(kxcurrent*Vis.a*i + kycurrent*Vis.a*j - w*Vis.t);
                        ydisp += uky*Math.cos(kxcurrent*Vis.a*i + kycurrent*Vis.a*j - w*Vis.t);
                    }
                }                
                Vis.x[n] = i*Vis.a + xdisp;
                Vis.y[n] = j*Vis.a + ydisp;
            }
        }
    },
};

Vis.setup = {
    initConsts: function() {
        Vis.a = 1; // atomic spacing
        Vis.dw = 1; // debye wavelength

        Vis.Nx = 20; // # of atoms in x direction
        Vis.Ny = 20; // # of atoms in y direction
        Vis.N = Vis.Nx * Vis.Ny;

        Vis.canvasx = 450;
        Vis.canvasy = 450;

        Vis.pointR = 0.20 * Vis.a;
    },

    initVars: function() {
        Vis._then = Date.now();

        Vis.kxbar = 0.5;
        Vis.kybar = 0.5;
        Vis.sigmax = 0.1;
        Vis.sigmay = 0.1;

        Vis.x = new Array(Vis.N);
        Vis.y = new Array(Vis.N);
    },

    initGraph: function() {
        Vis.canvas = d3.select('#canvas-div')
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
    },

    initButton: function() {
        Vis.button = document.getElementById('start-stop');

        Vis.button.addEventListener('click', function() {
            if (Vis.isRunning) {
                Vis.stop();
            } else {
                Vis.start();
            }
        });
    },

    initSlider: function() {

        Vis.kxbarRange = document.getElementById('kxbar-range');
        Vis.kxbarDisplay = document.getElementById('kxbar-display');

        Vis.kxbarRange.addEventListener('input', function() {
            Vis.kxbar = Vis.kxbarRange.value;
            Vis.kxbarDisplay.textContent = Vis.kxbar;
        });

        Vis.kybarRange = document.getElementById('kybar-range');
        Vis.kybarDisplay = document.getElementById('kybar-display');

        Vis.kybarRange.addEventListener('input', function() {
            Vis.kybar = Vis.kybarRange.value;
            Vis.kybarDisplay.textContent = Vis.kybar;
        });

        Vis.sigmaxRange = document.getElementById('sigmax-range');
        Vis.sigmaxDisplay = document.getElementById('sigmax-display');

        Vis.sigmaxRange.addEventListener('input', function() {
            Vis.sigmax = Vis.sigmaxRange.value;
            Vis.sigmaxDisplay.textContent = Vis.sigmax;
        });

        Vis.sigmayRange = document.getElementById('sigmay-range');
        Vis.sigmayDisplay = document.getElementById('sigmay-display');

        Vis.sigmayRange.addEventListener('input', function() {
            Vis.sigmay = Vis.sigmayRange.value;
            Vis.sigmayDisplay.textContent = Vis.sigmay;
        });

        Vis.core.updateSliders();
    },
};

document.addEventListener('DOMContentLoaded', Vis.init);