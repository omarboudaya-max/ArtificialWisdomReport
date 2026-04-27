import sys
import os

# Add the project root and backend directory to the path so we can import everything
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend'))

from backend.main import app
