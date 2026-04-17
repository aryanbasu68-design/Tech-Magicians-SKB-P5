from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Marine Plastic Detection API running"}
