//---------------------------------//
// Visualisation Object            //
//---------------------------------//

window.Vis = window.Vis || {};

Vis.init = function() {
    Vis.isRunning = false;

    Vis.setup.initConsts();
    Vis.setup.initVars();

    Vis.setup.initDisplay();
    Vis.setup.initGraph();
    Vis.setup.initScene();

    Vis.setup.initSliders();

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
        Vis.t = (Date.now() - Vis._then) / 500; // time since start in seconds

        Vis.core.update();
        Vis.core.animate();

        Vis.animationFrameLoop = window.requestAnimationFrame(Vis.core.frame);
    },

    update: function() {
        Vis.workers.calcParams();
        Vis.workers.calcPos();
        // Vis.workers.calcPhase();
    },

    animate: function() {
        for (let n=0; n<Vis.N; n++) {
            Vis.spheres[n].position.set(Vis.x[n], Vis.y[n], Vis.z[n]);
        }

        Vis.renderer.render(Vis.scene, Vis.camera);
        
    },

    updateSliders: function() {
        Vis.dxRange.value = Vis.dx;
        Vis.dxDisplay.textContent = Number(Vis.dx).toFixed(2);

        Vis.dyRange.value = Vis.dy;
        Vis.dyDisplay.textContent = Number(Vis.dy).toFixed(2);

        Vis.dzRange.value = Vis.dz;
        Vis.dzDisplay.textContent = Number(Vis.dz).toFixed(2);


        Vis.ukxRange.value = Vis.ukx;
        Vis.ukxDisplay.textContent = Number(Vis.ukx).toFixed(2);

        Vis.ukyRange.value = Vis.uky;
        Vis.ukyDisplay.textContent = Number(Vis.uky).toFixed(2);

        Vis.ukzRange.value = Vis.ukz;
        Vis.ukzDisplay.textContent = Number(Vis.ukz).toFixed(2);

        Vis.core.updateDisplay();
    },

    updateDisplay: function() {
        Vis.workers.calcParams();

        let ukvec = [Vis.ukx, Vis.uky, Vis.ukz];
        let kvec = [Vis.kx, Vis.ky, Vis.kz];

        let dotproduct = Math.round(100*Math.abs(math.dot(kvec, ukvec)))/100;
        Vis.dotDisplay.textContent = dotproduct.toString();

        let crossproduct = Math.round(Math.abs(100*Math.pow((Math.pow(math.cross(kvec, ukvec)[0], 2) + Math.pow(math.cross(kvec, ukvec)[1], 2) + Math.pow(math.cross(kvec, ukvec)[2], 2)), 0.5)))/100;
        Vis.crossDisplay.textContent = crossproduct.toString();
    }
};

Vis.workers = {
    calcParams: function() {
        Vis.k = Math.sqrt(Vis.kx**2 + Vis.ky**2 + Vis.kz**2);
        Vis.kx = Vis.dx * Math.PI / Vis.a;
        Vis.ky = Vis.dy * Math.PI / Vis.a;
        Vis.kz = Vis.dz * Math.PI / Vis.a;

        Vis.w = 2 * Vis.dw * Math.sqrt(Math.sin(Vis.kx * Vis.a / 2)**2 + Math.sin(Vis.ky * Vis.a / 2)**2 + Math.sin(Vis.kz * Vis.a / 2)**2);

        Vis.dphase = 2*Math.PI/Vis.k; // update spacing of phase tracker 
    },

    calcPos: function() {
        for (let i=0; i < Vis.Nx; i++) {
            for (let j=0; j < Vis.Ny; j++) {
                for (let k=0; k < Vis.Nz; k++) {
                    let n = Vis.Ny*Vis.Nz*i + Vis.Nz*j + k;
                    let offset = Math.cos( Vis.kx*Vis.a*i + Vis.ky*Vis.a*j + Vis.kz*Vis.a*k - Vis.w*Vis.t);
    
                    Vis.x[n] = i*Vis.a + Vis.ukx * offset;
                    Vis.y[n] = j*Vis.a + Vis.uky * offset;
                    Vis.z[n] = k*Vis.a + Vis.ukz * offset;
                }
            }
        }
    },

    calcPhase: function() {
        let v = Vis.w / Vis.k;
        let vx = v * Vis.kx / Vis.k;
        let vy = v * Vis.ky / Vis.k;
        let vz = v * Vis.kz / Vis.k;

        let m = vy / vx;

        var spacing;
        var t_space;
        if (m >= -1 && m <= 1) {
            // do y processing
            spacing = Vis.dphase * Vis.ky / Vis.k; // distance between phases 
            t_space = spacing / vy;
        } else {
            // do x processing
            spacing = Vis.dphase * Vis.kx / Vis.k;
            t_space = spacing / vx;
        }

        let t = Vis.t % (Vis.Nx*t_space/2); // heuristic # of time spacings until wrap around 

        for (let i=0; i < Vis.Nphase; i++) {
            let T = t + (i - Vis.Nphase/2)*t_space; // shift each phase particle 

            if (m >= -1 && m <= 1) {
                // do x processing
                Vis.phasex[i] = T*vx;
                Vis.phasey[i] = (m)*(T*vx - Vis.Nx*Vis.a/2) + Vis.Ny*Vis.a/2;
            } else {
                // do y processing
                Vis.phasex[i] = (1/m)*(T*vy - Vis.Ny*Vis.a/2) + Vis.Nx*Vis.a/2;
                Vis.phasey[i] = T*vy;
            }

            
        }
    }
};

