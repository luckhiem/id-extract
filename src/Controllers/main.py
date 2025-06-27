import os

import numpy as np
import yolov5
from fastapi import File, Form, Request, UploadFile
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from PIL import Image
from vietocr.tool.config import Cfg
from vietocr.tool.predictor import Predictor

import src.Controllers.config as cfg
from src import app, templates
from src.Controllers import utils

""" ---- Setup ---- """
# Init yolov5 model
CORNER_MODEL = yolov5.load(cfg.CORNER_MODEL_PATH)
CONTENT_MODEL = yolov5.load(cfg.CONTENT_MODEL_PATH)
FACE_MODEL = yolov5.load(cfg.FACE_MODEL_PATH)

# Set conf and iou threshold -> Remove overlap and low confident bounding boxes
CONTENT_MODEL.conf = cfg.CONF_CONTENT_THRESHOLD
CONTENT_MODEL.iou = cfg.IOU_CONTENT_THRESHOLD

# CORNER_MODEL.conf = cfg.CONF_CORNER_THRESHOLD
# CORNER_MODEL.iou = cfg.IOU_CORNER_THRESHOLD

# Config directory
UPLOAD_FOLDER = cfg.UPLOAD_FOLDER
SAVE_DIR = cfg.SAVE_DIR
FACE_CROP_DIR = cfg.FACE_DIR

""" ---- ##### -----"""


""" Recognizion detected parts in ID """
config = Cfg.load_config_from_name(
    "vgg_seq2seq"
)  # OR vgg_transformer -> acc || vgg_seq2seq -> time
# config = Cfg.load_config_from_file(cfg.OCR_CFG)
# config['weights'] = cfg.OCR_MODEL_PATH
config["cnn"]["pretrained"] = False
config["device"] = cfg.DEVICE
config["predictor"]["beamsearch"] = False
detector = Predictor(config)


@app.get("/")
async def root(request: Request):
    return templates.TemplateResponse("idcard.html", {"request": request})


@app.get("/id_card")
async def id_extract_page(request: Request):
    return templates.TemplateResponse("idcard.html", {"request": request})


@app.get("/ekyc")
async def ekyc_page(request: Request):
    return templates.TemplateResponse("ekyc.html", {"request": request})


