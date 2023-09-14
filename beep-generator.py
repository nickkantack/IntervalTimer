
from scipy.io.wavfile import write
import numpy
import matplotlib.pyplot as plt
import math

rate = 44100
data = numpy.random.rand(1000000)
scaled = (data / numpy.max(numpy.abs(data)) * 32767)

# Create the desired fourier transform, noting that the zero frequency comes halfway through the array
fourier = numpy.zeros((rate * 2 + 1,), dtype=numpy.complex_)
center_index = rate
pitch_hz = 800
fourier[-pitch_hz] = 1
fourier[pitch_hz] = 1

scaled = numpy.fft.ifft(fourier)
# Scaling is normally not super critical, but here we need to get reasonable values for a decent volume in the audio file

# Mask and crop to just the sound file we need (the current audio sample is 2 seconds long since we treated each index in
# the fourier transform above as 1 Hz (if we chose not to, there would be more scaling steps above).
each_beep_duration_s = 0.25
number_of_beeps = 1
scaled = scaled[:int(2 * number_of_beeps * each_beep_duration_s * rate)]
mask = numpy.zeros((scaled.shape[0],))
for i in range(number_of_beeps):
    mask[int(2 * (i + .5) * each_beep_duration_s * rate):int((2 * i + 1.5) * each_beep_duration_s * rate)] = 1
# Window the mask. Use two opposite facing sigmoids to make the mask edges smooth
mask_fourier = numpy.fft.fft(mask)
mask_fourier = numpy.fft.fftshift(mask_fourier)
mask_before_filtering = mask
midpoint = mask_fourier.shape[0] // 2
scaler = 0.04
filter = 1 / (1 + numpy.exp(scaler * (numpy.arange(mask_fourier.shape[0]) - midpoint))) / (1 + numpy.exp(scaler * (midpoint - numpy.arange(mask_fourier.shape[0]))))
mask_fourier *= filter
mask_fourier = numpy.fft.ifftshift(mask_fourier)
mask = numpy.fft.ifft(mask_fourier)
mask *= 1 / numpy.max(mask.real)
scaled = scaled * mask
scaled *= 32767 / numpy.max(scaled.real)

fig, ax = plt.subplots(4)
ax[0].plot(mask_before_filtering)
ax[0].set_title("Time domain mask before filtering")
ax[1].plot(filter)
ax[1].set_title("Filter used to smooth out the mask")
ax[2].plot(mask)
ax[2].set_title("Smoothed out mask")
ax[3].plot(scaled)
ax[3].set_title("Sound signal with mask applied")
plt.show()

pause_duration_s = 1
repetitions = 1
final_waveform = scaled
final_waveform = final_waveform[10000:20000]
for i in range(repetitions - 1):
    final_waveform = numpy.concatenate((final_waveform, numpy.zeros((pause_duration_s * rate,)), scaled))

# Save the file
write('beep.wav', rate, final_waveform.astype("int16"))