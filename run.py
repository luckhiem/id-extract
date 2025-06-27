# from imp import reload
import sys
import os
import uvicorn

# Add the src directory to Python path so that 'sources' module can be found
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.Controllers.config import PORT

if __name__ == "__main__":
    uvicorn.run(
        "src:app", host="0.0.0.0", port=int(PORT), reload=True, debug=True
    )  # workers=1
