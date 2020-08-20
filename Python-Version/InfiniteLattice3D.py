#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Sun Jan 19 19:36:58 2020

@author: darrenlean
"""

import numpy as np
from matplotlib import pyplot as plt
import matplotlib.animation
from matplotlib.widgets import Slider
from matplotlib import rcParams
from mpl_toolkits.mplot3d import Axes3D

N = 10          #N*N*N atoms
a = 1           #atomic spacing
wd = 1          #Debye wavelength

#Try changing the value of rx, ry, rz!
#Note that k = [rx*pi/a, ry*pi/a, rz*pi/a]
rx = 0.1        
ry = 0.1
rz = 0.1
    
kx = rx*np.pi/a
ky = ry*np.pi/a
kz = rz*np.pi/a
w = np.sqrt(4*wd*(np.sin(kx*a/2)**2 + np.sin(ky*a/2)**2 + np.sin(kz*a/2)**2))

ukx = 1
uky = 1
ukz = 1

def data(ukx, uky, ukz, kx, ky, kz, t):
    x = []
    y = []
    z = []
    w = np.sqrt(4*wd*(np.sin(kx*a/2)**2 + np.sin(ky*a/2)**2))
    for l in range(N):
        for m in range(N):
            for n in range(N):
                x.append(l*a + ukx*np.cos(l*kx*a + m*ky*a + n*kz*a - w*t))
                y.append(m*a + uky*np.cos(l*kx*a + m*ky*a + n*kz*a - w*t))
                z.append(n*a + ukz*np.cos(l*kx*a + m*ky*a + n*kz*a - w*t))
    return x, y, z

def phasetrack(kx, ky, kz, a, t):
    w = np.sqrt(4*wd*(np.sin(kx*a/2)**2 + np.sin(ky*a/2)**2))
    k = np.sqrt(kx**2 + ky**2 + kz**2)
    lamb = 2*np.pi/k
    v = w/k
    x0 = 5
    y0 = 5
    z0 = 5
    x = []
    y = []
    z = []
    for n in range(25):
        x.append(x0 + t*v*kx/k)
        y.append(y0 + t*v*ky/k)
        z.append(z0 + t*v*kz/k)
        x.append(x0 + n*round(N*a/lamb)*lamb*kx/k + t*v*kx/k)
        y.append(y0 + n*round(N*a/lamb)*lamb*ky/k + t*v*ky/k)
        z.append(z0 + n*round(N*a/lamb)*lamb*kz/k + t*v*kz/k)
        x.append(x0 - n*round(N*a/lamb)*lamb*kx/k + t*v*kx/k)
        y.append(y0 - n*round(N*a/lamb)*lamb*ky/k + t*v*ky/k)
        z.append(z0 - n*round(N*a/lamb)*lamb*kz/k + t*v*kz/k)
    return x, y, z

def animate(t):
    ukx = sukx.val
    uky = suky.val
    ukz = sukz.val
    rx = srx.val
    ry = sry.val
    rz = srz.val
    kx = rx*np.pi/a
    ky = ry*np.pi/a
    kz = rz*np.pi/a
    title.set_text(r'Infinite lattice atomic spacing = a, $\mathbf{k}$ = $\frac{\pi}{a}$[' + str(np.round(100*rx)/100) + ', ' +  str(np.round(100*ry)/100) + ', ' +  str(np.round(100*rz)/100) + r'] , $\lambda = $' + str(np.round(10*2/np.sqrt(rx**2+ry**2+rz**2))/10) + 'a')
    text1.set_text(r'$\mathbf{u_k} \cdot \mathbf{k}$ = ' + str(np.round(100*np.dot([ukx, uky, ukz], [kx, ky, kz]))/100))
    cp = np.cross([ukx, uky, ukz], [kx, ky, kz])
    abscp = np.sqrt(cp[0]**2 + cp[1]**2 + cp[2]**2)
    text2.set_text(r'$|\mathbf{u_k} \times \mathbf{k}$| = '+ str(np.round(100*abscp)/100))
    plot1.set_data(data(ukx, uky, ukz, kx, ky, kz, t)[0], data(ukx, uky, ukz, kx, ky, kz, t)[1])
    plot1.set_3d_properties(data(ukx, uky, ukz, kx, ky, kz, t)[2])
    plot2.set_data(data(ukx, uky, ukz, kx, ky, kz, t)[0][6], data(ukx, uky, ukz, kx, ky, kz, t)[1][6])
    plot2.set_3d_properties(data(ukx, uky, ukz, kx, ky, kz, t)[2][6])
    plot3.set_data(phasetrack(kx, ky, kz, a, t)[0], phasetrack(kx, ky, kz, a, t)[1])
    plot3.set_3d_properties(phasetrack(kx, ky, kz, a, t)[2])
    return plot1, plot2, plot3,

fig = plt.figure(figsize=(10,10))
plt.subplots_adjust(left=0.1, bottom=0.25)
ax = fig.add_subplot(111, projection='3d')
ax.set_xlim3d([-0.1*N*a, 1.05*N*a])
ax.set_ylim3d([-0.1*N*a, 1.05*N*a])
ax.set_zlim3d([-0.1*N*a, 1.05*N*a])
title = plt.title(r'Infinite lattice atomic spacing = a, $\mathbf{k}$ = $\frac{\pi}{a}$[' + str(rx) + ', ' +  str(ry) + ', ' +  str(rz) + r'] , $\lambda = $' + str(np.round(10*2/np.sqrt(rx**2+ry**2+rz**2))/10) + 'a')
rcParams['axes.titlepad'] = 27               #Title distance from plot
ax.set_xlabel(r'$\frac{1}{a}$', fontsize=10)
ax.set_ylabel(r'$\frac{1}{a}$', fontsize=10)
ax.set_zlabel(r'$\frac{1}{a}$', fontsize=10)

plot1, = ax.plot([], [], [], 'yo', markersize=4)
plot2, = ax.plot([], [], [], 'ro', markersize=4)
plot3, = ax.plot([], [], [], 'ko', markersize=4)

axcolor = 'lightgoldenrodyellow'
axsrx = plt.axes([0.1, 0.12, 0.3, 0.02], facecolor=axcolor)
axsry = plt.axes([0.1, 0.08, 0.3, 0.02], facecolor=axcolor)
axsrz = plt.axes([0.1, 0.04, 0.3, 0.02], facecolor=axcolor)
axsukx = plt.axes([0.55, 0.12, 0.3, 0.02], facecolor=axcolor)
axsuky = plt.axes([0.55, 0.08, 0.3, 0.02], facecolor=axcolor)
axsukz = plt.axes([0.55, 0.04, 0.3, 0.02], facecolor=axcolor)

fig.text(0.1, 0.16, r'$\mathbf{k}$ = $\frac{\pi}{a}[r_x, r_y, r_z]$')
text1 = fig.text(0.55, 0.16, r'$\mathbf{u_k} \cdot \mathbf{k}$ = ' + str(np.round(100*np.dot([ukx, uky, ukz], [kx, ky, kz]))/100))
cp = np.cross([ukx, uky, ukz], [kx, ky, kz])
abscp = np.sqrt(cp[0]**2 + cp[1]**2 + cp[2]**2)
text2 = fig.text(0.725, 0.16, r'|$\mathbf{u_k} \times \mathbf{k}$| = '+ str(np.round(100*abscp)/100))

srx = Slider(axsrx, '$r_{x}$', -1, 1, valinit=rx, valstep=0.01)
sry = Slider(axsry, '$r_{y}$', -1, 1, valinit=ry, valstep=0.01)
srz = Slider(axsrz, '$r_{z}$', -1, 1, valinit=rz, valstep=0.01)
sukx = Slider(axsukx, '$u_{k_{x}}$', -1, 1, valinit=ukx, valstep=0.01)
suky = Slider(axsuky, '$u_{k_{y}}$', -1, 1, valinit=uky, valstep=0.01)
sukz = Slider(axsukz, '$u_{k_{z}}$', -1, 1, valinit=ukz, valstep=0.01)

ani = matplotlib.animation.FuncAnimation(fig, animate, frames=200, interval=20, blit=True)

