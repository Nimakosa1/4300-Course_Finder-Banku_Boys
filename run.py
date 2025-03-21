import subprocess
import os
import signal
import sys
import time
import shlex

def run_servers():
    # Get the current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Define paths to frontend and backend
    frontend_dir = os.path.join(current_dir, 'frontend')
    backend_dir = os.path.join(current_dir, 'backend')
    
    # Validate directories exist
    if not os.path.exists(frontend_dir):
        print(f"Error: Frontend directory not found at {frontend_dir}")
        sys.exit(1)
    
    if not os.path.exists(backend_dir):
        print(f"Error: Backend directory not found at {backend_dir}")
        sys.exit(1)
    
    # Install the dependencies directly with pip
    print("Installing Flask backend dependencies...")
    deps = ["flask", "flask-cors", "pandas", "nltk"]
    for dep in deps:
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", dep], check=True)
        except subprocess.CalledProcessError:
            print(f"Warning: Failed to install {dep}")
    
    # Start backend Flask server
    print("Starting Flask backend server...")
    # Use the current Python interpreter to ensure same environment
    flask_cmd = [sys.executable, "app.py"]
    flask_process = subprocess.Popen(
        flask_cmd, 
        cwd=backend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True,
        bufsize=1
    )
    
    # Give Flask server time to start
    time.sleep(2)
    
    # Start frontend Next.js server
    print("Starting Next.js frontend server...")
    nextjs_cmd = ["npm", "run", "dev"]
    nextjs_process = subprocess.Popen(
        nextjs_cmd, 
        cwd=frontend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True,
        bufsize=1
    )
    
    # Function to handle process output
    def print_output(process, prefix):
        for line in iter(process.stdout.readline, ''):
            print(f"{prefix}: {line}", end='')
    
    # Handle process output in separate threads
    import threading
    threading.Thread(target=print_output, args=(flask_process, "FLASK"), daemon=True).start()
    threading.Thread(target=print_output, args=(nextjs_process, "NEXT.JS"), daemon=True).start()
    
    # Handle clean termination on Ctrl+C
    def signal_handler(sig, frame):
        print("\nShutting down servers...")
        flask_process.terminate()
        nextjs_process.terminate()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    try:
        # Wait for processes to complete
        flask_process.wait()
        nextjs_process.wait()
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        flask_process.terminate()
        nextjs_process.terminate()

if __name__ == "__main__":
    run_servers()