import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, Activity } from 'lucide-react';

export default function AudioVisualization({ audioData, isSpeaking }) {
  const {
    volume,
    frequency,
    dominantFrequency,
    frequencyBins,
    isAnalyzing
  } = audioData;

  // Convert frequency to a more readable range for slider (0-4000 Hz)
  const normalizedFrequency = Math.min(frequency / 4000, 1) * 100;
  const normalizedDominantFreq = Math.min(dominantFrequency / 4000, 1) * 100;
  const volumePercentage = volume * 100;

  // Determine frequency range for voice characteristics
  const getFrequencyRange = (freq) => {
    if (freq < 300) return { label: 'Bass', color: 'bg-blue-500' };
    if (freq < 800) return { label: 'Low Mid', color: 'bg-green-500' };
    if (freq < 2000) return { label: 'Mid', color: 'bg-yellow-500' };
    if (freq < 4000) return { label: 'High Mid', color: 'bg-orange-500' };
    return { label: 'High', color: 'bg-red-500' };
  };

  const freqRange = getFrequencyRange(frequency);
  const dominantRange = getFrequencyRange(dominantFrequency);

  // Map frequency to potential viseme
  const getVisemeFromFrequency = (freq, vol) => {
    if (vol < 0.1) return 'Silence';
    if (freq < 500) return 'A/O (Wide)';
    if (freq < 1000) return 'E (Medium)';
    if (freq < 2000) return 'I (Smile)';
    if (freq < 3000) return 'U (Pucker)';
    return 'Consonant';
  };

  const currentViseme = getVisemeFromFrequency(frequency, volume);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {isAnalyzing ? (
            <>
              <Activity className="h-5 w-5 text-green-500 animate-pulse" />
              Audio Analysis
            </>
          ) : (
            <>
              <MicOff className="h-5 w-5 text-gray-400" />
              Audio Inactive
            </>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Indicators */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant={isSpeaking ? "default" : "secondary"}>
            {isSpeaking ? "Speaking" : "Silent"}
          </Badge>
          <Badge variant={isAnalyzing ? "default" : "secondary"}>
            {isAnalyzing ? "Analyzing" : "Inactive"}
          </Badge>
          <Badge variant="outline">
            {currentViseme}
          </Badge>
        </div>

        {/* Volume Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-1">
              <Volume2 className="h-4 w-4" />
              Volume
            </label>
            <span className="text-sm text-muted-foreground">
              {volumePercentage.toFixed(1)}%
            </span>
          </div>
          <Slider
            value={[volumePercentage]}
            max={100}
            step={0.1}
            disabled
            className="w-full"
          />
        </div>

        {/* Average Frequency Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              Avg Frequency
            </label>
            <div className="flex items-center gap-2">
              <Badge className={`${freqRange.color} text-white text-xs`}>
                {freqRange.label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {frequency.toFixed(0)} Hz
              </span>
            </div>
          </div>
          <Slider
            value={[normalizedFrequency]}
            max={100}
            step={0.1}
            disabled
            className="w-full"
          />
        </div>

        {/* Dominant Frequency Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              Dominant Frequency
            </label>
            <div className="flex items-center gap-2">
              <Badge className={`${dominantRange.color} text-white text-xs`}>
                {dominantRange.label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {dominantFrequency.toFixed(0)} Hz
              </span>
            </div>
          </div>
          <Slider
            value={[normalizedDominantFreq]}
            max={100}
            step={0.1}
            disabled
            className="w-full"
          />
        </div>

        {/* Frequency Spectrum Visualization */}
        {frequencyBins.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Frequency Spectrum (0-2kHz)
            </label>
            <div className="flex items-end gap-1 h-16 bg-muted rounded p-2">
              {frequencyBins.slice(0, 30).map((bin, index) => {
                const height = (bin / 255) * 100;
                const hue = (index / 30) * 240; // Blue to red spectrum
                return (
                  <div
                    key={index}
                    className="flex-1 bg-gradient-to-t from-blue-500 to-red-500 rounded-sm min-w-[2px]"
                    style={{
                      height: `${Math.max(height, 2)}%`,
                      backgroundColor: `hsl(${hue}, 70%, 50%)`
                    }}
                    title={`${((index * 44100) / 512).toFixed(0)} Hz: ${bin}`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 Hz</span>
              <span>1 kHz</span>
              <span>2 kHz</span>
            </div>
          </div>
        )}

        {/* Real-time Values */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-muted-foreground">Volume</div>
            <div className="font-mono">{(volume * 100).toFixed(1)}%</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Avg Freq</div>
            <div className="font-mono">{frequency.toFixed(0)} Hz</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Peak Freq</div>
            <div className="font-mono">{dominantFrequency.toFixed(0)} Hz</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Viseme</div>
            <div className="font-mono text-xs">{currentViseme}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}