PORT = 8080
CONF_CONTENT_THRESHOLD = 0.5
IOU_CONTENT_THRESHOLD = 0.5

# CONF_CORNER_THRESHOLD = 0.8
# IOU_CORNER_THRESHOLD = 0.5

CORNER_MODEL_PATH = "src/Database/OCR/weights/corner.pt"
CONTENT_MODEL_PATH = "src/Database/OCR/weights/content.pt"
FACE_MODEL_PATH = "src/Database/OCR/weights/face.pt"
# OCR_MODEL_PATH = "src/Database/OCR/weights/seq2seq.pth"
# OCR_CFG = 'src/Database/OCR/config/seq2seq_config.yml'
DEVICE = "cpu"  # or "cuda:0" if using GPU
# Config directory
UPLOAD_FOLDER = "src/Database/uploads"
SAVE_DIR = "src/static/results"
FACE_DIR = "src/static/face"
