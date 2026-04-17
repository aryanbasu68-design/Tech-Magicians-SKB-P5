from fastapi import APIRouter, UploadFile, File
import numpy as np
from PIL import Image

router = APIRouter()

@router.post("/predict")
async def predict(file: UploadFile = File(...)):

    image = Image.open(file.file)
    image = image.resize((100, 100))
    data = np.array(image)

    # simple fake detection
    plastic_pixels = int((data.mean(axis=2) > 150).sum())

    return {
        "plastic_pixels": plastic_pixels
    }