@app.post("/uploader")
async def upload(file: UploadFile = File(...)):
    # Ensure upload directory exists
    if not os.path.isdir(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    INPUT_IMG = os.listdir(UPLOAD_FOLDER)
    if INPUT_IMG is not None:
        for uploaded_img in INPUT_IMG:
            os.remove(os.path.join(UPLOAD_FOLDER, uploaded_img))

    file_location = f"./{UPLOAD_FOLDER}/{file.filename}"
    contents = await file.read()
    with open(file_location, "wb") as f:
        f.write(contents)

    # Validating file
    INPUT_FILE = os.listdir(UPLOAD_FOLDER)[0]
    if INPUT_FILE == "NULL":
        os.remove(os.path.join(UPLOAD_FOLDER, INPUT_FILE))
        error = "No file selected!"
        return JSONResponse(status_code=403, content={"message": error})
    elif INPUT_FILE == "WRONG_EXTS":
        os.remove(os.path.join(UPLOAD_FOLDER, INPUT_FILE))
        error = "This file is not supported!"
        return JSONResponse(status_code=404, content={"message": error})

    # return {"Filename": file.filename}
    return await extract_info()


@app.post("/extract")
# @app.api_route("/extract", methods=["GET", "POST"])
async def extract_info(ekyc=False, path_id=None):
    """Check if uploaded image exist"""
    if not os.path.isdir(cfg.UPLOAD_FOLDER):
        os.makedirs(cfg.UPLOAD_FOLDER, exist_ok=True)

    INPUT_IMG = os.listdir(UPLOAD_FOLDER)
    if INPUT_IMG is not None:
        if not ekyc:
            img = os.path.join(UPLOAD_FOLDER, INPUT_IMG[0])
        else:
            img = path_id

    CORNER = CORNER_MODEL(img)
    # CORNER.save(save_dir='results/')
    predictions = CORNER.pred[0]
    categories = predictions[:, 5].tolist()  # Class
    if len(categories) != 4:
        error = "Detecting corner failed!"
        return JSONResponse(status_code=401, content={"message": error})
    boxes = utils.class_Order(predictions[:, :4].tolist(), categories)  # x1, x2, y1, y2
    IMG = Image.open(img)
    center_points = list(map(utils.get_center_point, boxes))

    """ Temporary fixing """
    c2, c3 = center_points[2], center_points[3]
    c2_fix, c3_fix = (c2[0], c2[1] + 30), (c3[0], c3[1] + 30)
    center_points = [center_points[0], center_points[1], c2_fix, c3_fix]
    center_points = np.asarray(center_points)
    aligned = utils.four_point_transform(IMG, center_points)
    # Convert from OpenCV to PIL format
    aligned = Image.fromarray(aligned)
    # aligned.save('res.jpg')
    # CORNER.show()

    CONTENT = CONTENT_MODEL(aligned)
    # CONTENT.save(save_dir='results/')
    predictions = CONTENT.pred[0]
    categories = predictions[:, 5].tolist()  # Class
    
    # Debug logging
    print(f"DEBUG: Detected {len(categories)} categories: {categories}")
    
    # More lenient detection - allow processing with fewer fields
    min_fields = 4  # Reduced minimum fields
    if len(categories) < min_fields:
        error = f"Very few fields detected! Found {len(categories)} fields, need at least {min_fields}. Please ensure the ID card image is clear, well-lit, and properly oriented."
        return JSONResponse(status_code=400, content={"message": error})
    
    # Warning for low field count but continue processing
    if len(categories) < 6:
        print(f"WARNING: Low field count detected ({len(categories)}), but continuing processing...")

    boxes = predictions[:, :4].tolist()

    """ Non Maximum Suppression """
    boxes, categories = utils.non_max_suppression_fast(np.array(boxes), categories, 0.7)
    boxes = utils.class_Order(boxes, categories)  # x1, x2, y1, y2
    if not os.path.isdir(SAVE_DIR):
        os.makedirs(SAVE_DIR, exist_ok=True)
    else:
        for f in os.listdir(SAVE_DIR):
            os.remove(os.path.join(SAVE_DIR, f))

    for index, box in enumerate(boxes):
        left, top, right, bottom = box
        if 5 < index < 9:
            # right = c3[0]
            right = right + 100
        cropped_image = aligned.crop((left, top, right, bottom))
        # Convert RGBA to RGB if necessary before saving as JPEG
        if cropped_image.mode == 'RGBA':
            cropped_image = cropped_image.convert('RGB')
        cropped_image.save(os.path.join(SAVE_DIR, f"{index}.jpg"))

    FIELDS_DETECTED = []  # Collecting all detected parts
    for idx, img_crop in enumerate(sorted(os.listdir(SAVE_DIR))):
        if idx > 0:
            img_ = Image.open(os.path.join(SAVE_DIR, img_crop))
            s = detector.predict(img_)
            FIELDS_DETECTED.append(s)

    if 7 in categories:
        FIELDS_DETECTED = (
            FIELDS_DETECTED[:6]
            + [FIELDS_DETECTED[6] + ", " + FIELDS_DETECTED[7]]
            + [FIELDS_DETECTED[8]]
        )

    response = {"data": FIELDS_DETECTED}

    response = jsonable_encoder(response)
    return JSONResponse(content=response)


@app.post("/download")
async def download(file: str = Form(...)):
    if file != "undefined":
        noti = "Download file successfully!"
        return JSONResponse(status_code=201, content={"message": noti})
    else:
        error = "No file to download!"
        return JSONResponse(status_code=405, content={"message": error})


@app.post("/ekyc/uploader")
async def get_id_card(id: UploadFile = File(...), img: UploadFile = File(...)):
    # Ensure upload directory exists
    if not os.path.isdir(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    INPUT_IMG = os.listdir(UPLOAD_FOLDER)
    if INPUT_IMG is not None:
        for uploaded_img in INPUT_IMG:
            os.remove(os.path.join(UPLOAD_FOLDER, uploaded_img))

    id_location = f"./{UPLOAD_FOLDER}/{id.filename}"
    id_contents = await id.read()

    with open(id_location, "wb") as f:
        f.write(id_contents)

    img_location = f"./{UPLOAD_FOLDER}/{img.filename}"
    img_contents = await img.read()
    with open(img_location, "wb") as f_:
        f_.write(img_contents)

    # Validating file
    INPUT_FILE = os.listdir(UPLOAD_FOLDER)
    if "NULL_1" in INPUT_FILE and "NULL_2" not in INPUT_FILE:
        for uploaded_img in os.listdir(UPLOAD_FOLDER):
            os.remove(os.path.join(UPLOAD_FOLDER, uploaded_img))
        error = "Missing ID card image!"
        return JSONResponse(status_code=410, content={"message": error})
    elif "NULL_2" in INPUT_FILE and "NULL_1" not in INPUT_FILE:
        for uploaded_img in os.listdir(UPLOAD_FOLDER):
            os.remove(os.path.join(UPLOAD_FOLDER, uploaded_img))
        error = "Missing person image!"
        return JSONResponse(status_code=411, content={"message": error})
    elif "NULL_1" in INPUT_FILE and "NULL_2" in INPUT_FILE:
        for uploaded_img in os.listdir(UPLOAD_FOLDER):
            os.remove(os.path.join(UPLOAD_FOLDER, uploaded_img))
        error = "Missing ID card and person images!"
        return JSONResponse(status_code=412, content={"message": error})
    else:
        id_name = id.filename.split(".")
        new_id_name = f"./{UPLOAD_FOLDER}/id.{id_name[-1]}"
        os.rename(id_location, new_id_name)
        img_name = img.filename.split(".")
        new_img_name = f"./{UPLOAD_FOLDER}/person.{img_name[-1]}"
        os.rename(img_location, new_img_name)

    FACE = FACE_MODEL(new_img_name)
    predictions = FACE.pred[0]
    categories = predictions[:, 5].tolist()  # Class
    if 0 not in categories:
        error = "No face detected!"
        return JSONResponse(status_code=413, content={"message": error})
    elif categories.count(0) > 1:
        error = "Multiple faces detected!"
        return JSONResponse(status_code=414, content={"message": error})

    boxes = predictions[:, :4].tolist()

    """ Non Maximum Suppression """
    # boxes, categories = utils.non_max_suppression_fast(np.array(boxes), categories, 0.7)

    if not os.path.isdir(FACE_CROP_DIR):
        os.makedirs(FACE_CROP_DIR, exist_ok=True)
    else:
        for f in os.listdir(FACE_CROP_DIR):
            os.remove(os.path.join(FACE_CROP_DIR, f))

    FACE_IMG = Image.open(new_img_name)
    # left, top, right, bottom = boxes[0]
    cropped_image = FACE_IMG.crop((boxes[0]))
    cropped_image.save(os.path.join(FACE_CROP_DIR, "face_crop.jpg"))

    return await extract_info(ekyc=True, path_id=new_id_name)
