from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI()

app.mount("/static", StaticFiles(directory="./src/static"), name="static")


templates = Jinja2Templates(directory="./src/Views/templates")

from src.Controllers import main