Vis.setup = {
    initConsts: function() {
        Vis.a = 1; // atomic spacing
        Vis.dw = 1; // debye wavelength

        Vis.Nx = 10; // # of atoms in x direction
        Vis.Ny = 10; // # of atoms in y direction
        Vis.Nz = 10; // # of atoms in z direction
        Vis.N = Vis.Nx * Vis.Ny * Vis.Nz;

        Vis.Nphase = 2*Vis.Nx;

        Vis.canvasx = document.getElementById('main-vis').offsetWidth;
        Vis.canvasy = document.getElementById('main-vis').offsetHeight;

        Vis.pointR = 0.10 * Vis.a;
    },

    initVars: function() {
        Vis._then = Date.now();

        Vis.dx = 0.5; // % of max x wavenumber, (-1, 1)
        Vis.dy = 0; // % of max y wavenumber, (-1, 1)
        Vis.dz = 0; // % of max z wavenumber, (-1, 1)

        Vis.ukx = 0; // x amplitude
        Vis.uky = 0; // y amplitude
        Vis.ukz = 0.5; // z amplitude

        Vis.x = new Array(Vis.N);
        Vis.y = new Array(Vis.N);
        Vis.z = new Array(Vis.N);
        Vis.spheres = new Array(Vis.N);

        Vis.phasex = new Array(Vis.Nphase);
        Vis.phasey = new Array(Vis.Nphase);
        Vis.phasez = new Array(Vis.Nphase);
    },

    initGraph: function() {
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
    },

    initScene: function() {
        Vis.scene = new THREE.Scene();
        Vis.scene.background = new THREE.Color( 0xffffff );
        
        Vis.camera = new THREE.PerspectiveCamera( 75, Vis.canvasx/Vis.canvasy, 0.1, 1000 );
        Vis.camera.position.set(-0.8, -0.6, -0.8);
        Vis.camera.lookAt(new THREE.Vector3(0,0,0));

        Vis.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            canvas: document.getElementById('canvas-div')
        });
        Vis.renderer.setSize(Vis.canvasx, Vis.canvasy);
        // document.getElementById('canvas-div').appendChild(Vis.renderer.domElement);

        for (let n=0; n<Vis.N; n++) {
            let geometry = new THREE.SphereBufferGeometry(Vis.pointR, 10, 10);
            let material = new THREE.MeshBasicMaterial( { 
                color: new THREE.Color("hsl(" + Number(360*n/(Vis.N-1)).toFixed(2) + ", 60%, 52%)") 
            } );
            let sphere = new THREE.Mesh( geometry, material );
            Vis.spheres[n] = sphere;
            
            Vis.scene.add(sphere);
        }
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

    initSliders: function() {
        // r sliders
        Vis.dxRange = document.getElementById('dx');
        Vis.dxDisplay = document.getElementById('dx-display');

        Vis.dxRange.addEventListener('input', function() {
            Vis.dx = Vis.dxRange.value;
            Vis.dxDisplay.textContent = Vis.dx;

            Vis.core.updateDisplay();
        });

        Vis.dyRange = document.getElementById('dy');
        Vis.dyDisplay = document.getElementById('dy-display');

        Vis.dyRange.addEventListener('input', function() {
            Vis.dy = Vis.dyRange.value;
            Vis.dyDisplay.textContent = Vis.dy;

            Vis.core.updateDisplay();
        });

        Vis.dzRange = document.getElementById('dz');
        Vis.dzDisplay = document.getElementById('dz-display');

        Vis.dzRange.addEventListener('input', function() {
            Vis.dz = Vis.dzRange.value;
            Vis.dzDisplay.textContent = Vis.dz;

            Vis.core.updateDisplay();
        });

        // u sliders
        Vis.ukxRange = document.getElementById('ukx');
        Vis.ukxDisplay = document.getElementById('ukx-display');

        Vis.ukxRange.addEventListener('input', function() {
            Vis.ukx = Vis.ukxRange.value;
            Vis.ukxDisplay.textContent = Vis.ukx;

            Vis.core.updateDisplay();
        });

        Vis.ukyRange = document.getElementById('uky');
        Vis.ukyDisplay = document.getElementById('uky-display');

        Vis.ukyRange.addEventListener('input', function() {
            Vis.uky = Vis.ukyRange.value;
            Vis.ukyDisplay.textContent = Vis.uky;

            Vis.core.updateDisplay();
        });

        Vis.ukzRange = document.getElementById('ukz');
        Vis.ukzDisplay = document.getElementById('ukz-display');

        Vis.ukzRange.addEventListener('input', function() {
            Vis.ukz = Vis.ukzRange.value;
            Vis.ukzDisplay.textContent = Vis.ukz;

            Vis.core.updateDisplay();
        });

        Vis.core.updateSliders();
    },

    initDisplay: function() {
        Vis.dotDisplay = document.getElementById("dotproduct");
        Vis.crossDisplay = document.getElementById("crossproduct");
    }
};

document.addEventListener('DOMContentLoaded', Vis.init);