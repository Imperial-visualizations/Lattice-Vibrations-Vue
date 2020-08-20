#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Sun Jan 19 16:25:19 2020

@author: darrenlean
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib import animation
from matplotlib.widgets import Slider

N = 50          #N atoms
a = 1           #atomic spacing
wd = 1          #Debye wavelength

#Try changing the value of r!
#Note that k = r*pi/a
r = 0.1       
    
k = r*np.pi/a
w = np.sqrt(4*wd*(np.sin(k*a/2)**2))

uk = 1

def data(uk, k, t):
    x = []
    w = np.sqrt(4*wd*(np.sin(k*a/2)**2))
    for l in range(N):
        x.append(l*a + uk*np.cos(l*k*a - w*t))
    return x

# initialization function: plot the background of each frame
def init():
    plot1.set_data([], [])
    plot2.set_data([], [])
    return plot1, plot2,

# animation function.  This is called sequentially
def animate(t):
    uk = suk.val
    r = sr.val
    k = r*np.pi/a
    title.set_text(r'Infinite lattice atomic spacing = a, k = ' + str(np.round(10*r)/10) + r'$\frac{\pi}{a}$ , $\lambda = $' + str(np.round(10*2/r)/10) + 'a')
    plot1.set_data(data(uk, k, t), np.zeros(N))
    plot2.set_data(data(uk, k, t)[30], 0)
    return plot1, plot2,

# First set up the figure, the axis, and the plot element we want to animate
fig = plt.figure(figsize=(20,10))
plt.subplots_adjust(left=0.1, bottom=0.25)
ax = plt.axes(xlim=(0.1*N*a, 0.95*N*a), ylim=(-1, 1))
plt.yticks([])
plt.grid(True)
title = plt.title(r'Infinite lattice atomic spacing = a, k = ' + str(r) + r'$\frac{\pi}{a}$ , $\lambda = $' + str(np.round(10*2/r)/10) + 'a')
plt.xlabel(r'$\frac{1}{a}$')

plot1, = ax.plot([], [], 'bo', markersize=4)
plot2, = ax.plot([], [], 'ro', markersize=4)

axcolor = 'lightgoldenrodyellow'
axsr = plt.axes([0.1, 0.09, 0.3, 0.02], facecolor=axcolor)
axsuk = plt.axes([0.55, 0.09, 0.3, 0.02], facecolor=axcolor)

fig.text(0.1, 0.13, r'k = $\frac{\pi}{a}r$')

sr = Slider(axsr, '$r$', -1, 1, valinit=r, valstep=0.01)
suk = Slider(axsuk, '$u_k$', -1, 1, valinit=uk, valstep=0.01)

# call the animator.  blit=True means only re-draw the parts that have changed.
anim = animation.FuncAnimation(fig, animate, init_func=init, frames=1000, interval=40, blit=True)