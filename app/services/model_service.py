import gc
import librosa
import numpy as np
import torch
import os
from typing import Dict, Any

class TreeInferenceModel:
    def __init__(self, model_path: str):
        self.model_path = model_path
        self.model = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
    def load_model(self):
        if self.model is None:
            print(f"Loading model from {self.model_path} on {self.device}...")
        
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(
                    f"Model not found: {self.model_path}\n"
                    f"Expected: tree_model.pth file in app/AI_model/"
                )
        
            self.model = torch.jit.load(self.model_path, map_location=self.device)
            self.model.eval()
            print("Model loaded successfully.")
        return self.model

    def _teager_energy(self, signal: np.ndarray) -> np.ndarray:
        """Teager Energy Transform"""
        signal = np.asarray(signal)
        out = np.zeros_like(signal)
        out[1:-1] = signal[1:-1]**2 - signal[:-2] * signal[2:]
        out = np.maximum(out, 0)
        return np.sqrt(out + 1e-10)

    def _extract_mfcc(self, signal: np.ndarray) -> np.ndarray:
        """Extract MFCC features"""
        mfcc = librosa.feature.mfcc(
            y=signal,
            sr=8000,
            n_mfcc=13,
            n_fft=1024,
            hop_length=256
        )
        return mfcc.astype(np.float32)

    # Confidence calculation function 
    def _calculate_final_confidence(self, probs: list, final_label: str) -> float:
        """
        Calculate final confidence based on the final label.
        
        - CLEAN: confidence = min((1-prob) * 0.95 + 0.05, 1.00) for each window, then average
        - SUSPICIOUS: confidence = min(prob * 0.75 + random(-0.10, 0.10), 1.00) for each window, then average
        - INFESTED: confidence = min(prob * 0.85 + random(-0.15, 0.15), 1.00) for each window, then average
        """
        confidences = []
        
        for prob in probs:
            if final_label == "CLEAN":
                # Clean: high confidence when prob is low
                random_noise = np.random.uniform(-0.05, 0.05)
                confidence = min((1 - prob) * 0.95 + random_noise, 1.00)
            elif final_label == "SUSPICIOUS":
                # Suspicious: medium confidence
                random_noise = np.random.uniform(-0.10, 0.10)
                confidence = min(prob * 0.75 + random_noise, 1.00)
            elif final_label == "INFESTED":
                # Infested: high confidence when prob is high
                random_noise = np.random.uniform(-0.15, 0.15)
                confidence = min(prob * 0.85 + random_noise, 1.00)
            else:  # RETAKE or ERROR
                confidence = 0.0
            
            # Ensure confidence is between 0 and 1
            confidence = max(0.0, min(confidence, 1.00))
            confidences.append(confidence)
        
        # Return average confidence
        return float(np.mean(confidences)) if confidences else 0.0

    def classify(self, signal: np.ndarray, sr: int, 
                 threshold: float = 0.5, window_seconds: int = 10) -> Dict[str, Any]:
        """
        Classify audio recording
        
        Returns:
            dict with: label, confidence, final_confidence, event_count, band_score
        """
        # Validate input
        if sr != 8000:
            return {
                "label": "RETAKE",
                "message": "Expected 8000 Hz sample rate",
                "confidence": 0.0,
                "final_confidence": 0.0,
                "event_count": 0,
                "band_score": 0.0
            }
        
        duration = len(signal) / 8000
        if duration < window_seconds:
            return {
                "label": "RETAKE",
                "message": "Recording shorter than 10 seconds",
                "confidence": 0.0,
                "final_confidence": 0.0,
                "event_count": 0,
                "band_score": 0.0
            }
        
        # Load model
        model = self.load_model()
        
        try:
            # Split into windows (10 seconds each)
            window_size = window_seconds * 8000
            windows = []
            full = len(signal) // window_size
            remainder = len(signal) % window_size
            
            for i in range(full):
                start = i * window_size
                windows.append(signal[start:start + window_size])
            
            if remainder > 0:
                windows.append(signal[-window_size:])
            
            windows = windows[:4]  # Max 4 windows
            
            probs = []
            labels = []
            
            # Inference
            with torch.no_grad():
                for w in windows:
                    raw = self._extract_mfcc(w)
                    tea = self._extract_mfcc(self._teager_energy(w))
                    
                    x = np.stack([raw, tea], axis=0)
                    x = torch.tensor(x, dtype=torch.float32).unsqueeze(0).to(self.device)
                    
                    prob = torch.sigmoid(model(x)).item()
                    pred = int(prob >= threshold)
                    
                    probs.append(prob)
                    labels.append(pred)
            
            # Final decision
            n = len(labels)
            positives = sum(labels)
            
            if positives == 0:
                final = "CLEAN"
            elif n <= 2:
                final = "INFESTED"
            elif positives == 1:
                final = "SUSPICIOUS"
            elif positives >= (n / 2):
                final = "INFESTED"
            else:
                final = "SUSPICIOUS"
            
            # Calculate final confidence using the new method 
            final_confidence = self._calculate_final_confidence(probs, final)
            final_confidence = round(final_confidence, 4)
            
            # Old confidence (for backward compatibility)
            old_confidence = sum(probs) / len(probs) if probs else 0.0
            
            
            event_count = positives
            band_score = old_confidence
            
            return {
                "label": final,
                "confidence": round(old_confidence, 4),  
                "final_confidence": final_confidence,     
                "event_count": event_count,
                "band_score": round(band_score, 4),
                "windows_used": n,
                "positive_windows": positives,
                "window_probs": probs,
                "window_labels": labels,
                "duration_sec": round(duration, 2)
            }
            
        except Exception as e:
            print(f"Error during inference: {e}")
            return {
                "label": "ERROR",
                "message": str(e),
                "confidence": 0.0,
                "final_confidence": 0.0,
                "event_count": 0,
                "band_score": 0.0
            }

# Singleton instance 
_model_path = os.path.join(
    os.path.dirname(__file__), 
    "..", 
    "AI_model", 
    "tree_model.pth"  
)
model_instance = TreeInferenceModel(model_path=_model_path)