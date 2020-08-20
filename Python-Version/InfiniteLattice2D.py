#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Tue Jan 21 21:56:26 2020

@author: darrenlean
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib import animation
from matplotlib.widgets import Slider
from matplotlib import rcParams

N = 50          #N*N atoms
a = 1           #atomic spacing
wd = 1          #Debye wavelength

#Note that k = [rx*pi/a, ry*pi/a]
rx = 0.1
ry = 0.1
    
kx = rx*np.pi/a
ky = ry*np.pi/a
w = np.sqrt(4*wd*(np.sin(kx*a/2)**2 + np.sin(ky*a/2)**2))

ukx = 1
uky = 1

def data(ukx, uky, kx, ky, t):
    x = []
    y = []
    w = np.sqrt(4*wd*(np.sin(kx*a/2)**2 + np.sin(ky*a/2)**2))
    for l in range(N):
        for m in range(N):
            x.append(l*a + ukx*np.cos(kx*l*a + ky*m*a - w*t))
            y.append(m*a + uky*np.cos(l*kx*a + m*ky*a - w*t))
    return x, y

def phasetrack(kx, ky, a, t):
    w = np.sqrt(4*wd*(np.sin(kx*a/2)**2 + np.sin(ky*a/2)**2))
    k = np.sqrt(kx**2 + ky**2)
    lamb = 2*np.pi/k
    v = w/k
    x0 = 25
    y0 = 25
    x = []
    y = []
    for n in range(25):
        x.append(x0 + t*v*kx/k)
        y.append(y0 + t*v*ky/k)
        x.append(x0 + n*round(N*a/lamb - 1)*lamb*kx/k + t*v*kx/k)
        y.append(y0 + n*round(N*a/lamb - 1)*lamb*ky/k + t*v*ky/k)
        x.append(x0 - n*round(N*a/lamb - 1)*lamb*kx/k + t*v*kx/k)
        y.append(y0 - n*round(N*a/lamb - 1)*lamb*ky/k + t*v*ky/k)
    return x, y

# initialization function: plot the background of each frame
def init():
    plot1.set_data([], [])
    plot2.set_data([], [])
    plot3.set_data([], [])
    return plot1, plot2, plot3,

# animation function.  This is called sequentially
def animate(t):
    ukx = sukx.val
    uky = suky.val
    rx = srx.val
    ry = sry.val
    kx = rx*np.pi/a
    ky = ry*np.pi/a
    title.set_text(r'Infinite lattice atomic spacing = a, $\mathbf{k}$ = $\frac{\pi}{a}$[' + str(np.round(100*rx)/100) + ', ' +  str(np.round(100*ry)/100) + r'] , $\lambda = $' + str(np.round(100*2/np.sqrt(rx**2+ry**2))/100) + 'a')
    text1.set_text(r'$\mathbf{u_k} \cdot \mathbf{k}$ = ' + str(np.round(100*np.dot([ukx, uky], [kx, ky]))/100))
    text2.set_text(r'$|\mathbf{u_k} \times \mathbf{k}$| = '+ str(np.round(100*abs(np.cross([ukx, uky], [kx, ky])))/100))
    plot1.set_data(data(ukx, uky, kx, ky, t)[0], data(ukx, uky, kx, ky, t)[1])
    plot2.set_data(data(ukx, uky, kx, ky, t)[0][1180], data(ukx, uky, kx, ky, t)[1][1180])
    plot3.set_data(phasetrack(kx, ky, a, t))
    return plot1, plot2, plot3,

# First set up the figure, the axis, and the plot element we want to animate
fig = plt.figure(figsize=(10,10))
plt.subplots_adjust(left=0.1, bottom=0.25)
ax = plt.axes(xlim=(0.1*N*a, 0.95*N*a), ylim=(0.1*N*a, 0.95*N*a))
plt.grid(True)
title = plt.title(r'Infinite lattice atomic spacing = a, $\mathbf{k}$ = $\frac{\pi}{a}$[' + str(rx) + ', ' +  str(ry) + r'] , $\lambda = $' + str(np.round(10*2/np.sqrt(rx**2+ry**2))/10) + 'a')
rcParams['axes.titlepad'] = 5               #Title distance from plot
plt.xlabel(r'$\frac{1}{a}$')
plt.ylabel(r'$\frac{1}{a}$')

plot1, = ax.plot([], [], 'yo', markersize=4)
plot2, = ax.plot([], [], 'ro', markersize=4)
plot3, = ax.plot([], [], 'ko', markersize=4)

axcolor = 'lightgoldenrodyellow'
axsrx = plt.axes([0.1, 0.09, 0.3, 0.02], facecolor=axcolor)
axsry = plt.axes([0.1, 0.05, 0.3, 0.02], facecolor=axcolor)
axsukx = plt.axes([0.55, 0.09, 0.3, 0.02], facecolor=axcolor)
axsuky = plt.axes([0.55, 0.05, 0.3, 0.02], facecolor=axcolor)

fig.text(0.1, 0.13, r'$\mathbf{k}$ = $\frac{\pi}{a}[r_x, r_y]$')
text1 = fig.text(0.55, 0.13, r'$\mathbf{u_k} \cdot \mathbf{k}$ = ' + str(np.round(100*np.dot([ukx, uky], [kx, ky]))/100))
text2 = fig.text(0.725, 0.13, r'|$\mathbf{u_k} \times \mathbf{k}$| = '+ str(np.round(100*abs(np.cross([ukx, uky], [kx, ky])))/100))
srx = Slider(axsrx, '$r_{x}$', -1, 1, valinit=rx, valstep=0.01)
sry = Slider(axsry, '$r_{y}$', -1, 1, valinit=ry, valstep=0.01)
sukx = Slider(axsukx, '$u_{k_{x}}$', -1, 1, valinit=ukx, valstep=0.01)
suky = Slider(axsuky, '$u_{k_{y}}$', -1, 1, valinit=uky, valstep=0.01)

# call the animator.  blit=True means only re-draw the parts that have changed.
anim = animation.FuncAnimation(fig, animate, init_func=init, frames=100, interval=40, blit=True)