"""
Image Quality Module
====================
Assesses face image quality before embedding generation.

Features:
- Blur detection using Laplacian variance
- Brightness/contrast checks
- Face size validation
- Overall quality score
"""
import numpy as np
import cv2


def estimate_blur(image_rgb):
    """
    Estimate blur level using Laplacian variance.
    
    Args:
        image_rgb: RGB image as numpy array
    
    Returns:
        (laplacian_variance, is_blurry, blur_message)
    """
    gray = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2GRAY)
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    
    from . import config
    
    is_blurry = laplacian_var < config.BLUR_THRESHOLD
    
    if is_blurry:
        return laplacian_var, True, f"Blurry image (Laplacian variance: {laplacian_var:.2f}, threshold: {config.BLUR_THRESHOLD})"
    else:
        return laplacian_var, False, None


def estimate_brightness(image_rgb):
    """
    Estimate brightness level.
    
    Args:
        image_rgb: RGB image as numpy array
    
    Returns:
        (mean_brightness, is_too_dark, is_too_bright)
    """
    gray = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2GRAY)
    mean_brightness = np.mean(gray)
    
    is_too_dark = mean_brightness < 30
    is_too_bright = mean_brightness > 225
    
    return mean_brightness, is_too_dark, is_too_bright


def estimate_contrast(image_rgb):
    """
    Estimate contrast level.
    
    Args:
        image_rgb: RGB image as numpy array
    
    Returns:
        (std_intensity, is_low_contrast)
    """
    gray = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2GRAY)
    std = np.std(gray)
    
    is_low_contrast = std < 20
    
    return std, is_low_contrast


def compute_quality_score(laplacian_var, brightness, contrast, face_size):
    """
    Compute an overall quality score from 0.0 to 1.0.
    
    Args:
        laplacian_var: Laplacian variance (blur metric)
        brightness: Mean brightness
        contrast: Standard deviation of intensity
        face_size: Tuple of (width, height) in pixels
    
    Returns:
        quality_score: float 0.0 to 1.0
    """
    from . import config
    
    score = 1.0
    
    # Blur penalty
    if laplacian_var < config.BLUR_THRESHOLD:
        score *= max(0.1, laplacian_var / config.BLUR_THRESHOLD)
    
    # Brightness penalty
    if brightness < 30 or brightness > 225:
        score *= 0.5
    elif brightness < 50 or brightness > 200:
        score *= 0.8
    
    # Contrast penalty
    if contrast < 20:
        score *= max(0.3, contrast / 40)
    
    # Face size bonus
    min_dim = min(face_size)
    if min_dim >= 200:
        score *= 1.0
    elif min_dim >= 120:
        score *= 0.9
    elif min_dim >= config.MIN_FACE_SIZE:
        score *= 0.7
    else:
        score *= 0.3
    
    return round(min(1.0, max(0.0, score)), 4)


def check_image_quality(image_rgb, face_size):
    """
    Comprehensive image quality check.
    
    Args:
        image_rgb: RGB image as numpy array
        face_size: Tuple of (width, height) in pixels
    
    Returns:
        dict with quality metrics
    """
    laplacian_var, is_blurry, blur_msg = estimate_blur(image_rgb)
    brightness, is_too_dark, is_too_bright = estimate_brightness(image_rgb)
    contrast, is_low_contrast = estimate_contrast(image_rgb)
    quality_score = compute_quality_score(laplacian_var, brightness, contrast, face_size)
    
    warnings = []
    if is_blurry:
        warnings.append(blur_msg)
    if is_too_dark:
        warnings.append("Image too dark")
    if is_too_bright:
        warnings.append("Image too bright")
    if is_low_contrast:
        warnings.append("Low contrast image")
    
    return {
        "quality_score": quality_score,
        "laplacian_variance": round(laplacian_var, 2),
        "brightness": round(brightness, 1),
        "contrast": round(contrast, 1),
        "is_blurry": is_blurry,
        "is_acceptable": quality_score >= 0.3,
        "warnings": warnings,
    }